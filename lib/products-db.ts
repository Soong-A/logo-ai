// // lib/products-db.ts
// import { db } from '@/db';
// import { modelProductsTable, type SelectModelProduct } from '@/db/schema';
// import { eq, and } from 'drizzle-orm';

// // 获取所有活跃的3D模型产品
// export async function getActiveModelProducts() {
//   try {
//     return await db
//       .select()
//       .from(modelProductsTable)
//       .where(eq(modelProductsTable.isActive, true))
//       .orderBy(modelProductsTable.id);
//   } catch (error) {
//     console.error('获取模型产品失败:', error);
//     return [];
//   }
// }

// // 根据ID获取单个模型产品
// export async function getModelProductById(id: number) {
//   try {
//     const [product] = await db
//       .select()
//       .from(modelProductsTable)
//       .where(eq(modelProductsTable.id, id));
    
//     return product || null;
//   } catch (error) {
//     console.error('获取模型产品失败:', error);
//     return null;
//   }
// }

// // 根据modelId获取模型产品
// export async function getModelProductByModelId(modelId: string) {
//   try {
//     const [product] = await db
//       .select()
//       .from(modelProductsTable)
//       .where(
//         and(
//           eq(modelProductsTable.modelId, modelId),
//           eq(modelProductsTable.isActive, true)
//         )
//       );
    
//     return product || null;
//   } catch (error) {
//     console.error('获取模型产品失败:', error);
//     return null;
//   }
// }