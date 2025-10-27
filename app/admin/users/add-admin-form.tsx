// app/admin/users/add-admin-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

export function AddAdminForm() {
  const [clerkUserId, setClerkUserId] = useState('');
  const [role, setRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clerkUserId.trim()) {
      toast({
        title: '错误',
        description: '请输入用户ID',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          clerkUserId: clerkUserId.trim(),
          role 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '成功',
          description: `成功添加${role === 'super_admin' ? '超级管理员' : '管理员'}！`,
        });
        setClerkUserId('');
        setRole('admin');
        
        // 刷新页面以更新列表
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: '添加失败',
          description: data.error || '请重试',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '网络错误',
        description: '请检查连接后重试',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clerkUserId" className="text-sm font-medium">
          Clerk User ID
        </Label>
        <Input
          id="clerkUserId"
          value={clerkUserId}
          onChange={(e) => setClerkUserId(e.target.value)}
          placeholder="user_xxxxxxxxxxxxxxxx"
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          在 Clerk Dashboard 的用户详情中可以找到 User ID
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-sm font-medium">
          管理员角色
        </Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="选择角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">管理员</SelectItem>
            <SelectItem value="super_admin">超级管理员</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {role === 'super_admin' 
            ? '超级管理员拥有所有权限，包括管理其他管理员' 
            : '管理员拥有基础管理权限'}
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>添加中...</>
        ) : (
          <>
            <Users className="h-4 w-4 mr-2" />
            添加{role === 'super_admin' ? '超级管理员' : '管理员'}
          </>
        )}
      </Button>

      {/* 使用提示 */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-2">如何获取 User ID？</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>登录 Clerk Dashboard</li>
            <li>进入你的应用</li>
            <li>点击左侧菜单的 "Users"</li>
            <li>找到目标用户并点击进入详情</li>
            <li>在 URL 中或用户信息中找到 User ID</li>
          </ol>
        </CardContent>
      </Card>
    </form>
  );
}