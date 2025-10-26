// app/api/cart/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { shoppingCartsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 获取用户购物车
export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const clerkUserId = user.id;
    console.log('获取购物车，用户ID:', clerkUserId);

    // 从数据库获取购物车
    const cart = await db
      .select()
      .from(shoppingCartsTable)
      .where(eq(shoppingCartsTable.clerkUserId, clerkUserId))
      .execute();

    console.log('查询结果:', cart);

    if (cart.length === 0) {
      // 如果购物车不存在，创建一个空的
      console.log('创建新购物车');
      const newCart = await db
        .insert(shoppingCartsTable)
        .values({
          clerkUserId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return NextResponse.json({ 
        success: true, 
        cart: newCart[0] 
      });
    }

    return NextResponse.json({ 
      success: true, 
      cart: cart[0] 
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    return NextResponse.json(
      { 
        error: '获取购物车失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      }, 
      { status: 500 }
    );
  }
}

// 添加商品到购物车或更新购物车
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const clerkUserId = user.id;
    const { items } = await request.json();

    console.log('更新购物车，用户ID:', clerkUserId, '商品数量:', items?.length || 0);

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: '无效的商品数据' }, 
        { status: 400 }
      );
    }

    // 检查购物车是否存在
    const existingCart = await db
      .select()
      .from(shoppingCartsTable)
      .where(eq(shoppingCartsTable.clerkUserId, clerkUserId))
      .execute();

    if (existingCart.length > 0) {
      // 更新现有购物车
      console.log('更新现有购物车');
      const updatedCart = await db
        .update(shoppingCartsTable)
        .set({ 
          items: items,
          updatedAt: new Date()
        })
        .where(eq(shoppingCartsTable.clerkUserId, clerkUserId))
        .returning();

      return NextResponse.json({ 
        success: true, 
        cart: updatedCart[0],
        message: '购物车已更新'
      });
    } else {
      // 创建新购物车
      console.log('创建新购物车');
      const newCart = await db
        .insert(shoppingCartsTable)
        .values({
          clerkUserId,
          items: items,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({ 
        success: true, 
        cart: newCart[0],
        message: '购物车已创建'
      });
    }
  } catch (error) {
    console.error('更新购物车失败:', error);
    return NextResponse.json(
      { 
        error: '更新购物车失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    );
  }
}

// 清空购物车
export async function DELETE() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const clerkUserId = user.id;

    // 检查购物车是否存在
    const existingCart = await db
      .select()
      .from(shoppingCartsTable)
      .where(eq(shoppingCartsTable.clerkUserId, clerkUserId))
      .execute();

    if (existingCart.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: '购物车已经是空的' 
      });
    }

    // 清空购物车
    const updatedCart = await db
      .update(shoppingCartsTable)
      .set({ 
        items: [],
        updatedAt: new Date()
      })
      .where(eq(shoppingCartsTable.clerkUserId, clerkUserId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      cart: updatedCart[0],
      message: '购物车已清空' 
    });
  } catch (error) {
    console.error('清空购物车失败:', error);
    return NextResponse.json(
      { 
        error: '清空购物车失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    );
  }
}