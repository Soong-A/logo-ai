// // lib/admin-utils.ts
// import { db } from '@/db';
// import { userProfilesTable, logosTable, ordersTable} from '@/db/schema';
// import { adminUsersTable } from '@/db/schema';
// import { auth } from '@clerk/nextjs/server';
// import { eq, and } from 'drizzle-orm';
// import { sql, desc, gte } from 'drizzle-orm';


// // 检查用户是否为管理员
// export async function isUserAdmin() {
//   const { userId } = await auth(); // 添加 await
  
//   if (!userId) {
//     return false;
//   }

//   try {
//     const adminUser = await db
//       .select()
//       .from(adminUsersTable)
//       .where(
//         and(
//           eq(adminUsersTable.clerkUserId, userId),
//           eq(adminUsersTable.isActive, true)
//         )
//       )
//       .limit(1);

//     return adminUser.length > 0;
//   } catch (error) {
//     console.error('Error checking admin status:', error);
//     return false;
//   }
// }

// // 获取管理员用户信息
// export async function getAdminUser() {
//   const { userId } = await auth(); // 添加 await
  
//   if (!userId) {
//     return null;
//   }

//   try {
//     const adminUser = await db
//       .select()
//       .from(adminUsersTable)
//       .where(
//         and(
//           eq(adminUsersTable.clerkUserId, userId),
//           eq(adminUsersTable.isActive, true)
//         )
//       )
//       .limit(1);

//     return adminUser.length > 0 ? adminUser[0] : null;
//   } catch (error) {
//     console.error('Error getting admin user:', error);
//     return null;
//   }
// }

// // 添加用户为管理员
// export async function addAdminUser(clerkUserId: string, role: string = 'admin', permissions: string[] = []) {
//   try {
//     const [adminUser] = await db
//       .insert(adminUsersTable)
//       .values({
//         clerkUserId,
//         role,
//         permissions,
//         isActive: true,
//       })
//       .returning();

//     return adminUser;
//   } catch (error) {
//     console.error('Error adding admin user:', error);
//     throw error;
//   }
// }

// // 更新管理员最后登录时间
// export async function updateAdminLastLogin(clerkUserId: string) {
//   try {
//     await db
//       .update(adminUsersTable)
//       .set({
//         lastLoginAt: new Date(),
//       })
//       .where(eq(adminUsersTable.clerkUserId, clerkUserId));
//   } catch (error) {
//     console.error('Error updating admin last login:', error);
//   }
// }

// // 停用管理员
// export async function deactivateAdminUser(clerkUserId: string) {
//   try {
//     await db
//       .update(adminUsersTable)
//       .set({
//         isActive: false,
//         updatedAt: new Date(),
//       })
//       .where(eq(adminUsersTable.clerkUserId, clerkUserId));
    
//     return { success: true };
//   } catch (error) {
//     console.error('Error deactivating admin user:', error);
//     throw error;
//   }
// }

// // 获取平台统计信息
// export async function getPlatformStats() {
//   try {
//     // 获取用户总数
//     const userCountResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(userProfilesTable);
    
//     // 获取 Logo 总数
//     const logoCountResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(logosTable);
    
//     // 获取订单总数
//     const orderCountResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(ordersTable)
//       .where(eq(ordersTable.status, 'paid'));
    
//     // 获取今日新增用户
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const todayUsersResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(userProfilesTable)
//       .where(gte(userProfilesTable.createdAt, today));

//     return {
//       totalUsers: userCountResult[0]?.count || 0,
//       totalLogos: logoCountResult[0]?.count || 0,
//       totalOrders: orderCountResult[0]?.count || 0,
//       todayUsers: todayUsersResult[0]?.count || 0,
//     };
//   } catch (error) {
//     console.error('Error getting platform stats:', error);
//     return {
//       totalUsers: 0,
//       totalLogos: 0,
//       totalOrders: 0,
//       todayUsers: 0,
//     };
//   }
// }

