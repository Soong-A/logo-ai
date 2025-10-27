// // lib/user-management-utils.ts
// import { db } from '@/db';
// import { 
//   userProfilesTable, 
//   creditTransactionsTable, 
//   ordersTable,
//   logosTable,
//   bookmarksTable,
//   likesTable,
//   modelOrdersTable // 添加模型订单表
// } from '@/db/schema';
// import { eq, desc, like, and, gte, sql, count, asc } from 'drizzle-orm';
// import { auth } from '@clerk/nextjs/server';
// import { clerkClient } from '@clerk/nextjs/server';

// // Clerk 用户数据类型定义
// export interface ClerkUserData {
//   username: string | null;
//   firstName: string | null;
//   lastName: string | null;
//   fullName: string;
//   imageUrl: string | null;
//   primaryEmail: string | null;
//   createdAt: Date | null;
// }

// // 获取单个 Clerk 用户数据
// export async function getClerkUserData(clerkUserId: string): Promise<ClerkUserData | null> {
//   try {
//     // 正确的 Clerk 客户端用法
//     const client = await clerkClient();
//     const user = await client.users.getUser(clerkUserId);
    
//     // 提取主要邮箱
//     const primaryEmail = user.primaryEmailAddressId 
//       ? user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
//       : user.emailAddresses[0]?.emailAddress;

//     return {
//       username: user.username,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '未知用户',
//       imageUrl: user.imageUrl,
//       primaryEmail: primaryEmail || null,
//       createdAt: user.createdAt ? new Date(user.createdAt) : null,
//     };
//   } catch (error) {
//     console.error(`Error fetching Clerk user data for ${clerkUserId}:`, error);
//     return null;
//   }
// }

// // 批量获取 Clerk 用户数据
// export async function getClerkUsersData(clerkUserIds: string[]): Promise<Map<string, ClerkUserData>> {
//   try {
//     // 正确的 Clerk 客户端用法
//     const client = await clerkClient();
//     const users = await client.users.getUserList({
//       userId: clerkUserIds,
//       limit: 100
//     });

//     const userMap = new Map<string, ClerkUserData>();
    
//     users.data.forEach(user => {
//       const primaryEmail = user.primaryEmailAddressId 
//         ? user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
//         : user.emailAddresses[0]?.emailAddress;

//       userMap.set(user.id, {
//         username: user.username,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '未知用户',
//         imageUrl: user.imageUrl,
//         primaryEmail: primaryEmail || null,
//         createdAt: user.createdAt ? new Date(user.createdAt) : null,
//       });
//     });

//     return userMap;
//   } catch (error) {
//     console.error('Error fetching Clerk users data:', error);
//     return new Map();
//   }
// }

// // 安全的数字处理函数
// function safeNumber(value: number | null | undefined): number {
//   return value ?? 0;
// }

// // 获取用户列表
// export async function getUsersList(options: {
//   page?: number;
//   limit?: number;
//   search?: string;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// } = {}) {
//   const {
//     page = 1,
//     limit = 20,
//     search = '',
//     sortBy = 'createdAt',
//     sortOrder = 'desc'
//   } = options;

//   const offset = (page - 1) * limit;

//   try {
//     // 构建查询条件
//     const whereConditions: any[] = [];
    
//     if (search) {
//       whereConditions.push(
//         like(userProfilesTable.displayName, `%${search}%`)
//       );
//     }

//     const orderByFn = sortOrder === 'desc' ? desc : asc;
//     let orderByColumn;
//     switch (sortBy) {
//       case 'displayName':
//         orderByColumn = userProfilesTable.displayName;
//         break;
//       case 'totalLogosGenerated':
//         orderByColumn = userProfilesTable.totalLogosGenerated;
//         break;
//       case 'creditsRemaining':
//         orderByColumn = userProfilesTable.creditsRemaining;
//         break;
//       case 'createdAt':
//       default:
//         orderByColumn = userProfilesTable.createdAt;
//     }

//     // 第一步：获取用户列表（不带统计信息）
//     const users = await db
//       .select({
//         id: userProfilesTable.id,
//         clerkUserId: userProfilesTable.clerkUserId,
//         displayName: userProfilesTable.displayName,
//         avatarUrl: userProfilesTable.avatarUrl,
//         company: userProfilesTable.company,
//         location: userProfilesTable.location,
//         creditsRemaining: userProfilesTable.creditsRemaining,
//         totalLogosGenerated: userProfilesTable.totalLogosGenerated,
//         emailNotifications: userProfilesTable.emailNotifications,
//         createdAt: userProfilesTable.createdAt,
//         updatedAt: userProfilesTable.updatedAt,
//       })
//       .from(userProfilesTable)
//       .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
//       .orderBy(orderByFn(orderByColumn))
//       .limit(limit)
//       .offset(offset);

//     // 第二步：为每个用户查询统计信息
//     const usersWithStats = await Promise.all(
//       users.map(async (user) => {
//         // 查询积分订单
//         const creditOrdersResult = await db
//           .select({
//             count: sql<number>`COUNT(*)`.as('count'),
//             total: sql<number>`COALESCE(SUM(${ordersTable.price}), 0)`.as('total'),
//           })
//           .from(ordersTable)
//           .where(
//             and(
//               eq(ordersTable.clerkUserId, user.clerkUserId),
//               eq(ordersTable.status, 'paid')
//             )
//           );

//         // 查询3D模型订单
//         const modelOrdersResult = await db
//           .select({
//             count: sql<number>`COUNT(*)`.as('count'),
//             total: sql<number>`COALESCE(SUM(${modelOrdersTable.totalAmount}), 0)`.as('total'),
//           })
//           .from(modelOrdersTable)
//           .where(
//             and(
//               eq(modelOrdersTable.clerkUserId, user.clerkUserId),
//               eq(modelOrdersTable.status, 'paid')
//             )
//           );

