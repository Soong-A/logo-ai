import { pgTable, serial, text, varchar, timestamp, integer, uniqueIndex, index, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 用户资料表
export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  displayName: varchar('display_name', { length: 255 }),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  website: varchar('website', { length: 255 }),
  company: varchar('company', { length: 255 }),
  location: varchar('location', { length: 255 }),
  socialLinks: jsonb('social_links'),
  creditsRemaining: integer('credits_remaining').default(5),
  totalLogosGenerated: integer('total_logos_generated').default(0),
  emailNotifications: boolean('email_notifications').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 积分包表
export const creditPackagesTable = pgTable('credit_packages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  credits: integer('credits').notNull(),
  price: integer('price').notNull(), // 单位：分
  originalPrice: integer('original_price'),
  isPopular: boolean('is_popular').default(false),
  isActive: boolean('is_active').default(true),
  features: jsonb('features'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 订单表
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 100 }).unique().notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  creditPackageId: integer('credit_package_id').notNull().references(() => creditPackagesTable.id),
  credits: integer('credits').notNull(),
  price: integer('price').notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // pending, paid, failed, refunded
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentId: varchar('payment_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Logo 表
export const logosTable = pgTable('logos_table', {
  id: serial('id').primaryKey(),
  image_url: text("image_url").notNull(),
  primary_color: text('primary_color').notNull(),
  background_color: text('background_color').notNull(),
  username: text('username').notNull(),
  userId: text('user_id').notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  style: text('style'),
  companyName: text('company_name'),
  size: text('size'),
  promptText: text('prompt_text'),
  model: varchar('model', { length: 100 }),
  isPublic: boolean('is_public').default(false),
  isFeatured: boolean('is_featured').default(false),
});

// 点赞表
export const likesTable = pgTable('logo_likes', {
  id: serial('id').primaryKey(),
  logoId: integer('logo_id')
    .notNull()
    .references(() => logosTable.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueLike: uniqueIndex('logo_likes_unique').on(table.logoId, table.userId),
  logoIdIdx: index('logo_likes_logo_id_idx').on(table.logoId),
}));

// 积分交易记录表
export const creditTransactionsTable = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  logoId: integer('logo_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 收藏表
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  logoId: integer('logo_id')
    .notNull()
    .references(() => logosTable.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueBookmark: uniqueIndex('bookmarks_unique').on(table.logoId, table.userId),
  logoIdIdx: index('bookmarks_logo_id_idx').on(table.logoId),
}));

// 收藏关系
export const bookmarkRelations = relations(bookmarksTable, ({ one }) => ({
  logo: one(logosTable, {
    fields: [bookmarksTable.logoId],
    references: [logosTable.id],
  }),
  user: one(userProfilesTable, {
    fields: [bookmarksTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
}));

// 购物车表 - 只存储配置信息
export const shoppingCartsTable = pgTable('shopping_carts', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  items: jsonb('items').notNull().default('[]'), // 存储购物车商品配置
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: uniqueIndex('shopping_carts_user_unique').on(table.clerkUserId),
}));

// 3D模型产品配置表
export const modelProductsTable = pgTable('model_products', {
  id: serial('id').primaryKey(),
  modelId: varchar('model_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  basePrice: integer('base_price').notNull().default(9999), // 基础价格（分）
  texturePrice: integer('texture_price').notNull().default(999), // 每个贴图的价格（分）
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3D模型订单表 - 添加退货相关字段
export const modelOrdersTable = pgTable('model_orders', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 100 }).unique().notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  items: jsonb('items').notNull(), // 存储订单商品配置
  totalAmount: integer('total_amount').notNull(), // 单位：分
  itemCount: integer('item_count').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentId: varchar('payment_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  // 退货相关字段
  returnStatus: varchar('return_status', { length: 50 }), // returned, processing, rejected
  returnReason: text('return_reason'),
  returnedAt: timestamp('returned_at'),
  refundAmount: integer('refund_amount').default(0), // 单位：分
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('model_orders_user_idx').on(table.clerkUserId),
  returnStatusIdx: index('model_orders_return_status_idx').on(table.returnStatus),
}));

// 管理员表
export const adminUsersTable = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  role: varchar('role', { length: 50 }).default('admin'), // admin, super_admin, moderator
  permissions: jsonb('permissions').default('[]'),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clerkUserIdIdx: index('admin_users_clerk_user_id_idx').on(table.clerkUserId),
}));

