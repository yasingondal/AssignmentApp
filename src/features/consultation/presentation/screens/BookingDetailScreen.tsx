import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Text,
  Card,
  Button,
  ErrorState,
  ScreenContainer,
  ScreenHeader,
  Badge,
  DetailShimmer,
} from '@/design-system/components';
import { useToast } from '@/design-system/components/Toast';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { getDoctorById } from '@/features/consultation/data/doctorGenerator';
import type { ConsultationStackParamList } from '@/app/navigation/types';
import { formatCurrency } from '@/core/utils/currency';
import { toUserMessage } from '@/core/errors/AppError';
import { canCancelBooking } from '@/features/consultation/domain/bookingValidation';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  formatAppointmentDate,
  formatBookedOn,
  getVisitTiming,
} from '@/features/consultation/domain/bookingDisplay';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { FadeInView } from '@/design-system/components/FadeInView';

function DetailRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View>
      <View style={styles.metaRow}>
        <Text variant="caption" color="muted">{label}</Text>
        <Text variant="bodySmall" style={styles.metaValue}>{value}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
    </View>
  );
}

export function BookingDetailScreen() {
  const route = useRoute<RouteProp<ConsultationStackParamList, 'BookingDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ConsultationStackParamList>>();
  const { bookingId } = route.params;
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const networkStatus = useNetworkStatus();

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => consultationRepository.getBookingById(bookingId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => consultationRepository.cancelBooking(bookingId),
    onSuccess: () => {
      toast.showSuccess('Visit cancelled');
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: (error) => toast.showError(toUserMessage(error)),
  });

  if (isLoading) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader title="Visit details" subtitle="Loading appointment" onBack={() => navigation.goBack()} />
        <DetailShimmer />
      </ScreenContainer>
    );
  }

  if (isError || !booking) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader title="Visit details" onBack={() => navigation.goBack()} />
        <ErrorState message="Could not load this visit." onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const doctor = getDoctorById(booking.doctorId);
  const { allowed, reason } = canCancelBooking(booking);
  const statusColor = BOOKING_STATUS_COLORS[booking.status];

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader
        title="Visit details"
        subtitle={getVisitTiming(booking)}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Card style={[styles.heroCard, { borderColor: theme.colors.borderLight }]}>
            <View style={[styles.accentBar, { backgroundColor: statusColor }]} />
            <View style={styles.heroInner}>
              <View style={styles.heroTop}>
                {doctor?.avatar ? (
                  <Image
                    source={{ uri: doctor.avatar }}
                    style={styles.avatar}
                    accessibilityLabel={booking.doctorName}
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceMuted }]} />
                )}
                <View style={styles.heroText}>
                  <Badge label={BOOKING_STATUS_LABELS[booking.status]} variant="gold" />
                  <Text variant="h2" style={styles.heroTitle}>{booking.doctorName}</Text>
                  <Text variant="bodySmall" color="secondary">
                    {doctor?.specialization ?? 'Ayurvedic consultation'}
                  </Text>
                  {doctor?.location ? (
                    <Text variant="caption" color="muted">{doctor.location}</Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.schedule, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View style={styles.scheduleCol}>
                  <Text variant="caption" color="muted">Date</Text>
                  <Text variant="label">{formatAppointmentDate(booking.date)}</Text>
                </View>
                <View style={styles.scheduleCol}>
                  <Text variant="caption" color="muted">Time</Text>
                  <Text variant="label">{booking.startTime} – {booking.endTime}</Text>
                </View>
                <View style={styles.scheduleCol}>
                  <Text variant="caption" color="muted">Fee</Text>
                  <Text variant="label" style={{ color: theme.colors.primary }}>
                    {formatCurrency(booking.consultationFee)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </FadeInView>

        {doctor ? (
          <FadeInView delay={80}>
            <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
              <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
              <View style={styles.sectionInner}>
                <Text variant="label">Doctor</Text>
                <View style={styles.badges}>
                  <Badge label={`★ ${doctor.rating}`} variant="gold" />
                  <Badge label={`${doctor.experience} yrs`} variant="outline" />
                </View>
                <Text variant="bodySmall" color="secondary" style={styles.description}>
                  {doctor.description}
                </Text>
                <Text variant="caption" color="muted">
                  Languages · {doctor.languages.join(', ')}
                </Text>
                <Button
                  title="View doctor profile"
                  variant="outline"
                  size="sm"
                  onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor.id })}
                />
              </View>
            </Card>
          </FadeInView>
        ) : null}

        <FadeInView delay={120}>
          <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
            <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
            <View style={styles.sectionInner}>
              <Text variant="label">Appointment</Text>
              <DetailRow label="Booking ID" value={booking.id} />
              <DetailRow label="Slot ID" value={booking.slotId} />
              <DetailRow label="Booked on" value={formatBookedOn(booking.createdAt)} />
              <DetailRow label="Status" value={BOOKING_STATUS_LABELS[booking.status]} />
              <View style={styles.metaRow}>
                <Text variant="caption" color="muted">Consultation fee</Text>
                <Text variant="bodySmall" style={styles.metaValue}>
                  {formatCurrency(booking.consultationFee)}
                </Text>
              </View>
              {booking.idempotencyKey ? (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                  <View style={styles.metaRow}>
                    <Text variant="caption" color="muted">Idempotency key</Text>
                    <Text variant="caption" style={[styles.metaValue, styles.mono]} numberOfLines={1}>
                      {booking.idempotencyKey}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>
        </FadeInView>

        {booking.failureReason ? (
          <FadeInView delay={160}>
            <Card style={[styles.sectionCard, { borderColor: theme.colors.error }]}>
              <View style={[styles.sectionAccent, { backgroundColor: theme.colors.error }]} />
              <View style={styles.sectionInner}>
                <Text variant="label">Issue</Text>
                <Text variant="bodySmall" color="error">{booking.failureReason}</Text>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        <FadeInView delay={200}>
          <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
            <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
            <View style={styles.sectionInner}>
              <Text variant="label">Cancellation policy</Text>
              <Text variant="bodySmall" color="secondary">
                Visits can be cancelled up to 2 hours before the appointment time. After that, the slot is locked.
              </Text>
              {allowed ? (
                <Button
                  title={cancelMutation.isPending ? 'Cancelling...' : 'Cancel this visit'}
                  variant="outline"
                  loading={cancelMutation.isPending}
                  onPress={() => cancelMutation.mutate()}
                />
              ) : (
                <Text variant="caption" color="muted">{reason}</Text>
              )}
            </View>
          </Card>
        </FadeInView>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  accentBar: { height: 4, width: '100%' },
  heroCard: { padding: 0, overflow: 'hidden' },
  heroInner: { padding: 16, gap: 14 },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#E8E4DC' },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { lineHeight: 30 },
  schedule: { flexDirection: 'row', borderRadius: 14, padding: 12, gap: 10 },
  scheduleCol: { flex: 1, gap: 4 },
  sectionCard: { padding: 0, overflow: 'hidden' },
  sectionAccent: { height: 3, width: '100%' },
  sectionInner: { padding: 14, gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  description: { lineHeight: 22 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 12 },
  metaValue: { fontWeight: '600', textAlign: 'right', flex: 1 },
  mono: { fontSize: 11 },
  divider: { height: StyleSheet.hairlineWidth },
});
