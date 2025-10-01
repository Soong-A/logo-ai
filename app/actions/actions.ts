'use server';

import { z } from 'zod';
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { InsertLogo, logosTable, likesTable } from '@/db/schema';
import { db } from '@/db';
import { eq, desc, and, count } from 'drizzle-orm';
import { rateLimit } from '@/lib/upstash';

// 完全简化的表单验证 schema - 只保留核心创意输入
const FormSchema = z.object({
  // 核心创意输入
  concept: z.string().min(1, "创意概念是必需的"), // 取代 companyName，更自由
  style: z.string().min(1, "风格是必需的"),
  mood: z.string().optional(), // 情绪/氛围
  elements: z.string().optional(), // 设计元素
  
  // 可选视觉指导
  colorPalette: z.string().optional(), // 颜色调色板，更灵活
  composition: z.string().optional(), // 构图偏好
  
  // 技术参数
  model: z.enum(["flux-kontext-pro"]).default("flux-kontext-pro"),
  size: z.enum(['512x512','768x768','1024x1024']).default('1024x1024'),
});

// 更开放、启发性的风格映射
const styleLookup: { [key: string]: string } = {
  modern: "modern contemporary design, sleek, minimalist, clean lines, professional",
  creative: "highly creative, artistic, unique, imaginative, innovative, original concept",
  professional: "professional, elegant, sophisticated, trustworthy, business-oriented",
  playful: "playful, fun, energetic, dynamic, colorful, lively, engaging",
  luxury: "luxury, premium, high-end, exclusive, sophisticated, elegant",
  tech: "tech, futuristic, digital, innovative, cutting-edge, modern technology",
  organic: "organic, natural, flowing, authentic, handcrafted, earthy",
  abstract: "abstract, artistic, geometric, conceptual, unique patterns, creative forms",
  vintage: "vintage, classic, retro, nostalgic, timeless, traditional with modern twist",
  bold: "bold, striking, impactful, strong, confident, eye-catching",
  delicate: "delicate, elegant, refined, intricate, detailed, sophisticated",
  minimalist: "minimalist, simple, clean, essential, timeless, uncluttered",
};

// 情绪/氛围映射
const moodLookup: { [key: string]: string } = {
  energetic: "energetic, dynamic, vibrant, lively",
  calm: "calm, peaceful, serene, tranquil",
  powerful: "powerful, strong, confident, authoritative",
  friendly: "friendly, approachable, welcoming, warm",
  sophisticated: "sophisticated, elegant, refined, luxurious",
  innovative: "innovative, forward-thinking, cutting-edge, progressive",
  trustworthy: "trustworthy, reliable, stable, professional",
  playful: "playful, fun, cheerful, lighthearted",
  mysterious: "mysterious, intriguing, enigmatic, captivating",
};