//         const creditOrders = creditOrdersResult[0]?.count || 0;
//         const creditSpent = creditOrdersResult[0]?.total || 0;
//         const modelOrders = modelOrdersResult[0]?.count || 0;
//         const modelSpent = modelOrdersResult[0]?.total || 0;

//         // 查询其他统计信息
//         const bookmarksResult = await db
//           .select({ count: sql<number>`COUNT(*)`.as('count') })
//           .from(bookmarksTable)
//           .where(eq(bookmarksTable.clerkUserId, user.clerkUserId));

//         const likesResult = await db
//           .select({ count: sql<number>`COUNT(*)`.as('count') })
//           .from(likesTable)
//           .where(eq(likesTable.clerkUserId, user.clerkUserId));

//         return {
//           ...user,
//           creditOrders,
//           creditSpent,
//           modelOrders,
//           modelSpent,
//           totalOrders: creditOrders + modelOrders,
//           totalSpent: creditSpent + modelSpent,
//           totalBookmarks: bookmarksResult[0]?.count || 0,
//           totalLikes: likesResult[0]?.count || 0,
//         };
//       })
//     );

//     // 获取总数
//     const totalResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(userProfilesTable)
//       .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

//     const total = totalResult[0]?.count || 0;
//     const totalPages = Math.ceil(total / limit);

//     // 获取 Clerk 用户数据
//     const clerkUserIds = usersWithStats.map(user => user.clerkUserId);
//     const clerkUsersMap = await getClerkUsersData(clerkUserIds);

//     // 合并 Clerk 数据
//     const usersWithClerkData = usersWithStats.map(user => {
//       const clerkUser = clerkUsersMap.get(user.clerkUserId);
      
//       const displayName = clerkUser?.fullName || user.displayName || '未知用户';
//       const avatarUrl = clerkUser?.imageUrl || user.avatarUrl;
//       const email = clerkUser?.primaryEmail;

//       return {
//         ...user,
//         clerkUser,
//         displayName,
//         avatarUrl,
//         email,
//         // 安全处理数字字段
//         creditsRemaining: safeNumber(user.creditsRemaining),
//         totalLogosGenerated: safeNumber(user.totalLogosGenerated),
//         creditOrders: safeNumber(user.creditOrders),
//         creditSpent: safeNumber(user.creditSpent),
//         modelOrders: safeNumber(user.modelOrders),
//         modelSpent: safeNumber(user.modelSpent),
//         totalOrders: safeNumber(user.totalOrders),
//         totalSpent: safeNumber(user.totalSpent),
//         totalBookmarks: safeNumber(user.totalBookmarks),
//         totalLikes: safeNumber(user.totalLikes),
//       };
//     });

//     return {
//       users: usersWithClerkData,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages,
//         hasNext: page < totalPages,
//         hasPrev: page > 1,
//       }
//     };
//   } catch (error) {
//     console.error('Error getting users list:', error);
//     throw error;
//   }
// }

// // 获取用户详情
// export async function getUserDetails(clerkUserId: string) {
//   try {
//     const user = await db
//       .select()
//       .from(userProfilesTable)
//       .where(eq(userProfilesTable.clerkUserId, clerkUserId))
//       .limit(1);

//     if (user.length === 0) {
//       return null;
//     }

//     // 获取 Clerk 用户数据
//     const clerkUserData = await getClerkUserData(clerkUserId);

//     // 获取用户的积分交易记录
//     const creditTransactions = await db
//       .select()
//       .from(creditTransactionsTable)
//       .where(eq(creditTransactionsTable.clerkUserId, clerkUserId))
//       .orderBy(desc(creditTransactionsTable.createdAt))
//       .limit(20);

//     // 获取用户的积分订单记录
//     const creditOrders = await db
//       .select()
//       .from(ordersTable)
//       .where(eq(ordersTable.clerkUserId, clerkUserId))
//       .orderBy(desc(ordersTable.createdAt))
//       .limit(10);

//     // 获取用户的3D模型订单记录
//     const modelOrders = await db
//       .select()
//       .from(modelOrdersTable)
//       .where(eq(modelOrdersTable.clerkUserId, clerkUserId))
//       .orderBy(desc(modelOrdersTable.createdAt))
//       .limit(10);

//     // 获取用户生成的 Logo 数量
//     const logosCount = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(logosTable)
//       .where(eq(logosTable.clerkUserId, clerkUserId));

//     // 获取用户收藏数量
//     const bookmarksCount = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(bookmarksTable)
//       .where(eq(bookmarksTable.clerkUserId, clerkUserId));

//     // 获取用户点赞数量
//     const likesCount = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(likesTable)
//       .where(eq(likesTable.clerkUserId, clerkUserId));

//     // 安全处理用户数据
//     const userProfile = user[0];
//     const safeUserProfile = {
//       ...userProfile,
//       creditsRemaining: safeNumber(userProfile.creditsRemaining),
//       totalLogosGenerated: safeNumber(userProfile.totalLogosGenerated),
//     };

//     // 计算订单统计
//     const paidCreditOrders = creditOrders.filter(order => order.status === 'paid');
//     const paidModelOrders = modelOrders.filter(order => order.status === 'paid');
    
//     const totalCreditOrders = paidCreditOrders.length;
//     const totalModelOrders = paidModelOrders.length;
//     const totalOrders = totalCreditOrders + totalModelOrders;
    
//     const totalCreditSpent = paidCreditOrders.reduce((sum, order) => sum + safeNumber(order.price), 0);
//     const totalModelSpent = paidModelOrders.reduce((sum, order) => sum + safeNumber(order.totalAmount), 0);
//     const totalSpent = totalCreditSpent + totalModelSpent;

