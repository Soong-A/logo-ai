// lib/cart-db.ts
import { db } from '@/db';
import { shoppingCartsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { CartItem } from './cart';

export async function getServerCart(userId: string): Promise<CartItem[]> {
  const carts = await db
    .select()
    .from(shoppingCartsTable)
    .where(eq(shoppingCartsTable.clerkUserId, userId));

  if (carts.length === 0) {
    return [];
  }

  return carts[0].items as CartItem[];
}

export async function updateServerCart(userId: string, items: CartItem[]): Promise<void> {
  const carts = await db
    .select()
    .from(shoppingCartsTable)
    .where(eq(shoppingCartsTable.clerkUserId, userId));

  if (carts.length > 0) {
    await db
      .update(shoppingCartsTable)
      .set({ 
        items: items,
        updatedAt: new Date()
      })
      .where(eq(shoppingCartsTable.clerkUserId, userId));
  } else {
    await db
      .insert(shoppingCartsTable)
      .values({
        clerkUserId: userId,
        items: items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  }
}

export async function clearServerCart(userId: string): Promise<void> {
  await db
    .update(shoppingCartsTable)
    .set({ 
      items: [],
      updatedAt: new Date()
    })
    .where(eq(shoppingCartsTable.clerkUserId, userId));
}