// app/api/user-profile/route.ts
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { userProfilesTable, logosTable, creditTransactionsTable, ordersTable, bookmarksTable, modelOrdersTable, modelProductsTable } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 并行执行所有查询
    const [
      userProfile,
      logosCountResult,
      recentTransactions,
      recentOrders,
      bookmarksCountResult,
      recentLogos,
      recentModelOrders
    ] = await Promise.all([
      // 获取用户资料
      db
        .select({
          id: userProfilesTable.id,
          clerkUserId: userProfilesTable.clerkUserId,
          displayName: userProfilesTable.displayName,
          bio: userProfilesTable.bio,
          avatarUrl: userProfilesTable.avatarUrl,
          company: userProfilesTable.company,
          location: userProfilesTable.location,
          creditsRemaining: userProfilesTable.creditsRemaining,
          emailNotifications: userProfilesTable.emailNotifications,
          createdAt: userProfilesTable.createdAt,
          updatedAt: userProfilesTable.updatedAt,
        })
        .from(userProfilesTable)
        .where(eq(userProfilesTable.clerkUserId, user.id))
        .limit(1),

      // 获取用户生成的 Logo 数量
      db
        .select({ count: count() })
        .from(logosTable)
        .where(eq(logosTable.clerkUserId, user.id)),

      // 获取最近的积分交易记录
      db
        .select({
          id: creditTransactionsTable.id,
          transactionType: creditTransactionsTable.transactionType,
          amount: creditTransactionsTable.amount,
          description: creditTransactionsTable.description,
          createdAt: creditTransactionsTable.createdAt,
        })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.clerkUserId, user.id))
        .orderBy(desc(creditTransactionsTable.createdAt))
        .limit(5),

      // 获取最近的积分订单
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
        .where(eq(ordersTable.clerkUserId, user.id))
        .orderBy(desc(ordersTable.createdAt))
        .limit(5),

      // 获取收藏的 Logo 数量
      db
        .select({ count: count() })
        .from(bookmarksTable)
        .where(eq(bookmarksTable.clerkUserId, user.id)),

      // 获取用户生成的 Logo 列表（最近5个）
      db
        .select({
          id: logosTable.id,
          image_url: logosTable.image_url,
          primary_color: logosTable.primary_color,
          background_color: logosTable.background_color,
          companyName: logosTable.companyName,
          style: logosTable.style,
          createdAt: logosTable.createdAt,
        })
        .from(logosTable)
        .where(eq(logosTable.clerkUserId, user.id))
        .orderBy(desc(logosTable.createdAt))
        .limit(5),

      // 获取最近的3D模型订单（包含商品详情）
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
        })
        .from(modelOrdersTable)
        .where(eq(modelOrdersTable.clerkUserId, user.id))
        .orderBy(desc(modelOrdersTable.createdAt))
        .limit(5)
    ]);

    const profileData = userProfile[0] || {
      creditsRemaining: 5,
      displayName: null,
      bio: null,
      company: null,
      location: null
    };

    // 处理3D模型订单数据，确保items是数组
    const processedModelOrders = recentModelOrders.map((order) => {
      // 确保items是数组，如果不是则设为空数组
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

      // 确保每个item都有必要的字段
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
        id: order.id,
        orderId: order.orderId,
        items: safeItems,
        totalAmount: order.totalAmount,
        itemCount: order.itemCount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        formattedDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
        formattedAmount: (order.totalAmount / 100).toFixed(2),
      };
    });

    const responseData = {
      userProfile: {
        ...profileData,
        totalLogosGenerated: logosCountResult[0]?.count || 0,
        bookmarksCount: bookmarksCountResult[0]?.count || 0
      },
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id.toString(),
        type: transaction.transactionType,
        date: transaction.createdAt?.toISOString().split('T')[0] || '',
        description: transaction.description || '',
        amount: transaction.amount
      })),
      recentOrders,
      recentLogos,
      recentModelOrders: processedModelOrders
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}