export async function generateLogo(formData: z.infer<typeof FormSchema>) {
  'use server';
  
  try {
    // 用户认证
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 限流检查
    const { success: rateLimitSuccess, remaining } = await rateLimit.limit(user.id);
    await (await clerkClient()).users.updateUserMetadata(user.id, {
      unsafeMetadata: { remaining },
    });

    if (!rateLimitSuccess) {
      return { 
        success: false, 
        error: "You've reached your logo generation limit. Please try again later." 
      };
    }

    // 表单验证
    const validatedData = FormSchema.parse(formData);
    
    // 构建高度创意性的提示词 - 给模型最大自由度
    let promptParts = [];
    
    // 核心概念 - 最重要的部分
    promptParts.push(`Create a unique and memorable logo design for: ${validatedData.concept}`);
    
    // 风格指导
    if (validatedData.style) {
      const styleDescription = styleLookup[validatedData.style] || validatedData.style;
      promptParts.push(`Style: ${styleDescription}`);
    }
    
    // 情绪/氛围
    if (validatedData.mood) {
      const moodDescription = moodLookup[validatedData.mood] || validatedData.mood;
      promptParts.push(`Mood: ${moodDescription}`);
    }
    
    // 设计元素
    if (validatedData.elements) {
      promptParts.push(`Incorporate elements like: ${validatedData.elements}`);
    }
    
    // 颜色指导（可选，不强制）
    if (validatedData.colorPalette) {
      promptParts.push(`Color palette: ${validatedData.colorPalette}`);
    }
    
    // 构图偏好（可选）
    if (validatedData.composition) {
      promptParts.push(`Composition: ${validatedData.composition}`);
    }
    
    // 基础质量要求
    promptParts.push("High quality professional logo design, vector style, suitable for branding, clean composition, balanced, visually striking");
    
    // 最终提示词 - 用自然语言连接所有部分
    const prompt = promptParts.join(". ") + ".";
    
    console.log("Generated prompt:", prompt); // 用于调试

    // 转换尺寸为宽高比
    const sizeToAspectRatio: Record<string, string> = {
      '512x512': '1:1',
      '768x768': '1:1',
      '1024x1024': '1:1',
    };
    const aspectRatio = sizeToAspectRatio[validatedData.size] || '1:1';

    // 提交生成任务到 Flux API
    const submitUrl = "https://api.fluxapi.ai/api/v1/flux/kontext/generate";
    const headers = {
      "Authorization": "Bearer d6e167fec1a5ecd6c9b5b1d5ce2efe4b",
      "Content-Type": "application/json"
    };

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt.trim(),
        aspectRatio,
        model: "flux-kontext-pro"
      })
    });

    const submitResult = await submitResponse.json();
    if (!submitResponse.ok || submitResult.code !== 200) {
      throw new Error(submitResult.msg || 'Failed to submit generation task');
    }

    const taskId = submitResult.data.taskId;
    console.log(`Task submitted with ID: ${taskId}`);

    // 轮询任务状态
    const maxWaitTime = 300000;
    const checkInterval = 3000;
    const startTime = Date.now();
    let imageUrl: string | null = null;

    while (Date.now() - startTime < maxWaitTime) {
      const checkUrl = `https://api.fluxapi.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`;
      const checkResponse = await fetch(checkUrl, { headers });
      const checkResult = await checkResponse.json();

      if (checkResponse.ok && checkResult.code === 200) {
        const statusData = checkResult.data;
        if (statusData.successFlag === 1) {
          imageUrl = statusData.response.resultImageUrl;
          break;
        } else if (statusData.successFlag !== 0) {
          throw new Error(statusData.errorMessage || 'Image generation failed');
        }
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    if (!imageUrl) {
      throw new Error('Image generation timed out');
    }

    // 存储到数据库
    const DatabaseData: InsertLogo = {
      image_url: imageUrl,
      primary_color: validatedData.colorPalette || '',
      background_color: '',
      username: user.username ?? user.firstName ?? 'Anonymous',
      userId: user.id,
      style: validatedData.style,
      companyName: validatedData.concept, // 使用概念作为公司名称
      size: validatedData.size,
    };

    await db.insert(logosTable).values(DatabaseData);

    return { 
      success: true, 
      url: imageUrl,
    };
  } catch (error) {
    console.error('Error generating logo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate logo' };
  }
}

// 其他函数保持不变
export async function checkHistory() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const userLogos = await db
      .select()
      .from(logosTable)
      .where(
        user.externalId 
          ? eq(logosTable.userId, user.externalId)
          : eq(logosTable.userId, user.id)
      )
      .orderBy(desc(logosTable.createdAt));

    return userLogos;
  } catch (error) {
    console.error('Error fetching user logos:', error);
    return null;
  }
}

export async function allLogos(){
  try{
    const allLogos = await db
      .select()
      .from(logosTable)
      .orderBy(desc(logosTable.createdAt));
    return allLogos;
  }catch(error){
    console.error('Error fetching logos:', error);
    return null;
  }
}

export async function downloadImage(url: string) {
  'use server';

  try {
    // 如果是外部 URL，下载并转换为 base64
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';

    return {
      success: true,
      data: `data:${contentType};base64,${base64Image}`
    };

  } catch (error) {
    console.error('Error processing image:', error);
    return {
      success: false,
      error: 'Failed to process image'
    };
  }
}

export async function toggleLike(logoId: number) {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Please log in first" };
  }

  try {
    const existingLike = await db
      .select()
      .from(likesTable)
      .where(and(
        eq(likesTable.logoId, logoId),
        eq(likesTable.userId, user.id)
      ));

    if (existingLike.length > 0) {
      await db
        .delete(likesTable)
        .where(and(
          eq(likesTable.logoId, logoId),
          eq(likesTable.userId, user.id)
        ));
      const count = await getLikeCount(logoId);
      return { success: true, isLiked: false, count };
    } else {
      await db
        .insert(likesTable)
        .values({
          logoId,
          userId: user.id,
        });
      const count = await getLikeCount(logoId);
      return { success: true, isLiked: true, count };
    }
  } catch (error) {
    console.error("Like operation failed:", error);
    return { success: false, error: "Operation failed" };
  }
}

export async function getLikeCount(logoId: number) {
  try {
    const result = await db
      .select({ count: count() })
      .from(likesTable)
      .where(eq(likesTable.logoId, logoId));

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error getting like count:", error);
    return 0;
  }
}

export async function checkUserLiked(logoId: number): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

   try {
    const existingLike = await db
      .select()
      .from(likesTable)
      .where(and(
        eq(likesTable.logoId, logoId),
        eq(likesTable.userId, user.id)
      ));

    return existingLike.length > 0;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
}