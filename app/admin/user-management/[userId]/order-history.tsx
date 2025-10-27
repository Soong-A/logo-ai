// components/admin/order-history.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ShoppingCart, 
  Undo2,
  AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

// 订单状态标签组件
function OrderStatusBadge({ status, returnStatus }: { status: string; returnStatus?: string }) {
  const statusConfig = {
    completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle },
    pending: { label: '处理中', variant: 'secondary' as const, icon: Clock },
    failed: { label: '失败', variant: 'destructive' as const, icon: XCircle },
    paid: { label: '已支付', variant: 'default' as const, icon: CheckCircle },
    unpaid: { label: '未支付', variant: 'secondary' as const, icon: Clock },
    returned: { label: '已退货', variant: 'destructive' as const, icon: Undo2 },
  };

  // 如果有退货状态，优先显示退货状态
  const displayStatus = returnStatus === 'returned' ? 'returned' : status;
  const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.pending;
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// 格式化金额显示
function formatAmount(amount: number | null | undefined): string {
  if (!amount) return '¥0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `¥${(numAmount / 100).toFixed(2)}`;
}

interface OrderHistoryProps {
  creditOrders?: any[];
  modelOrders?: any[];
}

// 退货模态框组件
function ReturnModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  order 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string, refundAmount: number) => void;
  order: any;
}) {
  const [returnReason, setReturnReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(order?.formattedAmount ? 
    parseFloat(order.formattedAmount) : 0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(returnReason, refundAmount * 100); // 转换为分
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">处理3D模型订单退货</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">订单号: {order?.orderId}</p>
          <p className="text-sm text-gray-600">订单金额: ¥{order?.formattedAmount || '0.00'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">退货原因</label>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="请输入退货原因..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">退款金额 (元)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={order?.formattedAmount || 0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              最大可退款金额: ¥{order?.formattedAmount || '0.00'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="destructive">
              确认退货
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrderHistory({ creditOrders, modelOrders }: OrderHistoryProps) {
  // 安全的空值处理
  const safeCreditOrders = Array.isArray(creditOrders) ? creditOrders : [];
  const safeModelOrders = Array.isArray(modelOrders) ? modelOrders : [];
  
  const creditOrdersCount = safeCreditOrders.length;
  const modelOrdersCount = safeModelOrders.length;

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 打开退货模态框
  const openReturnModal = (order: any) => {
    setSelectedOrder(order);
    setReturnModalOpen(true);
  };

  // 关闭退货模态框
  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setSelectedOrder(null);
  };

  // 处理退货确认
  const handleReturnConfirm = async (reason: string, refundAmount: number) => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/return-model-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          returnReason: reason,
          refundAmount: refundAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('退货处理成功！');
        closeReturnModal();
        // 刷新页面数据
        window.location.reload();
      } else {
        alert('退货处理失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error processing return:', error);
      alert('退货处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 检查订单是否可以退货
  const canReturnOrder = (order: any) => {
    // 只有已支付/完成的订单可以退货，且未退货过
    const isPaidOrCompleted = order.status === 'paid' || order.status === 'completed';
    const notReturned = order.returnStatus !== 'returned';
    const notRefunded = order.status !== 'refunded'; // 确保订单状态不是已退款
  
  return isPaidOrCompleted && notReturned && notRefunded;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            订单记录
          </CardTitle>
          <CardDescription>
            查看用户的积分订单和3D模型订单记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credits" className="space-y-4">
            <TabsList>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                积分订单 ({creditOrdersCount})
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                3D模型订单 ({modelOrdersCount})
              </TabsTrigger>
            </TabsList>

            {/* 积分订单标签页 */}
            <TabsContent value="credits" className="space-y-4">
              {safeCreditOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无积分订单记录
                </div>
              ) : (
                <div className="space-y-4">
                  {safeCreditOrders.map((order) => (
                    <div key={order.id || Math.random()} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">订单 #{order.orderId || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '未知日期'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">+{order.credits || 0} 积分</p>
                        <p className="text-sm text-muted-foreground">{formatAmount(order.price)}</p>
                      </div>
                      <OrderStatusBadge status={order.status || 'pending'} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 3D模型订单标签页 */}
            <TabsContent value="models" className="space-y-4">
              {safeModelOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无3D模型订单记录
                </div>
              ) : (
                <div className="space-y-4">
                  {safeModelOrders.map((order) => (
                    <div key={order.id || Math.random()} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">订单 #{order.orderId || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.formattedDate || '未知日期'} • {order.itemCount || 0} 个商品
                            </p>
                            {/* 显示退款金额 */}
                            {order.returnStatus === 'returned' && order.refundAmount && (
                              <p className="text-sm text-red-600">
                                已退款: {formatAmount(order.refundAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">¥{order.formattedAmount || '0.00'}</p>
                          <OrderStatusBadge 
                            status={order.status || 'pending'} 
                            returnStatus={order.returnStatus}
                          />
                        </div>
                      </div>
                      
                      {/* 订单商品列表 */}
                      <div className="border-t pt-3">
                        {(order.items && Array.isArray(order.items) && order.items.length > 0) ? (
                          order.items.map((item: any, index: number) => (
                            <div key={item.id || index} className="flex items-center justify-between py-2">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <p className="text-sm font-medium">{item.modelName || '未知商品'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    纹理: {item.textureCount || 0} • 数量: {item.quantity || 0}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-medium">
                                ¥{((item.totalPrice || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">无商品信息</p>
                        )}
                      </div>

                      {/* 退货按钮和退货信息 */}
                      <div className="border-t pt-3 mt-3">
                        {canReturnOrder(order) ? (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReturnModal(order)}
                              disabled={isProcessing}
                              className="flex items-center gap-2"
                            >
                              <Undo2 className="h-4 w-4" />
                              处理退货
                            </Button>
                          </div>
                        ) : order.returnStatus === 'returned' ? (
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">已退货</span>
                            </div>
                            {order.returnReason && (
                              <p className="text-sm text-red-700 mt-1">
                                退货原因: {order.returnReason}
                              </p>
                            )}
                            {order.returnedAt && (
                              <p className="text-xs text-red-600 mt-1">
                                退货时间: {new Date(order.returnedAt).toLocaleString('zh-CN')}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 退货模态框 */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={closeReturnModal}
        onConfirm={handleReturnConfirm}
        order={selectedOrder}
      />
    </>
  );
}