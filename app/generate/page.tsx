"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { generateLogo, downloadImage } from "../actions/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/navbar";
import {
  IconBolt,
  IconBulb,
  IconBook,
  IconBrush,
  IconCube,
  IconFlame,
  IconHistory,
  IconMoodHappy,
  IconPalette,
  IconSparkles,
  IconTypography,
} from "@tabler/icons-react";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";

// ---------------------- 1. 同步后端：风格选项（匹配后端 styleLookup 键值）----------------------
const STYLE_OPTIONS = [
  { id: "modern", name: "Modern", icon: IconTypography, details: "简洁现代，利落线条" },
  { id: "creative", name: "Creative", icon: IconBulb, details: "创意独特，想象力丰富" },
  { id: "professional", name: "Professional", icon: IconBook, details: "专业优雅，商务导向" },
  { id: "playful", name: "Playful", icon: IconFlame, details: "活泼有趣，色彩鲜明" },
  { id: "luxury", name: "Luxury", icon: IconCube, details: "高端奢华，精致质感" },
  { id: "tech", name: "Tech", icon: IconBolt, details: "科技未来，前沿感" },
  { id: "organic", name: "Organic", icon: IconBrush, details: "自然流动，手工质感" },
  { id: "abstract", name: "Abstract", icon: IconCube, details: "概念抽象，几何创意" },
  { id: "vintage", name: "Vintage", icon: IconBook, details: "复古经典，怀旧风格" },
  { id: "bold", name: "Bold", icon: IconFlame, details: "大胆醒目，冲击力强" },
  { id: "delicate", name: "Delicate", icon: IconBrush, details: "精致细腻，优雅内敛" },
  { id: "minimalist", name: "Minimalist", icon: IconTypography, details: "极简简约，去繁就简" },
];

// ---------------------- 2. 同步后端：情绪选项（匹配后端 moodLookup 键值）----------------------
const MOOD_OPTIONS = [
  { id: "energetic", name: "Energetic", icon: IconFlame, details: "活力充沛" },
  { id: "calm", name: "Calm", icon: IconMoodHappy, details: "平静舒缓" },
  { id: "powerful", name: "Powerful", icon: IconBolt, details: "强劲有力" },
  { id: "friendly", name: "Friendly", icon: IconMoodHappy, details: "亲切友好" },
  { id: "sophisticated", name: "Sophisticated", icon: IconCube, details: "精致优雅" },
  { id: "innovative", name: "Innovative", icon: IconBulb, details: "创新前沿" },
  { id: "trustworthy", name: "Trustworthy", icon: IconBook, details: "可靠稳重" },
  { id: "playful", name: "Playful", icon: IconFlame, details: "轻松有趣" },
  { id: "mysterious", name: "Mysterious", icon: IconCube, details: "神秘迷人" },
];

// ---------------------- 3. 同步后端：模型/尺寸/质量选项----------------------
const MODEL_OPTIONS = [
  {
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    description: "专业级logo生成，细节丰富",
  },
];

const SIZE_OPTIONS = [
  { id: "256x256", name: "Small (256x256)" },
  { id: "512x512", name: "Medium (512x512)" },
  { id: "1024x1024", name: "Large (1024x1024)" },
];

const QUALITY_OPTIONS = [
  { id: "standard", name: "Standard", description: "平衡速度与质量" },
  { id: "hd", name: "HD", description: "高清细节，适合印刷" },
];

// ---------------------- 4. 页脚组件（保留原逻辑）----------------------
const Footer = () => (
  <div className="flex justify-between items-center mt-4 px-4 max-sm:flex-col">
    <div className="px-4 py-2 text-sm max-sm:hidden">
      Powered by{" "}            
      <Link href="https://dub.sh/nebius" className="text-foreground hover:text-primary transition-colors">
        Nebius AI
      </Link>
    </div>

    <div className="px-4 py-2 text-sm">
      Made with ❤️ by{" "}
      <Link 
        href="https://github.com/arindamcodes" 
        target="_blank"
        className="text-foreground hover:text-primary transition-colors"
      >
        Arindam
      </Link>
    </div>

    <div className="flex gap-4 items-center max-sm:hidden">
      {[
        { href: "https://git.new/Arindam", Icon: IconBrandGithub },
        { href: "https://dub.sh/arindam-linkedin", Icon: IconBrandLinkedin },
        { href: "https://dub.sh/arindam-x", Icon: IconBrandX }
      ].map(({ href, Icon }) => (
        <Link 
          key={href}
          href={href} 
          target="_blank"
          className="hover:text-primary transition-colors"
        >
          <Icon className="size-5" />
        </Link>
      ))}
    </div>
  </div>
);

