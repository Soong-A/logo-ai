// app/api/payments/alipay/notify/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const params = await request.text()
    
    // TODO: 验证签名
    // TODO: 处理支付成功逻辑
    // TODO: 更新订单状态
    // TODO: 为用户添加积分

    console.log('收到支付宝异步通知:', params)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('处理支付宝异步通知失败:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}