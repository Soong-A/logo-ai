"use client";

import { Suspense, useState, Component, ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Box, HelpCircle, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/landing/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 定义模型配置的类型接口
interface ModelConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  scale: number;
  position: [number, number, number];
}

// 错误边界组件 - 专门捕获React组件树中的错误
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("3D模型加载错误详情:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 模型配置 - 包含测试和实际模型
const MODEL_CONFIG: ModelConfig[] = [
  { 
    id: "test-cube", 
    name: "测试几何体", 
    path: "", // 空路径表示使用内置几何体
    description: "内置测试几何体 - 用于验证3D功能是否正常",
    scale: 1,
    position: [0, 0, 0]
  },
  { 
    id: "duck", 
    name: "贝雷帽", 
    path: "/Hat2-3D/scene.gltf", // 使用固定版本的URL
    description: "可靠的在线测试模型，用于验证网络加载功能",
    scale: 0.1,
    position: [0, 0, 0]
  },
  { 
    id: "local-model", 
    name: "渔夫帽", 
    path: "/Hat1-3D/scene.gltf", // 本地模型路径
    description: "本地GLTF模型文件，需放置在public/3D目录下",
    scale: 0.1,
    position: [0, 0, 0]
  }
];

// 模型加载组件
const ModelLoader = ({ model }: { model: ModelConfig }) => {
  // 情况1：无路径（测试几何体）
  if (!model.path) {
    return (
      <group>
        <mesh position={model.position}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[-1.5, 0, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <coneGeometry args={[0.5, 1, 16]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <axesHelper args={[2]} />
      </group>
    );
  }

  // 情况2：有路径（实际加载模型）
  // 注意：useGLTF的错误由ErrorBoundary捕获，无需try/catch
  const { scene } = useGLTF(model.path);
  
  // 应用模型配置
  scene.scale.set(model.scale, model.scale, model.scale);
  scene.position.set(...model.position);
  scene.castShadow = true;
  scene.receiveShadow = true;
  
  return <primitive object={scene} />;
};

// 3D场景组件
const ModelScene = ({ model }: { model: ModelConfig }) => {
  // 错误提示组件
  const ErrorFallback = () => (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-6">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <h3 className="text-lg font-medium text-red-500">模型加载失败</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        可能是文件不存在、格式错误或网络问题
      </p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => window.location.reload()}
        className="gap-1 mt-2"
      >
        <RefreshCw className="h-3 w-3" />
        重试
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Canvas 
        camera={{ position: [3, 3, 3], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)' }}
      >
        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          minDistance={1}
          maxDistance={10}
        />
        
        {/* 光照系统 */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <hemisphereLight args={["#87CEEB", "#8B7355", 0.3]} />
        
        {/* 简单地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        
        {/* 用Suspense处理加载状态 */}
        <Suspense fallback={
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#f59e0b" />
            </mesh>
            <axesHelper args={[2]} />
          </group>
        }>
          <ModelLoader model={model} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
};

// 状态指示器组件
const StatusIndicator = ({ currentModel }: { currentModel: ModelConfig | undefined }) => {
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  
  // 检查文件是否存在
  const checkFileExists = async (path: string) => {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      setFileExists(response.ok);
    } catch (error) {
      setFileExists(false);
    }
  };

  // 当模型改变时检查文件
  useState(() => {
    if (currentModel?.path) {
      checkFileExists(currentModel.path);
    }
  }, [currentModel]);

  if (!currentModel?.path) return null;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      {fileExists === true && (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>文件存在</span>
        </div>
      )}
      {fileExists === false && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>文件不存在</span>
        </div>
      )}
      {fileExists === null && (
        <div className="flex items-center gap-1 text-amber-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600"></div>
          <span>检查文件中...</span>
        </div>
      )}
    </div>
  );
};

// 主页面组件
export default function ThreeDViewerPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>("test-cube");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const currentModel: ModelConfig | undefined = MODEL_CONFIG.find(m => m.id === selectedModelId);

  const handleDownloadModel = () => {
    if (!currentModel?.path) return;
    
    setIsDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = currentModel.path;
      a.download = currentModel.path.split("/").pop() || "model.gltf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("下载失败:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        {/* 导航栏 */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <Link href="/gallery">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回画廊
            </Button>
          </Link>
          
          {currentModel?.path && (
            <Button 
              onClick={handleDownloadModel} 
              disabled={isDownloading}
              className="gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "下载中..." : "下载模型"}
            </Button>
          )}
        </div>
        
        <h1 className="text-3xl font-semibold mb-6">
          3D模型查看器
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* 控制面板 */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                模型控制
              </h3>
              
              {/* 模型选择器 */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">选择模型</label>
                <Select 
                  value={selectedModelId} 
                  onValueChange={setSelectedModelId}
                >
                  <SelectTrigger className="w-full">
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
              </div>
              
              {/* 模型信息 */}
              {currentModel && (
                <div className="p-4 bg-muted/50 rounded-lg mb-6">
                  <h4 className="font-medium text-sm mb-2">模型信息</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {currentModel.description}
                  </p>
                  {currentModel.path && (
                    <div className="text-xs text-muted-foreground">
                      <p>路径: {currentModel.path}</p>
                      <StatusIndicator currentModel={currentModel} />
                    </div>
                  )}
                </div>
              )}
              
              {/* 操作说明 */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  操作说明
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 左键拖动：旋转视角</li>
                  <li>• 滚轮：缩放模型</li>
                  <li>• 右键拖动：平移视角</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* 3D预览区域 */}
          <Card className="lg:col-span-3 border-2 border-primary/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[70vh] w-full relative">
                {currentModel ? (
                  <ModelScene model={currentModel} />
                ) : (
                  <div className="h-full flex items-center justify-center text-destructive">
                    未找到模型配置
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 故障排除指南 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            故障排除指南
          </h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>1. 确认基础功能正常</strong>：先选择"测试几何体"，如果能显示彩色几何体，说明3D渲染正常</p>
            <p><strong>2. 检查在线模型</strong>：如果鸭子模型加载失败，可能是网络问题，尝试：</p>
            <div className="ml-4">
              <p>• 检查网络连接</p>
              <p>• 直接访问模型URL：<code>https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Duck/glTF/Duck.glb</code></p>
            </div>
            <p><strong>3. 检查本地模型</strong>：</p>
            <div className="ml-4">
              <p>• 确认文件路径：<code>public/3D/scene.gltf</code></p>
              <p>• 验证文件格式：用在线工具（如<a href="https://gltf-viewer.donmccurdy.com/" target="_blank" rel="noopener" className="text-blue-600 underline">gltf-viewer</a>）检查文件是否损坏</p>
              <p>• 尝试简化模型：复杂模型可能导致加载失败</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
