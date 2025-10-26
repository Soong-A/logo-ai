



// // 获取所有 Logo 数据及其点赞数
// export async function getAllLogosWithLikes() {
//   try {
//     const logos = await db
//       .select({
//         id: logosTable.id,
//         image_url: logosTable.image_url,
//         primary_color: logosTable.primary_color,
//         background_color: logosTable.background_color,
//         username: logosTable.username,
//         style: logosTable.style,
//         companyName: logosTable.companyName,
//         size: logosTable.size,
//         createdAt: logosTable.createdAt,
//         likeCount: sql<number>`(
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         )`
//       })
//       .from(logosTable)
//       .orderBy(desc(sql`likeCount`));

//     return logos;
//   } catch (error) {
//     console.error("获取 Logo 数据错误:", error);
//     return [];
//   }
// }

// // 获取最受欢迎的颜色分析
// export async function getPopularColors() {
//   try {
//     // 获取主要颜色分析
//     const primaryColors = await db
//       .select({
//         color: logosTable.primary_color,
//         count: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .groupBy(logosTable.primary_color)
//       .orderBy(desc(sql`totalLikes`))
//       .limit(10);

//     // 获取背景颜色分析
//     const backgroundColors = await db
//       .select({
//         color: logosTable.background_color,
//         count: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .groupBy(logosTable.background_color)
//       .orderBy(desc(sql`totalLikes`))
//       .limit(10);

//     return {
//       primaryColors,
//       backgroundColors
//     };
//   } catch (error) {
//     console.error("获取颜色分析错误:", error);
//     return { primaryColors: [], backgroundColors: [] };
//   }
// }

// // 获取最受欢迎的类别分析
// export async function getPopularStyles() {
//   try {
//     const styles = await db
//       .select({
//         style: logosTable.style,
//         count: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`,
//         avgLikes: sql<number>`AVG((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .where(sql`${logosTable.style} IS NOT NULL`)
//       .groupBy(logosTable.style)
//       .orderBy(desc(sql`totalLikes`));

//     return styles;
//   } catch (error) {
//     console.error("获取类别分析错误:", error);
//     return [];
//   }
// }

// // 获取最受欢迎的尺寸分析
// export async function getPopularSizes() {
//   try {
//     const sizes = await db
//       .select({
//         size: logosTable.size,
//         count: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`,
//         avgLikes: sql<number>`AVG((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .where(sql`${logosTable.size} IS NOT NULL`)
//       .groupBy(logosTable.size)
//       .orderBy(desc(sql`totalLikes`));

//     return sizes;
//   } catch (error) {
//     console.error("获取尺寸分析错误:", error);
//     return [];
//   }
// }

// // 获取最受欢迎的用户（创建最多或获得最多点赞）
// export async function getTopUsers() {
//   try {
//     const usersByCreation = await db
//       .select({
//         username: logosTable.username,
//         logoCount: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .groupBy(logosTable.username)
//       .orderBy(desc(sql`logoCount`))
//       .limit(10);

//     const usersByLikes = await db
//       .select({
//         username: logosTable.username,
//         logoCount: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .groupBy(logosTable.username)
//       .orderBy(desc(sql`totalLikes`))
//       .limit(10);

//     return {
//       byCreation: usersByCreation,
//       byLikes: usersByLikes
//     };
//   } catch (error) {
//     console.error("获取用户分析错误:", error);
//     return { byCreation: [], byLikes: [] };
//   }
// }

// // 获取时间趋势分析
// export async function getTimeTrends() {
//   try {
//     const dailyTrends = await db
//       .select({
//         date: sql<string>`DATE(${logosTable.createdAt})`,
//         count: count(),
//         totalLikes: sql<number>`SUM((
//           SELECT COUNT(*) 
//           FROM logo_likes 
//           WHERE logo_likes.logo_id = logos_table.id
//         ))`
//       })
//       .from(logosTable)
//       .groupBy(sql`DATE(${logosTable.createdAt})`)
//       .orderBy(desc(sql`DATE(${logosTable.createdAt})`))
//       .limit(30);

//     return dailyTrends;
//   } catch (error) {
//     console.error("获取时间趋势错误:", error);
//     return [];
//   }
// }