//     return {
//       profile: safeUserProfile,
//       clerkUser: clerkUserData,
//       creditTransactions,
//       creditOrders,
//       modelOrders,
//       stats: {
//         logosCount: logosCount[0]?.count || 0,
//         bookmarksCount: bookmarksCount[0]?.count || 0,
//         likesCount: likesCount[0]?.count || 0,
//         totalCreditOrders,
//         totalModelOrders,
//         totalOrders,
//         totalCreditSpent,
//         totalModelSpent,
//         totalSpent,
//       }
//     };
//   } catch (error) {
//     console.error('Error getting user details:', error);
//     throw error;
//   }
// }

// // 更新用户积分
// export async function updateUserCredits(
//   clerkUserId: string, 
//   newCredits: number, 
//   description: string = '管理员调整'
// ) {
//   const { userId: adminUserId } = await auth();
  
//   if (!adminUserId) {
//     throw new Error('Unauthorized');
//   }

//   try {
//     // 开始事务
//     return await db.transaction(async (tx) => {
//       // 获取当前用户信息
//       const [currentUser] = await tx
//         .select()
//         .from(userProfilesTable)
//         .where(eq(userProfilesTable.clerkUserId, clerkUserId));

//       if (!currentUser) {
//         throw new Error('User not found');
//       }

//       // 修复：处理可能的 null 值
//       const oldCredits = currentUser.creditsRemaining ?? 0;
//       const creditDifference = newCredits - oldCredits;

//       // 更新用户积分
//       const [updatedUser] = await tx
//         .update(userProfilesTable)
//         .set({
//           creditsRemaining: newCredits,
//           updatedAt: new Date(),
//         })
//         .where(eq(userProfilesTable.clerkUserId, clerkUserId))
//         .returning();

//       // 记录积分交易
//       if (creditDifference !== 0) {
//         await tx
//           .insert(creditTransactionsTable)
//           .values({
//             clerkUserId,
//             transactionType: creditDifference > 0 ? 'admin_add' : 'admin_deduct',
//             amount: creditDifference,
//             balanceAfter: newCredits,
//             description: `${description} (由管理员操作)`,
//           });
//       }

//       return {
//         updatedUser,
//         oldCredits,
//         newCredits,
//         creditDifference,
//       };
//     });
//   } catch (error) {
//     console.error('Error updating user credits:', error);
//     throw error;
//   }
// }

// // 获取用户统计信息
// export async function getUserManagementStats() {
//   try {
//     // 总用户数
//     const totalUsersResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(userProfilesTable);
    
//     // 今日新增用户
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const todayUsersResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(userProfilesTable)
//       .where(gte(userProfilesTable.createdAt, today));

//     // 总生成 Logo 数量
//     const totalLogosResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(logosTable);

//     // 总积分订单数量
//     const totalCreditOrdersResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(ordersTable)
//       .where(eq(ordersTable.status, 'paid'));

//     // 总3D模型订单数量
//     const totalModelOrdersResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(modelOrdersTable)
//       .where(eq(modelOrdersTable.status, 'paid'));

//     // 总订单数量
//     const totalOrders = (totalCreditOrdersResult[0]?.count || 0) + (totalModelOrdersResult[0]?.count || 0);

//     // 总积分订单金额
//     const totalCreditRevenueResult = await db
//       .select({ total: sql<number>`COALESCE(SUM(${ordersTable.price}), 0)` })
//       .from(ordersTable)
//       .where(eq(ordersTable.status, 'paid'));

//     // 总3D模型订单金额
//     const totalModelRevenueResult = await db
//       .select({ total: sql<number>`COALESCE(SUM(${modelOrdersTable.totalAmount}), 0)` })
//       .from(modelOrdersTable)
//       .where(eq(modelOrdersTable.status, 'paid'));

//     // 总收入
//     const totalRevenue = (totalCreditRevenueResult[0]?.total || 0) + (totalModelRevenueResult[0]?.total || 0);

//     return {
//       totalUsers: totalUsersResult[0]?.count || 0,
//       todayUsers: todayUsersResult[0]?.count || 0,
//       totalLogos: totalLogosResult[0]?.count || 0,
//       totalCreditOrders: totalCreditOrdersResult[0]?.count || 0,
//       totalModelOrders: totalModelOrdersResult[0]?.count || 0,
//       totalOrders,
//       totalCreditRevenue: totalCreditRevenueResult[0]?.total || 0,
//       totalModelRevenue: totalModelRevenueResult[0]?.total || 0,
//       totalRevenue,
//     };
//   } catch (error) {
//     console.error('Error getting user management stats:', error);
//     return {
//       totalUsers: 0,
//       todayUsers: 0,
//       totalLogos: 0,
//       totalCreditOrders: 0,
//       totalModelOrders: 0,
//       totalOrders: 0,
//       totalCreditRevenue: 0,
//       totalModelRevenue: 0,
//       totalRevenue: 0,
//     };
//   }
// }

// // 搜索用户（用于自动完成）
// export async function searchUsers(query: string, limit: number = 10) {
//   try {
//     const users = await db
//       .select({
//         id: userProfilesTable.id,
//         clerkUserId: userProfilesTable.clerkUserId,
//         displayName: userProfilesTable.displayName,
//         avatarUrl: userProfilesTable.avatarUrl,
//         company: userProfilesTable.company,
//         creditsRemaining: userProfilesTable.creditsRemaining,
//       })
//       .from(userProfilesTable)
//       .where(like(userProfilesTable.displayName, `%${query}%`))
//       .limit(limit);

//     // 获取 Clerk 用户数据
//     const clerkUserIds = users.map(user => user.clerkUserId);
//     const clerkUsersMap = await getClerkUsersData(clerkUserIds);

//     // 合并数据
//     const usersWithClerkData = users.map(user => {
//       const clerkUser = clerkUsersMap.get(user.clerkUserId);
      
