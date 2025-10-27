// lib/clerk-utils.ts
import { clerkClient } from '@clerk/nextjs/server';

export interface ClerkUserData {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  imageUrl: string | null;
  primaryEmail: string | null;
  createdAt: Date | null;
}

export async function getClerkUserData(clerkUserId: string): Promise<ClerkUserData | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    
    // 提取主要邮箱
    const primaryEmail = user.primaryEmailAddressId 
      ? user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
      : user.emailAddresses[0]?.emailAddress;

    return {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '未知用户',
      imageUrl: user.imageUrl,
      primaryEmail: primaryEmail || null,
      createdAt: user.createdAt ? new Date(user.createdAt) : null,
    };
  } catch (error) {
    console.error(`Error fetching Clerk user data for ${clerkUserId}:`, error);
    return null;
  }
}

export async function getClerkUsersData(clerkUserIds: string[]): Promise<Map<string, ClerkUserData>> {
  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      userId: clerkUserIds,
      limit: 100
    });

    const userMap = new Map<string, ClerkUserData>();
    
    users.data.forEach(user => {
      const primaryEmail = user.primaryEmailAddressId 
        ? user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
        : user.emailAddresses[0]?.emailAddress;

      userMap.set(user.id, {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '未知用户',
        imageUrl: user.imageUrl,
        primaryEmail: primaryEmail || null,
        createdAt: user.createdAt ? new Date(user.createdAt) : null,
      });
    });

    return userMap;
  } catch (error) {
    console.error('Error fetching Clerk users data:', error);
    return new Map();
  }
}