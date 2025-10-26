"use client";

import { Suspense, useState, useEffect, Component, ErrorInfo, ReactNode, useRef, useCallback } from "react";
import { Canvas, useThree, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Download, Box, HelpCircle, AlertCircle, 
  CheckCircle, RefreshCw, Image as ImageIcon, ChevronDown,
  Upload, Mouse, Settings, X, Maximize2, Minimize2,
  RotateCcw, ZoomIn, ZoomOut, Move3D, Palette, Trash2,
  ShoppingCart, PlusCircle   // 新增：用于添加到购物车
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/landing/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkHistory } from "../actions/actions";
import { SelectLogo } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";
import * as THREE from "three";

// 购物车工具函数
import { addToCart, getCartItemsCount } from '@/lib/cart';

// 修复 DecalGeometry 导入
import { DecalGeometry } from 'three-stdlib';

// 扩展 Three.js 以支持 DecalGeometry
extend({ DecalGeometry });

// 修复：改进的贴花材质组件
const DecalMaterial = ({ texture, color = 0xffffff, opacity = 1 }) => {
  const materialRef = useRef<THREE.MeshPhongMaterial>(null);

  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.map = texture;
      materialRef.current.needsUpdate = true;
    }
  }, [texture]);

  return (
    <meshPhongMaterial
      ref={materialRef}
      color={color}
      map={texture}
      transparent
      opacity={opacity}
      polygonOffset
      polygonOffsetFactor={-50} // 增加深度偏移因子
      polygonOffsetUnits={-50}  // 增加深度偏移单位
      shininess={5} // 进一步降低光泽度
    />
  );
};

