// app/api/payments/create-model-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { modelOrdersTable, shoppingCartsTable } from '@/db/schema'
import { eq } from 'drizzle-orm'

// 定义购物车商品类型
interface CartItem {
  id: string;
  modelId: string;
  modelName: string;
  basePrice: number;
  texturePrice: number;
  textureCount: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnail?: string;
  textures: Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
    size: [number, number, number];
  }>;
  createdAt: string | Date;
}

export async function POST(request: NextRequest) {
  try {
    console.log('开始创建模型订单...');
    
    // 使用 getAuth 获取认证信息
    const { userId } = getAuth(request)
    console.log('用户ID:', userId);
    
    if (!userId) {
      console.log('未授权访问: 用户ID为空');
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { paymentMethod = 'alipay' } = await request.json();
    console.log('支付方式:', paymentMethod);

    // 直接从数据库获取购物车数据
    const carts = await db
      .select()
      .from(shoppingCartsTable)
      .where(eq(shoppingCartsTable.clerkUserId, userId))

    console.log('数据库购物车查询结果:', carts);

    // 明确指定 cartItems 的类型
    let cartItems: CartItem[] = [];
    if (carts.length > 0 && carts[0].items) {
      cartItems = carts[0].items as CartItem[];
    }

    console.log('购物车商品数量:', cartItems.length);
    
    if (cartItems.length === 0) {
      console.log('购物车为空');
      return NextResponse.json({ error: '购物车为空' }, { status: 400 })
    }

    // 计算总价 - 现在 TypeScript 知道 cartItems 的类型
    const totalAmount = cartItems.reduce((sum: number, item: CartItem) => sum + item.totalPrice, 0);
    const itemCount = cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
    console.log('订单总金额:', totalAmount, '商品数量:', itemCount);

    // 生成订单号
    const orderId = `MODEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('生成的订单号:', orderId);

    // 创建模型订单记录
    console.log('开始创建数据库订单记录...');
    const [order] = await db
      .insert(modelOrdersTable)
      .values({
        orderId,
        clerkUserId: userId,
        items: cartItems,
        totalAmount,
        itemCount,
        status: 'pending',
        paymentMethod,
        createdAt: new Date()
      })
      .returning();

    console.log('数据库订单创建成功:', order);

    // 使用模拟支付 - 生成可靠的二维码
    const mockQrCodeUrl = generateMockQRCode(orderId, totalAmount);
    
    console.log('🎯 使用模拟支付，二维码URL:', mockQrCodeUrl);
    
    return NextResponse.json({
      success: true,
      orderId: orderId,
      paymentData: {
        qrCodeUrl: mockQrCodeUrl,
        outTradeNo: orderId
      }
    });

  } catch (error: any) {
    console.error('创建订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '创建订单失败，请重试' 
    }, { status: 500 });
  }
}

// 生成模拟二维码的函数
function generateMockQRCode(orderId: string, amount: number): string {
  // 使用多个备选的二维码生成服务
  const qrServices = [
    // 方案1: 使用稳定的二维码服务
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_ORDER_${orderId}&format=png&margin=10`,
    // 方案2: 使用Google Charts API
    `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=PAY_ORDER_${orderId}&choe=UTF-8`,
    // 方案3: 使用QuickChart
    `https://quickchart.io/qr?text=PAY_ORDER_${orderId}&size=200`,
  ];
  
  // 返回第一个服务，如果失败前端会显示备用信息
  return qrServices[0];
}