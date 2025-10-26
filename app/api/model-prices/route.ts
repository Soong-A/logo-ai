// app/api/model-prices/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { modelProductsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const modelProducts = await db
      .select({
        modelId: modelProductsTable.modelId,
        name: modelProductsTable.name,
        basePrice: modelProductsTable.basePrice,
        texturePrice: modelProductsTable.texturePrice,
        description: modelProductsTable.description,
        thumbnailUrl: modelProductsTable.thumbnailUrl,
        isActive: modelProductsTable.isActive,
      })
      .from(modelProductsTable)
      .where(eq(modelProductsTable.isActive, true))
      .execute();

    return NextResponse.json({
      success: true,
      data: modelProducts
    });
  } catch (error) {
    console.error('获取模型价格失败:', error);
    return NextResponse.json(
      { 
        error: '获取模型价格失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}