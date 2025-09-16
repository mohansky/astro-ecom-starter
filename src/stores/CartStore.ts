// src/stores/CartStore.ts
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent'

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  weight: number; // weight in grams
  gstPercentage: number;
  taxInclusive: boolean;
  image?: string;
}

// Load initial cart from localStorage
let initialCart: CartItem[] = [];
if (typeof window !== 'undefined' && localStorage.getItem('cart')) {
  try {
    initialCart = JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.error('Failed to parse cart from localStorage', e);
  }
}

// Create an atom store with the initial cart data
// export const cartItems = atom<CartItem[]>(initialCart);

// // Save cart to localStorage whenever it changes
// if (typeof window !== 'undefined') {
//   cartItems.listen((items) => {
//     localStorage.setItem('cart', JSON.stringify(items));
//   });
// }

// Create a persistent atom with 'cart' as the storage key
export const cartItems = persistentAtom<CartItem[]>('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Helper function to ensure we always get an array
function getCartItems(): CartItem[] {
  const items = cartItems.get();
  return Array.isArray(items) ? items : [];
}

// Add item to cart
export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const currentItems = getCartItems();
  const existingItem = currentItems.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    // Increase quantity if item already exists
    const updatedItems = currentItems.map(cartItem => 
      cartItem.id === item.id 
        ? { ...cartItem, quantity: cartItem.quantity + 1 } 
        : cartItem
    );
    cartItems.set(updatedItems);
  } else {
    // Add new item with quantity 1
    cartItems.set([...currentItems, { ...item, quantity: 1 }]);
  }
}

// Remove item from cart
export function removeFromCart(id: string) {
  const currentItems = getCartItems();
  const updatedItems = currentItems.filter(item => item.id !== id);
  cartItems.set(updatedItems);
}

// Update item quantity
export function updateQuantity(id: string, quantity: number) {
  if (quantity < 1) return;
  
  const currentItems = getCartItems();
  const updatedItems = currentItems.map(item => 
    item.id === id ? { ...item, quantity } : item
  );
  cartItems.set(updatedItems);
}

// Calculate cart subtotal (price only, no shipping/tax)
export function getCartTotal(): number {
  return getCartItems().reduce(
    (total, item) => total + item.price * item.quantity, 
    0
  );
}

// Get cart item count
export function getCartCount(): number {
  return getCartItems().reduce(
    (count, item) => count + item.quantity, 
    0
  );
}

// Clear the cart
export function clearCart() {
  cartItems.set([]);
}

// Legacy functions - keeping for compatibility but recommending cart-utils.ts
// Calculate total weight in kilograms
export function getTotalWeight(): number {
  const totalGrams = getCartItems().reduce(
    (total, item) => total + (item.weight * item.quantity), 
    0
  );
  // Convert grams to kilograms
  return totalGrams / 1000;
}

// Calculate shipping cost (₹100 per kg)
export function getShippingCost(): number {
  const weightKg = getTotalWeight();
  // Round up to nearest kg for shipping calculation
  const shippingWeight = Math.ceil(weightKg);
  return shippingWeight * 100; // ₹100 per kg
}

// Calculate tax for individual item
function calculateItemTax(item: CartItem): number {
  if (item.taxInclusive) {
    // Tax is already included in the price, extract it
    const taxMultiplier = item.gstPercentage / 100;
    return (item.price * item.quantity * taxMultiplier) / (1 + taxMultiplier);
  } else {
    // Tax needs to be added to the price
    return item.price * item.quantity * (item.gstPercentage / 100);
  }
}

// Calculate total tax for cart
export function getCartTax(): number {
  const items = getCartItems();
  return items.reduce((total, item) => total + calculateItemTax(item), 0);
}

// Calculate subtotal (excluding tax for tax-inclusive items, including tax for others)
export function getCartSubtotal(): number {
  const items = getCartItems();
  return items.reduce((total, item) => {
    if (item.taxInclusive) {
      // Remove tax from the price to get the base price
      const taxMultiplier = item.gstPercentage / 100;
      const basePrice = item.price / (1 + taxMultiplier);
      return total + (basePrice * item.quantity);
    } else {
      // Price doesn't include tax
      return total + (item.price * item.quantity);
    }
  }, 0);
}

// Calculate cart total including shipping and tax
export function getCartTotalWithShipping(): number {
  const subtotal = getCartSubtotal();
  const shipping = getShippingCost();
  const tax = getCartTax();
  return subtotal + shipping + tax;
}


