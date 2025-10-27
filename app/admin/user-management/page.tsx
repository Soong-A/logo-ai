// app/admin/user-management/page.tsx
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/admin-utils';
import { getUsersList, getUserManagementStats } from '@/lib/user-management-utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Navbar from "@/components/landing/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { 
  Search, 
  Users, 
  Image, 
  ShoppingCart, 
  CreditCard, 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Calendar,
  Package,
  DollarSign,
} from 'lucide-react';

import {
  IconBrandGithub,
  IconMail,
  IconWorld
} from "@tabler/icons-react";

const Footer = () => (
  <div className="flex justify-between items-center mt-8 px-4 max-sm:flex-col">
    {/* <div className="px-4 py-2 text-sm max-sm:hidden">
      Powered by{" "}            
      <Link href="https://dub.sh/nebius" className="text-foreground hover:text-primary transition-colors">
        Nebius AI
      </Link>
    </div> */}

    <div className="px-4 py-2 text-sm">
      Made with ❤️ by{" "}
      <Link 
        href="https://github.com/Soong-A" 
        target="_blank"
        className="text-foreground hover:text-primary transition-colors"
      >
        Soong
      </Link>
    </div>

    <div className="flex gap-4 items-center max-sm:hidden">
      <Link 
                href="mailto:SYR-Soong@outlook.com" 
                className="hover:text-primary transition-colors"
                title="发送邮件"
              >
                <IconMail className="size-5 md:size-6" />
              </Link>
              

              <Link 
                href="https://github.com/Soong-A" 
                target="_blank" 
                className="hover:text-primary transition-colors"
                title="GitHub"
              >
                <IconBrandGithub className="size-5 md:size-6" />
              </Link>

              <Link 
                href="https://soong-a.github.io/" 
                target="_blank"
                className="hover:text-primary transition-colors"
                title="个人网站"
              >
                <IconWorld className="size-5 md:size-6" />
              </Link>
    </div>
  </div>
);


// 安全的日期格式化函数
function formatDate(date: Date | string | null): string {
  if (!date) return '从未登录';
  try {
    return new Date(date).toLocaleDateString('zh-CN');
  } catch {
    return '日期无效';
  }
}

// 格式化金额显示 - 修复金额计算
function formatAmount(amount: number | null | undefined): string {
  if (!amount) return '¥0.00';
  // 确保金额是数字，如果是字符串就转换为数字
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `¥${(numAmount / 100).toFixed(2)}`;
}

