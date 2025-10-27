// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  scale?: number;
  position?: [number, number, number];
}

export const MODEL_CONFIG: ModelConfig[] = [
  { 
    id: "helmet", 
    name: "头盔", 
    path: "/3D/scene.gltf",
    description: "Three.js示例头盔模型",
    scale: 2,
    position: [0, 0, 0]
  },
  { 
    id: "duck", 
    name: "鸭子", 
    path: "/3D1/obj_bucket_hat_gen8_toshitimo.glb",
    description: "经典测试模型",
    scale: 0.01,
    position: [0, 0, 0]
  },
  { 
    id: "cube", 
    name: "测试立方体", 
    path: "", // 空路径表示使用内置几何体
    description: "内置测试几何体",
    scale: 1,
    position: [0, 0, 0]
  }
];