import { useState, useEffect } from "react";
import { SelectLogo } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Heart, Bookmark, Share2, Image } from "lucide-react";
import { 
  toggleLike, 
  checkUserLiked, 
  getLikeCount, 
  toggleBookmark, 
  checkUserBookmarked, 
  getBookmarkCount,
  getLogoImageData
} from "@/app/actions/actions";
import { useToast } from "@/hooks/use-toast";

interface LogoCardProps {
  logo: SelectLogo;
  onDownload: (imageUrl: string) => void;
}

const LogoCard = ({ logo, onDownload }: LogoCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [actualImageUrl, setActualImageUrl] = useState(logo.image_url);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const { toast } = useToast();

  // 检查图片URL并修复
  useEffect(() => {
    const checkAndFixImageUrl = async () => {
      if (logo.image_url.startsWith('/') || logo.image_url.startsWith('http')) {
        try {
          const imageData = await getLogoImageData(logo.id);
          if (imageData && imageData.startsWith('data:image')) {
            setActualImageUrl(imageData);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.error("获取图片数据失败:", error);
          setImageError(true);
        }
      } else {
        setActualImageUrl(logo.image_url);
      }
    };

    checkAndFixImageUrl();
  }, [logo.id, logo.image_url]);

  // 获取点赞和收藏状态
  useEffect(() => {
    const fetchInteractionData = async () => {
      try {
        const [liked, likes, bookmarked, bookmarks] = await Promise.all([
          checkUserLiked(logo.id),
          getLikeCount(logo.id),
          checkUserBookmarked(logo.id),
          getBookmarkCount(logo.id)
        ]);
        
        setIsLiked(Boolean(liked));
        setLikesCount(likes || 0);
        setIsBookmarked(Boolean(bookmarked));
        setBookmarksCount(bookmarks || 0);
      } catch (error) {
        console.error("Error fetching interaction data:", error);
      }
    };

    fetchInteractionData();
  }, [logo.id]);

  // 处理图片加载错误
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // 处理图片加载成功
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // 处理点赞
  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await toggleLike(logo.id);
      if (result.success) {
        setIsLiked(Boolean(result.isLiked));
        setLikesCount(result.count || 0);
        
        toast({
          title: result.isLiked ? "已点赞" : "已取消点赞",
          description: result.isLiked ? "感谢您的喜欢！" : "",
        });
      } else {
        // 处理服务器返回的错误信息
        if (result.error === "Please log in first") {
          toast({
            title: "请先登录",
            description: "登录后即可点赞",
            variant: "default",
          });
        } else {
          toast({
            title: "操作失败",
            description: result.error || "请稍后重试",
            variant: "destructive",
          });
        } 
      }
    } catch (error) {
      // 捕获任何未预期的错误
      console.error("Like error:", error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理收藏
  const handleBookmark = async () => {
    if (isBookmarkLoading) return;
    
    setIsBookmarkLoading(true);
    try {
      const result = await toggleBookmark(logo.id);
      if (result.success) {
        setIsBookmarked(Boolean(result.isBookmarked));
        setBookmarksCount(result.count || 0);
        
        toast({
          title: result.isBookmarked ? "已收藏" : "已取消收藏",
          description: result.isBookmarked ? "Logo 已添加到收藏夹" : "",
        });
      } else {
        // 处理服务器返回的错误信息，不抛出错误
        if (result.error === "请先登录") {
          toast({
            title: "请先登录",
            description: "登录后即可收藏喜欢的Logo",
            variant: "default",
          });
        } else {
          toast({
            title: "操作失败",
            description: result.error || "请稍后重试",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      // 捕获任何未预期的错误
      console.error("Bookmark error:", error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // 处理分享
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${logo.companyName || logo.username} 的 Logo`,
          text: `查看这个精美的 Logo 设计`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "链接已复制",
          description: "Logo 链接已复制到剪贴板",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="group rounded-2xl hover:shadow-lg transition-all duration-300">
      <CardContent className="w-full rounded-2xl p-0">
        {/* 图片区域 */}
        <div className="w-full rounded-t-2xl overflow-hidden aspect-square relative bg-gradient-to-br from-slate-50 to-slate-100">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
              <div className="text-slate-400">加载中...</div>
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
              <Image className="h-12 w-12 mb-2" />
              <div className="text-sm">图片加载失败</div>
            </div>
          ) : (
            <img
              src={actualImageUrl}
              alt={`${logo.companyName || logo.username} 的 Logo`}
              className={`w-full h-full object-contain transition-all duration-500 ease-in-out
                ${imageLoaded ? "opacity-100" : "opacity-0"}
                group-hover:scale-105`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* 信息区域 */}
        <div className={`rounded-b-xl p-4 transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-40"
        }`}>
          {/* 标题和日期 */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {logo.companyName || logo.username}
              </h3>
              <p className="text-sm text-muted-foreground">
                {logo.username}
              </p>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {formatDate(logo.createdAt)}
            </div>
          </div>

          {/* Logo 基本信息 */}
          <div className="space-y-2 mb-4">
            {logo.style && (
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground mr-2">风格:</span>
                <span className="font-medium">{logo.style}</span>
              </div>
            )}
            
            {logo.model && (
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground mr-2">模型:</span>
                <span className="font-medium">{logo.model}</span>
              </div>
            )}
            
            {logo.size && (
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground mr-2">尺寸:</span>
                <span className="font-medium">{logo.size}</span>
              </div>
            )}
          </div>

          {/* 互动按钮区域 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 点赞按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLoading}
                className={`flex items-center gap-1 h-8 px-3 transition-all ${
                  isLiked 
                    ? "text-red-500 bg-red-50 hover:bg-red-100" 
                    : "text-muted-foreground hover:text-red-500"
                }`}
              >
                <Heart 
                  className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} 
                />
                <span className="text-xs">{likesCount}</span>
              </Button>

              {/* 收藏按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                disabled={isBookmarkLoading}
                className={`flex items-center gap-1 h-8 px-3 transition-all ${
                  isBookmarked 
                    ? "text-amber-500 bg-amber-50 hover:bg-amber-100" 
                    : "text-muted-foreground hover:text-amber-500"
                }`}
              >
                <Bookmark 
                  className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} 
                />
                <span className="text-xs">{bookmarksCount}</span>
              </Button>

              {/* 分享按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1 h-8 px-3 text-muted-foreground hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* 下载按钮 */}
            <Button
              onClick={() => onDownload(actualImageUrl)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
            >
              <Download className="mr-2 h-4 w-4" />
              下载
            </Button>
          </div>

          {/* 提示文本 */}
          {logo.promptText && (
            <div className="mt-3 p-2 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {logo.promptText}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoCard;