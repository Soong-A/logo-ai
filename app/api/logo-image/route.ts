import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { logosTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
  }

  try {
    const logo = await db
      .select({
        image_url: logosTable.image_url,
      })
      .from(logosTable)
      .where(eq(logosTable.id, parseInt(id)));

    if (!logo[0]) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      imageData: logo[0].image_url,
    });
  } catch (error) {
    console.error('获取图片数据失败:', error);
    return NextResponse.json({ error: 'Failed to get image data' }, { status: 500 });
  }
}