// 改进的贴花组件 - 增加厚度和表面距离
const Decal = ({ 
  position, 
  normal, 
  textureUrl, 
  size = [0.3, 0.3, 0.15], // 增加默认厚度从 0.05 到 0.15
  isSelected = false,
  modelMesh,
  onClick
}: { 
  position: [number, number, number];
  normal: [number, number, number];
  textureUrl: string;
  size?: [number, number, number];
  isSelected?: boolean;
  modelMesh?: THREE.Mesh | null;
  onClick: () => void;
}) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const meshRef = useRef<THREE.Mesh>(null);
  const decalRef = useRef<THREE.Group>(null);
  
  // 使用更精确的向量计算，增加与表面的距离
  const decalPosition = new THREE.Vector3(...position);
  const decalNormal = new THREE.Vector3(...normal).normalize();
  
  // 增加贴图与模型表面的基础距离
  const surfaceOffset = 0.0001; // 从 0.01 增加到 0.03
  const adjustedPosition = decalPosition.clone().add(
    decalNormal.clone().multiplyScalar(surfaceOffset)
  );
  
  const decalSize = new THREE.Vector3(...size);

  // 加载纹理
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setLoadError(false);

    const loadTexture = async () => {
      try {
        const textureLoader = new THREE.TextureLoader();
        
        textureLoader.load(
          textureUrl,
          (loadedTexture) => {
            if (!mounted) return;
            
            loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
            loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
            loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
            loadedTexture.magFilter = THREE.LinearFilter;
            loadedTexture.colorSpace = THREE.SRGBColorSpace;
            loadedTexture.anisotropy = 4;
            
            setTexture(loadedTexture);
            setLoadError(false);
            setIsLoading(false);
          },
          undefined,
          (error) => {
            if (!mounted) return;
            console.error("纹理加载失败:", error);
            setLoadError(true);
            setIsLoading(false);
          }
        );
      } catch (error) {
        if (!mounted) return;
        console.error("加载过程出错:", error);
        setLoadError(true);
        setIsLoading(false);
      }
    };

    loadTexture();

    return () => {
      mounted = false;
      if (texture) {
        texture.dispose();
      }
    };
  }, [textureUrl]);

  // 改进的曲面贴合计算
  const calculateDecalOrientation = useCallback((
    position: THREE.Vector3, 
    normal: THREE.Vector3,
    mesh?: THREE.Mesh | null
  ) => {
    try {
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      
      if (Math.abs(normal.y) > 0.95) {
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      } else {
        quaternion.setFromUnitVectors(up, normal);
      }
      
      const orientation = new THREE.Euler();
      orientation.setFromQuaternion(quaternion);
      
      return orientation;
    } catch (error) {
      console.error("计算朝向失败:", error);
      return new THREE.Euler();
    }
  }, []);

  // 创建和改进 DecalGeometry，增加厚度
  useEffect(() => {
    if (!meshRef.current || !modelMesh || !texture) return;

    try {
      const orientation = calculateDecalOrientation(adjustedPosition, decalNormal, modelMesh);
      
      // 显著增加贴图厚度
      const adjustedSize = new THREE.Vector3(
        size[0],
        size[1], 
        Math.max(0.5, size[2]) // 显著增加最小深度从 0.01 到 0.08
      );

      const decalGeometry = new DecalGeometry(
        modelMesh,
        adjustedPosition, // 使用调整后的位置
        orientation,
        adjustedSize
      );

      if (meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }
      meshRef.current.geometry = decalGeometry;

      if (meshRef.current.material) {
        const material = meshRef.current.material as THREE.MeshPhongMaterial;
        material.map = texture;
        material.needsUpdate = true;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -4; // 增加深度偏移
        material.polygonOffsetUnits = -2;  // 增加深度偏移
        material.shininess = 5;
        material.transparent = true;
        material.opacity = isSelected ? 1 : 0.95;
      }

    } catch (error) {
      console.error("创建 DecalGeometry 失败，使用备用方案:", error);
      try {
        if (meshRef.current.geometry) {
          meshRef.current.geometry.dispose();
        }
        
        // 创建更厚的几何体
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]); // 使用立方体而不是平面
        
        // 根据法线方向添加弯曲效果
        const positions = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          // 对顶面顶点进行弯曲（z > 0 的面）
          if (positions[i + 2] > 0) {
            const x = positions[i] / (size[0] / 2);
            const y = positions[i + 1] / (size[1] / 2);
            const distance = Math.sqrt(x * x + y * y);
            const curve = Math.sin(distance * 1.5) * 0.03; // 增加弯曲效果
            positions[i + 2] += curve;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        meshRef.current.geometry = geometry;
        meshRef.current.position.copy(adjustedPosition);
        
        // 设置朝向
        const box = meshRef.current;
        box.lookAt(
          box.position.x + decalNormal.x,
          box.position.y + decalNormal.y, 
          box.position.z + decalNormal.z
        );
        
      } catch (fallbackError) {
        console.error("备用方案也失败:", fallbackError);
      }
    }
  }, [position, normal, modelMesh, texture, size, calculateDecalOrientation, isSelected, adjustedPosition, decalNormal]);

  // 每帧微调贴图位置
  useFrame(() => {
    if (!meshRef.current || !modelMesh) return;
    
    try {
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);
      
      if (modelMesh.geometry.boundingBox) {
        const distance = worldPosition.distanceTo(modelMesh.position);
        if (distance > 5) {
          meshRef.current.position.copy(adjustedPosition);
        }
      }
    } catch (error) {
      // 忽略帧更新中的错误
    }
  });

  // 清理几何体
  useEffect(() => {
    return () => {
      if (meshRef.current?.geometry) {
        meshRef.current.geometry.dispose();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <group ref={decalRef}>
        <mesh ref={meshRef} position={adjustedPosition} onClick={onClick}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshBasicMaterial color="#4ecdc4" transparent opacity={0.8} />
        </mesh>
      </group>
    );
  }

  if (loadError || !texture) {
    return (
      <group ref={decalRef}>
        <mesh ref={meshRef} position={adjustedPosition} onClick={onClick}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshBasicMaterial color="#ff6b6b" transparent opacity={0.9} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={decalRef}>
      <mesh 
        ref={meshRef} 
        onClick={onClick}
      >
        <DecalMaterial 
          texture={texture} 
          opacity={isSelected ? 1 : 0.95}
          color={isSelected ? 0xf0f0f0 : 0xffffff}
        />
      </mesh>
      
      {/* 改进的选中状态指示器 */}
      {isSelected && (
        <mesh position={adjustedPosition}>
          <ringGeometry args={[Math.max(size[0], size[1]) * 0.6, Math.max(size[0], size[1]) * 0.7, 16]} />
          <meshBasicMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

// 历史图片接口定义
interface HistoryImage {
  id: string;
  url: string;
  name: string;
}

// 定义模型配置的类型接口
interface ModelConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  scale: number;
  position: [number, number, number];
  thumbnailUrl?: string; // 添加可选的缩略图属性
}

// 错误边界组件
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

// 模型配置
const MODEL_CONFIG: ModelConfig[] = [
  { 
    id: "test-cube", 
    name: "测试几何体", 
    path: "",
    description: "内置测试几何体 - 用于验证3D功能是否正常",
    scale: 1,
    position: [0, 0, 0],
    thumbnailUrl: "/thumbnails/test-cube.jpg" // 添加缩略图
  },
  { 
    id: "duck", 
    name: "贝雷帽", 
    path: "/Hat2-3D/scene.gltf",
    description: "可靠的在线测试模型，用于验证网络加载功能",
    scale: 0.1,
    position: [0, 0, 0],
    thumbnailUrl: "/thumbnails/beret-hat.jpg"
  },
  { 
    id: "local-model", 
    name: "渔夫帽", 
    path: "/Hat1-3D/scene.gltf",
    description: "本地GLTF模型文件，需放置在public/3D目录下",
    scale: 0.1,
    position: [0, 0, 0],
    thumbnailUrl: "/thumbnails/fisherman-hat.jpg"
  }
];

// 鼠标控制说明组件
const MouseControlsInfo = () => {
  return (
    <div className="bg-card border rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Mouse className="h-4 w-4 text-primary" />
        鼠标控制
      </h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Mouse className="h-3 w-3 text-primary" />
          </div>
          <div>
            <p className="font-medium">旋转视图</p>
            <p className="text-muted-foreground text-xs">按住左键拖动鼠标</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="font-medium">缩放</p>
            <p className="text-muted-foreground text-xs">滚动鼠标滚轮</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Mouse className="h-3 w-3 text-primary" />
          </div>
          <div>
            <p className="font-medium">放置贴图</p>
            <p className="text-muted-foreground text-xs">双击模型表面放置选中贴图</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Mouse className="h-3 w-3 text-primary" />
          </div>
          <div>
            <p className="font-medium">移动贴图</p>
            <p className="text-muted-foreground text-xs">选中贴图后双击新位置移动</p>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">提示：先选择图片或贴图，然后双击模型表面放置或移动</p>
        </div>
      </div>
    </div>
  );
};

// 改进模型加载器中的双击处理，增加表面距离
const ModelLoader = ({ 
  model, 
  appliedTextures,
  selectedTextureId,
  onTextureSelect,
  onDoubleClick
}: { 
  model: ModelConfig;
  appliedTextures: Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
    modelMesh?: THREE.Mesh | null;
  }>;
  selectedTextureId: string | null;
  onTextureSelect: (textureId: string) => void;
  onDoubleClick: (position: [number, number, number], normal: [number, number, number], modelMesh: THREE.Mesh | null) => void;
}) => {
  const modelRef = useRef<THREE.Group | null>(null);
  const { scene, camera, raycaster, gl } = useThree();
  const [modelMeshes, setModelMeshes] = useState<THREE.Mesh[]>([]);
  
  // 收集模型中的所有网格
  useEffect(() => {
    if (modelRef.current) {
      const meshes: THREE.Mesh[] = [];
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeVertexNormals();
            meshes.push(child);
          }
        }
      });
      setModelMeshes(meshes);
    }
  }, [model]);
  
  // 改进的双击处理，增加表面距离
  const handleDoubleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
    
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 1000;
    
    const intersects = raycaster.intersectObjects(modelMeshes, true);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const point = intersect.point;
      
      let normal = new THREE.Vector3(0, 1, 0);
      if (intersect.face) {
        if (intersect.face.normal.length() > 0) {
          normal = intersect.face.normal.clone();
        }
      }
      
      const mesh = intersect.object as THREE.Mesh;
      if (mesh.geometry.attributes.normal && intersect.face) {
        const normals = mesh.geometry.attributes.normal;
        const normalVector = new THREE.Vector3()
          .fromArray(normals.array, intersect.face.a * 3)
          .add(new THREE.Vector3().fromArray(normals.array, intersect.face.b * 3))
          .add(new THREE.Vector3().fromArray(normals.array, intersect.face.c * 3))
          .normalize();
        
        if (normalVector.length() > 0.1) {
          normal = normalVector;
        }
      }
      
      normal.normalize();
      
      // 显著增加与模型表面的距离，从 0.01 增加到 0.05
      const surfaceDistance = 0.05;
      const adjustedPoint = point.clone().add(normal.clone().multiplyScalar(surfaceDistance));
      
      onDoubleClick(
        [adjustedPoint.x, adjustedPoint.y, adjustedPoint.z] as [number, number, number],
        [normal.x, normal.y, normal.z] as [number, number, number],
        mesh
      );
    }
  }, [gl, scene, camera, raycaster, onDoubleClick, modelMeshes]);

  // 绑定双击事件
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      canvas.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [gl, handleDoubleClick]);
  
  if (!model.path) {
    return (
      <group ref={modelRef}>
        <mesh position={model.position}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[-1.5, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <coneGeometry args={[0.5, 1, 32]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <axesHelper args={[2]} />
        
        {appliedTextures.map((texture) => (
          <Decal
            key={texture.id}
            textureUrl={texture.url}
            position={texture.position}
            normal={texture.normal}
            size={[0.4, 0.4, 0.15]} // 调整默认大小，增加厚度
            isSelected={selectedTextureId === texture.id}
            modelMesh={texture.modelMesh}
            onClick={() => onTextureSelect(texture.id)}
          />
        ))}
      </group>
    );
  }

  const { scene: modelScene } = useGLTF(model.path);
  
  // 改进模型设置
  modelScene.scale.set(model.scale, model.scale, model.scale);
  modelScene.position.set(...model.position);
  modelScene.castShadow = true;
  modelScene.receiveShadow = true;
  
  // 确保模型几何体有正确的法线
  modelScene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      child.geometry.computeVertexNormals();
    }
  });
  
  return (
    <group ref={modelRef}>
      <primitive object={modelScene} />
      {appliedTextures.map((texture) => (
        <Decal
          key={texture.id}
          textureUrl={texture.url}
          position={texture.position}
          normal={texture.normal}
          size={[0.25, 0.25, 0.15]} // 调整默认大小，增加厚度
          isSelected={selectedTextureId === texture.id}
          modelMesh={texture.modelMesh}
          onClick={() => onTextureSelect(texture.id)}
        />
      ))}
    </group>
  );
};

