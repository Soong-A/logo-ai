'use server';

import { z } from 'zod';
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { InsertLogo, logosTable, likesTable, userProfilesTable, creditTransactionsTable } from '@/db/schema';
import { db } from '@/db';
import { eq, desc, and, count } from 'drizzle-orm';
import { rateLimit } from '@/lib/upstash';
import sharp from 'sharp';

// 表单验证 schema
const FormSchema = z.object({
  concept: z.string().min(1, "创意概念是必需的"),
  style: z.string().min(1, "风格是必需的"),
  mood: z.string().optional(),
  elements: z.string().optional(),
  colorPalette: z.string().optional(),
  composition: z.string().optional(),
  model: z.enum(["flux-kontext-pro"]).default("flux-kontext-pro"),
  size: z.enum(['256x256','512x512','1024x1024']).default('512x512'),
  quality: z.enum(['standard', 'hd']).default('standard'),
});

// 风格映射
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

// 情绪映射
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

// 检查用户积分
async function checkUserCredits(userId: string) {
  try {
    const [userProfile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.clerkUserId, userId));

    if (!userProfile) {
      // 如果用户资料不存在，创建默认资料
      await db.insert(userProfilesTable).values({
        clerkUserId: userId,
        creditsRemaining: 5,
        totalLogosGenerated: 0,
      });
      return { success: true, creditsRemaining: 5, hasCredits: true };
    }
// 修复：确保 creditsRemaining 不是 null
    const creditsRemaining = userProfile.creditsRemaining ?? 5;
     return { 
      success: true, 
      creditsRemaining: creditsRemaining,
      hasCredits: creditsRemaining > 0
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { success: false, error: '检查积分时发生错误' };
  }
}

