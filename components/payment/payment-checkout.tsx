// components/payment-checkout.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeftIcon, QrCodeIcon, CheckCircleIcon, AlertCircleIcon, Loader2, CreditCard, Smartphone } from 'lucide-react'

interface PaymentCheckoutProps {
  package: {
    id: number;
    name: string;
    description: string;
    credits: number;
    price: number;
  };
  onBack: () => void;
}

export function PaymentCheckout({ package: pkg, onBack }: PaymentCheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<'alipay' | 'wechat' | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingCount, setPollingCount] = useState(0)

  const handlePaymentMethodSelect = async (method: 'alipay' | 'wechat') => {
    setSelectedMethod(method)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg.id,
          paymentMethod: method,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setQrCodeUrl(data.paymentData.qrCodeUrl)
        setOrderId(data.orderId)
        setPollingCount(0)
      } else {
        setError(data.error || '创建订单失败，请重试')
      }
    } catch (error) {
      console.error('支付请求失败:', error)
      setError('网络错误，请检查网络连接后重试')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!orderId || isPaid) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/check-status?orderId=${orderId}`)
        const data = await response.json()
        
        setPollingCount(prev => prev + 1)
        
        if (data.status === 'paid') {
          clearInterval(interval)
          setIsPaid(true)
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setError('支付失败，请重试')
        }
      } catch (error) {
        console.error('检查支付状态失败:', error)
      }

      // 10分钟后停止轮询 (120次 * 5秒 = 10分钟)
      if (pollingCount > 120) {
        clearInterval(interval)
        setError('支付超时，请重新尝试')
      }
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [orderId, isPaid, pollingCount])

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2)
  }

  const handleRetry = () => {
    setQrCodeUrl(null)
    setOrderId(null)
    setSelectedMethod(null)
    setError(null)
    setPollingCount(0)
  }

  if (isPaid) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-green-200 shadow-xl">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-green-700">支付成功！</h3>
            <p className="text-muted-foreground mb-2">
              已成功购买 <span className="font-semibold text-primary">{pkg.credits}</span> 个积分
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              积分已自动添加到您的账户
            </p>
            <div className="space-y-3">
              <Button 
                onClick={onBack} 
                className="w-full py-3 text-base font-medium"
                size="lg"
              >
                返回套餐页面
              </Button>
              <Button 
                variant="outline" 
                className="w-full py-3" 
                onClick={() => window.location.href = '/generate'}
                size="lg"
              >
                立即生成Logo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-red-200 shadow-xl">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircleIcon className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-red-700">支付遇到问题</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button 
                onClick={handleRetry} 
                className="w-full py-3 text-base font-medium"
                size="lg"
              >
                重新尝试
              </Button>
              <Button 
                variant="outline" 
                onClick={onBack} 
                className="w-full py-3"
                size="lg"
              >
                选择其他套餐
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (qrCodeUrl) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="w-fit p-0 mb-2 hover:bg-transparent text-muted-foreground"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              选择其他套餐
            </Button>
            <CardTitle className="text-center text-2xl">扫码支付</CardTitle>
            <CardDescription className="text-center text-base">
              请使用{selectedMethod === 'alipay' ? '支付宝' : '微信'}扫描二维码完成支付
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="border-2 border-border rounded-xl p-6 bg-white shadow-lg">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="支付二维码" 
                    className="w-64 h-64"
                    onError={(e) => {
                      console.error('二维码加载失败')
                      setError('二维码生成失败，请重新选择支付方式')
                    }}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                    <div className="text-center">
                      <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">生成二维码中...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center space-y-3 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border">
              <p className="text-3xl font-bold text-primary">¥{formatPrice(pkg.price)}</p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>{pkg.name} · {pkg.credits}积分</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  支付倒计时: {Math.floor((120 - pollingCount) / 12)}:{(120 - pollingCount) % 12 * 5}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4" />
                支付完成后，系统会自动为您添加积分
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="pb-6">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="w-fit p-0 mb-2 hover:bg-transparent text-muted-foreground"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            选择其他套餐
          </Button>
          <div className="text-center">
            <CardTitle className="text-3xl mb-2">选择支付方式</CardTitle>
            <CardDescription className="text-lg">
              购买 <span className="font-semibold text-primary">{pkg.name}</span> - {pkg.credits}积分 
              <span className="ml-2 text-2xl font-bold text-primary">¥{formatPrice(pkg.price)}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 支付方式选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className={`cursor-pointer transition-all duration-300 border-2 ${
                selectedMethod === 'alipay' 
                  ? 'border-blue-500 shadow-lg bg-blue-50' 
                  : 'border-border hover:border-blue-300 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isLoading && handlePaymentMethodSelect('alipay')}
            >
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <div className="text-white text-2xl font-bold">支</div>
                </div>
                <span className="font-semibold text-lg mb-1">支付宝支付</span>
                <p className="text-sm text-muted-foreground text-center">
                  推荐使用支付宝扫码支付
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-300 border-2 ${
                selectedMethod === 'wechat' 
                  ? 'border-green-500 shadow-lg bg-green-50' 
                  : 'border-border hover:border-green-300 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isLoading && handlePaymentMethodSelect('wechat')}
            >
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <div className="text-white text-2xl font-bold">微</div>
                </div>
                <span className="font-semibold text-lg mb-1">微信支付</span>
                <p className="text-sm text-muted-foreground text-center">
                  推荐使用微信扫码支付
                </p>
              </CardContent>
            </Card>
          </div>

          {isLoading && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-3 bg-muted/50 px-6 py-4 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-base font-medium">正在生成支付二维码...</span>
              </div>
            </div>
          )}

          {/* 购买说明 */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              购买说明
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>积分永久有效，不会过期</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>支付成功后积分自动到账</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>支持支付宝、微信扫码支付</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>如有问题请联系客服</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}