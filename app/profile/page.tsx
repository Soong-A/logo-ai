"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, User, History, CreditCard, Mail, Calendar, User as UserIcon, 
  Heart, Bookmark, RefreshCw, ShoppingCart 
} from "lucide-react";
import {
  IconBrandGithub,
  IconMail,
  IconWorld
} from "@tabler/icons-react";
import { UserProfile } from "@clerk/nextjs";
import Navbar from "@/components/landing/navbar";

// 数据库数据类型
interface UserProfileData {
  id: number;
  clerkUserId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  website: string | null;
  company: string | null;
  location: string | null;
  socialLinks: any;
  creditsRemaining: number;
  totalLogosGenerated: number;
  bookmarksCount: number;
  emailNotifications: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Transaction {
  id: string;
  type: string;
  date: string;
  description: string;
  amount: number;
}

interface Logo {
  id: number;
  image_url: string;
  primary_color: string;
  background_color: string;
  username: string;
  companyName: string | null;
  style: string | null;
  createdAt: Date;
}

interface Order {
  id: number;
  orderId: string;
  credits: number;
  price: number;
  status: string;
  createdAt: Date;
}

interface ModelItem {
  id: string;
  modelId: string;
  modelName: string;
  textureCount: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnail?: string;
  description?: string;
  createdAt: Date;
}

interface ModelOrder {
  id: number;
  orderId: string;
  items: ModelItem[];
  totalAmount: number;
  itemCount: number;
  status: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  createdAt: Date;
  formattedDate: string;
  formattedAmount: string;
}

interface UserData {
  userProfile: UserProfileData;
  recentTransactions: Transaction[];
  recentOrders: Order[];
  recentLogos: Logo[];
  recentModelOrders: ModelOrder[];
}

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

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("account");

