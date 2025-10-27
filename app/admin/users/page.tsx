// app/admin/users/page.tsx
import { redirect } from 'next/navigation';
import { isUserAdmin, addAdminUser, deactivateAdminUser, activateAdminUser } from '@/lib/admin-utils';
import { db } from '@/db';
import { adminUsersTable, userProfilesTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Navbar from "@/components/landing/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddAdminForm } from './add-admin-form';
import { CopyButton } from '@/components/ui/copy-button';
import { Users, Shield, Calendar, CheckCircle, XCircle, User, Mail } from 'lucide-react';

// 安全的日期格式化函数
function formatDate(date: Date | string | null): string {
  if (!date) return '从未登录';
  try {
    return new Date(date).toLocaleDateString('zh-CN');
  } catch {
    return '日期无效';
  }
}

// 获取 Clerk 用户信息的函数 - 使用 Clerk Backend API
async function getClerkUserData(clerkUserId: string) {
  try {
    // 使用 Clerk Backend API
    const response = await fetch(
      `https://api.clerk.com/v1/users/${clerkUserId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 } // 缓存 60 秒
      }
    );

    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status}`);
    }

    const user = await response.json();
    
    // 提取主要邮箱
    const primaryEmail = user.primary_email_address_id 
      ? user.email_addresses?.find((email: any) => email.id === user.primary_email_address_id)?.email_address
      : user.email_addresses?.[0]?.email_address;

    return {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      imageUrl: user.image_url,
      emailAddresses: user.email_addresses,
      primaryEmail: primaryEmail,
      createdAt: user.created_at ? new Date(user.created_at * 1000) : null, // Clerk 使用秒时间戳
    };
  } catch (error) {
    console.error(`Error fetching Clerk user data for ${clerkUserId}:`, error);
    
    // 回退到从数据库获取基本信息
    try {
      const userProfile = await db
        .select()
        .from(userProfilesTable)
        .where(eq(userProfilesTable.clerkUserId, clerkUserId))
        .limit(1);
      
      if (userProfile.length > 0) {
        return {
          username: null,
          firstName: null,
          lastName: null,
          fullName: userProfile[0].displayName,
          imageUrl: userProfile[0].avatarUrl,
          emailAddresses: [],
          primaryEmail: null,
          createdAt: userProfile[0].createdAt,
        };
      }
    } catch (dbError) {
      console.error('Database fallback also failed:', dbError);
    }
    
    return null;
  }
}