// 场景内容组件
const SceneContent = ({ 
  model, 
  appliedTextures,
  selectedTextureId,
  onTextureSelect,
  onDoubleClick
}: { 
  model: ModelConfig;
  appliedTextures: Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
  }>;
  selectedTextureId: string | null;
  onTextureSelect: (textureId: string) => void;
  onDoubleClick: (
    position: [number, number, number], 
    normal: [number, number, number], 
    modelMesh: THREE.Mesh | null
  ) => void;
}) => {
  return (
    <>
      {/* 光照系统 */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <hemisphereLight args={["#87CEEB", "#8B7355", 0.3]} />
      
      {/* 添加 OrbitControls 支持鼠标交互 */}
      <OrbitControls
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        panSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={1}
        maxDistance={20}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
      />
      
     {/* 浅色地面 - 与背景渐变协调 */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial transparent opacity={0.3} />
    </mesh>
      
      <Suspense fallback={
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <axesHelper args={[2]} />
        </group>
      }>
        <ModelLoader 
          model={model} 
          appliedTextures={appliedTextures}
          selectedTextureId={selectedTextureId}
          onTextureSelect={onTextureSelect}
          onDoubleClick={onDoubleClick}
        />
      </Suspense>
    </>
  );
};

// 3D场景组件
const ModelScene = ({ 
  model, 
  appliedTextures,
  selectedTextureId,
  onTextureSelect,
  onDoubleClick
}: { 
  model: ModelConfig;
  appliedTextures: Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
  }>;
  selectedTextureId: string | null;
  onTextureSelect: (textureId: string) => void;
  onDoubleClick: (
    position: [number, number, number], 
    normal: [number, number, number], 
    modelMesh: THREE.Mesh | null
  ) => void;
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
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
      <div 
        ref={canvasRef}
        className="h-full w-full"
      >
        <Canvas 
                 camera={{ 
                   position: [3, 3, 3], 
                   fov: 50,
                   near: 0.1,
                   far: 1000
                 }}
                 style={{ 
                   background: `
                     linear-gradient(to bottom, #f8f7ff 0%, #f0edff 25%, #ffffff 60%),
                     radial-gradient(circle at 20% 20%, rgba(168, 139, 245, 0.08) 0%, transparent 50%)
                   `
                 }}
               >
                 <Suspense fallback={
                   <div className="w-full h-full flex items-center justify-center">
                     <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                   </div>
                 }>
                   <SceneContent 
                     model={model} 
                     appliedTextures={appliedTextures}
                     selectedTextureId={selectedTextureId}
                     onTextureSelect={onTextureSelect}
                     onDoubleClick={onDoubleClick}
                   />
                 </Suspense>
               </Canvas>
      </div>
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
  useEffect(() => {
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

// 历史图片卡片组件
const HistoryImageCard = ({ 
  image, 
  onSelect,
  imageData
}: { 
  image: SelectLogo; 
  onSelect: (url: string) => void;
  imageData?: string;
}) => {
  return (
    <div 
      className="flex-shrink-0 w-32 h-32 group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-pointer"
      onClick={() => imageData && onSelect(imageData)}
    >
      {imageData ? (
        <img 
          src={imageData} 
          alt={`历史图片 ${image.id}`} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button size="sm" variant="secondary" className="h-6 text-xs">
          {imageData ? "选择" : "加载中..."}
        </Button>
      </div>
    </div>
  );
};

// 主页面组件
const ControlPanel = ({ 
  isOpen, 
  onClose,
  selectedModelId,
  onModelChange,
  currentModel,
  selectedImageUrl,
  onDeselectImage
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onModelChange: (id: string) => void;
  currentModel: ModelConfig | undefined;
  selectedImageUrl: string | null;
  onDeselectImage: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-24 left-4 w-80 bg-background/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl z-20 max-h-[60vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <Settings className="h-5 w-5 text-blue-600" />
          控制面板
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* 模型选择器 */}
        <div>
          <label className="text-sm font-medium mb-2 block text-gray-700">选择模型</label>
          <Select 
            value={selectedModelId} 
            onValueChange={onModelChange}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
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
        
        {/* 鼠标控制说明 */}
        <MouseControlsInfo />
        
        {/* 模型信息 */}
        {currentModel && (
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <h4 className="font-medium text-sm mb-2 text-gray-700">模型信息</h4>
            <p className="text-sm text-gray-600 mb-2">
              {currentModel.description}
            </p>
            {currentModel.path && (
              <div className="text-xs text-gray-500">
                <p>路径: {currentModel.path}</p>
                <StatusIndicator currentModel={currentModel} />
              </div>
            )}
          </div>
        )}

        {/* 选中状态提示 */}
        {selectedImageUrl && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-amber-800">
              <ImageIcon className="h-4 w-4 text-amber-600" />
              已选择图片
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={selectedImageUrl} 
                alt="已选择图片"
                className="w-8 h-8 object-cover rounded-lg border border-amber-300"
              />
              <span className="text-sm text-amber-700 flex-1">双击模型表面放置</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={onDeselectImage}
            >
              取消选择
            </Button>
          </div>
        )}

        {/* 操作说明 */}
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-gray-800">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            操作指南
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              鼠标左键拖拽旋转视图
            </li>
            <li className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              鼠标滚轮缩放
            </li>
            <li className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              选择图片后双击模型表面放置新贴图
            </li>
            <li className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              点击已放置的贴图选中它
            </li>
            <li className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              选中贴图后双击模型表面移动贴图
            </li>
          </ul>
        </div>
      </CardContent>
    </div>
  );
};

// 历史图片面板组件 - 修改位置避免与状态栏重叠
const HistoryPanel = ({
  isOpen,
  onClose,
  historyImages,
  loadedImages,
  onImageSelect,
  selectedImageUrl,
  onDeselectImage,
  isLoadingHistory
}: {
  isOpen: boolean;
  onClose: () => void;
  historyImages: SelectLogo[];
  loadedImages: {[key: number]: string};
  onImageSelect: (url: string) => void;
  selectedImageUrl: string | null;
  onDeselectImage: () => void;
  isLoadingHistory: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-4xl bg-background/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl z-20">
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <ImageIcon className="h-5 w-5 text-purple-600" />
          历史图片
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
            <p className="text-sm text-gray-600">加载历史图片中...</p>
          </div>
        ) : historyImages.length > 0 ? (
          <>
            {/* 横向滚动的图片列表 */}
            <div 
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db transparent'
              }}
            >
              {historyImages.map((image) => (
                <HistoryImageCard 
                  key={image.id} 
                  image={image} 
                  onSelect={onImageSelect}
                  imageData={loadedImages[image.id]}
                />
              ))}
            </div>
            
            {/* 选中的图片提示 */}
            {selectedImageUrl && (
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">已选择图片</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <img 
                    src={selectedImageUrl} 
                    alt="Selected" 
                    className="w-12 h-12 object-cover rounded-lg border border-green-300"
                  />
                  <p className="text-sm text-gray-600 flex-1">
                    双击模型表面放置（自动贴合曲面）
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={onDeselectImage}
                  >
                    取消选择
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>暂无历史图片</p>
          </div>
        )}
      </div>
    </div>
  );
};


// 贴图管理面板组件
const TextureManagerPanel = ({
  isOpen,
  onClose,
  appliedTextures,
  selectedTextureId,
  onTextureSelect,
  onRemoveTexture,
  onClearTextures
}: {
  isOpen: boolean;
  onClose: () => void;
  appliedTextures: any[];
  selectedTextureId: string | null;
  onTextureSelect: (id: string) => void;
  onRemoveTexture: (id: string) => void;
  onClearTextures: () => void;
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 默认位置 - 在工具栏下方
  const defaultPosition = { x: 0, y: 180 };

  // 初始化位置
  useEffect(() => {
    if (isOpen) {
      setPosition(defaultPosition);
    }
  }, [isOpen]);

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只处理左键
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.preventDefault();
  };

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, dragOffset]);

  // 处理鼠标抬起事件
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed w-80 bg-background/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl z-20 max-h-[70vh] overflow-y-auto select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* 标题栏 - 可拖拽区域 */}
      <div 
        className="p-4 border-b border-gray-200/50 flex items-center justify-between cursor-move bg-gradient-to-r from-green-50 to-emerald-50/50"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            贴图管理 ({appliedTextures.length})
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {/* 重置位置按钮 */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setPosition(defaultPosition)}
            className="h-8 w-8 p-0 hover:bg-green-100"
            title="重置位置"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          {/* 关闭按钮 */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        {appliedTextures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>暂无贴图</p>
            <p className="text-sm mt-1">从历史图片中选择并添加到模型</p>
          </div>
        ) : (
          <>
            {/* 贴图列表 */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appliedTextures.map((texture, index) => (
                <div 
                  key={texture.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedTextureId === texture.id 
                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                  onClick={() => onTextureSelect(texture.id)}
                >
                  {/* 贴图缩略图 */}
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={texture.url} 
                      alt={`贴图 ${index + 1}`}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-300"
                    />
                    {selectedTextureId === texture.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* 贴图信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      贴图 {index + 1}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedTextureId === texture.id ? "已选中 - 双击模型移动" : "点击选中"}
                    </p>
                  </div>
                  
                  {/* 删除按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTexture(texture.id);
                    }}
                    title="删除贴图"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={onClearTextures}
                disabled={appliedTextures.length === 0}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                清除全部 ({appliedTextures.length})
              </Button>
            </div>
            
            {/* 操作提示 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>提示：</strong>选中贴图后，双击模型表面可以移动贴图位置
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 工具栏组件
const Toolbar = ({
  onToggleControlPanel,
  onToggleHistoryPanel,
  onToggleTextureManager,
  onAddToCart,
  onDownloadModel,
  isDownloading,
  currentModel,
  appliedTextures,
  selectedTextureId,
  onDeselectTexture,
  selectedImageUrl,
  onDeselectImage,
  onClearTextures,
  cartItemsCount
}: {
  onToggleControlPanel: () => void;
  onToggleHistoryPanel: () => void;
  onToggleTextureManager: () => void;
  onAddToCart: () => void;
  onDownloadModel: () => void;
  isDownloading: boolean;
  currentModel: ModelConfig | undefined;
  appliedTextures: any[];
  selectedTextureId: string | null;
  onDeselectTexture: () => void;
  selectedImageUrl: string | null;
  onDeselectImage: () => void;
  onClearTextures: () => void;
  cartItemsCount: number;
}) => {
  return (
    <div className="absolute top-20 right-4 flex flex-col gap-3 z-20">
      {/* 主工具栏 */}
      <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-2 shadow-2xl">
        {/* 控制面板按钮 */}
        <Button
          onClick={onToggleControlPanel}
          variant="ghost"
          size="sm"
          className="gap-2 h-10 w-10 p-0 justify-center hover:bg-blue-50 hover:text-blue-600 transition-all"
          title="控制面板"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* 历史图片按钮 */}
        <Button
          onClick={onToggleHistoryPanel}
          variant="ghost"
          size="sm"
          className="gap-2 h-10 w-10 p-0 justify-center hover:bg-purple-50 hover:text-purple-600 transition-all"
          title="历史图片"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        {/* 贴图管理按钮 */}
        <Button
          onClick={onToggleTextureManager}
          variant="ghost"
          size="sm"
          className="gap-2 h-10 w-10 p-0 justify-center hover:bg-green-50 hover:text-green-600 transition-all relative"
          title="贴图管理"
        >
          <Palette className="h-5 w-5" />
          {appliedTextures.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {appliedTextures.length}
            </span>
          )}
        </Button>

        {/* 添加到购物车按钮 */}
        <Button
          onClick={onAddToCart}
          variant="ghost"
          size="sm"
          className="gap-2 h-10 w-10 p-0 justify-center hover:bg-orange-50 hover:text-orange-600 transition-all relative"
          title="添加到购物车"
          disabled={!currentModel}
        >
          <PlusCircle className="h-5 w-5" />
          {appliedTextures.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              {appliedTextures.length}
            </span>
          )}
        </Button>

        {/* 查看购物车按钮 */}
        <Link href="/cart">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-10 w-10 p-0 justify-center hover:bg-blue-50 hover:text-blue-600 transition-all relative"
            title="查看购物车"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Button>
        </Link>

        {/* 下载模型按钮 */}
        {currentModel?.path && (
          <Button 
            onClick={onDownloadModel} 
            disabled={isDownloading}
            variant="ghost"
            size="sm"
            className="gap-2 h-10 w-10 p-0 justify-center hover:bg-green-50 hover:text-green-600 transition-all"
            title="下载模型"
          >
            <Download className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* 快速操作按钮组 */}
      {(selectedTextureId || selectedImageUrl || appliedTextures.length > 0) && (
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-2 shadow-2xl">
          <div className="flex flex-col gap-1">
            {selectedTextureId && (
              <Button 
                onClick={onDeselectTexture}
                variant="ghost"
                size="sm"
                className="gap-2 justify-start h-8 text-xs text-blue-700 hover:bg-blue-50"
              >
                <Move3D className="h-3 w-3" />
                取消选中贴图
              </Button>
            )}
            
            {selectedImageUrl && (
              <Button 
                onClick={onDeselectImage}
                variant="ghost"
                size="sm"
                className="gap-2 justify-start h-8 text-xs text-amber-700 hover:bg-amber-50"
              >
                <ImageIcon className="h-3 w-3" />
                取消选择图片
              </Button>
            )}
            
            {appliedTextures.length > 0 && (
              <Button 
                onClick={onClearTextures}
                variant="ghost"
                size="sm"
                className="gap-2 justify-start h-8 text-xs text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                清除贴图 ({appliedTextures.length})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// 状态指示器组件 - 固定在底部
const StatusBar = ({
  selectedModelId,
  appliedTextures,
  selectedTextureId,
  selectedImageUrl,
  cartItemsCount
}: {
  selectedModelId: string;
  appliedTextures: any[];
  selectedTextureId: string | null;
  selectedImageUrl: string | null;
  cartItemsCount: number;
}) => {
  const currentModel = MODEL_CONFIG.find(m => m.id === selectedModelId);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 p-3 z-10">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <Box className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700">{currentModel?.name}</span>
          </div>
          
          {selectedImageUrl && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-300">
              <ImageIcon className="h-3 w-3" />
              <span className="font-medium">已选择图片 - 双击模型表面放置</span>
            </div>
          )}
          
          {selectedTextureId && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-300">
              <Move3D className="h-3 w-3" />
              <span className="font-medium">已选中贴图 - 双击模型表面移动</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-gray-200">
            <Palette className="h-3 w-3" />
            <span>贴图数量: {appliedTextures.length}</span>
          </div>
          
          {/* 购物车链接 */}
          <Link href="/cart">
            <div className="flex items-center gap-1 bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-200 transition-colors cursor-pointer">
              <ShoppingCart className="h-3 w-3 text-orange-600" />
              <span>购物车: {cartItemsCount} 件商品</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-1 bg-gradient-to-r from-blue-100 to-purple-100 px-2 py-1 rounded border border-blue-200">
            <span className="font-medium">✨ 增强厚度智能曲面贴图</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主页面组件
export default function ThreeDViewerPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>("test-cube");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [historyImages, setHistoryImages] = useState<SelectLogo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [appliedTextures, setAppliedTextures] = useState<Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
    size: [number, number, number]; // 添加 size 属性
    modelMesh?: any;
  }>>([]);
  const [selectedTextureId, setSelectedTextureId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{[key: number]: string}>({});
  const [textureSize, setTextureSize] = useState<number>(0.25);
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  
  // 面板状态
  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);
  const [isTextureManagerOpen, setIsTextureManagerOpen] = useState<boolean>(false);
  
  const { toast } = useToast();

  const currentModel: ModelConfig | undefined = MODEL_CONFIG.find(m => m.id === selectedModelId);

  // 使用 useRef 来跟踪选中的贴图ID，避免闭包问题
  const selectedTextureIdRef = useRef(selectedTextureId);
  useEffect(() => {
    selectedTextureIdRef.current = selectedTextureId;
  }, [selectedTextureId]);

  // 使用 useRef 来跟踪选中的图片URL，避免闭包问题
  const selectedImageUrlRef = useRef(selectedImageUrl);
  useEffect(() => {
    selectedImageUrlRef.current = selectedImageUrl;
  }, [selectedImageUrl]);

  // 加载历史图片
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const history = await checkHistory();
        if (history) {
          setHistoryImages(history);
        } else {
          toast({
            title: "加载历史记录失败",
            description: "无法获取您的历史图片",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("加载历史图片错误:", error);
        toast({
          title: "错误",
          description: "加载历史图片时发生错误",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [toast]);

  // 监听购物车变化
useEffect(() => {
  const updateCartCount = async () => {
    try {
      const count = await getCartItemsCount();
      setCartItemsCount(count);
    } catch (error) {
      console.error('获取购物车数量失败:', error);
      setCartItemsCount(0); // 失败时设为0
    }
  };
    // 初始更新
    updateCartCount();

    // 监听storage变化（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '3d-model-cart') {
        updateCartCount();
      }
    };

    // 监听自定义事件（同标签页内更新）
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // 懒加载图片数据
  const loadImageData = async (logoId: number) => {
    if (loadedImages[logoId]) return;
    
    try {
      const response = await fetch(`/api/logo-image?id=${logoId}`);
      const data = await response.json();
      
      if (data.success && data.imageData) {
        setLoadedImages(prev => ({
          ...prev,
          [logoId]: data.imageData
        }));
      }
    } catch (error) {
      console.error('加载图片数据失败:', error);
    }
  };

  // 当历史面板展开时加载可见图片
  useEffect(() => {
    if (isHistoryPanelOpen && historyImages.length > 0) {
      // 只加载前6张图片（首屏可见）
      const imagesToLoad = historyImages.slice(0, 6);
      imagesToLoad.forEach(image => {
        loadImageData(image.id);
      });
    }
  }, [isHistoryPanelOpen, historyImages]);

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
      toast({
        title: "下载失败",
        description: "无法下载模型文件",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // 处理历史图片选择
  const handleImageSelect = (url: string) => {
    setSelectedImageUrl(url);
    setSelectedTextureId(null); // 取消选中的贴图
    toast({
      title: "已选择图片",
      description: "双击模型表面放置图片",
    });
  };

  // 处理贴图选择
  const handleTextureSelect = (textureId: string) => {
    setSelectedTextureId(textureId);
    setSelectedImageUrl(null); // 取消选中的历史图片
    
    const texture = appliedTextures.find(t => t.id === textureId);
    if (texture) {
      toast({
        title: "已选中贴图",
        description: "双击模型表面移动贴图到新位置",
      });
    }
  };

  // 处理模型双击
  const handleModelDoubleClick = (
    position: [number, number, number], 
    normal: [number, number, number], 
    modelMesh: any
  ) => {
    // 使用 ref 的当前值来避免闭包问题
    const currentSelectedTextureId = selectedTextureIdRef.current;
    const currentSelectedImageUrl = selectedImageUrlRef.current;

    if (currentSelectedTextureId) {
      // 如果有选中的贴图，将其移动到双击位置
      setAppliedTextures(prev => 
        prev.map(texture => 
          texture.id === currentSelectedTextureId 
            ? { ...texture, position, normal, modelMesh } // 保持原有的 size
            : texture
        )
      );
      
      // 移动完成后取消选中贴图
      setSelectedTextureId(null);
      
      toast({
        title: "贴图已移动",
        description: "贴图已移动到新位置并重新计算曲面贴合",
      });
    } else if (currentSelectedImageUrl) {
      // 如果有选中的图片，将其放置在双击位置
      const newTexture = {
        id: `texture-${Date.now()}`,
        url: currentSelectedImageUrl,
        position,
        normal,
        size: [0.25, 0.25, 0.15] as [number, number, number], // 添加默认大小
        modelMesh // 保存模型网格信息用于贴花
      };
      
      setAppliedTextures(prev => [...prev, newTexture]);
      setSelectedImageUrl(null);
      
      toast({
        title: "图片已应用到模型",
        description: "图片已成功贴合到3D模型表面",
      });
    } else {
      toast({
        title: "未选择图片或贴图",
        description: "请先选择一张图片或贴图",
        variant: "destructive",
      });
    }
  };


 // 在 3D 查看器中更新购物车功能
// 监听购物车变化
const [modelPrices, setModelPrices] = useState<{[key: string]: {basePrice: number, texturePrice: number}}>({});

// 获取模型价格的函数
useEffect(() => {
  const fetchModelPrices = async () => {
    try {
      const response = await fetch('/api/model-prices');
      const data = await response.json();
      
      if (data.success) {
        const priceMap: {[key: string]: {basePrice: number, texturePrice: number}} = {};
        data.data.forEach((product: any) => {
          priceMap[product.modelId] = {
            basePrice: product.basePrice,
            texturePrice: product.texturePrice
          };
        });
        setModelPrices(priceMap);
      } else {
        console.error('获取模型价格失败:', data.error);
        // 使用默认价格作为后备
        setModelPrices({
          'test-cube': { basePrice: 9999, texturePrice: 999 },
          'duck': { basePrice: 12999, texturePrice: 1499 },
          'local-model': { basePrice: 11999, texturePrice: 1299 },
        });
      }
    } catch (error) {
      console.error('获取模型价格失败:', error);
      // 使用默认价格作为后备
      setModelPrices({
        'test-cube': { basePrice: 9999, texturePrice: 999 },
        'duck': { basePrice: 12999, texturePrice: 1499 },
        'local-model': { basePrice: 11999, texturePrice: 1299 },
      });
    }
  };

  fetchModelPrices();
}, []);

// 添加到购物车函数
const handleAddToCart = async () => {
  if (!currentModel) {
    toast({
      title: "无法添加到购物车",
      description: "请先选择模型",
      variant: "destructive",
    });
    return;
  }

  // 从状态获取价格配置
 const priceConfig = modelPrices[currentModel.id];

  if (!priceConfig) {
    toast({
      title: "无法添加到购物车",
      description: "未找到该模型的价格信息",
      variant: "destructive",
    });
    return;
  }
 try {
    // 使用工具函数添加到购物车
    const success = await addToCart({
      modelId: currentModel.id,
      modelName: currentModel.name,
      basePrice: priceConfig.basePrice,
      texturePrice: priceConfig.texturePrice,
      textures: appliedTextures.map(texture => ({
        id: texture.id,
        url: texture.url,
        position: texture.position,
        normal: texture.normal,
        size: texture.size || [0.25, 0.25, 0.15]
      })),
      quantity: 1,
      thumbnail: currentModel.thumbnailUrl
    });

    if (success) {
      // 更新购物车计数
      const newCount = await getCartItemsCount();
      setCartItemsCount(newCount);

      // 显示价格明细
      const modelPrice = priceConfig.basePrice / 100;
      const texturePrice = appliedTextures.length * (priceConfig.texturePrice / 100);
      const totalPrice = (priceConfig.basePrice + (appliedTextures.length * priceConfig.texturePrice)) / 100;

      toast({
        title: "已添加到购物车",
        description: (
          <div>
            <p>{currentModel.name} 已添加到购物车</p>
            <p className="text-sm">
              价格: ¥{modelPrice.toFixed(2)} (模型) + ¥{texturePrice.toFixed(2)} ({appliedTextures.length}个贴图) = ¥{totalPrice.toFixed(2)}
            </p>
          </div>
        ),
      });
    } else {
      throw new Error('添加到购物车失败');
    }
  } catch (error) {
    toast({
      title: "添加到购物车失败",
      description: "无法将商品添加到购物车",
      variant: "destructive",
    });
  }
};

  // 清除所有纹理
  const handleClearTextures = () => {
    setAppliedTextures([]);
    setSelectedImageUrl(null);
    setSelectedTextureId(null);
    toast({
      title: "已清除所有贴图",
      description: "所有应用的图片贴图已被移除",
    });
  };

  // 移除单个纹理
  const handleRemoveTexture = (textureId: string) => {
    setAppliedTextures(prev => prev.filter(t => t.id !== textureId));
    if (selectedTextureId === textureId) {
      setSelectedTextureId(null);
    }
  };

  // 取消选中当前贴图
  const handleDeselectTexture = () => {
    setSelectedTextureId(null);
    toast({
      title: "已取消选中",
      description: "贴图选中状态已取消",
    });
  };

  // 取消选中的图片
  const handleDeselectImage = () => {
    setSelectedImageUrl(null);
    toast({
      title: "已取消选择",
      description: "图片选择已取消",
    });
  };

  // 切换控制面板
  const toggleControlPanel = () => {
    setIsControlPanelOpen(!isControlPanelOpen);
  };

  // 切换历史面板
  const toggleHistoryPanel = () => {
    setIsHistoryPanelOpen(!isHistoryPanelOpen);
  };

  // 切换贴图管理面板
  const toggleTextureManager = () => {
    setIsTextureManagerOpen(!isTextureManagerOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Navbar />
      
      {/* 主内容区域 - 全屏3D画布 */}
      <div className="relative w-full h-[calc(100vh-4rem)]">
        {/* 3D场景 */}
        <div className="absolute inset-0 rounded-none">
          {currentModel ? (
            <ModelScene 
              model={currentModel} 
              appliedTextures={appliedTextures}
              selectedTextureId={selectedTextureId}
              onTextureSelect={handleTextureSelect}
              onDoubleClick={handleModelDoubleClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-red-500 bg-white/80 backdrop-blur-sm">
              未找到模型配置
            </div>
          )}
        </div>

        {/* 工具栏 */}
        <Toolbar
          onToggleControlPanel={toggleControlPanel}
          onToggleHistoryPanel={toggleHistoryPanel}
          onToggleTextureManager={toggleTextureManager}
          onAddToCart={handleAddToCart}
          onDownloadModel={handleDownloadModel}
          isDownloading={isDownloading}
          currentModel={currentModel}
          appliedTextures={appliedTextures}
          selectedTextureId={selectedTextureId}
          onDeselectTexture={handleDeselectTexture}
          selectedImageUrl={selectedImageUrl}
          onDeselectImage={handleDeselectImage}
          onClearTextures={handleClearTextures}
          cartItemsCount={cartItemsCount}
        />

        {/* 控制面板 - 在左侧 */}
        <ControlPanel
          isOpen={isControlPanelOpen}
          onClose={() => setIsControlPanelOpen(false)}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModelId}
          currentModel={currentModel}
          selectedImageUrl={selectedImageUrl}
          onDeselectImage={handleDeselectImage}
        />

        {/* 历史图片面板 */}
        <HistoryPanel
          isOpen={isHistoryPanelOpen}
          onClose={() => setIsHistoryPanelOpen(false)}
          historyImages={historyImages}
          loadedImages={loadedImages}
          onImageSelect={handleImageSelect}
          selectedImageUrl={selectedImageUrl}
          onDeselectImage={handleDeselectImage}
          isLoadingHistory={isLoadingHistory}
        />

        {/* 贴图管理面板 */}
        <TextureManagerPanel
          isOpen={isTextureManagerOpen}
          onClose={() => setIsTextureManagerOpen(false)}
          appliedTextures={appliedTextures}
          selectedTextureId={selectedTextureId}
          onTextureSelect={handleTextureSelect}
          onRemoveTexture={handleRemoveTexture}
          onClearTextures={handleClearTextures}
        />

        {/* 状态栏 - 固定在底部 */}
        <StatusBar
          selectedModelId={selectedModelId}
          appliedTextures={appliedTextures}
          selectedTextureId={selectedTextureId}
          selectedImageUrl={selectedImageUrl}
          cartItemsCount={cartItemsCount}
        />

        {/* 操作提示覆盖层 */}
        {selectedImageUrl && !selectedTextureId && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-orange-100/10 border-4 border-dashed border-amber-400/30 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-amber-200">
              <ImageIcon className="h-12 w-12 text-amber-600 mx-auto mb-3" />
              <p className="font-semibold text-lg mb-1 text-amber-800">双击模型表面放置图片</p>
              <p className="text-sm text-amber-600">贴图将自动贴合曲面</p>
            </div>
          </div>
        )}
        
        {selectedTextureId && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-cyan-100/10 border-4 border-dashed border-blue-400/30 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-blue-200">
              <Move3D className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <p className="font-semibold text-lg mb-1 text-blue-800">双击模型表面移动贴图</p>
              <p className="text-sm text-blue-600">贴图将自动重新计算曲面贴合</p>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        {/* <div className="absolute top-20 left-4 z-20">
          <Link href="/gallery">
            <Button 
              variant="secondary" 
              className="gap-2 bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:bg-white shadow-2xl rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              返回画廊
            </Button>
          </Link>
        </div> */}
      </div>

      {/* 全局样式 */}
      <style jsx global>{`
        .slider-gradient::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        
        .slider-gradient::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}