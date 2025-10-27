// // app/admin/user-management/[userId]/edit/page.tsx
// import { redirect } from 'next/navigation';
// import { clerkClient } from '@clerk/nextjs/server';
// import { isUserAdmin } from '@/lib/admin-utils';
// import { 
//   getUserDetails, 
//   getUserOrders, 
//   updateUserCredits,
//   getClerkUserData 
// } from '@/lib/user-management-utils';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
// import Navbar from "@/components/landing/navbar";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { 
//   ArrowLeft, 
//   CreditCard, 
//   User, 
//   AlertCircle, 
//   ShoppingCart, 
//   Package,
//   CheckCircle,
//   Clock,
//   XCircle,
//   Mail,
//   Building,
//   MapPin,
//   Calendar,
//   Settings,
//   History
// } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// // 订单状态标签组件
// function OrderStatusBadge({ status }: { status: string }) {
//   const statusConfig = {
//     completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle },
//     pending: { label: '处理中', variant: 'secondary' as const, icon: Clock },
//     failed: { label: '失败', variant: 'destructive' as const, icon: XCircle },
//     paid: { label: '已支付', variant: 'default' as const, icon: CheckCircle },
//     unpaid: { label: '未支付', variant: 'secondary' as const, icon: Clock },
//   };

//   const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
//   const IconComponent = config.icon;

//   return (
//     <Badge variant={config.variant} className="flex items-center gap-1">
//       <IconComponent className="h-3 w-3" />
//       {config.label}
//     </Badge>
//   );
// }

// // 安全的日期格式化函数
// function formatDate(date: Date | string | null): string {
//   if (!date) return '从未登录';
//   try {
//     return new Date(date).toLocaleDateString('zh-CN');
//   } catch {
//     return '日期无效';
//   }
// }

// // 格式化金额显示
// function formatAmount(amount: number | null | undefined): string {
//   if (!amount) return '¥0.00';
//   const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
//   return `¥${(numAmount / 100).toFixed(2)}`;
// }

// // 安全地计算数字值
// function safeNumber(value: number | null | undefined): number {
//   if (!value || isNaN(Number(value))) return 0;
//   return typeof value === 'string' ? parseFloat(value) : value;
// }

// // 积分调整表单组件
// function CreditsAdjustmentForm({ 
//   userId, 
//   currentCredits 
// }: { 
//   userId: string; 
//   currentCredits: number;
// }) {
//   async function handleUpdateCredits(formData: FormData) {
//     'use server';
    
//     const isAdmin = await isUserAdmin();
//     if (!isAdmin) {
//       throw new Error('Unauthorized');
//     }

//     const credits = parseInt(formData.get('credits') as string);
//     const description = formData.get('description') as string;

//     if (isNaN(credits) || credits < 0) {
//       throw new Error('积分必须是有效的正数');
//     }

//     try {
//       await updateUserCredits(userId, credits, description);
//       redirect(`/admin/user-management/${userId}`);
//     } catch (error) {
//       console.error('Error updating credits:', error);
//       throw new Error('更新积分失败');
//     }
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center">
//           <Settings className="h-5 w-5 mr-2" />
//           积分调整
//         </CardTitle>
//         <CardDescription>
//           设置用户的新积分余额，系统会自动记录调整记录
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form action={handleUpdateCredits} className="space-y-6">
//           <div className="space-y-2">
//             <Label htmlFor="credits">新积分余额</Label>
//             <Input
//               id="credits"
//               name="credits"
//               type="number"
//               min="0"
//               defaultValue={currentCredits}
//               required
//               placeholder="请输入新的积分余额"
//             />
//             <p className="text-sm text-muted-foreground">
//               当前积分: {currentCredits}
//             </p>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="description">调整说明</Label>
//             <Input
//               id="description"
//               name="description"
//               placeholder="请输入积分调整的原因"
//               defaultValue="管理员手动调整"
//             />
//             <p className="text-sm text-muted-foreground">
//               这个说明会显示在用户的积分交易记录中
//             </p>
//           </div>

