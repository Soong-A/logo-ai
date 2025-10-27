// // app/admin/dashboard/page.tsx
// import { redirect } from 'next/navigation';
// import { isUserAdmin, getPlatformStats, getRecentActivity } from '@/lib/admin-utils';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
// import Navbar from "@/components/landing/navbar";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Users, Image, ShoppingCart, TrendingUp } from 'lucide-react';

// export default async function AdminDashboard() {
//   const isAdmin = await isUserAdmin();
  
//   if (!isAdmin) {
//     redirect('/');
//   }

//   const stats = await getPlatformStats();
//   const activity = await getRecentActivity();

//   const statCards = [
//     {
//       title: '总用户数',
//       value: stats.totalUsers,
//       description: '平台注册用户总数',
//       icon: Users,
//       color: 'text-blue-600',
//       bgColor: 'bg-blue-50'
//     },
//     {
//       title: 'Logo 生成数',
//       value: stats.totalLogos,
//       description: '已生成的 Logo 总数',
//       icon: Image,
//       color: 'text-green-600',
//       bgColor: 'bg-green-50'
//     },
//     {
//       title: '成功订单',
//       value: stats.totalOrders,
//       description: '已支付的订单总数',
//       icon: ShoppingCart,
//       color: 'text-purple-600',
//       bgColor: 'bg-purple-50'
//     },
//     {
//       title: '今日新增',
//       value: stats.todayUsers,
//       description: '今日新注册用户',
//       icon: TrendingUp,
//       color: 'text-orange-600',
//       bgColor: 'bg-orange-50'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-background overflow-hidden">
//       <Navbar />
//       <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
//         {/* 页面标题 */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold">管理仪表板</h1>
//             <p className="text-muted-foreground mt-2">平台数据概览和快速操作</p>
//           </div>
//           {/* <div className="flex space-x-2">
//             <Button asChild variant="outline">
//               <Link href="/admin/users">管理员管理</Link>
//             </Button>
//           </div> */}
//         </div>

//         {/* 统计卡片 */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {statCards.map((stat, index) => (
//             <Card key={index}>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   {stat.title}
//                 </CardTitle>
//                 <stat.icon className={`h-4 w-4 ${stat.color}`} />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stat.value}</div>
//                 <p className="text-xs text-muted-foreground">
//                   {stat.description}
//                 </p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* 快速操作和最近活动 */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* 快速操作 */}
//           <Card>
//             <CardHeader>
//               <CardTitle>快速操作</CardTitle>
//               <CardDescription>常用管理功能</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-2 gap-4">
//                 <Button asChild variant="outline" className="h-auto py-3">
//                   <Link href="/admin/user-management">
//                     <div className="text-left">
//                       <div className="font-semibold">用户管理</div>
//                       <div className="text-xs text-muted-foreground mt-1">
//                         查看和管理所有用户积分|订单
//                       </div>
//                     </div>
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" className="h-auto py-3">
//                   <Link href="/admin/users">
//                     <div className="text-left">
//                       <div className="font-semibold">管理员管理</div>
//                       <div className="text-xs text-muted-foreground mt-1">
//                         查看和管理所有管理员
//                       </div>
//                     </div>
//                   </Link>
//                 </Button>
//                 {/* <Button asChild variant="outline" className="h-auto py-3">
//                   <Link href="/admin/logos">
//                     <div className="text-left">
//                       <div className="font-semibold">Logo 管理</div>
//                       <div className="text-xs text-muted-foreground mt-1">
//                         查看和审核 Logo
//                       </div>
//                     </div>
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" className="h-auto py-3">
//                   <Link href="/admin/orders">
//                     <div className="text-left">
//                       <div className="font-semibold">订单管理</div>
//                       <div className="text-xs text-muted-foreground mt-1">
//                         处理用户订单
//                       </div>
//                     </div>
//                   </Link>
//                 </Button> */}
//                 {/* <Button asChild variant="outline" className="h-auto py-3">
//                   <Link href="/gallery">
//                     <div className="text-left">
//                       <div className="font-semibold">作品库</div>
//                       <div className="text-xs text-muted-foreground mt-1">
//                         浏览用户作品
//                       </div>
//                     </div>
//                   </Link>
//                 </Button> */}
//               </div>
//             </CardContent>
//           </Card>