  // 从数据库获取用户数据
  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user-profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to load profile data. Please try again.");
      // 如果API失败，使用模拟数据作为后备
      const mockUserData: UserData = {
        userProfile: {
          id: 1,
          clerkUserId: user.id,
          displayName: user.fullName,
          bio: null,
          avatarUrl: user.imageUrl,
          website: null,
          company: null,
          location: null,
          socialLinks: null,
          creditsRemaining: 5,
          totalLogosGenerated: 0,
          bookmarksCount: 0,
          emailNotifications: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        recentTransactions: [
          { id: "1", type: "signup_bonus", date: new Date().toISOString().split('T')[0], description: "注册奖励", amount: 5 }
        ],
        recentOrders: [],
        recentLogos: [],
        recentModelOrders: [
          {
            id: 1,
            orderId: "MODEL_001",
            items: [
              {
                id: "item1",
                modelId: "model_001",
                modelName: "Modern Chair",
                textureCount: 3,
                quantity: 1,
                unitPrice: 2999,
                totalPrice: 2999,
                thumbnail: "/placeholder-chair.jpg",
                description: "Modern designer chair with wood texture",
                createdAt: new Date()
              },
              {
                id: "item2",
                modelId: "model_002",
                modelName: "Coffee Table",
                textureCount: 2,
                quantity: 1,
                unitPrice: 1999,
                totalPrice: 1999,
                thumbnail: "/placeholder-table.jpg",
                description: "Round coffee table with glass top",
                createdAt: new Date()
              }
            ],
            totalAmount: 4998,
            itemCount: 2,
            status: "paid",
            paymentMethod: "credit_card",
            paidAt: new Date(),
            createdAt: new Date(),
            formattedDate: new Date().toLocaleDateString(),
            formattedAmount: "49.98"
          }
        ]
      };
      setUserData(mockUserData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [isLoaded, user]);

  // 骨架屏组件
  const SkeletonCard = () => (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if(!user){
    return(
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p>Please Sign in to view your profile</p>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* 主要内容区域 */}
      <div className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account and view your activity</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="text-red-700">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUserData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            // 骨架屏 - 简化布局
            <Tabs value="account" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account" disabled>
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="activity" disabled>
                  <History className="h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="billing" disabled>
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
              </TabsList>
              <div className="grid gap-6 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </Tabs>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 用户基本信息 */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Profile Information</CardTitle>
                      <CardDescription>
                        Your basic account details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {user.imageUrl ? (
                            <img 
                              src={user.imageUrl} 
                              alt="Profile" 
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{user.username || user.fullName || "User"}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {userData?.userProfile.company && `Works at ${userData.userProfile.company}`}
                            {!userData?.userProfile.company && "Member since " + (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.primaryEmailAddress?.emailAddress || "No email"}
                            </p>
                          </div>
                        </div>
                        
                        {userData?.userProfile.location && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">Location</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {userData.userProfile.location}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {userData?.userProfile.bio && (
                        <div className="pt-2">
                          <p className="text-sm font-medium">Bio</p>
                          <p className="text-sm text-muted-foreground break-words">{userData.userProfile.bio}</p>
                        </div>
                      )}

                      {/* 按钮组 */}
                      <div className="pt-4 space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-center"
                          onClick={() => document.getElementById('clerk-profile-modal')?.classList.remove('hidden')}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        
                        <Link href="/cart" className="block">
                          <Button variant="outline" className="w-full justify-center">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            View Shopping Cart
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 应用数据 */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Usage Stats</CardTitle>
                      <CardDescription>
                        Your activity in our application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userData && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 text-center p-3 bg-secondary rounded-lg">
                              <p className="text-sm font-medium">Credits</p>
                              <p className="text-2xl font-bold text-primary">{userData.userProfile.creditsRemaining}</p>
                            </div>
                            <div className="space-y-1 text-center p-3 bg-secondary rounded-lg">
                              <p className="text-sm font-medium">Logos</p>
                              <p className="text-2xl font-bold text-primary">{userData.userProfile.totalLogosGenerated}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 text-sm">
                              <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">Likes: {userData.userProfile.bookmarksCount}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Bookmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">Bookmarks: {userData.userProfile.bookmarksCount}</span>
                            </div>
                          </div>

                          <div className="pt-4">
                            <Link href="/history" className="block">
                              <Button variant="outline" className="w-full justify-center">
                                <History className="h-4 w-4 mr-2" />
                                History Logo
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 最近交易记录 */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Credit Transactions</CardTitle>
                      <CardDescription>
                        Your recent credit activities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userData && userData.recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {userData.recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{transaction.description}</p>
                                <p className="text-sm text-muted-foreground">{transaction.date}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ml-2 ${
                                transaction.amount > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No recent transactions</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 最近生成的 Logo */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Recent Logos</CardTitle>
                      <CardDescription>
                        Your recently generated logos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userData && userData.recentLogos.length > 0 ? (
                        <div className="space-y-3">
                          {userData.recentLogos.map((logo) => (
                            <div key={logo.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                              <div 
                                className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: logo.background_color }}
                              >
                                <div 
                                  className="w-8 h-8 rounded"
                                  style={{ backgroundColor: logo.primary_color }}
                                ></div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{logo.companyName || "Untitled Logo"}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {logo.style} • {new Date(logo.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No logos generated yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="billing">
                <div className="space-y-6">
                  {/* 积分订单 */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Credit Orders</CardTitle>
                      <CardDescription>
                        Your credit package purchase history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userData && userData.recentOrders.length > 0 ? (
                        <div className="space-y-3">
                          {userData.recentOrders.map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">Credit Package #{order.orderId}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {order.credits} credits • ${(order.price / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${
                                  order.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order.status}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No credit orders yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 3D模型订单 */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">3D Model Orders</CardTitle>
                      <CardDescription>
                        Your 3D model purchase history with item details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userData && userData.recentModelOrders.length > 0 ? (
                        <div className="space-y-4">
                          {userData.recentModelOrders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 space-y-3">
                              {/* 订单头部信息 */}
                              <div className="flex justify-between items-center">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">Order #{order.orderId}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {order.itemCount} item{order.itemCount > 1 ? 's' : ''} • ${order.formattedAmount}
                                    {order.paymentMethod && ` • ${order.paymentMethod}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    order.status === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : order.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {order.formattedDate}
                                  </span>
                                </div>
                              </div>

                              {/* 商品列表 */}
                              <div className="border-t pt-3">
                                <h4 className="text-sm font-medium mb-2">Purchased Items:</h4>
                                <div className="space-y-2">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium truncate">{item.modelName}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.textureCount} texture{item.textureCount > 1 ? 's' : ''} × {item.quantity}
                                          </p>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-medium">${(item.totalPrice / 100).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">
                                          ${(item.unitPrice / 100).toFixed(2)} each
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 订单总计 */}
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="font-medium">Total</span>
                                <span className="font-bold">${order.formattedAmount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No 3D model orders yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 账户信息 */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Account Information</CardTitle>
                      <CardDescription>
                        Your current account status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userData && (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Current Credits</p>
                              <p className="text-lg font-semibold">{userData.userProfile.creditsRemaining} credits</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Account Type</p>
                              <p className="text-lg">Free Account</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Link href="/credits">
                              <Button>Buy Credits</Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Clerk Profile Modal */}
          <div id="clerk-profile-modal" className="hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-semibold">Edit Profile</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => document.getElementById('clerk-profile-modal')?.classList.add('hidden')}
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <UserProfile 
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "h-full",
                      card: "h-full shadow-none",
                      scrollBox: "h-full"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
   <Footer />
    </div>
  );
}