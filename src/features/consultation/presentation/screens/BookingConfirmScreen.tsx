import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateId } from '@/core/utils/id';
import { Text, Button, Card, Loader, ScreenContainer, ScreenHeader, Badge } from '@/design-system/components';
import { useToast } from '@/design-system/components/Toast';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { getDoctorById } from '@/features/consultation/data/doctorGenerator';
import { getSlotById, generateSlotsForDoctor } from '@/features/consultation/data/slotGenerator';
import type { ConsultationStackParamList } from '@/app/navigation/types';
import { formatCurrency } from '@/core/utils/currency';
import { toUserMessage } from '@/core/errors/AppError';
import { getSlotUnavailableReason } from '@/features/consultation/domain/bookingValidation';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';

const SLOT_MESSAGES = {
  booked: 'This slot is already booked. Please choose another time.',
  expired: 'This slot has expired and cannot be booked.',
  duplicate: 'You have already booked this slot. Open My Visits to see it.',
} as const;

export function BookingConfirmScreen() {
  const route = useRoute<RouteProp<ConsultationStackParamList, 'BookingConfirm'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ConsultationStackParamList>>();
  const { doctorId, slotId } = route.params;
  const toast = useToast();
  const queryClient = useQueryClient();
  const networkStatus = useNetworkStatus();
  const { theme } = useTheme();
  const [idempotencyKey] = useState(() => generateId());

  const doctor = getDoctorById(doctorId);
  const { data: slots } = useQuery({
    queryKey: ['slots', doctorId],
    queryFn: () => consultationRepository.getSlots(doctorId),
  });
  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => consultationRepository.getBookings(),
  });
  const slot = slots?.find(s => s.id === slotId) ?? getSlotById(slotId) ?? generateSlotsForDoctor(doctorId).find(s => s.id === slotId);

  const bookingMutation = useMutation({
    mutationFn: () =>
      consultationRepository.createBooking({ doctorId, slotId, idempotencyKey }),
    onSuccess: (booking) => {
      if (booking.status === 'pending') {
        toast.showInfo('Booking queued. Will sync when online.');
      } else if (booking.status === 'conflict') {
        toast.showWarning('This slot was just taken. Please choose another time.');
        void queryClient.invalidateQueries({ queryKey: ['slots', doctorId] });
        void queryClient.invalidateQueries({ queryKey: ['bookings'] });
        return;
      } else {
        toast.showSuccess('Consultation booked successfully!');
      }
      void queryClient.invalidateQueries({ queryKey: ['slots', doctorId] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigation.replace('UpcomingConsultations');
    },
    onError: (error) => {
      toast.showError(toUserMessage(error));
      void queryClient.invalidateQueries({ queryKey: ['slots', doctorId] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  if (!doctor || !slot) {
    return <ScreenContainer><Loader /></ScreenContainer>;
  }

  const unavailable = getSlotUnavailableReason(slot, bookings ?? []);

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader title="Confirm Booking" subtitle="Review your appointment details" />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text variant="h3">{doctor.name}</Text>
          <Text variant="bodySmall" color="secondary">{doctor.specialization}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text variant="bodySmall" color="secondary">Date</Text>
            <Text variant="label">{slot.date}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" color="secondary">Time</Text>
            <Text variant="label">{slot.startTime} – {slot.endTime}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" color="secondary">Consultation Fee</Text>
            <Badge label={formatCurrency(doctor.consultationFee)} variant="gold" />
          </View>
        </Card>

        {unavailable ? (
          <Text variant="bodySmall" color="error" style={styles.warn}>
            {SLOT_MESSAGES[unavailable]}
          </Text>
        ) : null}

        {networkStatus === 'offline' && (
          <View style={[styles.offlineNote, { backgroundColor: theme.colors.offlineBanner }]}>
            <Text variant="caption" style={{ color: theme.colors.offlineBannerText }}>
              Offline — booking will be queued and synced automatically.
            </Text>
          </View>
        )}

        {unavailable === 'duplicate' ? (
          <Button
            title="View My Visits"
            variant="gold"
            fullWidth
            onPress={() => navigation.replace('UpcomingConsultations')}
            style={styles.btn}
          />
        ) : (
          <Button
            title={bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            variant="gold"
            loading={bookingMutation.isPending}
            fullWidth
            disabled={!!unavailable || bookingMutation.isPending}
            onPress={() => {
              if (bookingMutation.isPending) {
                return;
              }
              if (unavailable) {
                toast.showWarning(SLOT_MESSAGES[unavailable]);
                return;
              }
              bookingMutation.mutate();
            }}
            style={styles.btn}
          />
        )}
        <Button title="Go Back" variant="ghost" fullWidth onPress={() => navigation.goBack()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { gap: 8 },
  divider: { height: 1, backgroundColor: '#E2DDD4', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  offlineNote: { padding: 12, borderRadius: 12, marginVertical: 12 },
  warn: { marginTop: 12 },
  btn: { marginTop: 20 },
});
