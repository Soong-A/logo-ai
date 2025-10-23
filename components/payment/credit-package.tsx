// components/credit-packages.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentCheckout } from './payment-checkout'
import { CheckIcon, StarIcon, Zap, Crown, Rocket, Gem } from 'lucide-react'

interface CreditPackage {
  id: number;
  name: string;
  description: string;
  credits: number;
  price: number;
  originalPrice: number | null;
  isPopular: boolean;
  isActive: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export function CreditPackages() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/credit-packages')
      
      if (!response.ok) {
        throw new Error('获取积分套餐失败')
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const activePackages = data.filter(pkg => pkg.isActive)
        setPackages(activePackages)
      } else {
        throw new Error('数据格式错误')
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      setError('加载积分套餐失败，请刷新页面重试')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2)
  }

  const getPackageIcon = (index: number) => {
    const icons = [Zap, Rocket, Crown, Gem]
    const IconComponent = icons[index] || Zap
    return <IconComponent className="w-5 h-5" />
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载积分套餐中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchPackages} variant="outline">
          重新加载
        </Button>
      </div>
    )
  }

  if (selectedPackage) {
    return (
      <PaymentCheckout 
        package={selectedPackage}
        onBack={() => setSelectedPackage(null)}
      />
    )
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无可用积分套餐</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
      {packages.map((pkg, index) => (
        <Card 
          key={pkg.id} 
          className={`relative flex flex-col transition-all duration-300 hover:shadow-xl border-2 ${
            pkg.isPopular 
              ? 'border-primary scale-105 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10' 
              : 'border-border hover:border-primary/30'
          }`}
        >
          {pkg.isPopular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-1.5 flex items-center gap-1 shadow-md">
                <StarIcon className="w-3 h-3 fill-current" />
                热门选择
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center pb-4 pt-6">
            <div className="flex justify-center mb-3">
              <div className={`p-3 rounded-full ${
                pkg.isPopular 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getPackageIcon(index)}
              </div>
            </div>
            <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
            <CardDescription className="text-base">{pkg.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 space-y-4">
            {/* 价格区域 */}
            <div className="text-center bg-gradient-to-r from-background to-muted/30 p-4 rounded-lg border">
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-3xl font-bold text-primary">¥{formatPrice(pkg.price)}</span>
                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ¥{formatPrice(pkg.originalPrice)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{pkg.credits} 个生成积分</span>
              </div>
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                    节省 ¥{formatPrice(pkg.originalPrice - pkg.price)}
                  </Badge>
                </div>
              )}
            </div>

            {/* 功能列表 */}
            <div className="space-y-3 px-5">
              <h4 className="font-medium text-sm text-center text-muted-foreground">包含功能</h4>
              <div className="space-y-2">
                {pkg.features && pkg.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed" >{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          
          {/* 按钮区域 - 确保所有卡片按钮在同一高度 */}
          <CardFooter className="pt-4 mt-auto">
            <Button 
              className={`w-full py-3 text-base font-medium transition-all duration-300 ${
                pkg.isPopular 
                  ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl' 
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
              size="lg"
              onClick={() => setSelectedPackage(pkg)}
            >
              {pkg.isPopular ? (
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4 fill-current" />
                  立即购买
                </div>
              ) : (
                '立即购买'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
