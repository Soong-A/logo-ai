"use client";

import { Component, ReactNode, ErrorInfo, useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Canvas, useThree, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, Mouse, Image as ImageIcon } from "lucide-react";
import { SelectLogo } from "@/db/schema";
import * as THREE from "three";

// 修复 DecalGeometry 导入
import { DecalGeometry } from 'three-stdlib';

// 扩展 Three.js 以支持 DecalGeometry
extend({ DecalGeometry });

// 类型定义
export interface ModelConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  scale: number;
  position: [number, number, number];
}

interface HistoryImage {
  id: string;
  url: string;
  name: string;
}

// 模型配置
export const MODEL_CONFIG: ModelConfig[] = [
  { 
    id: "test-cube", 
    name: "测试几何体", 
    path: "",
    description: "内置测试几何体 - 用于验证3D功能是否正常",
    scale: 1,
    position: [0, 0, 0]
  },
  { 
    id: "duck", 
    name: "贝雷帽", 
    path: "/Hat2-3D/scene.gltf",
    description: "可靠的在线测试模型，用于验证网络加载功能",
    scale: 0.1,
    position: [0, 0, 0]
  },
  { 
    id: "local-model", 
    name: "渔夫帽", 
    path: "/Hat1-3D/scene.gltf",
    description: "本地GLTF模型文件，需放置在public/3D目录下",
    scale: 0.1,
    position: [0, 0, 0]
  }
];

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

// 修复：改进的贴花材质组件
const DecalMaterial = ({ texture, color = 0xffffff, opacity = 1 }: { 
  texture: THREE.Texture | null; 
  color?: number; 
  opacity?: number;
}) => {
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
      polygonOffsetFactor={-50}
      polygonOffsetUnits={-50}
      shininess={5}
    />
  );
};

// 改进的贴花组件 - 增加厚度和表面距离
export const Decal = ({ 
  position, 
  normal, 
  textureUrl, 
  size = [0.3, 0.3, 0.001],
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
  
  const decalPosition = new THREE.Vector3(...position);
  const decalNormal = new THREE.Vector3(...normal).normalize();
  
  const surfaceOffset = 0.00001;
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

  // 安全地创建和改进 DecalGeometry，增加厚度
  useEffect(() => {
    if (!meshRef.current || !modelMesh || !texture) return;

    const createDecalGeometry = () => {
      try {
        // 检查模型网格是否有效
        if (!modelMesh.geometry || !modelMesh.geometry.attributes || !modelMesh.geometry.attributes.position) {
          throw new Error("模型网格几何体数据不完整");
        }

        const orientation = calculateDecalOrientation(adjustedPosition, decalNormal, modelMesh);
        
        const adjustedSize = new THREE.Vector3(
          size[0],
          size[1], 
          Math.max(0.5, size[2]) // 使用更合理的厚度
        );

        // 安全地创建 DecalGeometry
        const decalGeometry = new DecalGeometry(
          modelMesh,
          adjustedPosition,
          orientation,
          adjustedSize
        );

        if (meshRef.current!.geometry) {
          meshRef.current!.geometry.dispose();
        }
        meshRef.current!.geometry = decalGeometry;

        if (meshRef.current!.material) {
          const material = meshRef.current!.material as THREE.MeshPhongMaterial;
          material.map = texture;
          material.needsUpdate = true;
          material.polygonOffset = true;
          material.polygonOffsetFactor = -2;
          material.polygonOffsetUnits = -1;
          material.shininess = 5;
          material.transparent = true;
          material.opacity = isSelected ? 1 : 0.95;
        }

      } catch (error) {
        console.error("创建 DecalGeometry 失败，使用备用方案:", error);
        useFallbackGeometry();
      }
    };

    const useFallbackGeometry = () => {
      try {
        if (meshRef.current!.geometry) {
          meshRef.current!.geometry.dispose();
        }
        
        // 创建更厚的几何体作为备用
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]*0.5);
        
        // 根据法线方向添加弯曲效果
        const positions = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          if (positions[i + 2] > 0) {
            const x = positions[i] / (size[0] / 2);
            const y = positions[i + 1] / (size[1] / 2);
            const distance = Math.sqrt(x * x + y * y);
            const curve = Math.sin(distance * 1.5) * 0.03;
            positions[i + 2] += curve;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        meshRef.current!.geometry = geometry;
        meshRef.current!.position.copy(adjustedPosition);
        
        const box = meshRef.current!;
        box.lookAt(
          box.position.x + decalNormal.x,
          box.position.y + decalNormal.y, 
          box.position.z + decalNormal.z
        );
        
      } catch (fallbackError) {
        console.error("备用方案也失败:", fallbackError);
        // 最终备用方案：使用简单的平面
        const planeGeometry = new THREE.PlaneGeometry(size[0], size[1]);
        meshRef.current!.geometry = planeGeometry;
        meshRef.current!.position.copy(adjustedPosition);
        meshRef.current!.lookAt(
          adjustedPosition.x + decalNormal.x,
          adjustedPosition.y + decalNormal.y,
          adjustedPosition.z + decalNormal.z
        );
      }
    };

    createDecalGeometry();
  }, [position, normal, modelMesh, texture, size, calculateDecalOrientation, isSelected, adjustedPosition, decalNormal]);

  // 每帧微调贴图位置
  useFrame(() => {
    if (!meshRef.current || !modelMesh) return;
    
    try {
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);
      
      // 简单的距离检查，避免贴图漂移
      const distance = worldPosition.distanceTo(adjustedPosition);
      if (distance > 0.1) {
        meshRef.current.position.copy(adjustedPosition);
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

// 鼠标控制说明组件
export const MouseControlsInfo = () => {
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
  const { camera, raycaster, gl } = useThree();
  const [modelMeshes, setModelMeshes] = useState<THREE.Mesh[]>([]);
  
  // 收集模型中的所有网格
  useEffect(() => {
    if (modelRef.current) {
      const meshes: THREE.Mesh[] = [];
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            // 确保几何体有正确的法线和边界
            if (!child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
            if (!child.geometry.boundingBox) {
              child.geometry.computeBoundingBox();
            }
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
      const surfaceDistance = 0.0001;
      const adjustedPoint = point.clone().add(normal.clone().multiplyScalar(surfaceDistance));
      
      onDoubleClick(
        [adjustedPoint.x, adjustedPoint.y, adjustedPoint.z] as [number, number, number],
        [normal.x, normal.y, normal.z] as [number, number, number],
        mesh
      );
    }
  }, [gl, camera, raycaster, onDoubleClick, modelMeshes]);

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
            size={[0.4, 0.4, 0.0001]}
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
      if (!child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals();
      }
      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }
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
          size={[0.25, 0.25, 0.0001]}
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
export const ModelScene = ({ 
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
export const StatusIndicator = ({ currentModel }: { currentModel: ModelConfig | undefined }) => {
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
export const HistoryImageCard = ({ 
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