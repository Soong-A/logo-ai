// lib/alipay.ts
import { AlipaySdk } from 'alipay-sdk';

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!, // 沙箱APPID
  // privateKey: process.env.ALIPAY_PRIVATE_KEY!, // 应用私钥
  // alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!, // 支付宝公钥
  privateKey: process.env.ALIPAY_PRIVATE_KEY!.replace(/\\n/g, '\n'), // 处理换行符
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!.replace(/\\n/g, '\n'),
  gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do', // 沙箱网关:cite[3]
  signType: 'RSA2', // 推荐使用RSA2:cite[6]
  timeout: 10000
})

export interface CreateOrderParams {
  outTradeNo: string
  totalAmount: number
  subject: string
  body?: string
}

export async function createAlipayOrder(params: CreateOrderParams) {
  const { outTradeNo, totalAmount, subject, body } = params

  try {
    const result = await alipaySdk.exec('alipay.trade.precreate', {
      notify_url: `${process.env.NEXTAUTH_URL}/api/payments/alipay/notify`,
      bizContent: {
        out_trade_no: outTradeNo,
        total_amount: (totalAmount / 100).toFixed(2), // 转换为元
        subject: subject,
        body: body || subject,
        qr_code_timeout_express: '15m' // 二维码超时时间
      }
    })

     console.log('支付宝API响应:', result)

    if (result.code !== '10000') {
      throw new Error(`支付宝API错误: ${result.msg} - ${result.subMsg || ''}`)
    }

    return {
      success: true,
      qrCodeUrl: result.qr_code,
      outTradeNo: outTradeNo
    }
  } catch (error: any) {
    console.error('创建支付宝订单失败:', error)
    return {
      success: false,
      error: error.message || '创建支付订单失败'
    }
  }
}

export async function checkAlipayOrderStatus(outTradeNo: string) {
  try {
     console.log('查询支付宝订单状态:', outTradeNo)

    const result = await alipaySdk.exec('alipay.trade.query', {
      biz_content: { // 注意是 biz_content
        out_trade_no: outTradeNo
      }
    })

     console.log('订单查询响应:', result)

    if (result.code !== '10000') {
      console.error('支付宝查询接口错误:', result.msg, result.subMsg)
      return { status: 'failed' as const }
    }
    
    const tradeStatus = result.trade_status
    
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      return { status: 'paid' as const, tradeNo: result.trade_no }
    } else if (tradeStatus === 'WAIT_BUYER_PAY') {
      return { status: 'pending' as const }
    } else {
      return { status: 'failed' as const }
    }
  } catch (error) {
    console.error('查询支付宝订单状态失败:', error)
    return { status: 'failed' as const }
  }
}