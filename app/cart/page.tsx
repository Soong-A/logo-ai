// app/cart/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  CreditCard,
  Package,
  X,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { 
  getCartItems, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart, 
  getCartTotal, 
  CartItem 
} from '@/lib/cart';
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import SkeletonCard from "@/components/skeleton-card";

// 基于您的 SkeletonCard 组件创建购物车骨架屏
const CartSkeleton = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部骨架 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* 商品列表骨架 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* 商品图片骨架 */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                    
                    {/* 商品信息骨架 */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="h-6 bg-slate-200 rounded animate-pulse w-48" />
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-32" />
                        </div>
                        <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
                            <div className="h-6 w-8 bg-slate-200 rounded animate-pulse" />
                            <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
                          </div>
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                        </div>
                        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 订单汇总骨架 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-16" />
                    </div>
                  ))}
                </div>
                
                <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
                <div className="h-9 w-full bg-slate-200 rounded animate-pulse" />
                
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                  <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// 空购物车状态的骨架屏
const EmptyCartSkeleton = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full animate-pulse mx-auto mb-6" />
            <div className="h-8 bg-slate-200 rounded animate-pulse w-48 mx-auto mb-4" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-64 mx-auto mb-8" />
            <div className="flex gap-4 justify-center">
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{ qrCodeUrl: string; orderId: string } | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();

  // 在您的购物车页面中，更新 PaymentModal 组件
