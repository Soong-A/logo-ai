// import { pgTable, serial, text, timestamp,  boolean, foreignKey} from 'drizzle-orm/pg-core';


// export const logosTable = pgTable('logos_table', {
//   id: serial('id').primaryKey(),
//   image_url: text('link').notNull(),
//   primary_color: text('primary_color').notNull(),
//   background_color: text('background_color').notNull(),
//   username: text('username').notNull(),
//   userId: text('user_id').notNull(),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
  
// });

// // 1. 点赞表（记录用户对 logo 的点赞）
// export const likesTable = pgTable("likes", {
//   id: text("id").primaryKey(), // 唯一 ID
//   logoId: text("logo_id")
//     .notNull()
//     .references(() => logosTable.id, { onDelete: "cascade" }), // 关联 logo
//   userId: text("user_id").notNull(), // 点赞用户（Clerk 用户 ID）
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });

// // 2. 收藏表（记录用户收藏的 logo）
// export const favoritesTable = pgTable("favorites", {
//   id: text("id").primaryKey(),
//   logoId: text("logo_id")
//     .notNull()
//     .references(() => logosTable.id, { onDelete: "cascade" }),
//   userId: text("user_id").notNull(), // 收藏用户
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });

// export type InsertLogo = typeof logosTable.$inferInsert;
// export type SelectLogo = typeof logosTable.$inferSelect;

import { pgTable, serial, text, timestamp, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const logosTable = pgTable('logos_table', {
  id: serial('id').primaryKey(),
  image_url: text('link').notNull(),
  primary_color: text('primary_color').notNull(),
  background_color: text('background_color').notNull(),
  username: text('username').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  style: text('style'),
  companyName: text('company_name'),
  size: text('size'),
  // model: validatedData.model, // 记录使用的模型
  // text_accuracy: 0, // 可以后期人工评估添加
  // style_match: 0,   // 可以后期人工评估添加
});

// 点赞表
export const likesTable = pgTable('logo_likes', {
  id: serial('id').primaryKey(),
  logoId: integer('logo_id')
    .notNull()
    .references(() => logosTable.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueLike: uniqueIndex('logo_likes_unique').on(table.logoId, table.userId),
  logoIdIdx: index('logo_likes_logo_id_idx').on(table.logoId),
}));

// 关系定义
export const logoRelations = relations(logosTable, ({ many }) => ({
  likes: many(likesTable),
}));

export const likeRelations = relations(likesTable, ({ one }) => ({
  logo: one(logosTable, {
    fields: [likesTable.logoId],
    references: [logosTable.id],
  }),
}));

export type InsertLogo = typeof logosTable.$inferInsert;
export type SelectLogo = typeof logosTable.$inferSelect;
export type InsertLike = typeof likesTable.$inferInsert;
export type SelectLike = typeof likesTable.$inferSelect;