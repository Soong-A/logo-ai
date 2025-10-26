// lib/cart.ts

export interface CartItem {
  id: string;
  modelId: string;
  modelName: string;
  basePrice: number;
  texturePrice: number;
  textureCount: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnail?: string;
  textures: Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
    size: [number, number, number];
  }>;
  createdAt: Date;
}

export interface AddToCartParams {
  modelId: string;
  modelName: string;
  basePrice: number;
  texturePrice: number;
  textures: Array<{
    id: string;
    url: string;
    position: [number, number, number];
    normal: [number, number, number];
    size: [number, number, number];
  }>;
  quantity: number;
  thumbnail?: string;
}

// 计算商品价格
export function calculateItemPrice(basePrice: number, texturePrice: number, textureCount: number): number {
  return basePrice + (textureCount * texturePrice);
}

// 直接调用 API 添加到购物车
export async function addToCart(item: AddToCartParams): Promise<boolean> {
  try {
    const totalPrice = calculateItemPrice(item.basePrice, item.texturePrice, item.textures.length);
    
    const cartItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId: item.modelId,
      modelName: item.modelName,
      basePrice: item.basePrice,
      texturePrice: item.texturePrice,
      textureCount: item.textures.length,
      quantity: item.quantity,
      unitPrice: totalPrice,
      totalPrice: totalPrice * item.quantity,
      textures: item.textures,
      thumbnail: item.thumbnail,
      createdAt: new Date()
    };

    // 从数据库获取当前购物车
    const response = await fetch('/api/cart');
    const data = await response.json();
    
    let currentItems: CartItem[] = [];
    if (data.success && data.cart) {
      currentItems = data.cart.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    }

    // 检查是否已存在相同配置的商品
    const existingItemIndex = currentItems.findIndex(cartItem => 
      cartItem.modelId === item.modelId && 
      JSON.stringify(cartItem.textures) === JSON.stringify(item.textures)
    );

    if (existingItemIndex > -1) {
      // 更新数量
      currentItems[existingItemIndex].quantity += item.quantity;
      currentItems[existingItemIndex].totalPrice = currentItems[existingItemIndex].unitPrice * currentItems[existingItemIndex].quantity;
    } else {
      // 添加新商品
      currentItems.push(cartItem);
    }

    // 更新数据库
    const updateResponse = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: currentItems }),
    });

    const updateData = await updateResponse.json();
    
    if (updateData.success) {
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    } else {
      throw new Error(updateData.error || '更新购物车失败');
    }
  } catch (error) {
    console.error('添加到购物车失败:', error);
    throw error;
  }
}

// 从数据库获取购物车商品
export async function getCartItems(): Promise<CartItem[]> {
  try {
    const response = await fetch('/api/cart');
    
    if (!response.ok) {
      throw new Error('获取购物车失败');
    }

    const data = await response.json();
    
    if (data.success && data.cart) {
      return data.cart.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('获取购物车失败:', error);
    return [];
  }
}

// 获取购物车商品数量
export async function getCartItemsCount(): Promise<number> {
  const items = await getCartItems();
  return items.reduce((total, item) => total + item.quantity, 0);
}

// 更新购物车商品数量
export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<boolean> {
  try {
    if (quantity < 1) {
      return await removeFromCart(itemId);
    }

    const items = await getCartItems();
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
      items[itemIndex].quantity = quantity;
      items[itemIndex].totalPrice = items[itemIndex].unitPrice * quantity;
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();
      
      if (data.success) {
        window.dispatchEvent(new Event('cartUpdated'));
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('更新商品数量失败:', error);
    return false;
  }
}

// 从购物车移除商品
export async function removeFromCart(itemId: string): Promise<boolean> {
  try {
    const items = await getCartItems();
    const filteredItems = items.filter(item => item.id !== itemId);
    
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: filteredItems }),
    });

    const data = await response.json();
    
    if (data.success) {
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('移除商品失败:', error);
    return false;
  }
}

// 清空购物车
export async function clearCart(): Promise<boolean> {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: [] }),
    });

    const data = await response.json();
    
    if (data.success) {
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('清空购物车失败:', error);
    return false;
  }
}

// 计算购物车总价
export async function getCartTotal(): Promise<number> {
  const items = await getCartItems();
  return items.reduce((total, item) => total + item.totalPrice, 0);
}