//           {/* 警告信息 */}
//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//             <div className="flex items-start space-x-2">
//               <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
//               <div>
//                 <h4 className="text-sm font-medium text-yellow-800">重要提示</h4>
//                 <p className="text-sm text-yellow-700 mt-1">
//                   积分调整将直接影响用户的生成能力。请确保操作正确，系统会自动记录所有调整记录。
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="flex space-x-3 pt-4">
//             <Button type="submit" className="flex-1">
//               确认调整
//             </Button>
//             <Button variant="outline" asChild>
//               <Link href={`/admin/user-management/${userId}`}>
//                 取消
//               </Link>
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

// // 订单记录组件
// function OrderHistory({
//   creditOrders,
//   modelOrders
// }: {
//   creditOrders: any[];
//   modelOrders: any[];
// }) {
//   const creditOrdersCount = creditOrders?.length || 0;
//   const modelOrdersCount = modelOrders?.length || 0;

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center">
//           <History className="h-5 w-5 mr-2" />
//           订单记录
//         </CardTitle>
//         <CardDescription>
//           查看用户的积分订单和3D模型订单记录
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <Tabs defaultValue="credits" className="space-y-4">
//           <TabsList>
//             <TabsTrigger value="credits" className="flex items-center gap-2">
//               <CreditCard className="h-4 w-4" />
//               积分订单 ({creditOrdersCount})
//             </TabsTrigger>
//             <TabsTrigger value="models" className="flex items-center gap-2">
//               <Package className="h-4 w-4" />
//               3D模型订单 ({modelOrdersCount})
//             </TabsTrigger>
//           </TabsList>