const PaymentModal = () => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [qrLoadError, setQrLoadError] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(15);
  
  // 轮询检查支付状态
  useEffect(() => {
    if (!paymentData) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/check-model-order-status?orderId=${paymentData.orderId}`);
        const data = await response.json();
        
        if (data.remainingSeconds) {
          setRemainingSeconds(data.remainingSeconds);
        }
        
        if (data.status === 'paid') {
          setPaymentStatus('paid');
          clearInterval(interval);
          toast({
            title: "支付成功",
            description: "订单支付成功，购物车已清空",
          });
          // 刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('检查支付状态失败:', error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [paymentData]);
  
  if (!paymentData) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">模拟支付</h3>
        
        {paymentStatus === 'paid' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-green-600 font-medium">支付成功！</p>
            <p className="text-sm text-gray-600 mt-2">页面即将刷新...</p>
          </div>
        ) : (
          <>
            {/* 测试说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                💡 <strong>模拟支付测试</strong>
                <br />
                等待 <strong>{remainingSeconds}</strong> 秒后自动完成支付
              </p>
            </div>
            
            {/* 二维码显示区域 */}
            <div className="flex justify-center mb-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                {qrLoadError ? (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">💰</span>
                      </div>
                      <p className="text-sm text-gray-500">模拟支付二维码</p>
                      <p className="text-xs text-gray-400 mt-1">订单: {paymentData.orderId}</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={paymentData.qrCodeUrl} 
                    alt="支付二维码" 
                    className="w-64 h-64"
                    onError={() => {
                      console.log('二维码加载失败，显示备用界面');
                      setQrLoadError(true);
                    }}
                  />
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 text-center">
              请使用支付宝扫描二维码完成支付（模拟）
            </p>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-2xl font-bold text-primary">¥{(totalAmount / 100).toFixed(2)}</p>
              <p className="text-sm text-gray-600">订单号: {paymentData.orderId}</p>
            </div>
            
            <Button 
              onClick={() => setShowPaymentModal(false)} 
              variant="outline" 
              className="w-full"
            >
              取消支付
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

  // 处理结算
  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      
      const response = await fetch('/api/payments/create-model-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'alipay'
        })
      });

      const data = await response.json();

      if (data.success) {
        // 设置支付数据并显示弹窗
        setPaymentData({
          qrCodeUrl: data.paymentData.qrCodeUrl,
          orderId: data.orderId
        });
        setShowPaymentModal(true);
        
        toast({
          title: "请扫码支付",
          description: "请使用支付宝扫描二维码完成支付",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('结算失败:', error);
      toast({
        title: "结算失败",
        description: error.message || "无法创建订单，请重试",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // 从数据库加载购物车数据
  const loadCart = async () => {
    try {
      setIsLoading(true);
      const items = await getCartItems();
      setCartItems(items);
    } catch (error) {
      console.error('加载购物车失败:', error);
      toast({
        title: "加载购物车失败",
        description: "无法从服务器获取购物车数据",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 手动刷新购物车
  const handleRefreshCart = async () => {
    try {
      setIsSyncing(true);
      await loadCart();
      toast({
        title: "刷新成功",
        description: "购物车数据已更新",
      });
    } catch (error) {
      toast({
        title: "刷新失败",
        description: "无法更新购物车数据",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadCart();

    // 监听购物车更新事件
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // 更新商品数量
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const success = await updateCartItemQuantity(itemId, newQuantity);
      if (success) {
        toast({
          title: "数量已更新",
          description: "商品数量已成功更新",
        });
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      toast({
        title: "更新失败",
        description: "无法更新商品数量",
        variant: "destructive",
      });
    }
  };

  // 移除商品
  const handleRemoveItem = async (itemId: string) => {
    try {
      const success = await removeFromCart(itemId);
      if (success) {
        toast({
          title: "已移除商品",
          description: "商品已从购物车中移除",
        });
      } else {
        throw new Error('移除失败');
      }
    } catch (error) {
      toast({
        title: "移除失败",
        description: "无法移除商品",
        variant: "destructive",
      });
    }
  };

  // 清空购物车
  const handleClearCart = async () => {
    try {
      const success = await clearCart();
      if (success) {
        toast({
          title: "购物车已清空",
          description: "所有商品已从购物车中移除",
        });
      } else {
        throw new Error('清空失败');
      }
    } catch (error) {
      toast({
        title: "清空失败",
        description: "无法清空购物车",
        variant: "destructive",
      });
    }
  };

  // 格式化价格显示（分转元）
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  // 计算总价
  useEffect(() => {
    const calculateTotal = async () => {
      const total = await getCartTotal();
      setTotalAmount(total);
    };
    calculateTotal();
  }, [cartItems]);

  // 显示骨架屏
  if (isLoading) {
    return <CartSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/gallery">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              购物车
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {cartItems.length} 件商品
              </Badge>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshCart}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '刷新中...' : '刷新购物车'}
            </Button>
            
            {cartItems.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearCart}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                清空购物车
              </Button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          // 空购物车状态
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-4">购物车是空的</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                您还没有添加任何3D模型商品到购物车，快去设计您喜欢的模型吧！
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/gallery">
                  <Button size="lg" className="gap-2">
                    <Package className="h-4 w-4" />
                    浏览模型
                  </Button>
                </Link>
                <Link href="/3D">
                  <Button variant="outline" size="lg">
                    开始设计
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          // 购物车商品列表
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 商品列表 */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* 商品图片 */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt={item.modelName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-primary" />
                          )}
                        </div>
                      </div>
                      
                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg truncate">
                              {item.modelName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              模型ID: {item.modelId}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* 价格明细 */}
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>模型价格:</span>
                              <span>¥{formatPrice(item.basePrice)}</span>
                            </div>
                            {item.textureCount > 0 && (
                              <div className="flex justify-between">
                                <span>贴图费用 ({item.textureCount} × ¥{formatPrice(item.texturePrice)}):</span>
                                <span>¥{formatPrice(item.textureCount * item.texturePrice)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-1">
                              <span className="font-medium">小计:</span>
                              <span className="font-medium">¥{formatPrice(item.unitPrice)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 贴图信息 */}
                        <div className="mb-3">
                          <Badge variant="outline" className="mb-2">
                            {item.textureCount} 个贴图
                          </Badge>
                          <div className="flex gap-2 flex-wrap">
                            {item.textures.slice(0, 3).map((texture, index) => (
                              <div key={texture.id} className="relative group">
                                <img 
                                  src={texture.url} 
                                  alt={`贴图 ${index + 1}`}
                                  className="w-8 h-8 rounded border object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                  <span className="text-white text-xs">贴图 {index + 1}</span>
                                </div>
                              </div>
                            ))}
                            {item.textures.length > 3 && (
                              <Badge variant="secondary" className="px-2">
                                +{item.textures.length - 3} 更多
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* 数量控制 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0 hover:bg-background"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0 hover:bg-background"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ¥{formatPrice(item.unitPrice)} × {item.quantity}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ¥{formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 订单汇总 */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    订单汇总
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 价格明细 */}
                  <div className="space-y-3">
                    {/* 计算各项总计 */}
                    {(() => {
                      const baseTotal = cartItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
                      const textureTotal = cartItems.reduce((sum, item) => sum + (item.textureCount * item.texturePrice * item.quantity), 0);
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>模型总价</span>
                            <span>¥{formatPrice(baseTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>贴图总价</span>
                            <span>¥{formatPrice(textureTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>运费</span>
                            <span className="text-green-600">免费</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>税费</span>
                            <span>¥0.00</span>
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between text-lg font-bold">
                              <span>总计</span>
                              <span className="text-primary">¥{formatPrice(totalAmount)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* 结算按钮 */}
                  <Button 
                    className="w-full gap-2 py-3 text-base font-medium" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cartItems.length === 0}
                  >
                    <CreditCard className="h-5 w-5" />
                    {isCheckingOut ? '处理中...' : '立即结算'}
                  </Button>
                  
                  {/* 增加按钮之间的间距 */}
                  <div className="pt-2"></div>

                  {/* 继续购物 */}
                  <Link href="/3D">
                    <Button variant="outline" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      继续添加商品
                    </Button>
                  </Link>
                  
                  {/* 购物提示 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="text-blue-700 font-medium mb-1">💡 购物提示</p>
                    <p className="text-blue-600">
                      所有3D模型都包含贴图配置，下单后可随时修改和重新生成。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* 支付弹窗 */}
        {showPaymentModal && <PaymentModal />}
      </div>
      <Footer />
    </div>
  );
}