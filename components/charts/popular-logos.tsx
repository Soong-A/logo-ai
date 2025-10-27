// components/admin/popular-logos.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Star, TrendingUp, Zap } from 'lucide-react';

interface PopularLogo {
  logoId: number;
  imageUrl: string;
  style: string | null;
  companyName: string | null;
  likeCount: number;
}

interface PopularLogosProps {
  popularLogos: PopularLogo[];
}

export default function PopularLogos({ popularLogos }: PopularLogosProps) {
  if (popularLogos.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            热门 Logo
          </CardTitle>
          <CardDescription>暂无数据</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-500';
      case 1: return 'from-gray-400 to-gray-500';
      case 2: return 'from-amber-600 to-amber-700';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />;
      case 1: return <Zap className="h-4 w-4 fill-gray-400 text-gray-400" />;
      case 2: return <TrendingUp className="h-4 w-4 fill-amber-600 text-amber-600" />;
      default: return <div className="h-4 w-4 text-xs font-bold text-white flex items-center justify-center">{index + 1}</div>;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          热门 Logo
        </CardTitle>
        <CardDescription>用户最喜欢的 Logo 作品排行</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {popularLogos.map((logo, index) => (
            <div 
              key={logo.logoId} 
              className="group relative bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* 排名徽章 */}
              <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-r ${getRankColor(index)} flex items-center justify-center shadow-lg z-10`}>
                {getRankIcon(index)}
              </div>

              {/* Logo 图片 */}
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:border-blue-200 transition-colors">
                <img
                  src={logo.imageUrl}
                  alt={logo.companyName || 'Logo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* 悬停覆盖层 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <div className="bg-white rounded-full p-2 shadow-lg">
                      <Heart className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="mt-3 space-y-2">
                {logo.companyName && (
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {logo.companyName}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {logo.style || '未分类'}
                  </span>
                  <div className="flex items-center space-x-1 bg-red-50 px-2 py-1 rounded-full">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">{logo.likeCount}</span>
                  </div>
                </div>
              </div>

              {/* 装饰元素 */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* 底部统计信息 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span>第一名</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>第二名</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
              <span>第三名</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}