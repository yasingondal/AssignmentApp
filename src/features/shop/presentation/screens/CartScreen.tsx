import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Text, Button, Card, EmptyState, Loader, ScreenContainer, ScreenHeader, Badge,
} from '@/design-system/components';
import { useCartStore } from '@/features/shop/data/cartStore';
import type { ShopStackParamList } from '@/app/navigation/types';
import { formatCurrency } from '@/core/utils/currency';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { CartListItem } from '@/features/shop/presentation/components/CartListItem';
import type { CartProductSnapshot } from '@/features/shop/domain/types';

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const { theme } = useTheme();
  const items = useCartStore(s => s.items);
  const hasHydrated = useCartStore(s => s.hasHydrated);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const removeItem = useCartStore(s => s.removeItem);
  const getTotals = useCartStore(s => s.getTotals);
  const networkStatus = useNetworkStatus();
  const totals = getTotals();

  const uniqueProducts = items.length;
  const estimatedDelivery = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: CartProductSnapshot; index: number }) => (
      <CartListItem
        item={item}
        index={index}
        onPress={productId => navigation.navigate('ProductDetail', { productId })}
        onRemove={removeItem}
        onIncrease={updateQuantity}
        onDecrease={updateQuantity}
      />
    ),
    [navigation, removeItem, updateQuantity],
  );

  const listHeader = useMemo(
    () => (
      <Card style={[styles.summaryCard, { borderColor: theme.colors.borderLight }]}>
        <View style={styles.summaryRow}>
          <View>
            <Text variant="label">Order summary</Text>
            <Text variant="bodySmall" color="secondary">
              {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} · {uniqueProducts} product{uniqueProducts === 1 ? '' : 's'}
            </Text>
          </View>
          {totals.discount > 0 ? (
            <Badge label={`Saving ${formatCurrency(totals.discount)}`} variant="gold" />
          ) : null}
        </View>
        <View style={[styles.deliveryRow, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Text variant="caption" color="secondary">🚚 Free Ayurvedic delivery</Text>
          <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            Est. by {estimatedDelivery}
          </Text>
        </View>
      </Card>
    ),
    [theme, totals, uniqueProducts, estimatedDelivery],
  );

  if (!hasHydrated) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader
          title="My Cart"
          subtitle="Loading your cart"
          onBack={() => navigation.goBack()}
        />
        <Loader message="Restoring cart..." />
      </ScreenContainer>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader
          title="My Cart"
          subtitle="Your wellness picks"
          onBack={() => navigation.goBack()}
        />
        <EmptyState
          title="Your cart is empty"
          message="Discover authentic Ayurvedic oils, supplements, and wellness essentials."
          actionLabel="Browse Shop"
          onAction={() => navigation.navigate('ProductList')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader
        title="My Cart"
        subtitle={`${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'} ready for checkout`}
        onBack={() => navigation.goBack()}
      />
      <FlashList
        data={items}
        renderItem={renderItem}
        estimatedItemSize={180}
        keyExtractor={item => item.productId}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
      />
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.borderLight }]}>
        <Card style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text variant="bodySmall" color="secondary">Subtotal (MRP)</Text>
            <Text variant="bodySmall">{formatCurrency(totals.subtotal)}</Text>
          </View>
          {totals.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text variant="bodySmall" color="secondary">Product discount</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.success }}>
                −{formatCurrency(totals.discount)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text variant="bodySmall" color="secondary">Delivery</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.success }}>FREE</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
          <View style={styles.totalRow}>
            <Text variant="h3">Total payable</Text>
            <Text variant="h2" style={{ color: theme.colors.primary }}>{formatCurrency(totals.total)}</Text>
          </View>
          {totals.discount > 0 ? (
            <Text variant="caption" style={{ color: theme.colors.success, textAlign: 'center' }}>
              You save {formatCurrency(totals.discount)} on this order
            </Text>
          ) : null}
        </Card>
        <Button
          title={`Checkout · ${formatCurrency(totals.total)}`}
          variant="gold"
          fullWidth
          onPress={() => navigation.navigate('Checkout')}
        />
        <Button
          title="Continue Shopping"
          variant="outline"
          fullWidth
          onPress={() => navigation.navigate('ProductList')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 8 },
  summaryCard: { marginBottom: 16, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  totalsCard: { gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
});