//       return {
//         ...user,
//         clerkUser,
//         displayName: clerkUser?.fullName || user.displayName || '未知用户',
//         avatarUrl: clerkUser?.imageUrl || user.avatarUrl,
//         creditsRemaining: safeNumber(user.creditsRemaining),
//       };
//     });

//     return usersWithClerkData;
//   } catch (error) {
//     console.error('Error searching users:', error);
//     return [];
//   }
// }

// // 获取用户活跃度统计
// export async function getUserActivityStats(days: number = 30) {
//   try {
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     // 活跃用户（有登录或操作）
//     const activeUsersResult = await db
//       .select({ count: sql<number>`COUNT(DISTINCT ${userProfilesTable.clerkUserId})` })
//       .from(userProfilesTable)
//       .where(gte(userProfilesTable.updatedAt, startDate));

//     // 新注册用户
//     const newUsersResult = await db
//       .select({ count: sql<number>`COUNT(*)` })
//       .from(userProfilesTable)
//       .where(gte(userProfilesTable.createdAt, startDate));

//     // 生成 Logo 的用户
//     const logoUsersResult = await db
//       .select({ count: sql<number>`COUNT(DISTINCT ${logosTable.clerkUserId})` })
//       .from(logosTable)
//       .where(gte(logosTable.createdAt, startDate));

//     // 付费用户（积分订单）
//     const creditPaidUsersResult = await db
//       .select({ count: sql<number>`COUNT(DISTINCT ${ordersTable.clerkUserId})` })
//       .from(ordersTable)
//       .where(and(
//         gte(ordersTable.createdAt, startDate),
//         eq(ordersTable.status, 'paid')
//       ));

//     // 付费用户（3D模型订单）
//     const modelPaidUsersResult = await db
//       .select({ count: sql<number>`COUNT(DISTINCT ${modelOrdersTable.clerkUserId})` })
//       .from(modelOrdersTable)
//       .where(and(
//         gte(modelOrdersTable.createdAt, startDate),
//         eq(modelOrdersTable.status, 'paid')
//       ));

//     const paidUsers = (creditPaidUsersResult[0]?.count || 0) + (modelPaidUsersResult[0]?.count || 0);

//     return {
//       activeUsers: activeUsersResult[0]?.count || 0,
//       newUsers: newUsersResult[0]?.count || 0,
//       logoUsers: logoUsersResult[0]?.count || 0,
//       paidUsers,
//     };
//   } catch (error) {
//     console.error('Error getting user activity stats:', error);
//     return {
//       activeUsers: 0,
//       newUsers: 0,
//       logoUsers: 0,
//       paidUsers: 0,
//     };
//   }
// }


// // @/lib/user-management-utils.ts
// export async function getUserOrders(clerkUserId: string) {
//   try {
//     const [creditOrders, modelOrders] = await Promise.all([
//       // 获取积分订单
//       db
//         .select({
//           id: ordersTable.id,
//           orderId: ordersTable.orderId,
//           credits: ordersTable.credits,
//           price: ordersTable.price,
//           status: ordersTable.status,
//           createdAt: ordersTable.createdAt,
//         })
//         .from(ordersTable)
//         .where(eq(ordersTable.clerkUserId, clerkUserId))
//         .orderBy(desc(ordersTable.createdAt)),

//       // 获取3D模型订单
//       db
//         .select({
//           id: modelOrdersTable.id,
//           orderId: modelOrdersTable.orderId,
//           items: modelOrdersTable.items,
//           totalAmount: modelOrdersTable.totalAmount,
//           itemCount: modelOrdersTable.itemCount,
//           status: modelOrdersTable.status,
//           paymentMethod: modelOrdersTable.paymentMethod,
//           paidAt: modelOrdersTable.paidAt,
//           createdAt: modelOrdersTable.createdAt,
//         })
//         .from(modelOrdersTable)
//         .where(eq(modelOrdersTable.clerkUserId, clerkUserId))
//         .orderBy(desc(modelOrdersTable.createdAt))
//     ]);

//     // 处理3D模型订单的items，确保是数组
//     const processedModelOrders = modelOrders.map((order) => {
//       let items: any[] = [];
//       try {
//         if (order.items && typeof order.items === 'string') {
//           items = JSON.parse(order.items);
//         } else if (Array.isArray(order.items)) {
//           items = order.items;
//         }
//       } catch (error) {
//         console.error('Error parsing items:', error);
//         items = [];
//       }

//       const safeItems = items.map((item, index) => ({
//         id: item.id || `item-${index}`,
//         modelId: item.modelId || 'unknown',
//         modelName: item.modelName || 'Unknown Model',
//         textureCount: item.textureCount || 0,
//         quantity: item.quantity || 1,
//         unitPrice: item.unitPrice || 0,
//         totalPrice: item.totalPrice || 0,
//         thumbnail: item.thumbnail || null,
//         description: item.description || null,
//         createdAt: item.createdAt || order.createdAt
//       }));

//       return {
//         ...order,
//         items: safeItems,
//         formattedDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
//         formattedAmount: (order.totalAmount / 100).toFixed(2),
//       };
//     });

//     return {
//       creditOrders,
//       modelOrders: processedModelOrders
//     };
//   } catch (error) {
//     console.error('Error getting user orders:', error);
//     return {
//       creditOrders: [],
//       modelOrders: []
//     };
//   }
// }

