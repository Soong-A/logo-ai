import os
import torch
import base64
from io import BytesIO
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from diffusers import FluxPipeline
from PIL import Image
import logging
import time

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Logo AI Service")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LogoRequest(BaseModel):
    prompt: str
    width: int = 512
    height: int = 512
    steps: int = 30
    guidance_scale: float = 7.5
    negative_prompt: str = "text, watermark, signature, ugly, blurry, low quality"
    lora_scale: float = 1.0  # 新增：控制LoRA影响强度

class LogoResponse(BaseModel):
    success: bool
    base64_image: str = None
    error: str = None
    generation_time: float = None

def load_flux_model(lora_path: str = r"models\FLUX.1-dev-LoRA-Logo-Design\flux.safetensors"):  # 使用原始字符串处理路径
    """
    加载 FLUX.1-schnell 基础模型并集成指定 LoRA 权重
    """
    try:
        logger.info("正在加载 FLUX.1-schnell 基础模型...")
        
        # 加载 FLUX.1-schnell 基础模型（替换原flux.1-dev）
        pipe = FluxPipeline.from_pretrained(
            "black-forest-labs/flux.1-schnell",
            torch_dtype=torch.float16,
            variant="fp16",
        )
        
        # 加载 LoRA 权重（处理路径格式）
        lora_path = os.path.normpath(lora_path)  # 标准化路径（兼容Windows/Linux）
        if os.path.exists(lora_path):
            logger.info(f"加载 LoRA 模型 from: {lora_path}")
            pipe.load_lora_weights(
                os.path.dirname(lora_path),  # 传递LoRA所在文件夹
                weight_name=os.path.basename(lora_path)  # 传递权重文件名
            )
            pipe.fuse_lora()  # 合并LoRA到基础模型
            logger.info("LoRA 模型已成功合并")
        else:
            logger.warning(f"未找到 LoRA 权重文件: {lora_path}，将使用基础模型生成")
        
        # 设备部署
        if torch.cuda.is_available():
            pipe = pipe.to("cuda")
            logger.info("模型已移动到 GPU")
        else:
            logger.info("使用 CPU 运行模型")
            
        return pipe
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        raise e

# 全局模型实例
model = None

@app.on_event("startup")
async def startup_event():
    global model
    try:
        # 加载模型（自动使用指定的LoRA路径）
        model = load_flux_model()
        logger.info("FLUX.1-schnell + LoRA 模型加载完成，服务准备就绪")
    except Exception as e:
        logger.error(f"启动失败: {e}")
        model = None

@app.post("/generate-logo", response_model=LogoResponse)
async def generate_logo(request: LogoRequest):
    start_time = time.time()
    
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="模型未加载，请检查日志")
        
        logger.info(f"开始生成Logo: {request.prompt[:50]}...")
        
        # 生成图像（应用LoRA强度）
        with torch.no_grad():
            result = model(
                prompt=request.prompt,
                height=request.height,
                width=request.width,
                num_inference_steps=request.steps,
                guidance_scale=request.guidance_scale,
                negative_prompt=request.negative_prompt,
                lora_scale=request.lora_scale,  # 传递LoRA强度
                output_type="pil"
            )
        
        image = result.images[0]
        
        # 转换为base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        generation_time = time.time() - start_time
        logger.info(f"Logo生成完成，耗时: {generation_time:.2f}秒")
        
        return LogoResponse(
            success=True,
            base64_image=f"data:image/png;base64,{img_base64}",
            generation_time=generation_time
        )
        
    except Exception as e:
        logger.error(f"生成失败: {e}")
        return LogoResponse(
            success=False,
            error=str(e),
            generation_time=time.time() - start_time
        )

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "model_not_loaded",
        "model_loaded": model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model": "FLUX.1-schnell + LoRA"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)