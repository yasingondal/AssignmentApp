import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductListScreen } from '@/features/shop/presentation/screens/ProductListScreen';
import { lazyScreen } from '@/app/navigation/lazyScreen';
import type { ShopStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/design-system/theme/ThemeContext';

const ProductDetailScreen = lazyScreen(() =>
  import('@/features/shop/presentation/screens/ProductDetailScreen').then(m => ({
    default: m.ProductDetailScreen,
  })),
);
const CartScreen = lazyScreen(() =>
  import('@/features/shop/presentation/screens/CartScreen').then(m => ({
    default: m.CartScreen,
  })),
);
const CheckoutScreen = lazyScreen(() =>
  import('@/features/shop/presentation/screens/CheckoutScreen').then(m => ({
    default: m.CheckoutScreen,
  })),
);
const WishlistScreen = lazyScreen(() =>
  import('@/features/shop/presentation/screens/WishlistScreen').then(m => ({
    default: m.WishlistScreen,
  })),
);

const Stack = createNativeStackNavigator<ShopStackParamList>();

export function ShopNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.headerGradientStart },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
    </Stack.Navigator>
  );
}