// // 获取最近活动
// export async function getRecentActivity() {
//   try {
//     const recentLogos = await db
//       .select()
//       .from(logosTable)
//       .orderBy(desc(logosTable.createdAt))
//       .limit(5);

//     const recentOrders = await db
//       .select()
//       .from(ordersTable)
//       .orderBy(desc(ordersTable.createdAt))
//       .limit(5);

//     return {
//       recentLogos,
//       recentOrders,
//     };
//   } catch (error) {
//     console.error('Error getting recent activity:', error);
//     return {
//       recentLogos: [],
//       recentOrders: [],
//     };
//   }
// }

// // 激活管理员
// export async function activateAdminUser(clerkUserId: string) {
//   try {
//     await db
//       .update(adminUsersTable)
//       .set({
//         isActive: true,
//         updatedAt: new Date(),
//       })
//       .where(eq(adminUsersTable.clerkUserId, clerkUserId));
    
//     return { success: true };
//   } catch (error) {
//     console.error('Error activating admin user:', error);
//     throw error;
//   }
// }

// lib/admin-utils.ts
import { db } from '@/db';
import { 
  userProfilesTable, 
  logosTable, 
  ordersTable,
  likesTable,
  bookmarksTable,
  modelOrdersTable
} from '@/db/schema';
import { adminUsersTable } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { sql, desc, gte } from 'drizzle-orm';

// 检查用户是否为管理员
export async function isUserAdmin() {
  const { userId } = await auth(); // 添加 await
  
  if (!userId) {
    return false;
  }

  try {
    const adminUser = await db
      .select()
      .from(adminUsersTable)
      .where(
        and(
          eq(adminUsersTable.clerkUserId, userId),
          eq(adminUsersTable.isActive, true)
        )
      )
      .limit(1);

    return adminUser.length > 0;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// 获取管理员用户信息
export async function getAdminUser() {
  const { userId } = await auth(); // 添加 await
  
  if (!userId) {
    return null;
  }

  try {
    const adminUser = await db
      .select()
      .from(adminUsersTable)
      .where(
        and(
          eq(adminUsersTable.clerkUserId, userId),
          eq(adminUsersTable.isActive, true)
        )
      )
      .limit(1);

    return adminUser.length > 0 ? adminUser[0] : null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

// 添加用户为管理员
export async function addAdminUser(clerkUserId: string, role: string = 'admin', permissions: string[] = []) {
  try {
    const [adminUser] = await db
      .insert(adminUsersTable)
      .values({
        clerkUserId,
        role,
        permissions,
        isActive: true,
      })
      .returning();

    return adminUser;
  } catch (error) {
    console.error('Error adding admin user:', error);
    throw error;
  }
}

// 更新管理员最后登录时间
export async function updateAdminLastLogin(clerkUserId: string) {
  try {
    await db
      .update(adminUsersTable)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(adminUsersTable.clerkUserId, clerkUserId));
  } catch (error) {
    console.error('Error updating admin last login:', error);
  }
}

// 停用管理员
export async function deactivateAdminUser(clerkUserId: string) {
  try {
    await db
      .update(adminUsersTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(adminUsersTable.clerkUserId, clerkUserId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deactivating admin user:', error);
    throw error;
  }
}

// 获取平台统计信息
export async function getPlatformStats() {
  try {
    // 获取用户总数
    const userCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProfilesTable);
    
    // 获取 Logo 总数
    const logoCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(logosTable);
    
    // 获取积分订单总数
    const orderCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'paid'));
    
    // 获取3D模型订单总数
    const modelOrderCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelOrdersTable)
      .where(eq(modelOrdersTable.status, 'paid'));

    // 获取今日新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProfilesTable)
      .where(gte(userProfilesTable.createdAt, today));

    return {
      totalUsers: userCountResult[0]?.count || 0,
      totalLogos: logoCountResult[0]?.count || 0,
      totalOrders: (orderCountResult[0]?.count || 0) + (modelOrderCountResult[0]?.count || 0),
      todayUsers: todayUsersResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    return {
      totalUsers: 0,
      totalLogos: 0,
      totalOrders: 0,
      todayUsers: 0,
    };
  }
}

// 获取最近活动
export async function getRecentActivity() {
  try {
    const recentLogos = await db
      .select()
      .from(logosTable)
      .orderBy(desc(logosTable.createdAt))
      .limit(5);

    const recentOrders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(5);

    return {
      recentLogos,
      recentOrders,
    };
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return {
      recentLogos: [],
      recentOrders: [],
    };
  }
}

// 激活管理员
export async function activateAdminUser(clerkUserId: string) {
  try {
    await db
      .update(adminUsersTable)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(adminUsersTable.clerkUserId, clerkUserId));
    
    return { success: true };
  } catch (error) {
    console.error('Error activating admin user:', error);
    throw error;
  }
}

// ============ 新增的数据可视化函数 ============

// 获取 Logo 风格统计
export async function getLogoStyleStats() {
  try {
    const styleStats = await db
      .select({
        style: logosTable.style,
        count: sql<number>`count(*)`,
      })
      .from(logosTable)
      .where(sql`${logosTable.style} IS NOT NULL`)
      .groupBy(logosTable.style)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return styleStats.map(stat => ({
      name: stat.style || '未分类',
      value: stat.count,
    }));
  } catch (error) {
    console.error('Error getting logo style stats:', error);
    return [];
  }
}

// 获取每日 Logo 生成统计（最近30天）
export async function getDailyLogoStats() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await db
      .select({
        date: sql<string>`DATE(${logosTable.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(logosTable)
      .where(gte(logosTable.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${logosTable.createdAt})`)
      .orderBy(sql`DATE(${logosTable.createdAt})`);

    // 填充缺失的日期
    const filledStats: { date: string; count: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const stat = dailyStats.find(s => s.date === dateStr);
      filledStats.push({
        date: dateStr,
        count: stat?.count || 0,
      });
    }

    return filledStats;
  } catch (error) {
    console.error('Error getting daily logo stats:', error);
    return [];
  }
}

