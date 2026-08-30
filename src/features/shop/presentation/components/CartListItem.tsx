import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, QuantityStepper, Text } from '@/design-system/components';
import { FadeInView } from '@/design-system/components/FadeInView';
import { useTheme } from '@/design-system/theme/ThemeContext';
import type { CartProductSnapshot } from '@/features/shop/domain/types';
import { calculateDiscountedPrice, formatCurrency } from '@/core/utils/currency';
import { ItemCountBadge } from '@/shared/components/ItemCountBadge';

interface CartListItemProps {
  item: CartProductSnapshot;
  index?: number;
  onPress: (productId: string) => void;
  onRemove: (productId: string) => void;
  onIncrease: (productId: string, quantity: number) => void;
  onDecrease: (productId: string, quantity: number) => void;
}

export const CartListItem = memo(function CartListItem({
  item,
  index = 0,
  onPress,
  onRemove,
  onIncrease,
  onDecrease,
}: CartListItemProps) {
  const { theme } = useTheme();
  const unitPrice = calculateDiscountedPrice(item.unitPrice, item.discountPercent);
  const lineTotal = unitPrice * item.quantity;
  const lineMrp = item.unitPrice * item.quantity;
  const lineSavings = lineMrp - lineTotal;
  const remainingStock = Math.max(0, item.stock - item.quantity);
  const lowStock = remainingStock > 0 && remainingStock <= 5;

  return (
    <FadeInView delay={Math.min(index * 50, 200)}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Pressable
            style={styles.tapArea}
            onPress={() => onPress(item.productId)}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name}`}
          >
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.image }} style={styles.image} accessibilityLabel={item.name} />
              <ItemCountBadge count={item.quantity} />
            </View>
            <View style={styles.info}>
              {item.brand ? (
                <Text variant="caption" color="muted">{item.brand}</Text>
              ) : null}
              <Text variant="label" numberOfLines={2}>{item.name}</Text>
              {item.category ? (
                <Text variant="caption" color="secondary">{item.category}</Text>
              ) : null}
              <View style={styles.badges}>
                {item.discountPercent > 0 ? (
                  <Badge label={`${item.discountPercent}% off`} variant="gold" />
                ) : null}
                {remainingStock === 0 ? (
                  <Badge label="No stock left" variant="outline" />
                ) : lowStock ? (
                  <Badge label={`Only ${remainingStock} left`} variant="outline" />
                ) : (
                  <Badge label={`${remainingStock} in stock`} variant="outline" />
                )}
              </View>
            </View>
          </Pressable>
          <Button
            title="✕"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(item.productId)}
            accessibilityLabel={`Remove ${item.name}`}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

        <View style={styles.bottomRow}>
          <View style={styles.priceBlock}>
            <Text variant="caption" color="muted">Unit price</Text>
            <View style={styles.priceRow}>
              <Text variant="label" style={{ color: theme.colors.primary }}>
                {formatCurrency(unitPrice)}
              </Text>
              {item.discountPercent > 0 ? (
                <Text variant="caption" color="muted" style={styles.strike}>
                  {formatCurrency(item.unitPrice)}
                </Text>
              ) : null}
            </View>
          </View>
          <QuantityStepper
            value={item.quantity}
            onIncrease={() => onIncrease(item.productId, item.quantity + 1)}
            onDecrease={() => onDecrease(item.productId, item.quantity - 1)}
            max={item.stock}
          />
          <View style={styles.lineTotalBlock}>
            <Text variant="caption" color="muted">Line total</Text>
            <Text variant="h3" style={{ color: theme.colors.primary, fontSize: 17 }}>
              {formatCurrency(lineTotal)}
            </Text>
            {lineSavings > 0 ? (
              <Text variant="caption" style={{ color: theme.colors.success }}>
                Save {formatCurrency(lineSavings)}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    </FadeInView>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: 14, gap: 12, padding: 14 },
  topRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tapArea: { flex: 1, flexDirection: 'row', gap: 12 },
  imageWrap: { position: 'relative' },
  image: { width: 88, height: 88, borderRadius: 14, backgroundColor: '#F0EBE3' },
  info: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  priceBlock: { flex: 1, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strike: { textDecorationLine: 'line-through' },
  lineTotalBlock: { alignItems: 'flex-end', gap: 2, minWidth: 88 },
});