export default function Home() {
  // ---------------------- 5. 状态管理：完全同步后端 FormSchema 字段----------------------
  const [concept, setConcept] = useState(""); // 核心必填：创意概念（替代原companyName）
  const [selectedStyle, setSelectedStyle] = useState("modern"); // 核心必填：风格
  const [selectedMood, setSelectedMood] = useState<string | undefined>(); // 可选：情绪
  const [elements, setElements] = useState(""); // 可选：设计元素
  const [colorPalette, setColorPalette] = useState(""); // 可选：颜色调色板（替代原单色选择）
  const [composition, setComposition] = useState(""); // 可选：构图偏好
  const [selectedModel, setSelectedModel] = useState<"flux-kontext-pro">("flux-kontext-pro"); // 模型
  const [selectedSize, setSelectedSize] = useState<"256x256" | "512x512" | "1024x1024">("512x512"); // 尺寸
  const [selectedQuality, setSelectedQuality] = useState<"standard" | "hd">("standard"); // 质量

  // 交互状态
  const [loading, setLoading] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { isSignedIn, isLoaded, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  // ---------------------- 6. 表单验证：同步后端必填规则（仅 concept 和 style 必填）----------------------
  const isFormValid = useMemo(() => {
    return concept.trim().length > 0 && selectedStyle.trim().length > 0;
  }, [concept, selectedStyle]);

  // ---------------------- 7. 生成逻辑：完全匹配后端参数格式----------------------
  const handleGenerate = useCallback(async () => {
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      // 严格按照后端 FormSchema 传参
      const result = await generateLogo({
        concept: concept.trim(), // 核心必填
        style: selectedStyle, // 核心必填
        mood: selectedMood, // 可选
        elements: elements.trim() || undefined, // 可选（空值转undefined）
        colorPalette: colorPalette.trim() || undefined, // 可选（支持自由输入调色板）
        composition: composition.trim() || undefined, // 可选
        model: selectedModel, // 技术参数
        size: selectedSize, // 技术参数
        quality: selectedQuality, // 技术参数
      });

      if (result.success && result.url) {
        setGeneratedLogo(result.url);
        toast({
          title: "生成成功！",
          description: "您的创意logo已生成完成",
          variant: "success"
        });
      } else {
        throw new Error(result.error || "生成logo失败");
      }
    } catch (error) {
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "未知错误，请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    concept, selectedStyle, selectedMood, elements, 
    colorPalette, composition, selectedModel, selectedSize, 
    selectedQuality, isFormValid, toast
  ]);

  // ---------------------- 8. 下载逻辑：适配后端外部URL处理----------------------
  const handleDownload = useCallback(async () => {
    if (!generatedLogo) return;
    
    setIsDownloading(true);
    try {
      const result = await downloadImage(generatedLogo);
      if (result.success && result.data) {
        const a = document.createElement("a");
        a.href = result.data;
        // 用创意概念作为下载文件名
        a.download = `${concept.trim() || "creative-logo"}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast({
          title: "下载开始",
          description: "logo文件正在下载中",
        });
      } else {
        throw new Error("下载logo失败");
      }
    } catch (error) {
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : "文件处理错误",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [generatedLogo, concept, toast]);

  // ---------------------- 9. 权限控制（保留原逻辑）----------------------
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return redirect("/");
  }

  // ---------------------- 10. UI渲染：匹配新字段逻辑----------------------
  return (
    <div className="max-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 mt-12 sm:px-6 lg:px-8 pt-8 h-[calc(100vh-12rem)] overflow-y-auto rounded-lg">
        {/* 页面标题 */}
        <div className="flex md:flex-row items-start gap-4 md:items-center justify-between flex-col-reverse mb-6">
          <div className="text-3xl md:text-3xl font-medium">
            创意自由 <br />
            <span className="bg-gradient-to-tr mx-2 from-white via-primary to-white bg-clip-text text-transparent">
              生成专属Logo
            </span>
          </div>
          <Button onClick={() => router.push("/history")} className="w-fit">
            <IconHistory className="w-4 scale-y-[-1] h-4" />
            历史记录
          </Button>
        </div>

        {/* 核心表单区域 */}
        <div className="grid grid-cols-1 relative lg:grid-cols-2 gap-8">
          {/* 左侧：创意输入表单 */}
          <div>
            <Card className="dark:bg-accent/20 border-2 border-primary/10 h-full">
              <CardContent className="p-6 space-y-6">
                {/* 1. 创意概念（必填） */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium ml-2 flex items-center gap-1">
                    <IconSparkles className="w-4 h-4 text-primary" />
                    创意概念 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="例如：咖啡品牌/科技工作室/瑜伽馆，描述核心定位"
                    className="mt-1 h-12 border-accent"
                  />
                  <p className="text-xs text-slate-500">
                    填写您的品牌/项目核心定位，是AI生成的基础
                  </p>
                </div>

                {/* 2. 风格选择（必填） */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium ml-2 flex items-center gap-1">
                    <IconTypography className="w-4 h-4 text-primary" />
                    设计风格 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-1">
                    {STYLE_OPTIONS.map((style) => (
                      <motion.button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-lg border flex items-center gap-1 flex-col text-center transition-all text-xs ${
                          selectedStyle === style.id
                            ? "border-primary bg-primary/20 text-foreground font-semibold ring-1 ring-primary"
                            : "border-accent hover:bg-accent/20"
                        }`}
                      >
                        <style.icon className="w-4 h-4" />
                        <div className="mt-1 font-medium">{style.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 3. 情绪选择（可选） */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium ml-2 flex items-center gap-1">
                    <IconMoodHappy className="w-4 h-4 text-primary" />
                    整体情绪
                  </label>
                  <Select
                    value={selectedMood}
                    onValueChange={(value) => setSelectedMood(value)}
                  >
                    <SelectTrigger className="mt-1 h-12 border-accent">
                      <SelectValue placeholder="选择logo传递的情绪（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((mood) => (
                        <SelectItem key={mood.id} value={mood.id}>
                          <div className="flex items-center gap-2">
                            <mood.icon className="w-4 h-4" />
                            <span>{mood.name}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              {mood.details}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. 设计元素（可选） */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium ml-2 flex items-center gap-1">
                    <IconCube className="w-4 h-4 text-primary" />
                    设计元素
                  </label>
                  <Input
                    value={elements}
                    onChange={(e) => setElements(e.target.value)}
                    placeholder="例如：咖啡豆/几何图形/羽毛，需包含的视觉元素"
                    className="mt-1 h-12 border-accent"
                  />
                </div>

                {/* 5. 颜色调色板（可选） */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium ml-2 flex items-center gap-1">
                    <IconPalette className="w-4 h-4 text-primary" />
                    颜色调色板
                  </label>
                  <Input
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    placeholder="例如：深棕+米白+浅黄 / 科技蓝+银灰"
                    className="mt-1 h-12 border-accent"
                  />
                  <p className="text-xs text-slate-500">
                    支持自由描述颜色组合，更灵活的配色控制
                  </p>
                </div>

                {/* 6. 构图偏好（可选） */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium ml-2 flex items-center gap-1">
                    <IconBrush className="w-4 h-4 text-primary" />
                    构图偏好
                  </label>
                  <Textarea
                    value={composition}
                    onChange={(e) => setComposition(e.target.value)}
                    placeholder="例如：文字在上图形在下 / 图形包围文字 / 极简对称布局"
                    className="mt-1 h-20 px-4 py-3 border-accent"
                  />
                </div>

                {/* 7. 技术参数（模型/尺寸/质量） */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 模型选择 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium ml-2">AI模型</label>
                    <Select
                      value={selectedModel}
                      onValueChange={(value: "flux-kontext-pro") => setSelectedModel(value)}
                    >
                      <SelectTrigger className="mt-1 h-12 border-accent">
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_OPTIONS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-slate-500">
                                {model.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 尺寸选择 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium ml-2">图片尺寸</label>
                    <Select
                      value={selectedSize}
                      onValueChange={(value: "256x256" | "512x512" | "1024x1024") => setSelectedSize(value)}
                    >
                      <SelectTrigger className="mt-1 h-12 border-accent">
                        <SelectValue placeholder="选择尺寸" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 质量选择 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium ml-2">生成质量</label>
                    <Select
                      value={selectedQuality}
                      onValueChange={(value: "standard" | "hd") => setSelectedQuality(value)}
                    >
                      <SelectTrigger className="mt-1 h-12 border-accent">
                        <SelectValue placeholder="选择质量" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALITY_OPTIONS.map((quality) => (
                          <SelectItem key={quality.id} value={quality.id}>
                            <div>
                              <div className="font-medium">{quality.name}</div>
                              <div className="text-xs text-slate-500">
                                {quality.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerate}
                  disabled={!isFormValid || loading}
                  className="w-full h-12 text-lg bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      生成中...
                      <RefreshCw className="ml-2 h-5 w-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      生成Logo
                      <IconSparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：Logo预览区域 */}
          <div className="">
            <Card className="h-full rounded-3xl dark:bg-accent/20 ">
              <CardContent className="p-6 h-full">
                {generatedLogo ? (
                  // 生成成功：预览Logo
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Logo预览框（移除固定背景，适配自由调色） */}
                    <div className="aspect-square rounded-2xl border border-accent/30 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
                      <img
                        src={generatedLogo}
                        alt="Generated logo"
                        className="w-full h-full rounded-2xl object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex-1 bg-primary hover:bg-primary/80"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        重新生成
                      </Button>
                      <Button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {isDownloading ? "下载中..." : "下载"}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  // 未生成：引导提示
                  <motion.div
                    className="h-full rounded-2xl flex items-center border-2 dark:border-primary/40 border-dashed justify-center text-center p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="max-w-md space-y-4">
                      <IconPalette className="h-20 w-20 mx-auto text-primary opacity-50" />
                      <h3 className="text-xl font-semibold">
                        Logo将在这里预览
                      </h3>
                      <p className="text-neutral-500">
                        填写左侧创意信息，AI将为您生成专属设计
                        <br />
                        支持自由描述风格、元素和配色，创意无限制
                      </p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 页脚 */}
        <Footer />
      </main>
    </div>
  );
}