//           {/* 最近活动 */}
//           <Card>
//             <CardHeader>
//               <CardTitle>最近活动</CardTitle>
//               <CardDescription>平台最新动态</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   <div className="flex-1">
//                     <p className="text-sm font-medium">新用户注册</p>
//                     <p className="text-xs text-muted-foreground">
//                       今日新增 {stats.todayUsers} 个用户
//                     </p>
//                   </div>
//                 </div>
//                 {activity.recentLogos.length > 0 && (
//                   <div className="flex items-center space-x-4">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium">Logo 生成</p>
//                       <p className="text-xs text-muted-foreground">
//                         最近生成了 {activity.recentLogos.length} 个 Logo
//                       </p>
//                     </div>
//                   </div>
//                 )}
//                 {activity.recentOrders.length > 0 && (
//                   <div className="flex items-center space-x-4">
//                     <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium">新订单</p>
//                       <p className="text-xs text-muted-foreground">
//                         有 {activity.recentOrders.length} 个新订单待处理
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }


// app/admin/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { 
  isUserAdmin, 
  getPlatformStats, 
  getRecentActivity,
  getLogoStyleStats,
  getDailyLogoStats,
  getPopularLogos
} from '@/lib/admin-utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Navbar from "@/components/landing/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Image, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react';
import LogoStatsChart from '@/components/charts/logo-stats-chart';
import PopularLogos from '@/components/charts/popular-logos';

export default async function AdminDashboard() {
  const isAdmin = await isUserAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }

  // 并行获取所有数据
  const [stats, activity, styleStats, dailyStats, popularLogos] = await Promise.all([
    getPlatformStats(),
    getRecentActivity(),
    getLogoStyleStats(),
    getDailyLogoStats(),
    getPopularLogos(5)
  ]);

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      description: '平台注册用户总数',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Logo 生成数',
      value: stats.totalLogos.toLocaleString(),
      description: '已生成的 Logo 总数',
      icon: Image,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '成功订单',
      value: stats.totalOrders.toLocaleString(),
      description: '已支付的订单总数',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '今日新增',
      value: stats.todayUsers.toLocaleString(),
      description: '今日新注册用户',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">管理仪表板</h1>
            <p className="text-muted-foreground mt-2">平台数据概览和快速操作</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 数据可视化图表 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Logo 数据分析
              </CardTitle>
              <CardDescription>
                用户生成 Logo 的风格分布和趋势分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogoStatsChart 
                styleStats={styleStats} 
                dailyStats={dailyStats} 
              />
            </CardContent>
          </Card>
        </div>

        {/* 热门 Logo 展示 */}
        <div className="mb-8">
          <PopularLogos popularLogos={popularLogos} />
        </div>

        {/* 快速操作和最近活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>常用管理功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-auto py-3">
                  <Link href="/admin/user-management">
                    <div className="text-left">
                      <div className="font-semibold">用户管理</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        查看和管理所有用户积分|订单
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-3">
                  <Link href="/admin/users">
                    <div className="text-left">
                      <div className="font-semibold">管理员管理</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        查看和管理所有管理员
                      </div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 最近活动 */}
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>平台最新动态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">新用户注册</p>
                    <p className="text-xs text-muted-foreground">
                      今日新增 {stats.todayUsers} 个用户
                    </p>
                  </div>
                </div>
                {activity.recentLogos.length > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Logo 生成</p>
                      <p className="text-xs text-muted-foreground">
                        最近生成了 {activity.recentLogos.length} 个 Logo
                      </p>
                    </div>
                  </div>
                )}
                {activity.recentOrders.length > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">新订单</p>
                      <p className="text-xs text-muted-foreground">
                        有 {activity.recentOrders.length} 个新订单待处理
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}