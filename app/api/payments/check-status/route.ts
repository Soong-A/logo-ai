// app/api/payments/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrder, updateOrderStatus, addUserCredits } from '@/app/credits/payment-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ success: false, error: '订单号不能为空' }, { status: 400 })
    }

    // 获取订单信息
    const orderResult = await getOrder(orderId)
    if (!orderResult.success) {
      return NextResponse.json({ success: false, error: orderResult.error }, { status: 404 })
    }

    if (!orderResult.order) {
      return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 })
    }

    const order = orderResult.order

    // 如果订单已经是已支付状态，直接返回
    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        status: 'paid',
        tradeNo: order.paymentId
      })
    }

    // 模拟支付检查逻辑（开发环境）
    const USE_MOCK_PAYMENT = process.env.NODE_ENV === 'development'
    
    if (USE_MOCK_PAYMENT) {
      // 模拟支付成功逻辑：30%的概率在5次查询内支付成功
      const queryCount = Math.floor(Math.random() * 10) + 1
      const shouldSucceed = Math.random() > 0.7 || queryCount > 5
      
      if (shouldSucceed) {
        // 更新订单状态为已支付
        const updateResult = await updateOrderStatus({
          orderId: order.orderId,
          status: 'paid',
          paymentId: `MOCK_TRADE_${Date.now()}`
        })

        if (!updateResult.success) {
          return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 })
        }

         // 确保 updateResult.order 存在
        if (!updateResult.order) {
          return NextResponse.json({ success: false, error: '更新订单失败' }, { status: 500 })
        }
        
        // 为用户添加积分
        const creditResult = await addUserCredits({
          clerkUserId: order.clerkUserId,
          credits: order.credits,
          orderId: order.orderId
        })

        if (!creditResult.success) {
          console.error('添加积分失败:', creditResult.error)
          // 这里可以选择回滚订单状态，或者记录错误日志
        }

        return NextResponse.json({
          success: true,
          status: 'paid',
          tradeNo: `MOCK_TRADE_${Date.now()}`
        })
      } else {
        return NextResponse.json({
          success: true,
          status: 'pending'
        })
      }
    } else {
      // 真实支付宝支付检查
      // 暂时返回失败
      return NextResponse.json({
        success: true,
        status: 'failed',
        error: '支付宝支付暂未配置完成'
      })
    }

  } catch (error) {
    console.error('检查订单状态失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '检查订单状态失败' 
    }, { status: 500 })
  }
}