// app/api/payments/check-model-order-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { modelOrdersTable, shoppingCartsTable } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: '订单号不能为空' }, { status: 400 })
    }

    console.log('🎯 模拟支付 - 检查订单状态:', orderId);
    
    // 获取订单信息以获取用户ID
    const orders = await db
      .select()
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.orderId, orderId))

    if (orders.length === 0) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    const order = orders[0]
    const userId = order.clerkUserId

    // 安全地处理 createdAt，确保它不是 null
    let orderCreateTime: number;
    
    if (order.createdAt) {
      // 如果 createdAt 存在，使用它
      orderCreateTime = new Date(order.createdAt).getTime();
    } else {
      // 如果 createdAt 为 null，记录警告并使用当前时间
      console.warn('⚠️ 订单创建时间为空，使用当前时间作为备用值，订单ID:', orderId);
      orderCreateTime = Date.now();
      
      // 可选：更新数据库中的 createdAt 字段
      try {
        await db
          .update(modelOrdersTable)
          .set({
            createdAt: new Date()
          })
          .where(eq(modelOrdersTable.orderId, orderId));
        console.log('✅ 已更新订单的创建时间');
      } catch (updateError) {
        console.error('更新订单创建时间失败:', updateError);
      }
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - orderCreateTime;
    
    // 如果订单创建超过15秒，模拟支付成功
    if (timeDiff > 15000) {
      console.log('🎯 模拟支付成功，订单:', orderId);
      
      // 更新本地订单状态
      await db
        .update(modelOrdersTable)
        .set({
          status: 'paid',
          paymentId: `MOCK_PAYMENT_${orderId}`,
          paidAt: new Date()
        })
        .where(eq(modelOrdersTable.orderId, orderId))

      // 直接清空数据库中的购物车
      await db
        .update(shoppingCartsTable)
        .set({ 
          items: [],
          updatedAt: new Date()
        })
        .where(eq(shoppingCartsTable.clerkUserId, userId))

      console.log('购物车已清空，用户ID:', userId);

      return NextResponse.json({
        status: 'paid',
        orderId
      });
    } else {
      // 15秒内返回支付中状态
      const remainingSeconds = Math.ceil((15000 - timeDiff) / 1000);
      console.log('🎯 模拟支付中，订单:', orderId, '剩余等待时间:', remainingSeconds, '秒');
      return NextResponse.json({
        status: 'pending',
        remainingSeconds
      });
    }

  } catch (error) {
    console.error('检查订单状态失败:', error);
    return NextResponse.json(
      { status: 'failed' },
      { status: 500 }
    );
  }
}