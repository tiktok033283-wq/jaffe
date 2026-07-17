export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  shippingAddress?: Address;
  joinedDate: string;
  avatarUrl?: string;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "apparel" | "accessories" | "footwear";
  imageUrl: string;
  sizes?: string[];
  colors?: string[];
  stock: number;
  details: string[];
  brandName?: string;
  sellerPhone?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export type OrderStatus = "placed" | "processing" | "shipped" | "out_for_delivery" | "delivered";

export interface TrackingUpdate {
  timestamp: string;
  status: OrderStatus;
  location: string;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod: "stripe" | "sandbox";
  trackingNumber: string;
  trackingUpdates: TrackingUpdate[];
  createdAt: string;
}
