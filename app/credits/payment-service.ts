// lib/db/payment-service.ts
import { db } from '@/db'
import { ordersTable, creditPackagesTable, userProfilesTable, creditTransactionsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { SelectOrder, SelectCreditPackage } from '@/db/schema'

// 定义更明确的返回类型
type OrderResult = {
  success: true;
  order: SelectOrder;
  package?: SelectCreditPackage;
} | {
  success: false;
  error: string;
}

type UpdateOrderResult = {
  success: true;
  order: SelectOrder;
} | {
  success: false;
  error: string;
}

type CreditResult = {
  success: true;
  newBalance: number;
} | {
  success: false;
  error: string;
}

type GetOrderResult = {
  success: true;
  order: SelectOrder;
} | {
  success: false;
  error: string;
}

// 生成订单号
function generateOrderNo(): string {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 创建订单
export async function createOrder(params: {
  clerkUserId: string
  packageId: number
  paymentMethod: string
}): Promise<OrderResult> {
  try {
    // 获取套餐信息
    const packages = await db
      .select()
      .from(creditPackagesTable)
      .where(
        and(
          eq(creditPackagesTable.id, params.packageId),
          eq(creditPackagesTable.isActive, true)
        )
      )

    if (packages.length === 0) {
      return { success: false, error: '套餐不存在或已下架' }
    }

    const selectedPackage = packages[0]
    const orderNo = generateOrderNo()

    // 创建订单记录
    const [order] = await db
      .insert(ordersTable)
      .values({
        orderId: orderNo,
        clerkUserId: params.clerkUserId,
        creditPackageId: selectedPackage.id,
        credits: selectedPackage.credits,
        price: selectedPackage.price,
        status: 'pending',
        paymentMethod: params.paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    if (!order) {
      return { success: false, error: '创建订单失败' }
    }

    return {
      success: true,
      order: order,
      package: selectedPackage
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    return { success: false, error: '创建订单失败' }
  }
}

// 更新订单状态
export async function updateOrderStatus(params: {
  orderId: string
  status: 'paid' | 'failed' | 'refunded'
  paymentId?: string
}): Promise<UpdateOrderResult> {
  try {
    const updateData: any = {
      status: params.status,
      updatedAt: new Date()
    }

    if (params.status === 'paid') {
      updateData.paidAt = new Date()
      updateData.paymentId = params.paymentId
    }

    const [updatedOrder] = await db
      .update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.orderId, params.orderId))
      .returning()

    if (!updatedOrder) {
      return { success: false, error: '更新订单失败' }
    }

    return { success: true, order: updatedOrder }
  } catch (error) {
    console.error('更新订单状态失败:', error)
    return { success: false, error: '更新订单状态失败' }
  }
}

// 为用户添加积分
export async function addUserCredits(params: {
  clerkUserId: string
  credits: number
  orderId: string
}): Promise<CreditResult> {
  try {
    // 获取当前用户信息
    const users = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.clerkUserId, params.clerkUserId))

    if (users.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const user = users[0]
    const newBalance = (user.creditsRemaining || 0) + params.credits

    // 更新用户积分
    await db
      .update(userProfilesTable)
      .set({ 
        creditsRemaining: newBalance,
        updatedAt: new Date()
      })
      .where(eq(userProfilesTable.clerkUserId, params.clerkUserId))

    // 记录积分交易
    await db
      .insert(creditTransactionsTable)
      .values({
        clerkUserId: params.clerkUserId,
        transactionType: 'purchase',
        amount: params.credits,
        balanceAfter: newBalance,
        description: `购买积分 - 订单 ${params.orderId}`,
        createdAt: new Date()
      })

    return { success: true, newBalance }
  } catch (error) {
    console.error('添加用户积分失败:', error)
    return { success: false, error: '添加积分失败' }
  }
}

// 获取订单信息
export async function getOrder(orderId: string): Promise<GetOrderResult> {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderId, orderId))

    if (orders.length === 0) {
      return { success: false, error: '订单不存在' }
    }

    return { success: true, order: orders[0] }
  } catch (error) {
    console.error('获取订单失败:', error)
    return { success: false, error: '获取订单失败' }
  }
}