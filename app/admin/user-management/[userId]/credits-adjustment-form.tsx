// components/admin/credits-adjustment-form.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, AlertCircle } from 'lucide-react';

interface CreditsAdjustmentFormProps {
  userId: string;
  currentCredits: number;
}

export default function CreditsAdjustmentForm({ 
  userId, 
  currentCredits 
}: CreditsAdjustmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const credits = parseInt(formData.get('credits') as string);
    const description = formData.get('description') as string;

    if (isNaN(credits) || credits < 0) {
      setError('积分必须是有效的正数');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/update-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits,
          description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/admin/user-management/${userId}`);
        router.refresh(); // 刷新页面数据
      } else {
        setError(result.error || '更新积分失败');
      }
    } catch (error) {
      console.error('Error updating credits:', error);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          积分调整
        </CardTitle>
        <CardDescription>
          设置用户的新积分余额，系统会自动记录调整记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="credits">新积分余额</Label>
            <Input
              id="credits"
              name="credits"
              type="number"
              min="0"
              defaultValue={currentCredits}
              required
              placeholder="请输入新的积分余额"
            />
            <p className="text-sm text-muted-foreground">
              当前积分: {currentCredits}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">调整说明</Label>
            <Input
              id="description"
              name="description"
              placeholder="请输入积分调整的原因"
              defaultValue="管理员手动调整"
            />
            <p className="text-sm text-muted-foreground">
              这个说明会显示在用户的积分交易记录中
            </p>
          </div>

          {/* 错误信息显示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">错误</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 警告信息 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">重要提示</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  积分调整将直接影响用户的生成能力。请确保操作正确，系统会自动记录所有调整记录。
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? '处理中...' : '确认调整'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/user-management/${userId}`}>
                取消
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}