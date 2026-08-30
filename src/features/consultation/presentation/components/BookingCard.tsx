import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { FadeInView } from '@/design-system/components/FadeInView';
import { useTheme } from '@/design-system/theme/ThemeContext';
import type { Booking } from '@/features/consultation/domain/types';
import { getDoctorById } from '@/features/consultation/data/doctorGenerator';
import { formatCurrency } from '@/core/utils/currency';
import { canCancelBooking } from '@/features/consultation/domain/bookingValidation';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  formatAppointmentDate,
  getVisitTiming,
} from '@/features/consultation/domain/bookingDisplay';

interface BookingCardProps {
  booking: Booking;
  index?: number;
  onPress: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
}

export const BookingCard = memo(function BookingCard({
  booking,
  index = 0,
  onPress,
  onCancel,
}: BookingCardProps) {
  const { theme } = useTheme();
  const doctor = getDoctorById(booking.doctorId);
  const { allowed, reason } = canCancelBooking(booking);
  const statusColor = BOOKING_STATUS_COLORS[booking.status];

  return (
    <FadeInView delay={Math.min(index * 45, 220)}>
      <Card
        style={[styles.card, { borderColor: theme.colors.borderLight }]}
        accessibilityLabel={`${booking.doctorName}, ${formatAppointmentDate(booking.date)} ${booking.startTime}`}
      >
        <View style={[styles.accentBar, { backgroundColor: statusColor }]} />
        <Pressable onPress={() => onPress(booking.id)} accessibilityRole="button">
          <View style={styles.inner}>
            <View style={styles.topRow}>
              {doctor?.avatar ? (
                <Image
                  source={{ uri: doctor.avatar }}
                  style={styles.avatar}
                  accessibilityLabel={booking.doctorName}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceMuted }]} />
              )}
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text variant="label" numberOfLines={1} style={styles.name}>{booking.doctorName}</Text>
                <Badge
                  label={BOOKING_STATUS_LABELS[booking.status]}
                  variant={booking.status === 'confirmed' ? 'gold' : 'outline'}
                />
              </View>
              <Text variant="caption" color="secondary" numberOfLines={1}>
                {doctor?.specialization ?? 'Ayurvedic consultation'}
              </Text>
              {doctor?.location ? (
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {doctor.location}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.schedule, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View style={styles.scheduleCol}>
              <Text variant="caption" color="muted">Date</Text>
              <Text variant="label">{formatAppointmentDate(booking.date)}</Text>
            </View>
            <View style={[styles.scheduleDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.scheduleCol}>
              <Text variant="caption" color="muted">Time</Text>
              <Text variant="label">{booking.startTime} – {booking.endTime}</Text>
            </View>
            <View style={[styles.scheduleDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.scheduleCol}>
              <Text variant="caption" color="muted">Fee</Text>
              <Text variant="label" style={{ color: theme.colors.primary }}>
                {formatCurrency(booking.consultationFee)}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text variant="caption" color="secondary">{getVisitTiming(booking)}</Text>
            {doctor ? (
              <Badge label={`★ ${doctor.rating}`} variant="gold" />
            ) : null}
          </View>

          {booking.failureReason ? (
            <Text variant="caption" color="error">{booking.failureReason}</Text>
          ) : null}
          </View>
        </Pressable>
          <View style={styles.footer}>
            <Button
              title="View details"
              variant="gold"
              size="sm"
              onPress={() => onPress(booking.id)}
            />
            {allowed ? (
              <Button
                title="Cancel visit"
                variant="outline"
                size="sm"
                onPress={() => onCancel(booking.id)}
              />
            ) : (
              <Text variant="caption" color="muted" style={styles.cancelHint} numberOfLines={2}>
                {reason}
              </Text>
            )}
          </View>
      </Card>
    </FadeInView>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 0, overflow: 'hidden' },
  accentBar: { height: 4, width: '100%' },
  inner: { padding: 14, paddingBottom: 4, gap: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#E8E4DC' },
  info: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16 },
  schedule: { flexDirection: 'row', borderRadius: 14, padding: 12, alignItems: 'center' },
  scheduleCol: { flex: 1, gap: 4 },
  scheduleDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginHorizontal: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cancelHint: { flex: 1, textAlign: 'right' },
});