// 获取热门 Logo 数据（按点赞数）
export async function getPopularLogos(limit: number = 10) {
  try {
    const popularLogos = await db
      .select({
        logoId: logosTable.id,
        imageUrl: logosTable.image_url,
        style: logosTable.style,
        companyName: logosTable.companyName,
        likeCount: sql<number>`COUNT(${likesTable.id})`,
      })
      .from(logosTable)
      .leftJoin(likesTable, eq(logosTable.id, likesTable.logoId))
      .groupBy(logosTable.id)
      .orderBy(desc(sql`COUNT(${likesTable.id})`))
      .limit(limit);

    return popularLogos;
  } catch (error) {
    console.error('Error getting popular logos:', error);
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

// 获取颜色偏好统计
export async function getColorPreferenceStats() {
  try {
    const colorStats = await db
      .select({
        primaryColor: logosTable.primary_color,
        count: sql<number>`count(*)`,
      })
      .from(logosTable)
      .where(sql`${logosTable.primary_color} IS NOT NULL`)
      .groupBy(logosTable.primary_color)
      .orderBy(desc(sql`count(*)`))
      .limit(15);

    return colorStats.map(stat => ({
      name: stat.primaryColor || '未知颜色',
      value: stat.count,
    }));
  } catch (error) {
    console.error('Error getting color preference stats:', error);
    return [];
  }
}

// 获取模型使用统计
export async function getModelUsageStats() {
  try {
    const modelStats = await db
      .select({
        model: logosTable.model,
        count: sql<number>`count(*)`,
      })
      .from(logosTable)
      .where(sql`${logosTable.model} IS NOT NULL`)
      .groupBy(logosTable.model)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return modelStats.map(stat => ({
      name: stat.model || '未知模型',
      value: stat.count,
    }));
  } catch (error) {
    console.error('Error getting model usage stats:', error);
    return [];
  }
}