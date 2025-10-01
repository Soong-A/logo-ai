"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { 
  Environment, 
  OrbitControls, 
  Plane, 
  MeshReflectorMaterial,
  useGLTF 
} from "@react-three/drei";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Box, 
  HelpCircle 
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Group } from "three"; // 修复：改为 Group 而不是 Mesh
import Navbar from "@/components/landing/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 模型列表配置
const MODEL_CONFIG = [
  { 
    id: "logo-display", 
    name: "Logo展示板", 
    path: "/3D/obj_bucket_hat_gen8_toshitimo.glb",
    description: "标准展示板模型，适合放置2D Logo"
  },
  { 
    id: "business-card", 
    name: "名片", 
    path: "/3D/obj_beret_8panel_fv2yuna_toshitimo.glb",
    description: "3D名片模型，适合展示品牌标识"
  }
];

// GLB模型加载组件
const GLBModel = ({ 
  modelPath, 
  modelId 
}: { 
  modelPath: string;
  modelId: string;
}) => {
  const { scene } = useGLTF(modelPath);
  // 修复：使用 Group 类型而不是 Mesh
  const modelRef = useRef<Group>(null);
  const { toast } = useToast();
  const [loadError, setLoadError] = useState<Error | null>(null);

  // 处理模型加载错误
  useEffect(() => {
    if (loadError) {
      toast({
        title: "模型加载失败",
        description: `请检查模型文件是否存在或格式正确: ${loadError.message}`,
        variant: "destructive",
      });
    }
  }, [loadError, toast]);

  // 模型参数调整
  useEffect(() => {
    if (!modelRef.current) return;

    modelRef.current.castShadow = true;
    modelRef.current.receiveShadow = true;

    switch(modelId) {
      case "logo-display":
        modelRef.current.scale.set(1.2, 1.2, 1.2);
        modelRef.current.position.set(0, 0.5, 0);
        break;
      case "business-card":
        modelRef.current.scale.set(1.5, 1.5, 1.5);
        modelRef.current.rotation.set(0, Math.PI/4, 0);
        break;
      default:
        modelRef.current.scale.set(1, 1, 1);
    }
  }, [modelId]);

  // 修复：使用 group 而不是 primitive 来避免类型问题
  return (
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
};

// 3D场景主组件
const Model3DScene = ({ 
  modelPath, 
  modelId 
}: { 
  modelPath: string;
  modelId: string;
}) => {
  return (
    <Canvas 
      camera={{ position: [5, 5, 8], fov: 50 }} 
      className="w-full h-full"
      shadows
    >
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        minDistance={2}
        maxDistance={15}
        autoRotateSpeed={0.5}
      />
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 15, 7]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight 
        position={[-5, 10, 5]} 
        angle={0.3} 
        intensity={0.8} 
        penumbra={0.5} 
        castShadow 
      />
      
      <Plane 
        args={[20, 20]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]}
        receiveShadow
      >
        <MeshReflectorMaterial 
          resolution={1024} 
          blur={[1024, 1024]} 
          mixBlur={30} 
          mixStrength={80}
          color="#111827"
          roughness={1}
        />
      </Plane>
      
      <GLBModel modelPath={modelPath} modelId={modelId} />
      
      {/* 修复：使用更可靠的环境预设或移除环境贴图 */}
      <Environment 
        preset="apartment" 
        background={false} // 只使用环境光照，不设置背景
      />
    </Canvas>
  );
};

// 加载状态组件
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full w-full gap-4">
    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    <p className="text-muted-foreground">加载3D模型中...</p>
  </div>
);

// 主页面组件
export default function ThreeDViewerPage() {
  const [selectedModelId, setSelectedModelId] = useState(MODEL_CONFIG[0].id);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const currentModel = MODEL_CONFIG.find(m => m.id === selectedModelId);

  const handleDownloadModel = () => {
    if (!currentModel) return;
    
    setIsDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = currentModel.path;
      a.download = currentModel.path.split("/").pop() || "3d-model.glb";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "下载成功",
        description: `已下载 ${currentModel.name} 模型`,
      });
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载模型文件，请检查文件是否存在",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <Link href="/gallery">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回画廊
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleDownloadModel} 
              disabled={isDownloading || !currentModel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "下载中..." : "下载模型"}
            </Button>
          </div>
        </div>
        
        <h1 className="text-3xl font-semibold mb-6">
          3D模型预览
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                模型选择
              </h3>
              
              <Select 
                value={selectedModelId} 
                onValueChange={setSelectedModelId}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="选择3D模型" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_CONFIG.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentModel && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">模型说明</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentModel.description}
                  </p>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  鼠标操作：拖动旋转模型，滚轮缩放，右键平移视角
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[70vh] w-full relative">
              {currentModel ? (
                <Suspense fallback={<LoadingState />}>
                  <Model3DScene 
                    modelPath={currentModel.path} 
                    modelId={currentModel.id} 
                  />
                </Suspense>
              ) : (
                <div className="h-full flex items-center justify-center text-destructive">
                  未找到模型，请检查配置
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}