// lib/user-management-utils.ts
import { db } from '@/db';
import { 
  userProfilesTable, 
  creditTransactionsTable, 
  ordersTable,
  logosTable,
  bookmarksTable,
  likesTable,
  modelOrdersTable,
  type SelectModelOrder,
  RETURN_STATUS
} from '@/db/schema';
import { eq, desc, like, and, gte, sql, count, asc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// Clerk 用户数据类型定义
export interface ClerkUserData {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  imageUrl: string | null;
  primaryEmail: string | null;
  createdAt: Date | null;
}

// 获取单个 Clerk 用户数据
export async function getClerkUserData(clerkUserId: string): Promise<ClerkUserData | null> {
  try {
    // 正确的 Clerk 客户端用法
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    
    // 提取主要邮箱
    const primaryEmail = user.primaryEmailAddressId 
      ? user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
      : user.emailAddresses[0]?.emailAddress;

    return {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '未知用户',
      imageUrl: user.imageUrl,
      primaryEmail: primaryEmail || null,
      createdAt: user.createdAt ? new Date(user.createdAt) : null,
    };
  } catch (error) {
    console.error(`Error fetching Clerk user data for ${clerkUserId}:`, error);
    return null;
  }
}

// 批量获取 Clerk 用户数据
export async function getClerkUsersData(clerkUserIds: string[]): Promise<Map<string, ClerkUserData>> {
  try {
    // 正确的 Clerk 客户端用法
    const client = await clerkClient();
    const users = await client.users.getUserList({
      userId: clerkUserIds,
      limit: 100
    });

    const userMap = new Map<string, ClerkUserData>();
    
    users.data.forEach(user => {
      const primaryEmail = user.primaryEmailAddressId 
        ? user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
        : user.emailAddresses[0]?.emailAddress;

      userMap.set(user.id, {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '未知用户',
        imageUrl: user.imageUrl,
        primaryEmail: primaryEmail || null,
        createdAt: user.createdAt ? new Date(user.createdAt) : null,
      });
    });

    return userMap;
  } catch (error) {
    console.error('Error fetching Clerk users data:', error);
    return new Map();
  }
}

// 安全的数字处理函数
function safeNumber(value: number | null | undefined): number {
  return value ?? 0;
}

// 获取用户列表
export async function getUsersList(options: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;

  try {
    // 构建查询条件
    const whereConditions: any[] = [];
    
    if (search) {
      whereConditions.push(
        like(userProfilesTable.displayName, `%${search}%`)
      );
    }

    const orderByFn = sortOrder === 'desc' ? desc : asc;
    let orderByColumn;
    switch (sortBy) {
      case 'displayName':
        orderByColumn = userProfilesTable.displayName;
        break;
      case 'totalLogosGenerated':
        orderByColumn = userProfilesTable.totalLogosGenerated;
        break;
      case 'creditsRemaining':
        orderByColumn = userProfilesTable.creditsRemaining;
        break;
      case 'createdAt':
      default:
        orderByColumn = userProfilesTable.createdAt;
    }

    // 第一步：获取用户列表（不带统计信息）
    const users = await db
      .select({
        id: userProfilesTable.id,
        clerkUserId: userProfilesTable.clerkUserId,
        displayName: userProfilesTable.displayName,
        avatarUrl: userProfilesTable.avatarUrl,
        company: userProfilesTable.company,
        location: userProfilesTable.location,
        creditsRemaining: userProfilesTable.creditsRemaining,
        totalLogosGenerated: userProfilesTable.totalLogosGenerated,
        emailNotifications: userProfilesTable.emailNotifications,
        createdAt: userProfilesTable.createdAt,
        updatedAt: userProfilesTable.updatedAt,
      })
      .from(userProfilesTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByFn(orderByColumn))
      .limit(limit)
      .offset(offset);

    // 第二步：为每个用户查询统计信息
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // 查询积分订单
        const creditOrdersResult = await db
          .select({
            count: sql<number>`COUNT(*)`.as('count'),
            total: sql<number>`COALESCE(SUM(${ordersTable.price}), 0)`.as('total'),
          })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.clerkUserId, user.clerkUserId),
              eq(ordersTable.status, 'paid')
            )
          );

        // 查询3D模型订单
        const modelOrdersResult = await db
          .select({
            count: sql<number>`COUNT(*)`.as('count'),
            total: sql<number>`COALESCE(SUM(${modelOrdersTable.totalAmount}), 0)`.as('total'),
          })
          .from(modelOrdersTable)
          .where(
            and(
              eq(modelOrdersTable.clerkUserId, user.clerkUserId),
              eq(modelOrdersTable.status, 'paid')
            )
          );

        // 查询退货订单统计
        const returnedOrdersResult = await db
          .select({
            count: sql<number>`COUNT(*)`.as('count'),
            totalRefund: sql<number>`COALESCE(SUM(${modelOrdersTable.refundAmount}), 0)`.as('totalRefund'),
          })
          .from(modelOrdersTable)
          .where(
            and(
              eq(modelOrdersTable.clerkUserId, user.clerkUserId),
              eq(modelOrdersTable.returnStatus, RETURN_STATUS.RETURNED)
            )
          );

        const creditOrders = creditOrdersResult[0]?.count || 0;
        const creditSpent = creditOrdersResult[0]?.total || 0;
        const modelOrders = modelOrdersResult[0]?.count || 0;
        const modelSpent = modelOrdersResult[0]?.total || 0;
        const returnedOrders = returnedOrdersResult[0]?.count || 0;
        const totalRefund = returnedOrdersResult[0]?.totalRefund || 0;

        // 计算净消费金额
        const netModelSpent = Math.max(0, modelSpent - totalRefund);
        const totalSpent = creditSpent + netModelSpent;

        // 查询其他统计信息
        const bookmarksResult = await db
          .select({ count: sql<number>`COUNT(*)`.as('count') })
          .from(bookmarksTable)
          .where(eq(bookmarksTable.clerkUserId, user.clerkUserId));

        const likesResult = await db
          .select({ count: sql<number>`COUNT(*)`.as('count') })
          .from(likesTable)
          .where(eq(likesTable.clerkUserId, user.clerkUserId));

        return {
          ...user,
          creditOrders,
          creditSpent,
          modelOrders,
          modelSpent: netModelSpent,
          returnedOrders,
          totalRefund,
          totalOrders: creditOrders + modelOrders,
          totalSpent,
          totalBookmarks: bookmarksResult[0]?.count || 0,
          totalLikes: likesResult[0]?.count || 0,
        };
      })
    );

    // 获取总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProfilesTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取 Clerk 用户数据
    const clerkUserIds = usersWithStats.map(user => user.clerkUserId);
    const clerkUsersMap = await getClerkUsersData(clerkUserIds);

    // 合并 Clerk 数据
    const usersWithClerkData = usersWithStats.map(user => {
      const clerkUser = clerkUsersMap.get(user.clerkUserId);
      
      const displayName = clerkUser?.fullName || user.displayName || '未知用户';
      const avatarUrl = clerkUser?.imageUrl || user.avatarUrl;
      const email = clerkUser?.primaryEmail;

      return {
        ...user,
        clerkUser,
        displayName,
        avatarUrl,
        email,
        // 安全处理数字字段
        creditsRemaining: safeNumber(user.creditsRemaining),
        totalLogosGenerated: safeNumber(user.totalLogosGenerated),
        creditOrders: safeNumber(user.creditOrders),
        creditSpent: safeNumber(user.creditSpent),
        modelOrders: safeNumber(user.modelOrders),
        modelSpent: safeNumber(user.modelSpent),
        returnedOrders: safeNumber(user.returnedOrders),
        totalRefund: safeNumber(user.totalRefund),
        totalOrders: safeNumber(user.totalOrders),
        totalSpent: safeNumber(user.totalSpent),
        totalBookmarks: safeNumber(user.totalBookmarks),
        totalLikes: safeNumber(user.totalLikes),
      };
    });

    return {
      users: usersWithClerkData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };
  } catch (error) {
    console.error('Error getting users list:', error);
    throw error;
  }
}

