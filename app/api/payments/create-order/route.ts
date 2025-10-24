// app/api/payments/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/app/credits/payment-service'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const clonedRequest = request.clone()
  
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const requestBody = await clonedRequest.json()
    const { packageId, paymentMethod } = requestBody

    if (!packageId || !paymentMethod) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数: packageId 或 paymentMethod' 
      }, { status: 400 })
    }

    // 创建订单记录到数据库
    const orderResult = await createOrder({
      clerkUserId: user.id,
      packageId,
      paymentMethod
    })

    if (!orderResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: orderResult.error 
      }, { status: 500 })
    }

    // 使用模拟支付（开发环境）
    const USE_MOCK_PAYMENT = process.env.NODE_ENV === 'development'
    
    if (USE_MOCK_PAYMENT) {
      // 模拟支付 - 生成二维码
      const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_PAYMENT_${orderResult.order.orderId}`
      
      return NextResponse.json({
        success: true,
        orderId: orderResult.order.orderId,
        paymentData: {
          qrCodeUrl: mockQrCodeUrl,
          outTradeNo: orderResult.order.orderId
        }
      })
    } else {
      // 真实支付宝支付（暂时返回错误）
      return NextResponse.json({ 
        success: false, 
        error: '支付宝支付暂未配置完成，请使用模拟支付进行测试' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('创建订单失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || '创建订单失败，请重试' 
    }, { status: 500 })
  }
}