import { useCallback } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Text, Card, Loader, EmptyState, ErrorState, ScreenContainer, Button, ScreenHeader,
} from '@/design-system/components';
import { useWishlistStore } from '@/features/shop/data/wishlistStore';
import { productRepository } from '@/features/shop/data/productRepository';
import type { ShopStackParamList } from '@/app/navigation/types';
import { formatCurrency, calculateDiscountedPrice } from '@/core/utils/currency';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useToast } from '@/design-system/components/Toast';

export function WishlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const productIds = useWishlistStore(s => s.productIds);
  const toggle = useWishlistStore(s => s.toggle);
  const toast = useToast();
  const networkStatus = useNetworkStatus();

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ['wishlist', productIds],
    queryFn: async () => {
      const items = await Promise.all(
        productIds.map(id => productRepository.getProductById(id)),
      );
      return items.filter((p): p is NonNullable<typeof p> => p !== null);
    },
    enabled: productIds.length > 0,
  });

  const renderItem = useCallback(
    ({ item }: { item: NonNullable<typeof products>[0] }) => (
      <Card style={styles.card}>
        <View style={styles.row}>
          <Image source={{ uri: item.image }} style={styles.image} accessibilityLabel={item.name} />
          <View style={styles.info}>
            <Text variant="label" numberOfLines={2}>{item.name}</Text>
            <Text variant="bodySmall" color="secondary">{item.brand}</Text>
            <Text variant="label">
              {formatCurrency(calculateDiscountedPrice(item.price, item.discount))}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Button
            title="View"
            size="sm"
            variant="outline"
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
          <Button
            title="Remove"
            size="sm"
            variant="ghost"
            onPress={() => {
              toggle(item.id);
              toast.showInfo('Removed from wishlist');
            }}
          />
        </View>
      </Card>
    ),
    [navigation, toggle, toast],
  );

  if (isLoading && productIds.length > 0) {
    return <ScreenContainer><Loader /></ScreenContainer>;
  }

  if (isError) {
    return <ScreenContainer><ErrorState onRetry={refetch} /></ScreenContainer>;
  }

  if (productIds.length === 0) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <EmptyState
          title="Wishlist is empty"
          message="Save products you like from the shop"
          actionLabel="Browse Shop"
          onAction={() => navigation.navigate('ProductList')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader title="My Wishlist" subtitle={`${productIds.length} saved product${productIds.length === 1 ? '' : 's'}`} />
      <FlashList
        data={products ?? []}
        renderItem={renderItem}
        estimatedItemSize={120}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { marginBottom: 12, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  image: { width: 72, height: 72, borderRadius: 8 },
  info: { flex: 1, gap: 4 },
  actions: { flexDirection: 'row', gap: 8 },
});
