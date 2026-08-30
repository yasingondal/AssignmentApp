import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Badge, Card, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme/ThemeContext';
import type { Product } from '@/features/shop/domain/types';
import { formatCurrency, calculateDiscountedPrice } from '@/core/utils/currency';
import { useCartStore } from '@/features/shop/data/cartStore';
import { ItemCountBadge } from '@/shared/components/ItemCountBadge';

interface ProductListItemProps {
  product: Product;
  onPress: (productId: string) => void;
  index?: number;
}

/** Memoized row; cart qty via narrow Zustand selector for efficient updates. */
export const ProductListItem = memo(function ProductListItem({ product, onPress }: ProductListItemProps) {
  const { theme } = useTheme();
  const cartQuantity = useCartStore(
    s => s.items.find(i => i.productId === product.id)?.quantity ?? 0,
  );
  const remainingStock = Math.max(0, product.stock - cartQuantity);
  const price = calculateDiscountedPrice(product.price, product.discount);

  return (
    <Card
      onPress={() => onPress(product.id)}
      style={styles.card}
      accessibilityLabel={`${product.name}, ${product.brand}, ${formatCurrency(price)}${cartQuantity ? `, ${cartQuantity} in cart` : ''}`}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} accessibilityLabel={product.name} />
        <ItemCountBadge count={cartQuantity} />
      </View>
      <View style={styles.info}>
        <Text variant="caption" color="muted">{product.brand}</Text>
        <Text variant="label" numberOfLines={2}>{product.name}</Text>
        <View style={styles.row}>
          <Text variant="h3" style={{ color: theme.colors.primary, fontSize: 17 }}>
            {formatCurrency(price)}
          </Text>
          {product.discount > 0 && (
            <Text variant="caption" color="muted" style={styles.strike}>
              {formatCurrency(product.price)}
            </Text>
          )}
        </View>
        <View style={styles.tags}>
          <Badge label={`★ ${product.rating.toFixed(1)}`} variant="gold" />
          {product.discount > 0 && <Badge label={`${product.discount}% off`} variant="outline" />}
          {product.availability && remainingStock > 0 ? (
            <Badge
              label={remainingStock <= 5 ? `Only ${remainingStock} left` : `${remainingStock} in stock`}
              variant="outline"
            />
          ) : null}
        </View>
        {(!product.availability || remainingStock === 0) && (
          <Text variant="caption" color="error">Out of stock</Text>
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { flexDirection: 'row', marginBottom: 12, gap: 14, padding: 12 },
  imageWrap: { position: 'relative' },
  image: { width: 88, height: 88, borderRadius: 14, backgroundColor: '#F0EBE3' },
  info: { flex: 1, gap: 4, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  strike: { textDecorationLine: 'line-through' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
