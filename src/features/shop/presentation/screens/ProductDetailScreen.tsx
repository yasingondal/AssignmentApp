import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Text, Button, Card, Loader, ErrorState, ScreenContainer, Badge } from '@/design-system/components';
import { useToast } from '@/design-system/components/Toast';
import { productRepository } from '@/features/shop/data/productRepository';
import { useCartStore } from '@/features/shop/data/cartStore';
import { useWishlistStore } from '@/features/shop/data/wishlistStore';
import type { ShopStackParamList } from '@/app/navigation/types';
import { formatCurrency, calculateDiscountedPrice } from '@/core/utils/currency';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export function ProductDetailScreen() {
  const route = useRoute<RouteProp<ShopStackParamList, 'ProductDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const { productId } = route.params;
  const toast = useToast();
  const addItem = useCartStore(s => s.addItem);
  const cartQuantity = useCartStore(
    s => s.items.find(i => i.productId === productId)?.quantity ?? 0,
  );
  const toggleWishlist = useWishlistStore(s => s.toggle);
  const wishlisted = useWishlistStore(s => s.productIds.includes(productId));
  const networkStatus = useNetworkStatus();

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productRepository.getProductById(productId),
  });

  if (isLoading) {
    return <ScreenContainer><Loader /></ScreenContainer>;
  }

  if (isError || !product) {
    return <ScreenContainer><ErrorState onRetry={refetch} /></ScreenContainer>;
  }

  const remainingStock = Math.max(0, product.stock - cartQuantity);
  const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
  const outOfStock = !product.availability || remainingStock === 0;

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.image }} style={styles.image} accessibilityLabel={product.name} />
        <Text variant="h2">{product.name}</Text>
        <Text variant="bodySmall" color="secondary">{product.brand} · {product.category}</Text>
        <View style={styles.priceRow}>
          <Text variant="h3">{formatCurrency(discountedPrice)}</Text>
          {product.discount > 0 && (
            <Text variant="bodySmall" color="muted" style={styles.strike}>
              {formatCurrency(product.price)} ({product.discount}% off)
            </Text>
          )}
        </View>
        <Text variant="caption">
          ★ {product.rating.toFixed(1)} · Stock: {remainingStock}
          {cartQuantity > 0 ? ` · ${cartQuantity} in cart` : ''}
        </Text>
        <View style={styles.tags}>
          {product.tags.map(t => <Badge key={t} label={t} />)}
        </View>
        <Card style={styles.desc}>
          <Text variant="bodySmall" color="secondary">{product.description}</Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title={wishlisted ? '♥ Wishlisted' : '♡ Add to Wishlist'}
            variant="outline"
            onPress={() => {
              const wasWishlisted = wishlisted;
              toggleWishlist(productId);
              toast.showSuccess(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
            }}
          />
          <Button
            title={outOfStock ? 'Out of Stock' : 'Add to Cart'}
            variant="gold"
            disabled={outOfStock}
            onPress={() => {
              addItem({
                productId: product.id,
                name: product.name,
                image: product.image,
                brand: product.brand,
                category: product.category,
                unitPrice: product.price,
                discountPercent: product.discount,
                stock: product.stock,
              });
              toast.showSuccess('Added to cart');
            }}
          />
        </View>
        <Button title="View Cart" variant="ghost" onPress={() => navigation.navigate('Cart')} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  image: { width: '100%', height: 260, borderRadius: 16, marginBottom: 12 },
  priceRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  strike: { textDecorationLine: 'line-through' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 },
  desc: { marginVertical: 8 },
  actions: { gap: 8, marginTop: 16 },
});