// 关系定义
export const userProfileRelations = relations(userProfilesTable, ({ many }) => ({
  logos: many(logosTable),
  likes: many(likesTable),
  creditTransactions: many(creditTransactionsTable),
  orders: many(ordersTable),
  modelOrders: many(modelOrdersTable),
}));

export const creditPackageRelations = relations(creditPackagesTable, ({ many }) => ({
  orders: many(ordersTable),
}));

export const orderRelations = relations(ordersTable, ({ one }) => ({
  creditPackage: one(creditPackagesTable, {
    fields: [ordersTable.creditPackageId],
    references: [creditPackagesTable.id],
  }),
  user: one(userProfilesTable, {
    fields: [ordersTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
}));

export const logoRelations = relations(logosTable, ({ one, many }) => ({
  user: one(userProfilesTable, {
    fields: [logosTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
  likes: many(likesTable),
  creditTransaction: one(creditTransactionsTable, {
    fields: [logosTable.id],
    references: [creditTransactionsTable.logoId],
  }),
}));

export const likeRelations = relations(likesTable, ({ one }) => ({
  logo: one(logosTable, {
    fields: [likesTable.logoId],
    references: [logosTable.id],
  }),
  user: one(userProfilesTable, {
    fields: [likesTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
}));

export const creditTransactionRelations = relations(creditTransactionsTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [creditTransactionsTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
  logo: one(logosTable, {
    fields: [creditTransactionsTable.logoId],
    references: [logosTable.id],
  }),
}));

export const shoppingCartRelations = relations(shoppingCartsTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [shoppingCartsTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
}));

export const modelOrderRelations = relations(modelOrdersTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [modelOrdersTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
}));

export const adminUserRelations = relations(adminUsersTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [adminUsersTable.clerkUserId],
    references: [userProfilesTable.clerkUserId],
  }),
}));

// 退货状态枚举类型
export const RETURN_STATUS = {
  RETURNED: 'returned',
  PROCESSING: 'processing',
  REJECTED: 'rejected',
  REQUESTED: 'requested'
} as const;

export type ReturnStatus = typeof RETURN_STATUS[keyof typeof RETURN_STATUS];

export interface CartItem {
  id: string;
  modelId: string;
  modelName: string;
  textureCount: number;
  quantity: number;
  unitPrice: number; // 单位：分
  totalPrice: number; // 单位：分
  thumbnail?: string;
  createdAt: Date;
}

// 类型推断
export type InsertShoppingCart = typeof shoppingCartsTable.$inferInsert;
export type SelectShoppingCart = typeof shoppingCartsTable.$inferSelect;
export type InsertModelProduct = typeof modelProductsTable.$inferInsert;
export type SelectModelProduct = typeof modelProductsTable.$inferSelect;
export type InsertModelOrder = typeof modelOrdersTable.$inferInsert;
export type SelectModelOrder = typeof modelOrdersTable.$inferSelect;
export type InsertLogo = typeof logosTable.$inferInsert;
export type SelectLogo = typeof logosTable.$inferSelect;
export type InsertLike = typeof likesTable.$inferInsert;
export type SelectLike = typeof likesTable.$inferSelect;
export type InsertUserProfile = typeof userProfilesTable.$inferInsert;
export type SelectUserProfile = typeof userProfilesTable.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactionsTable.$inferInsert;
export type SelectCreditTransaction = typeof creditTransactionsTable.$inferSelect;
export type InsertCreditPackage = typeof creditPackagesTable.$inferInsert;
export type SelectCreditPackage = typeof creditPackagesTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
export type SelectOrder = typeof ordersTable.$inferSelect;
export type InsertBookmark = typeof bookmarksTable.$inferInsert;
export type SelectBookmark = typeof bookmarksTable.$inferSelect;
export type InsertAdminUser = typeof adminUsersTable.$inferInsert;
export type SelectAdminUser = typeof adminUsersTable.$inferSelect;