// 扣除积分
async function deductCredits(userId: string, logoId?: number) {
  try {
    const [userProfile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.clerkUserId, userId));

    if (!userProfile) {
      throw new Error('用户资料不存在');
    }


    // 修复：确保 creditsRemaining 不是 null
    const currentCredits = userProfile.creditsRemaining ?? 0;
    
    if (currentCredits <= 0) {
      throw new Error('积分不足');
    }

    const newBalance = currentCredits - 1;

    await db.transaction(async (tx) => {
      // 更新用户积分
      await tx
        .update(userProfilesTable)
        .set({
          creditsRemaining: newBalance,
          totalLogosGenerated: (userProfile.totalLogosGenerated ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(userProfilesTable.clerkUserId, userId));

      // 记录积分交易
      await tx.insert(creditTransactionsTable).values({
        clerkUserId: userId,
        transactionType: 'generate_logo',
        amount: -1,
        balanceAfter: newBalance,
        logoId: logoId,
        description: '生成Logo消费',
      });
    });

    return newBalance;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

// 优化的图片处理函数
async function convertToPermanentStorage(tempUrl: string): Promise<string> {
  try {
    console.log("开始下载和优化图片...");
    
    // 下载图片
    const response = await fetch(tempUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch temporary image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 使用 Sharp 进行优化
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 80,
        progressive: true
      })
      .toBuffer();
    
    console.log(`图片优化完成: 原始 ${buffer.length} bytes → 优化后 ${optimizedBuffer.length} bytes`);
    
    // 转换为 Data URL
    const base64 = optimizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
    
  } catch (error) {
    console.error('图片处理失败:', error);
    return createOptimizedFallbackImage();
  }
}

// 优化的备选图片
function createOptimizedFallbackImage(): string {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="36" fill="white" font-weight="bold">LOGO</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// 构建提示词
function buildPrompt(validatedData: z.infer<typeof FormSchema>): string {
  let promptParts: string[] = [];
  
  promptParts.push(`Create a unique and memorable logo design for: ${validatedData.concept}`);
  
  if (validatedData.style) {
    const styleDescription = styleLookup[validatedData.style] || validatedData.style;
    promptParts.push(`Style: ${styleDescription}`);
  }
  
  if (validatedData.mood) {
    const moodDescription = moodLookup[validatedData.mood] || validatedData.mood;
    promptParts.push(`Mood: ${moodDescription}`);
  }
  
  if (validatedData.elements) {
    promptParts.push(`Incorporate elements like: ${validatedData.elements}`);
  }
  
  if (validatedData.colorPalette) {
    promptParts.push(`Color palette: ${validatedData.colorPalette}`);
  }
  
  if (validatedData.composition) {
    promptParts.push(`Composition: ${validatedData.composition}`);
  }
  
  promptParts.push("High quality professional logo design, vector style, suitable for branding, clean composition, balanced, visually striking");
  
  return promptParts.join(". ") + ".";
}

// 提交到 Flux API
async function submitToFluxAPI(prompt: string, size: string): Promise<string> {
  const aspectRatio = '1:1';
  const submitResponse = await fetch("https://api.fluxapi.ai/api/v1/flux/kontext/generate", {
    method: 'POST',
    headers: {
      "Authorization": "Bearer d6e167fec1a5ecd6c9b5b1d5ce2efe4b",
      "Content-Type": "application/json"
    },
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

  return submitResult.data.taskId;
}

// 轮询图片生成状态
async function pollForImage(taskId: string): Promise<string> {
  const maxWaitTime = 300000;
  const checkInterval = 3000;
  const startTime = Date.now();
  let imageUrl: string | null = null;

  while (Date.now() - startTime < maxWaitTime) {
    const checkUrl = `https://api.fluxapi.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`;
    const checkResponse = await fetch(checkUrl, { 
      headers: {
        "Authorization": "Bearer d6e167fec1a5ecd6c9b5b1d5ce2efe4b"
      }
    });
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

  return imageUrl;
}

// 主生成函数 - 修复后的版本
export async function generateLogo(formData: z.infer<typeof FormSchema>) {
  'use server';
  
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 检查积分
    const creditCheck = await checkUserCredits(user.id);
    if (!creditCheck.success) {
      return creditCheck;
    }

    if (!creditCheck.hasCredits) {
      return { 
        success: false, 
        error: '积分不足，请升级订阅计划',
        needsSubscription: true
      };
    }

    const validatedData = FormSchema.parse(formData);
    
    const prompt = buildPrompt(validatedData);
    console.log("Generated prompt:", prompt);

    const taskId = await submitToFluxAPI(prompt, validatedData.size);
    console.log(`Task submitted with ID: ${taskId}`);

    const imageUrl = await pollForImage(taskId);

    if (!imageUrl) {
      throw new Error('Image generation timed out');
    }

    console.log("获取到临时图片URL，开始转换为永久存储...");
    
    const permanentImageData = await convertToPermanentStorage(imageUrl);
    
    console.log("✅ 图片优化完成，准备存储到数据库");

    // 修复：添加所有必需的字段，包括 clerkUserId
   const DatabaseData: InsertLogo = {
      image_url: permanentImageData,
      primary_color: validatedData.colorPalette || '',
      background_color: '',
      username: user.username ?? user.firstName ?? 'Anonymous',
      userId: user.id,
      clerkUserId: user.id, // 新增的必需字段
      style: validatedData.style,
      companyName: validatedData.concept,
      size: validatedData.size,
      promptText: prompt, // 新增字段
      model: validatedData.model, // 新增字段
    };

    // 插入 Logo 记录并获取返回的 ID
    const [newLogo] = await db.insert(logosTable).values(DatabaseData).returning();
    console.log("✅ 优化后的图片数据已保存到数据库");

    // 扣除积分
    const newBalance = await deductCredits(user.id, newLogo.id);

    return { 
      success: true, 
      url: permanentImageData,
      creditsRemaining: newBalance
    };
  } catch (error) {
    console.error('Error generating logo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate logo' };
  }
}

// 优化的历史记录查询 - 修复后的版本
export async function checkHistory() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // 使用 clerkUserId 而不是 userId 进行查询
    const userLogos = await db
      .select({
        id: logosTable.id,
        companyName: logosTable.companyName,
        style: logosTable.style,
        primary_color: logosTable.primary_color,
        createdAt: logosTable.createdAt,
        image_url: logosTable.image_url,
        background_color: logosTable.background_color,
        username: logosTable.username,
        userId: logosTable.userId,
        size: logosTable.size,
      })
      .from(logosTable)
      .where(eq(logosTable.clerkUserId, user.id)) // 改为使用 clerkUserId
      .orderBy(desc(logosTable.createdAt))
      .limit(50);

    return userLogos;
  } catch (error) {
    console.error('Error fetching user logos:', error);
    return null;
  }
}

// 单独获取图片数据
export async function getLogoImageData(logoId: number) {
  try {
    const logo = await db
      .select({
        image_url: logosTable.image_url,
      })
      .from(logosTable)
      .where(eq(logosTable.id, logoId));

    return logo[0]?.image_url || null;
  } catch (error) {
    console.error('获取图片数据失败:', error);
    return null;
  }
}

// 其他辅助函数保持不变
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

// 修复 toggleLike 函数
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
      // 修复：添加 clerkUserId 字段
      await db
        .insert(likesTable)
        .values({
          logoId,
          userId: user.id,
          clerkUserId: user.id, // 新增的必需字段
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