//           {/* 积分订单标签页 */}
//           <TabsContent value="credits" className="space-y-4">
//             {creditOrders.length === 0 ? (
//               <div className="text-center py-8 text-muted-foreground">
//                 暂无积分订单记录
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {creditOrders.map((order) => (
//                   <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
//                     <div className="flex items-center space-x-4">
//                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                         <CreditCard className="h-5 w-5 text-primary" />
//                       </div>
//                       <div>
//                         <p className="font-medium">订单 #{order.orderId}</p>
//                         <p className="text-sm text-muted-foreground">
//                           {order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '未知日期'}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-bold text-lg">+{order.credits} 积分</p>
//                       <p className="text-sm text-muted-foreground">{formatAmount(order.price)}</p>
//                     </div>
//                     <OrderStatusBadge status={order.status || 'pending'} />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </TabsContent>

//           {/* 3D模型订单标签页 */}
//           <TabsContent value="models" className="space-y-4">
//             {modelOrders.length === 0 ? (
//               <div className="text-center py-8 text-muted-foreground">
//                 暂无3D模型订单记录
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {modelOrders.map((order) => (
//                   <div key={order.id} className="border rounded-lg p-4">
//                     <div className="flex items-center justify-between mb-3">
//                       <div className="flex items-center space-x-3">
//                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//                           <Package className="h-5 w-5 text-blue-600" />
//                         </div>
//                         <div>
//                           <p className="font-medium">订单 #{order.orderId}</p>
//                           <p className="text-sm text-muted-foreground">
//                             {order.formattedDate} • {order.itemCount} 个商品
//                           </p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-bold text-lg">¥{order.formattedAmount}</p>
//                         <OrderStatusBadge status={order.status || 'pending'} />
//                       </div>
//                     </div>
                    
//                     {/* 订单商品列表 */}
//                     <div className="border-t pt-3">
//                       {order.items?.map((item, index) => (
//                         <div key={item.id} className="flex items-center justify-between py-2">
//                           <div className="flex items-center space-x-3">
//                             {item.thumbnail && (
//                               <img 
//                                 src={item.thumbnail} 
//                                 alt={item.modelName}
//                                 className="w-8 h-8 rounded object-cover"
//                               />
//                             )}
//                             <div>
//                               <p className="text-sm font-medium">{item.modelName}</p>
//                               <p className="text-xs text-muted-foreground">
//                                 纹理: {item.textureCount} • 数量: {item.quantity}
//                               </p>
//                             </div>
//                           </div>
//                           <p className="text-sm font-medium">
//                             ¥{(item.totalPrice / 100).toFixed(2)}
//                           </p>
//                         </div>
//                       )) || (
//                         <p className="text-sm text-muted-foreground">无商品信息</p>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </TabsContent>
//         </Tabs>
//       </CardContent>
//     </Card>
//   );
// }

// export default async function EditUserCreditsPage({
//   params,
//   searchParams,
// }: {
//   params: Promise<{ userId: string }>;
//   searchParams: Promise<{ tab?: string }>;
// }) {
//   // 等待 params 和 searchParams 解析
//   const resolvedParams = await params;
//   const resolvedSearchParams = await searchParams;
  
//   const userId = resolvedParams.userId;
//   const isAdmin = await isUserAdmin();
  
//   if (!isAdmin) {
//     redirect('/');
//   }

//   try {
//     // 并行获取用户详情和订单数据
//     const [userData, ordersData, clerkUserData] = await Promise.all([
//       getUserDetails(userId),
//       getUserOrders(userId),
//       getClerkUserData(userId)
//     ]);

//     if (!userData) {
//       redirect('/admin/user-management');
//     }

//     // 处理可能的空值
//     const safeOrdersData = ordersData || {
//       creditOrders: [],
//       modelOrders: []
//     };

//     const creditOrders = safeOrdersData.creditOrders || [];
//     const modelOrders = safeOrdersData.modelOrders || [];

//     // 计算用户消费统计
//     const userCreditSpent = safeNumber(userData.stats?.totalCreditSpent);
//     const userModelSpent = safeNumber(userData.stats?.totalModelSpent);
//     const userTotalSpent = userCreditSpent + userModelSpent;

//     // 使用 Clerk 数据或回退到数据库数据
//     const userAvatarUrl = clerkUserData?.imageUrl || userData.profile.avatarUrl;
//     const userEmail = clerkUserData?.primaryEmail || userData.clerkUser?.primaryEmail;
//     const userDisplayName = clerkUserData?.fullName || userData.clerkUser?.fullName || userData.profile.displayName || '未设置名称';

//     // 获取当前激活的标签页
//     const activeTab = resolvedSearchParams.tab || 'credits';

//     return (
//       <div className="min-h-screen bg-background overflow-hidden">
//         <Navbar />
//         <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
//           {/* 返回按钮和标题 */}
//           <div className="flex items-center space-x-4 mb-6">
//             <Button variant="outline" size="sm" asChild>
//               <Link href={`/admin/user-management/${userId}`}>
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 返回用户详情
//               </Link>
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold">编辑用户积分</h1>
//               <p className="text-muted-foreground mt-1">调整用户积分余额并查看订单记录</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//             {/* 左侧导航栏 */}
//             <div className="lg:col-span-1 space-y-4">
//               {/* 用户信息卡片 */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <User className="h-5 w-5 mr-2" />
//                     用户信息
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                       {userAvatarUrl ? (
//                         <img 
//                           src={userAvatarUrl} 
//                           alt="Profile" 
//                           className="w-12 h-12 rounded-full object-cover"
//                         />
//                       ) : (
//                         <User className="h-6 w-6 text-primary" />
//                       )}
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <h3 className="font-semibold truncate">
//                         {userDisplayName}
//                       </h3>
//                       <div className="flex items-center space-x-2 mt-1">
//                         <Badge variant="secondary" className="text-xs">
//                           {safeNumber(userData.profile.creditsRemaining)} 积分
//                         </Badge>
//                         {userTotalSpent > 0 && (
//                           <Badge variant="default" className="text-xs">
//                             付费用户
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                   </div>
                  
//                   {/* 统计信息 */}
//                   <div className="grid grid-cols-2 gap-4 pt-3 border-t">
//                     <div className="text-center">
//                       <div className="text-2xl font-bold text-primary">
//                         {safeNumber(userData.profile.creditsRemaining)}
//                       </div>
//                       <div className="text-xs text-muted-foreground">剩余积分</div>
//                     </div>
//                     <div className="text-center">
//                       <div className="text-2xl font-bold text-green-600">
//                         {safeNumber(userData.profile.totalLogosGenerated)}
//                       </div>
//                       <div className="text-xs text-muted-foreground">生成Logo</div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* 操作导航 */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>操作菜单</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-">
//                   <Button
//                     variant={activeTab === 'credits' ? 'default' : 'outline'}
//                     className="w-full justify-start"
//                     asChild
//                   >
//                     <Link href={`?tab=credits`} className="flex items-center gap-2">
//                       <Settings className="h-4 w-4" />
//                       积分调整
//                     </Link>
//                   </Button>
//                   <Button
//                     variant={activeTab === 'orders' ? 'default' : 'outline'}
//                     className="w-full justify-start"
//                     asChild
//                   >
//                     <Link href={`?tab=orders`} className="flex items-center gap-2">
//                       <History className="h-4 w-4" />
//                       订单记录
//                     </Link>
//                   </Button>
//                 </CardContent>
//               </Card>

//               {/* 快速统计 */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>统计概览</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-muted-foreground">总订单数:</span>
//                     <span className="font-semibold">
//                       {safeNumber(userData.stats?.totalOrders)}
//                     </span>
//                   </div>
                  
//                   <div className="flex items-center justify-between text-sm">
//                     <div className="flex items-center space-x-1">
//                       <CreditCard className="h-3 w-3 text-blue-500" />
//                       <span className="text-muted-foreground">积分订单:</span>
//                     </div>
//                     <span className="font-medium">{safeNumber(userData.stats?.totalCreditOrders)}</span>
//                   </div>
                  
//                   <div className="flex items-center justify-between text-sm">
//                     <div className="flex items-center space-x-1">
//                       <Package className="h-3 w-3 text-purple-500" />
//                       <span className="text-muted-foreground">3D订单:</span>
//                     </div>
//                     <span className="font-medium">{safeNumber(userData.stats?.totalModelOrders)}</span>
//                   </div>
                  
//                   <div className="flex items-center justify-between text-sm pt-2 border-t">
//                     <span className="text-muted-foreground">总消费金额:</span>
//                     <span className="font-semibold text-green-600">
//                       {formatAmount(userTotalSpent)}
//                     </span>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* 右侧内容区域 */}
//             <div className="lg:col-span-3">
//               {activeTab === 'credits' && (
//                 <CreditsAdjustmentForm 
//                   userId={userId}
//                   currentCredits={userData.profile.creditsRemaining ?? 0}
//                 />
//               )}
              
//               {activeTab === 'orders' && (
//                 <OrderHistory 
//                   creditOrders={creditOrders}
//                   modelOrders={modelOrders}
//                 />
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   } catch (error) {
//     console.error('Error loading user data:', error);
//     redirect('/admin/user-management');
//   }
// }


// app/admin/user-management/[userId]/edit/page.tsx
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/admin-utils';
import { 
  getUserDetails, 
  getUserOrders, 
  getClerkUserData 
} from '@/lib/user-management-utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Navbar from "@/components/landing/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CreditCard, 
  User, 
  ShoppingCart, 
  Package,
  History,
  Mail,
  Building,
  MapPin,
  Calendar
} from 'lucide-react';
import CreditsAdjustmentForm from './credits-adjustment-form';
import OrderHistory from './order-history';

// 安全的日期格式化函数
function formatDate(date: Date | string | null): string {
  if (!date) return '从未登录';
  try {
    return new Date(date).toLocaleDateString('zh-CN');
  } catch {
    return '日期无效';
  }
}

// 格式化金额显示
function formatAmount(amount: number | null | undefined): string {
  if (!amount) return '¥0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `¥${(numAmount / 100).toFixed(2)}`;
}

// 安全地计算数字值
function safeNumber(value: number | null | undefined): number {
  if (!value || isNaN(Number(value))) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

export default async function EditUserCreditsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  // 等待 params 和 searchParams 解析
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const userId = resolvedParams.userId;
  const isAdmin = await isUserAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }

  try {
    // 并行获取用户详情和订单数据
    const [userData, ordersData, clerkUserData] = await Promise.all([
      getUserDetails(userId),
      getUserOrders(userId),
      getClerkUserData(userId)
    ]);

    if (!userData) {
      redirect('/admin/user-management');
    }

    // 处理可能的空值 - 更严格的检查
    const safeOrdersData = ordersData || {
      creditOrders: [],
      modelOrders: []
    };

    // 确保 creditOrders 和 modelOrders 是数组
    const creditOrders = Array.isArray(safeOrdersData.creditOrders) ? safeOrdersData.creditOrders : [];
    const modelOrders = Array.isArray(safeOrdersData.modelOrders) ? safeOrdersData.modelOrders : [];

    // 计算用户消费统计
    const userCreditSpent = safeNumber(userData.stats?.totalCreditSpent);
    const userModelSpent = safeNumber(userData.stats?.totalModelSpent);
    const userTotalSpent = userCreditSpent + userModelSpent;

    // 使用 Clerk 数据或回退到数据库数据
    const userAvatarUrl = clerkUserData?.imageUrl || userData.profile.avatarUrl;
    const userEmail = clerkUserData?.primaryEmail || userData.clerkUser?.primaryEmail;
    const userDisplayName = clerkUserData?.fullName || userData.clerkUser?.fullName || userData.profile.displayName || '未设置名称';

    // 获取当前激活的标签页
    const activeTab = resolvedSearchParams.tab || 'credits';

    return (
      <div className="min-h-screen bg-background overflow-hidden">
        <Navbar />
        <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
          {/* 返回按钮和标题 */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/user-management/${userId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回用户详情
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">编辑用户积分</h1>
              <p className="text-muted-foreground mt-1">调整用户积分余额并查看订单记录</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左侧导航栏 */}
            <div className="lg:col-span-1 space-y-4">
              {/* 用户信息卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    用户信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {userAvatarUrl ? (
                        <img 
                          src={userAvatarUrl} 
                          alt="Profile" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">
                        {userDisplayName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {safeNumber(userData.profile.creditsRemaining)} 积分
                        </Badge>
                        {userTotalSpent > 0 && (
                          <Badge variant="default" className="text-xs">
                            付费用户
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 统计信息 */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {safeNumber(userData.profile.creditsRemaining)}
                      </div>
                      <div className="text-xs text-muted-foreground">剩余积分</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {safeNumber(userData.profile.totalLogosGenerated)}
                      </div>
                      <div className="text-xs text-muted-foreground">生成Logo</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 操作导航 */}
              <Card>
                <CardHeader>
                  <CardTitle>操作菜单</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant={activeTab === 'credits' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`?tab=credits`} className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      积分调整
                    </Link>
                  </Button>
                  <Button
                    variant={activeTab === 'orders' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`?tab=orders`} className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      订单记录
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* 快速统计 */}
              <Card>
                <CardHeader>
                  <CardTitle>统计概览</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">总订单数:</span>
                    <span className="font-semibold">
                      {safeNumber(userData.stats?.totalOrders)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <CreditCard className="h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">积分订单:</span>
                    </div>
                    <span className="font-medium">{safeNumber(userData.stats?.totalCreditOrders)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Package className="h-3 w-3 text-purple-500" />
                      <span className="text-muted-foreground">3D订单:</span>
                    </div>
                    <span className="font-medium">{safeNumber(userData.stats?.totalModelOrders)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">总消费金额:</span>
                    <span className="font-semibold text-green-600">
                      {formatAmount(userTotalSpent)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧内容区域 */}
            <div className="lg:col-span-3">
              {activeTab === 'credits' && (
                <CreditsAdjustmentForm 
                  userId={userId}
                  currentCredits={userData.profile.creditsRemaining ?? 0}
                />
              )}
              
              {activeTab === 'orders' && (
                <OrderHistory 
                  creditOrders={creditOrders}
                  modelOrders={modelOrders}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading user data:', error);
    redirect('/admin/user-management');
  }
}