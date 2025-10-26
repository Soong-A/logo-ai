// app/api/credit-packages/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { creditPackagesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const packages = await db
      .select()
      .from(creditPackagesTable)
      .where(eq(creditPackagesTable.isActive, true))
      .orderBy(creditPackagesTable.price)
      
    return NextResponse.json(packages);
  } catch (error) {
    console.error('获取积分包失败:', error);
    return NextResponse.json(
      { error: '获取积分包失败' },
      { status: 500 }
    );
  }
}