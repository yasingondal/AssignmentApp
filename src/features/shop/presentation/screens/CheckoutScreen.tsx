import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Button, Card, ScreenContainer, EmptyState } from '@/design-system/components';
import { useToast } from '@/design-system/components/Toast';
import { useCartStore } from '@/features/shop/data/cartStore';
import { formatCurrency } from '@/core/utils/currency';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export function CheckoutScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const items = useCartStore(s => s.items);
  const getTotals = useCartStore(s => s.getTotals);
  const clearCart = useCartStore(s => s.clearCart);
  const networkStatus = useNetworkStatus();
  const totals = getTotals();

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast.showError('Your cart is empty');
      return;
    }
    toast.showSuccess('Order placed successfully! (Demo)');
    clearCart();
    navigation.goBack();
  };

  if (items.length === 0) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <EmptyState
          title="Nothing to checkout"
          message="Add items to your cart first"
          actionLabel="Go to Cart"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <View style={styles.container} accessibilityLabel="Checkout summary">
        <Text variant="h2" accessibilityRole="header">Checkout Summary</Text>
        <Card style={styles.card}>
          {items.map(item => (
            <View key={item.productId} style={styles.row}>
              <Text variant="bodySmall" style={styles.name} accessibilityLabel={`${item.name} quantity ${item.quantity}`}>
                {item.name} × {item.quantity}
              </Text>
              <Text variant="bodySmall">{formatCurrency(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </Card>
        <View style={styles.totals} accessibilityRole="summary">
          <Text variant="body">Subtotal: {formatCurrency(totals.subtotal)}</Text>
          <Text variant="bodySmall" color="secondary">Discount: -{formatCurrency(totals.discount)}</Text>
          <Text variant="h3">Total: {formatCurrency(totals.total)}</Text>
        </View>
        <Button
          title="Place Order"
          variant="gold"
          fullWidth
          onPress={handlePlaceOrder}
          style={styles.btn}
          accessibilityLabel="Place order"
        />
        <Text variant="caption" color="muted" style={styles.note}>
          No payment gateway — demo checkout only.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { flex: 1 },
  totals: { gap: 4, marginBottom: 24 },
  btn: { marginBottom: 8 },
  note: { textAlign: 'center' },
});