// 获取用户详情
export async function getUserDetails(clerkUserId: string) {
  try {
    const user = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.clerkUserId, clerkUserId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    // 获取 Clerk 用户数据
    const clerkUserData = await getClerkUserData(clerkUserId);

    // 获取用户的积分交易记录
    const creditTransactions = await db
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.clerkUserId, clerkUserId))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(20);

    // 获取用户的积分订单记录
    const creditOrders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.clerkUserId, clerkUserId))
      .orderBy(desc(ordersTable.createdAt))
      .limit(10);

    // 获取用户的3D模型订单记录（包含退货信息）- 修复：明确指定列
    const modelOrders = await db
      .select({
        id: modelOrdersTable.id,
        orderId: modelOrdersTable.orderId,
        items: modelOrdersTable.items,
        totalAmount: modelOrdersTable.totalAmount,
        itemCount: modelOrdersTable.itemCount,
        status: modelOrdersTable.status,
        paymentMethod: modelOrdersTable.paymentMethod,
        paidAt: modelOrdersTable.paidAt,
        createdAt: modelOrdersTable.createdAt,
        // 退货相关字段
        returnStatus: modelOrdersTable.returnStatus,
        returnReason: modelOrdersTable.returnReason,
        returnedAt: modelOrdersTable.returnedAt,
        refundAmount: modelOrdersTable.refundAmount,
      })
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.clerkUserId, clerkUserId))
      .orderBy(desc(modelOrdersTable.createdAt))
      .limit(10);

    // 获取用户生成的 Logo 数量
    const logosCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(logosTable)
      .where(eq(logosTable.clerkUserId, clerkUserId));

    // 获取用户收藏数量
    const bookmarksCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.clerkUserId, clerkUserId));

    // 获取用户点赞数量
    const likesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(likesTable)
      .where(eq(likesTable.clerkUserId, clerkUserId));

    // 获取退货订单统计
    const returnedOrdersCount = await db
      .select({ 
        count: sql<number>`count(*)`,
        totalRefund: sql<number>`COALESCE(SUM(${modelOrdersTable.refundAmount}), 0)`
      })
      .from(modelOrdersTable)
      .where(
        and(
          eq(modelOrdersTable.clerkUserId, clerkUserId),
          eq(modelOrdersTable.returnStatus, RETURN_STATUS.RETURNED)
        )
      );

    // 安全处理用户数据
    const userProfile = user[0];
    const safeUserProfile = {
      ...userProfile,
      creditsRemaining: safeNumber(userProfile.creditsRemaining),
      totalLogosGenerated: safeNumber(userProfile.totalLogosGenerated),
    };

    // 计算订单统计
    const paidCreditOrders = creditOrders.filter(order => order.status === 'paid');
    const paidModelOrders = modelOrders.filter(order => order.status === 'paid');
    const returnedOrders = modelOrders.filter(order => order.returnStatus === RETURN_STATUS.RETURNED);
    
    const totalCreditOrders = paidCreditOrders.length;
    const totalModelOrders = paidModelOrders.length;
    const totalReturnedOrders = returnedOrders.length;
    const totalOrders = totalCreditOrders + totalModelOrders;
    
    const totalCreditSpent = paidCreditOrders.reduce((sum, order) => sum + safeNumber(order.price), 0);
    const totalModelSpent = paidModelOrders.reduce((sum, order) => sum + safeNumber(order.totalAmount), 0);
    const totalRefundAmount = returnedOrdersCount[0]?.totalRefund || 0;
    
    // 计算净消费金额
    const netModelSpent = Math.max(0, totalModelSpent - totalRefundAmount);
    const totalSpent = totalCreditSpent + netModelSpent;

    return {
      profile: safeUserProfile,
      clerkUser: clerkUserData,
      creditTransactions,
      creditOrders,
      modelOrders,
      stats: {
        logosCount: logosCount[0]?.count || 0,
        bookmarksCount: bookmarksCount[0]?.count || 0,
        likesCount: likesCount[0]?.count || 0,
        totalCreditOrders,
        totalModelOrders,
        totalReturnedOrders,
        totalOrders,
        totalCreditSpent,
        totalModelSpent: netModelSpent,
        totalRefundAmount,
        totalSpent,
      }
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    throw error;
  }
}

