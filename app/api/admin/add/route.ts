// app/api/admin/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin, addAdminUser } from '@/lib/admin-utils';

export async function POST(request: NextRequest) {
  try {
    // 检查当前用户是否为管理员
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { clerkUserId, role = 'admin' } = await request.json();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'clerkUserId is required' },
        { status: 400 }
      );
    }

    // 验证角色
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const adminUser = await addAdminUser(clerkUserId, role);
    
    return NextResponse.json({ 
      success: true,
      adminUser 
    });
  } catch (error: any) {
    console.error('Error adding admin user:', error);
    
    if (error.code === '23505') { // 唯一约束冲突
      return NextResponse.json(
        { error: '该用户已经是管理员' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add admin user' },
      { status: 500 }
    );
  }
}