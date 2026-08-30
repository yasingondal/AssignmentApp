import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Text, Card, Badge, EmptyState, ScreenContainer, ScreenHeader, ListShimmer,
} from '@/design-system/components';
import { useToast } from '@/design-system/components/Toast';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import type { Booking } from '@/features/consultation/domain/types';
import type { ConsultationStackParamList } from '@/app/navigation/types';
import { toUserMessage } from '@/core/errors/AppError';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { BookingCard } from '@/features/consultation/presentation/components/BookingCard';
import { isUpcomingBooking } from '@/features/consultation/domain/bookingDisplay';

export function UpcomingConsultationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ConsultationStackParamList>>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const networkStatus = useNetworkStatus();
  const { theme } = useTheme();

  const goToDashboard = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.popToTop();
    } else {
      navigation.navigate('DoctorList');
    }
  }, [navigation]);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => consultationRepository.getBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => consultationRepository.cancelBooking(id),
    onSuccess: () => {
      toast.showSuccess('Visit cancelled');
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => toast.showError(toUserMessage(error)),
  });

  const list = bookings ?? [];
  const upcomingCount = useMemo(() => list.filter(isUpcomingBooking).length, [list]);
  const confirmedCount = useMemo(
    () => list.filter(b => b.status === 'confirmed').length,
    [list],
  );

  const handlePress = useCallback(
    (bookingId: string) => navigation.navigate('BookingDetail', { bookingId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Booking; index: number }) => (
      <BookingCard
        booking={item}
        index={index}
        onPress={handlePress}
        onCancel={id => cancelMutation.mutate(id)}
      />
    ),
    [handlePress, cancelMutation],
  );

  const listHeader = useMemo(
    () => (
      <Card style={[styles.summaryCard, { borderColor: theme.colors.borderLight }]}>
        <View style={[styles.summaryAccent, { backgroundColor: theme.colors.accent }]} />
        <View style={styles.summaryInner}>
          <View style={styles.summaryTop}>
            <View>
              <Text variant="label">Your Ayurvedic visits</Text>
              <Text variant="bodySmall" color="secondary">
                Upcoming, past, and queued consultations
              </Text>
            </View>
            {upcomingCount > 0 ? (
              <Badge label={`${upcomingCount} upcoming`} variant="gold" />
            ) : null}
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Text variant="h3" style={{ color: theme.colors.primary }}>{String(list.length)}</Text>
              <Text variant="caption" color="muted">Total</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Text variant="h3" style={{ color: theme.colors.primary }}>{String(upcomingCount)}</Text>
              <Text variant="caption" color="muted">Upcoming</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Text variant="h3" style={{ color: theme.colors.primary }}>{String(confirmedCount)}</Text>
              <Text variant="caption" color="muted">Confirmed</Text>
            </View>
          </View>
        </View>
      </Card>
    ),
    [theme, list.length, upcomingCount, confirmedCount],
  );

  if (isLoading) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader
          title="My Visits"
          subtitle="Upcoming and past appointments"
          onBack={goToDashboard}
        />
        <ListShimmer />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader
        title="My Visits"
        subtitle={
          list.length
            ? `${upcomingCount} upcoming · ${list.length} total`
            : 'Upcoming and past appointments'
        }
        onBack={goToDashboard}
      />
      <FlashList
        data={list}
        renderItem={renderItem}
        estimatedItemSize={220}
        keyExtractor={item => item.id}
        ListHeaderComponent={list.length ? listHeader : null}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No consultations yet"
            message="Book an Ayurvedic consultation to see it here with full visit details."
            actionLabel="Find a doctor"
            onAction={goToDashboard}
          />
        }
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },
  summaryCard: { padding: 0, overflow: 'hidden', marginBottom: 12 },
  summaryAccent: { height: 4, width: '100%' },
  summaryInner: { padding: 14, gap: 14 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 4 },
});