// 更新用户积分
export async function updateUserCredits(
  clerkUserId: string, 
  newCredits: number, 
  description: string = '管理员调整'
) {
  const { userId: adminUserId } = await auth();
  
  if (!adminUserId) {
    throw new Error('Unauthorized');
  }

  try {
    // 开始事务
    return await db.transaction(async (tx) => {
      // 获取当前用户信息
      const [currentUser] = await tx
        .select()
        .from(userProfilesTable)
        .where(eq(userProfilesTable.clerkUserId, clerkUserId));

      if (!currentUser) {
        throw new Error('User not found');
      }

      // 修复：处理可能的 null 值
      const oldCredits = currentUser.creditsRemaining ?? 0;
      const creditDifference = newCredits - oldCredits;

      // 更新用户积分
      const [updatedUser] = await tx
        .update(userProfilesTable)
        .set({
          creditsRemaining: newCredits,
          updatedAt: new Date(),
        })
        .where(eq(userProfilesTable.clerkUserId, clerkUserId))
        .returning();

      // 记录积分交易
      if (creditDifference !== 0) {
        await tx
          .insert(creditTransactionsTable)
          .values({
            clerkUserId,
            transactionType: creditDifference > 0 ? 'admin_add' : 'admin_deduct',
            amount: creditDifference,
            balanceAfter: newCredits,
            description: `${description} (由管理员操作)`,
          });
      }

      return {
        updatedUser,
        oldCredits,
        newCredits,
        creditDifference,
      };
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

// 获取用户统计信息
export async function getUserManagementStats() {
  try {
    // 总用户数
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProfilesTable);
    
    // 今日新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProfilesTable)
      .where(gte(userProfilesTable.createdAt, today));

    // 总生成 Logo 数量
    const totalLogosResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(logosTable);

    // 总积分订单数量
    const totalCreditOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'paid'));

    // 总3D模型订单数量
    const totalModelOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.status, 'paid'));

    // 总退货订单数量
    const totalReturnedOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.returnStatus, RETURN_STATUS.RETURNED));

    // 总订单数量
    const totalOrders = (totalCreditOrdersResult[0]?.count || 0) + (totalModelOrdersResult[0]?.count || 0);

    // 总积分订单金额
    const totalCreditRevenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${ordersTable.price}), 0)` })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'paid'));

    // 总3D模型订单金额
    const totalModelRevenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${modelOrdersTable.totalAmount}), 0)` })
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.status, 'paid'));

    // 总退款金额
    const totalRefundResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${modelOrdersTable.refundAmount}), 0)` })
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.returnStatus, RETURN_STATUS.RETURNED));

    // 总收入（考虑退款）
    const totalRevenue = (totalCreditRevenueResult[0]?.total || 0) + 
                        (totalModelRevenueResult[0]?.total || 0) - 
                        (totalRefundResult[0]?.total || 0);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      todayUsers: todayUsersResult[0]?.count || 0,
      totalLogos: totalLogosResult[0]?.count || 0,
      totalCreditOrders: totalCreditOrdersResult[0]?.count || 0,
      totalModelOrders: totalModelOrdersResult[0]?.count || 0,
      totalReturnedOrders: totalReturnedOrdersResult[0]?.count || 0,
      totalOrders,
      totalCreditRevenue: totalCreditRevenueResult[0]?.total || 0,
      totalModelRevenue: totalModelRevenueResult[0]?.total || 0,
      totalRefund: totalRefundResult[0]?.total || 0,
      totalRevenue: Math.max(0, totalRevenue),
    };
  } catch (error) {
    console.error('Error getting user management stats:', error);
    return {
      totalUsers: 0,
      todayUsers: 0,
      totalLogos: 0,
      totalCreditOrders: 0,
      totalModelOrders: 0,
      totalReturnedOrders: 0,
      totalOrders: 0,
      totalCreditRevenue: 0,
      totalModelRevenue: 0,
      totalRefund: 0,
      totalRevenue: 0,
    };
  }
}

// 搜索用户（用于自动完成）
export async function searchUsers(query: string, limit: number = 10) {
  try {
    const users = await db
      .select({
        id: userProfilesTable.id,
        clerkUserId: userProfilesTable.clerkUserId,
        displayName: userProfilesTable.displayName,
        avatarUrl: userProfilesTable.avatarUrl,
        company: userProfilesTable.company,
        creditsRemaining: userProfilesTable.creditsRemaining,
      })
      .from(userProfilesTable)
      .where(like(userProfilesTable.displayName, `%${query}%`))
      .limit(limit);

    // 获取 Clerk 用户数据
    const clerkUserIds = users.map(user => user.clerkUserId);
    const clerkUsersMap = await getClerkUsersData(clerkUserIds);

    // 合并数据
    const usersWithClerkData = users.map(user => {
      const clerkUser = clerkUsersMap.get(user.clerkUserId);
      
      return {
        ...user,
        clerkUser,
        displayName: clerkUser?.fullName || user.displayName || '未知用户',
        avatarUrl: clerkUser?.imageUrl || user.avatarUrl,
        creditsRemaining: safeNumber(user.creditsRemaining),
      };
    });

    return usersWithClerkData;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// 获取用户活跃度统计
export async function getUserActivityStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 活跃用户（有登录或操作）
    const activeUsersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${userProfilesTable.clerkUserId})` })
      .from(userProfilesTable)
      .where(gte(userProfilesTable.updatedAt, startDate));

    // 新注册用户
    const newUsersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userProfilesTable)
      .where(gte(userProfilesTable.createdAt, startDate));

    // 生成 Logo 的用户
    const logoUsersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${logosTable.clerkUserId})` })
      .from(logosTable)
      .where(gte(logosTable.createdAt, startDate));

    // 付费用户（积分订单）
    const creditPaidUsersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${ordersTable.clerkUserId})` })
      .from(ordersTable)
      .where(and(
        gte(ordersTable.createdAt, startDate),
        eq(ordersTable.status, 'paid')
      ));

    // 付费用户（3D模型订单）
    const modelPaidUsersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${modelOrdersTable.clerkUserId})` })
      .from(modelOrdersTable)
      .where(and(
        gte(modelOrdersTable.createdAt, startDate),
        eq(modelOrdersTable.status, 'paid')
      ));

    const paidUsers = (creditPaidUsersResult[0]?.count || 0) + (modelPaidUsersResult[0]?.count || 0);

    return {
      activeUsers: activeUsersResult[0]?.count || 0,
      newUsers: newUsersResult[0]?.count || 0,
      logoUsers: logoUsersResult[0]?.count || 0,
      paidUsers,
    };
  } catch (error) {
    console.error('Error getting user activity stats:', error);
    return {
      activeUsers: 0,
      newUsers: 0,
      logoUsers: 0,
      paidUsers: 0,
    };
  }
}

// 获取用户订单
export async function getUserOrders(clerkUserId: string) {
  try {
    const [creditOrders, modelOrders] = await Promise.all([
      // 获取积分订单
      db
        .select({
          id: ordersTable.id,
          orderId: ordersTable.orderId,
          credits: ordersTable.credits,
          price: ordersTable.price,
          status: ordersTable.status,
          createdAt: ordersTable.createdAt,
        })
        .from(ordersTable)
        .where(eq(ordersTable.clerkUserId, clerkUserId))
        .orderBy(desc(ordersTable.createdAt)),

      // 获取3D模型订单（包含退货信息）- 明确指定列
      db
        .select({
          id: modelOrdersTable.id,
          orderId: modelOrdersTable.orderId,
          items: modelOrdersTable.items,
          totalAmount: modelOrdersTable.totalAmount,
          itemCount: modelOrdersTable.itemCount,
          status: modelOrdersTable.status,
          paymentMethod: modelOrdersTable.paymentMethod,
          paidAt: modelOrdersTable.paidAt,
          createdAt: modelOrdersTable.createdAt,
          // 退货相关字段
          returnStatus: modelOrdersTable.returnStatus,
          returnReason: modelOrdersTable.returnReason,
          returnedAt: modelOrdersTable.returnedAt,
          refundAmount: modelOrdersTable.refundAmount,
        })
        .from(modelOrdersTable)
        .where(eq(modelOrdersTable.clerkUserId, clerkUserId))
        .orderBy(desc(modelOrdersTable.createdAt))
    ]);

    // 处理3D模型订单的items，确保是数组
    const processedModelOrders = modelOrders.map((order) => {
      let items: any[] = [];
      try {
        if (order.items && typeof order.items === 'string') {
          items = JSON.parse(order.items);
        } else if (Array.isArray(order.items)) {
          items = order.items;
        }
      } catch (error) {
        console.error('Error parsing items:', error);
        items = [];
      }

      const safeItems = items.map((item, index) => ({
        id: item.id || `item-${index}`,
        modelId: item.modelId || 'unknown',
        modelName: item.modelName || 'Unknown Model',
        textureCount: item.textureCount || 0,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        thumbnail: item.thumbnail || null,
        description: item.description || null,
        createdAt: item.createdAt || order.createdAt
      }));

      return {
        ...order,
        items: safeItems,
        formattedDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '未知日期',
        formattedAmount: (order.totalAmount / 100).toFixed(2),
        formattedRefundAmount: order.refundAmount ? (order.refundAmount / 100).toFixed(2) : '0.00',
      };
    });

    return {
      creditOrders,
      modelOrders: processedModelOrders
    };
  } catch (error) {
    console.error('Error getting user orders:', error);
    return {
      creditOrders: [],
      modelOrders: []
    };
  }
}

// 更新模型订单状态的函数 - 使用 Drizzle ORM
export async function updateModelOrderStatus(
  orderId: string, 
  status: string, 
  returnReason?: string, 
  refundAmount?: number
): Promise<SelectModelOrder | null> {
  try {
    const updateData: any = {
      returnStatus: status,
    };

    if (returnReason) {
      updateData.returnReason = returnReason;
    }

    if (refundAmount !== undefined) {
      updateData.refundAmount = refundAmount;
    }

    if (status === RETURN_STATUS.RETURNED) {
      updateData.returnedAt = new Date();
      // 退货成功时，将订单状态更新为 refunded
      updateData.status = 'refunded';
    }

    // 使用 Drizzle 更新订单状态
    const result = await db
      .update(modelOrdersTable)
      .set(updateData)
      .where(eq(modelOrdersTable.id, parseInt(orderId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Error updating model order status:', error);
    throw error;
  }
}
// 获取模型订单详情（包含退货信息）- 使用 Drizzle ORM
export async function getModelOrderWithReturnInfo(orderId: string): Promise<SelectModelOrder | null> {
  try {
    const result = await db
      .select()
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.id, parseInt(orderId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error fetching model order:', error);
    throw error;
  }
}

// 新增：获取所有需要退货处理的订单
export async function getPendingReturnOrders() {
  try {
    const pendingReturns = await db
      .select()
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.returnStatus, RETURN_STATUS.PROCESSING))
      .orderBy(desc(modelOrdersTable.createdAt));

    return pendingReturns;
  } catch (error) {
    console.error('Error fetching pending return orders:', error);
    return [];
  }
}

// 新增：拒绝退货申请
export async function rejectModelOrderReturn(orderId: string, rejectionReason: string) {
  try {
    const result = await db
      .update(modelOrdersTable)
      .set({
        returnStatus: RETURN_STATUS.REJECTED,
        returnReason: rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(modelOrdersTable.id, parseInt(orderId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Error rejecting order return:', error);
    throw error;
  }
}