// 安全地计算数字值
function safeNumber(value: number | null | undefined): number {
  if (!value || isNaN(Number(value))) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const isAdmin = await isUserAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  
  // 获取用户数据和统计信息
  const [{ users, pagination }, stats] = await Promise.all([
    getUsersList({
      page,
      limit: 20,
      search,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    getUserManagementStats()
  ]);

  // 安全地计算当前页面的统计数据
  const totalCredits = users.reduce((sum, user) => sum + safeNumber(user.creditsRemaining), 0);
  const totalGenerated = users.reduce((sum, user) => sum + safeNumber(user.totalLogosGenerated), 0);
  
  // 修复总消费金额计算 - 确保使用正确的字段
  const totalSpent = users.reduce((sum, user) => {
    const creditSpent = safeNumber(user.creditSpent);
    const modelSpent = safeNumber(user.modelSpent);
    return sum + creditSpent + modelSpent;
  }, 0);

  // 修复总收入计算 - 确保统计数据的正确性
  const totalRevenue = safeNumber(stats.totalRevenue);
  const totalCreditRevenue = safeNumber(stats.totalCreditRevenue);
  const totalModelRevenue = safeNumber(stats.totalModelRevenue);
  
  // 验证总收入计算是否正确
  const calculatedTotalRevenue = totalCreditRevenue + totalModelRevenue;
  const revenueDiffers = Math.abs(totalRevenue - calculatedTotalRevenue) > 1; // 允许1分的误差

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Users className="h-8 w-8 mr-3 text-primary" />
              用户管理
            </h1>
            <p className="text-muted-foreground mt-2">
              管理平台用户账户和积分 • 共 {pagination.total} 个用户
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/dashboard">返回仪表板</Link>
          </Button>
        </div>

        {/* 统计卡片 - 修复总收入计算 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                总用户数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-2 text-green-600" />
                今日新增
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.todayUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Image className="h-4 w-4 mr-2 text-blue-600" />
                总Logo数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalLogos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2 text-purple-600" />
                总订单数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                积分订单: {stats.totalCreditOrders} | 3D订单: {stats.totalModelOrders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-orange-600" />
                总收入
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatAmount(revenueDiffers ? calculatedTotalRevenue : totalRevenue)}
                {/* {revenueDiffers && (
                  <span className="text-xs text-yellow-600 ml-1">(已校正)</span>
                )} */}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                积分: {formatAmount(totalCreditRevenue)} | 3D: {formatAmount(totalModelRevenue)}
              </p>
              {/* {revenueDiffers && (
                <p className="text-xs text-yellow-600 mt-1">
                  数据库总收入: {formatAmount(totalRevenue)} ≠ 计算总收入: {formatAmount(calculatedTotalRevenue)}
                </p>
              )} */}
            </CardContent>
          </Card>
        </div>

        {/* 搜索和统计 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索用户名称..."
                  className="pl-10"
                  defaultValue={search}
                />
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-4 w-4" />
                  <span>当前页积分: {totalCredits}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Image className="h-4 w-4" />
                  <span>当前页生成: {totalGenerated}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>当前页消费: {formatAmount(totalSpent)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {search ? '没有找到匹配的用户' : '暂无用户数据'}
            </div>
          ) : (
            users.map((user) => {
              // 为每个用户计算正确的消费金额
              const userCreditSpent = safeNumber(user.creditSpent);
              const userModelSpent = safeNumber(user.modelSpent);
              const userTotalSpent = userCreditSpent + userModelSpent;
              
              return (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* 使用 Clerk 头像 */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {user.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">
                            {user.displayName}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {safeNumber(user.creditsRemaining)} 积分
                            </Badge>
                            {user.totalOrders > 0 && (
                              <Badge variant="default" className="text-xs">
                                付费用户
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 用户ID - 完整显示 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">用户ID:</span>
                      <CopyButton text={user.clerkUserId} />
                    </div>

                    {/* Clerk 用户名 */}
                    {user.clerkUser?.username && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">用户名:</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          @{user.clerkUser.username}
                        </code>
                      </div>
                    )}

                    {/* 邮箱信息 */}
                    {user.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">邮箱:</span>
                        <span className="flex-1 truncate">{user.email}</span>
                      </div>
                    )}

                    {/* 公司信息 */}
                    {user.company && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">公司:</span>
                        <span className="flex-1 truncate">{user.company}</span>
                      </div>
                    )}

                    {/* 位置信息 */}
                    {user.location && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">位置:</span>
                        <span className="flex-1 truncate">{user.location}</span>
                      </div>
                    )}

                    {/* 统计信息 */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {safeNumber(user.creditsRemaining)}
                        </div>
                        <div className="text-xs text-muted-foreground">剩余积分</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {safeNumber(user.totalLogosGenerated)}
                        </div>
                        <div className="text-xs text-muted-foreground">生成Logo</div>
                      </div>
                    </div>

                    {/* 订单信息 - 修复金额计算 */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">总订单数:</span>
                        <span className="font-semibold">{safeNumber(user.totalOrders)}</span>
                      </div>
                      
                      {/* 积分订单详情 */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">积分订单:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{safeNumber(user.creditOrders)}</span>
                          <span className="text-green-600 text-xs">
                            {formatAmount(userCreditSpent)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 3D模型订单详情 */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3 text-purple-500" />
                          <span className="text-muted-foreground">3D订单:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{safeNumber(user.modelOrders)}</span>
                          <span className="text-green-600 text-xs">
                            {formatAmount(userModelSpent)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 总消费金额 - 使用计算后的正确值 */}
                      <div className="flex items-center justify-between text-sm pt-1 border-t">
                        <span className="text-muted-foreground">总消费金额:</span>
                        <span className="font-semibold text-green-600">
                          {formatAmount(userTotalSpent)}
                        </span>
                      </div>
                    </div>

                    {/* 时间信息 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>注册: {formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex space-x-2 pt-3">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/admin/user-management/${user.clerkUserId}`}>
                          查看详情
                        </Link>
                      </Button>
                      {/* <Button variant="default" size="sm" asChild>
                        <Link href={`/admin/user-management/${user.clerkUserId}/edit`}>
                          编辑积分
                        </Link>
                      </Button> */}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              asChild
            >
              <Link 
                href={{
                  pathname: '/admin/user-management',
                  query: { ...(search && { search }), page: pagination.page - 1 }
                }}
              >
                上一页
              </Link>
            </Button>
            
            <span className="text-sm text-muted-foreground">
              第 {pagination.page} 页，共 {pagination.totalPages} 页
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              asChild
            >
              <Link 
                href={{
                  pathname: '/admin/user-management',
                  query: { ...(search && { search }), page: pagination.page + 1 }
                }}
              >
                下一页
              </Link>
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}