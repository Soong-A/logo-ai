"use client";

import { Card, CardContent } from "@/components/ui/card";  
import { Button } from "@/components/ui/button";
import { Download, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { allLogos, downloadImage } from "../actions/actions";  //获取下载数据
import { SelectLogo } from "@/db/schema";  //selectlogo函数用于存储数据
import { useToast } from "@/hooks/use-toast"; //消息提示（显示更新关闭）
import Navbar from "@/components/landing/navbar";  //landing page
import LogoCard from "@/components/logo-card";  //logo-card page
import SkeletonCard from "@/components/skeleton-card";  //skeleton-card page
//画廊渲染
export default function Gallery() {
  const { toast } = useToast();  //显示通知
  //logos状态变量，setlogos更新重新渲染
  const [logos, setLogos] = useState<SelectLogo[]>([]);  //初始化数组，存储logo数据
  const [showAll, setShowAll] = useState(false);  //分页逻辑
  const [isLoading, setIsLoading] = useState(true);  //加载状态
  const [isDownloading, setIsDownloading] = useState(false);  //下载状态

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const fetchedLogos = await allLogos();  //actions/allogos函数获取数据
        if (fetchedLogos) {
          setLogos(fetchedLogos);  //存储数据
        } else {
          toast({
            title: "Error",
            description: "Failed to load logos",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load logos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);  //结束加载
      }
    };
    fetchLogos();
  }, []);

  //分页处理，最多12
  const displayedLogos = showAll ? logos : logos.slice(0, 12);

  const handleDownload = async (imageUrl: string) => {
    setIsDownloading(true);
    try {
      const result = await downloadImage(imageUrl);  //actions/downloadImage
      if (result.success && result.data) {
        //a标签出发下载
        const a = document.createElement("a");
        a.href = result.data;  //64base作为链接
        a.download = `logo.webp`;  //下载名
        document.body.appendChild(a);  //将a标签添加到body
        a.click();
        document.body.removeChild(a);  //下载出发移除a
        toast({
          title: "Download started",
          description: "Your logo is being downloaded",
        });
      } else {
        throw new Error("Failed to download logo");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred while downloading",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />  {/* 导航栏组件 */}
      <div className="max-w-6xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold mb-8">
          Recent
          <span className="bg-gradient-to-tr mx-2 from-white via-primary to-white bg-clip-text text-transparent">
            Generations
          </span>{" "}
        </h1>
        {/* Logo网格布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            // 加载状态：显示12个骨架屏
            [...Array(12)].map((_, index) => <SkeletonCard key={index} />)
          ) : logos.length > 0 ? (
            //显示logo卡片
            displayedLogos.map((logo) => (
              <LogoCard 
              key={logo.id} 
              logo={logo} 
              onDownload={() => handleDownload(logo.image_url)} 
              />
            ))
          ) : (
            //无数据提示
            <div className="col-span-full text-center text-muted-foreground py-12">
              No logos generated yet
            </div>
          )}
        </div>
        {/*显示更多+收起按钮*/}
        {!isLoading && logos.length > 12 && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="gap-2"
            >
              {showAll ? "Show Less" : "See More"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
