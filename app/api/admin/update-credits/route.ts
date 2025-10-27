// app/api/admin/update-credits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/admin-utils';
import { updateUserCredits } from '@/lib/user-management-utils';

export async function POST(request: NextRequest) {
  const isAdmin = await isUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 使用 request.json() 而不是 request.formData()
    const body = await request.json();
    const { userId, credits, description } = body;

    if (!userId || credits === undefined) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    if (isNaN(credits) || credits < 0) {
      return NextResponse.json({ success: false, error: '积分必须是有效的正数' }, { status: 400 });
    }

    await updateUserCredits(userId, credits, description);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating credits:', error);
    return NextResponse.json({ success: false, error: '更新积分失败' }, { status: 500 });
  }
}