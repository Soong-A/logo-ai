// app/api/admin/return-model-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/admin-utils';
import { updateModelOrderStatus, getModelOrderWithReturnInfo } from '@/lib/user-management-utils';
import { RETURN_STATUS } from '@/db/schema';

export async function POST(request: NextRequest) {
  const isAdmin = await isUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, returnReason, refundAmount } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: '缺少订单ID' }, { status: 400 });
    }

    if (!returnReason || returnReason.trim() === '') {
      return NextResponse.json({ success: false, error: '请输入退货原因' }, { status: 400 });
    }

    if (refundAmount === undefined || refundAmount < 0) {
      return NextResponse.json({ success: false, error: '退款金额无效' }, { status: 400 });
    }

    // 先获取订单当前状态
    const currentOrder = await getModelOrderWithReturnInfo(orderId);
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 });
    }

    // 检查订单是否可以退货（只有已支付的订单可以退货）
    if (currentOrder.status !== 'paid' && currentOrder.status !== 'completed') {
      return NextResponse.json({ 
        success: false, 
        error: '只有已支付的订单可以退货' 
      }, { status: 400 });
    }

    // 检查订单是否已经退货
    if (currentOrder.returnStatus === RETURN_STATUS.RETURNED) {
      return NextResponse.json({ 
        success: false, 
        error: '该订单已经退货，不能重复操作' 
      }, { status: 400 });
    }

    // 更新订单状态为退货
    const updatedOrder = await updateModelOrderStatus(
      orderId, 
      RETURN_STATUS.RETURNED, 
      returnReason.trim(), 
      refundAmount
    );

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: '订单更新失败' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '退货处理成功',
      order: {
        id: updatedOrder.id,
        orderId: updatedOrder.orderId,
        status: updatedOrder.status, // 现在包含更新后的状态
        returnStatus: updatedOrder.returnStatus,
        returnReason: updatedOrder.returnReason,
        returnedAt: updatedOrder.returnedAt,
        refundAmount: updatedOrder.refundAmount,
        totalAmount: updatedOrder.totalAmount
      }
    });
  } catch (error) {
    console.error('Error processing return:', error);
    return NextResponse.json({ success: false, error: '退货处理失败' }, { status: 500 });
  }
}