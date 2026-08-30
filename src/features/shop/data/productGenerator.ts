import {
  createSeededRandom,
  pick,
  pickN,
  randomInt,
} from '@/core/utils/seededRandom';
import {
  BRANDS,
  CATEGORIES,
  PRODUCT_COUNT,
  TAGS,
  type Brand,
  type Category,
  type Product,
} from '@/features/shop/domain/types';

const PRODUCT_NAMES = [
  'Ashwagandha', 'Triphala', 'Brahmi', 'Turmeric', 'Neem', 'Amla',
  'Shatavari', 'Guduchi', 'Tulsi', 'Arjuna', 'Shilajit', 'Chyawanprash',
  'Kumkumadi', 'Kesh King', 'Liv 52', 'Stresscom', 'Immunity Boost',
];

const productCache = new Map<number, Product>();

export function generateProduct(index: number): Product {
  if (productCache.has(index)) {
    return productCache.get(index)!;
  }

  const rng = createSeededRandom(index * 3571 + 17);
  const baseName = pick(rng, PRODUCT_NAMES);
  const category = pick(rng, CATEGORIES) as Category;
  const brand = pick(rng, BRANDS) as Brand;
  const price = randomInt(rng, 99, 4999);
  const discount = randomInt(rng, 0, 40);
  const ratingSlot = ((index * 7919) >>> 0) % PRODUCT_COUNT;
  const rating =
    ratingSlot < 41
      ? Number((5 - ratingSlot * 0.1).toFixed(1))
      : Number((1 + Math.floor(rng() * 36) / 10).toFixed(1));
  const stock = randomInt(rng, 0, 200);
  const numTags = randomInt(rng, 1, 4);
  const tags = pickN(rng, TAGS, numTags);
  const daysAgo = randomInt(rng, 1, 365);
  const createdAt = new Date(Date.UTC(2025, 5, 15, 12, 0, 0) - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const product: Product = {
    id: `prod-${index}`,
    name: `${brand} ${baseName} ${category.split(' ')[0]}`,
    description: `Premium Ayurvedic ${baseName} formulation for ${category.toLowerCase()}. Made with natural ingredients following traditional recipes.`,
    image: `https://picsum.photos/seed/prod${index}/400/400`,
    price,
    discount,
    category,
    rating,
    stock,
    tags,
    brand,
    availability: stock > 0,
    popularity: randomInt(rng, 1, 10000),
    createdAt,
  };

  productCache.set(index, product);
  return product;
}

export function getAllProductIndices(): number[] {
  return Array.from({ length: PRODUCT_COUNT }, (_, i) => i + 1);
}

export function getProductById(id: string): Product | undefined {
  const match = id.match(/^prod-(\d+)$/);
  if (!match) {
    return undefined;
  }
  const index = parseInt(match[1]!, 10);
  if (index < 1 || index > PRODUCT_COUNT) {
    return undefined;
  }
  return generateProduct(index);
}
