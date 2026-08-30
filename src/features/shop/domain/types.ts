export const PRODUCT_COUNT = 20000;

export const CATEGORIES = [
  'Herbal Supplements', 'Oils & Massage', 'Skin Care', 'Hair Care',
  'Digestive Health', 'Immunity', 'Wellness Teas', 'Personal Care',
] as const;

export const BRANDS = [
  'Amrutam', 'Dabur', 'Patanjali', 'Himalaya', 'Baidyanath',
  'Zandu', 'Organic India', 'Kama Ayurveda', 'Forest Essentials',
] as const;

export const TAGS = [
  'organic', 'vegan', 'gluten-free', 'bestseller', 'new', 'ayurvedic',
  'immunity', 'detox', 'stress-relief', 'sleep', 'energy',
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Brand = (typeof BRANDS)[number];

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  discount: number;
  category: Category;
  rating: number;
  stock: number;
  tags: string[];
  brand: Brand;
  availability: boolean;
  popularity: number;
  createdAt: string;
}

export type SortOption = 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'newest';

export interface ProductFilters {
  search?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  brand?: Brand;
  availabilityOnly?: boolean;
  tags?: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartProductSnapshot {
  productId: string;
  name: string;
  image: string;
  brand?: string;
  category?: string;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  stock: number;
}