export default async function AdminUsersPage() {
  const isAdmin = await isUserAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }

  // 获取所有管理员用户
  const adminUsers = await db
    .select({
      admin: adminUsersTable,
      user: userProfilesTable,
    })
    .from(adminUsersTable)
    .leftJoin(
      userProfilesTable,
      eq(adminUsersTable.clerkUserId, userProfilesTable.clerkUserId)
    )
    .orderBy(adminUsersTable.createdAt);

  // 获取每个管理员的 Clerk 用户信息
  const adminUsersWithClerkData = await Promise.all(
    adminUsers.map(async (item) => {
      const clerkUserData = await getClerkUserData(item.admin.clerkUserId);
      return {
        ...item,
        clerkUser: clerkUserData,
      };
    })
  );

  // 统计信息
  const activeAdmins = adminUsersWithClerkData.filter(item => item.admin.isActive).length;
  const totalAdmins = adminUsersWithClerkData.length;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                总管理员数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                活跃管理员
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                非活跃管理员
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalAdmins - activeAdmins}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                超级管理员
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {adminUsersWithClerkData.filter(item => item.admin.role === 'super_admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Shield className="h-8 w-8 mr-3 text-primary" />
              管理员管理
            </h1>
            <p className="text-muted-foreground mt-2">
              管理平台管理员账户和权限 • 共 {totalAdmins} 个管理员
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/dashboard">返回仪表板</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 添加管理员表单 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                添加管理员
              </CardTitle>
              <CardDescription>
                通过 Clerk User ID 添加新的管理员账户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddAdminForm />
            </CardContent>
          </Card>

          {/* 管理员列表 */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>管理员列表</CardTitle>
                <CardDescription>
                  当前所有管理员账户信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {adminUsersWithClerkData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">暂无管理员数据</p>
                      <p className="text-sm mt-2">请添加第一个管理员账户</p>
                    </div>
                  ) : (
                    adminUsersWithClerkData.map(({ admin, user, clerkUser }) => {
                      // 安全处理权限数据
                      const permissions = Array.isArray(admin.permissions) 
                        ? admin.permissions as string[]
                        : [];

                      // 获取显示名称（优先使用 Clerk 用户名）
                      const displayName = clerkUser?.username || 
                                        clerkUser?.fullName || 
                                        user?.displayName || 
                                        '未设置名称';

                      return (
                        <div key={admin.id} className="flex items-start justify-between p-6 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              {clerkUser?.imageUrl ? (
                                <img 
                                  src={clerkUser.imageUrl} 
                                  alt="Profile" 
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* 管理员名称和基本信息 */}
                              <div className="flex items-center space-x-3 mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold truncate">
                                    {displayName}
                                  </h3>
                                  {clerkUser?.primaryEmail && (
                                    <div className="flex items-center space-x-1 mt-1">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground truncate">
                                        {clerkUser.primaryEmail}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={
                                      admin.role === 'super_admin' ? 'default' : 
                                      admin.isActive ? 'secondary' : 'outline'
                                    }
                                    className={
                                      admin.role === 'super_admin' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                                    }
                                  >
                                    {admin.role === 'super_admin' ? '超级管理员' : '管理员'}
                                  </Badge>
                                  <Badge 
                                    variant={admin.isActive ? "default" : "destructive"}
                                  >
                                    {admin.isActive ? '活跃' : '已停用'}
                                  </Badge>
                                </div>
                              </div>

                              {/* 用户ID - 突出显示 */}
                              <div className="mb-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-muted-foreground">用户ID:</span>
                                  <CopyButton text={admin.clerkUserId} />
                                </div>
                                <code className="block bg-muted p-2 rounded text-sm font-mono break-all border">
                                  {admin.clerkUserId}
                                </code>
                              </div>

                              {/* Clerk 用户名信息 */}
                              {clerkUser?.username && (
                                <div className="mb-2">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="font-medium text-muted-foreground">用户名:</span>
                                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                      @{clerkUser.username}
                                    </code>
                                  </div>
                                </div>
                              )}

                              {/* 详细信息和时间 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div className="space-y-1">
                                  {user?.company && (
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">公司:</span>
                                      <span>{user.company}</span>
                                    </div>
                                  )}
                                  {user?.location && (
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">位置:</span>
                                      <span>{user.location}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">注册时间:</span>
                                    <span>
                                      {clerkUser?.createdAt 
                                        ? formatDate(clerkUser.createdAt) 
                                        : formatDate(admin.createdAt)
                                      }
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">最后登录:</span>
                                    <span>{formatDate(admin.lastLoginAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 权限信息 */}
                              {permissions.length > 0 && (
                                <div className="mt-3">
                                  <span className="text-sm font-medium text-muted-foreground">权限:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {permissions.slice(0, 5).map((permission, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {permission}
                                      </Badge>
                                    ))}
                                    {permissions.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{permissions.length - 5} 更多
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex flex-col space-y-2 ml-4">
                            {admin.isActive ? (
                              <form action={async () => {
                                'use server';
                                await deactivateAdminUser(admin.clerkUserId);
                                redirect('/admin/users');
                              }}>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  type="submit"
                                  className="whitespace-nowrap"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  停用
                                </Button>
                              </form>
                            ) : (
                              <form action={async () => {
                                'use server';
                                await activateAdminUser(admin.clerkUserId);
                                redirect('/admin/users');
                              }}>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  type="submit"
                                  className="whitespace-nowrap"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  启用
                                </Button>
                              </form>
                            )}
                            
                            {/* 编辑按钮 - 可以后续实现编辑功能 */}
                            <Button variant="outline" size="sm" className="whitespace-nowrap" asChild>
                              <Link href={`/admin/users/${admin.clerkUserId}/edit`}>
                                编辑权限
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  管理员权限说明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>超级管理员</strong>：拥有所有权限，可以管理其他管理员</p>
                  <p><strong>管理员</strong>：拥有基础管理权限，可以管理用户、内容和订单</p>
                  <p><strong>已停用</strong>：该管理员账户暂时无法访问管理功能</p>
                  <p className="mt-3">💡 提示：请谨慎分配管理员权限，确保只有可信用户拥有管理权限</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}