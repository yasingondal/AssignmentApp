import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Text, Button, Card, Loader, ErrorState, ScreenContainer, Badge } from '@/design-system/components';
import { useToast } from '@/design-system/components/Toast';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import type { ConsultationStackParamList } from '@/app/navigation/types';
import { formatCurrency } from '@/core/utils/currency';
import type { TimeSlot } from '@/features/consultation/domain/types';
import { getSlotUnavailableReason } from '@/features/consultation/domain/bookingValidation';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

const SLOT_MESSAGES = {
  booked: 'This slot is already booked. Please choose another time.',
  expired: 'This slot has expired and cannot be booked.',
  duplicate: 'You have already booked this slot. Open My Visits to see it.',
} as const;

export function DoctorDetailScreen() {
  const route = useRoute<RouteProp<ConsultationStackParamList, 'DoctorDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ConsultationStackParamList>>();
  const { doctorId } = route.params;
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const networkStatus = useNetworkStatus();
  const toast = useToast();

  const { data: doctor, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => consultationRepository.getDoctorById(doctorId),
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', doctorId],
    queryFn: () => consultationRepository.getSlots(doctorId),
    enabled: !!doctor,
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => consultationRepository.getBookings(),
  });

  const displaySlots = useMemo(() => {
    const bookedIds = new Set(
      (bookings ?? [])
        .filter(
          b =>
            b.doctorId === doctorId &&
            b.status !== 'cancelled' &&
            b.status !== 'failed',
        )
        .map(b => b.slotId),
    );

    return (slots ?? []).map(s => {
      const reason = getSlotUnavailableReason(s, bookings ?? []);
      if (reason === 'expired') {
        return { ...s, status: 'expired' as const };
      }
      if (reason === 'duplicate' || reason === 'booked' || bookedIds.has(s.id)) {
        return { ...s, status: 'booked' as const };
      }
      return s;
    });
  }, [slots, bookings, doctorId]);

  const handleSlotPress = (slot: TimeSlot) => {
    const reason = getSlotUnavailableReason(slot, bookings ?? []);
    if (reason) {
      toast.showWarning(SLOT_MESSAGES[reason]);
      return;
    }
    setSelectedSlot(slot);
  };

  const selectedUnavailable = selectedSlot
    ? getSlotUnavailableReason(selectedSlot, bookings ?? [])
    : null;

  if (isLoading) {
    return <ScreenContainer><Loader /></ScreenContainer>;
  }

  if (isError || !doctor) {
    return <ScreenContainer><ErrorState onRetry={refetch} /></ScreenContainer>;
  }

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profile}>
          <Image source={{ uri: doctor.avatar }} style={styles.avatar} accessibilityLabel={doctor.name} />
          <View style={styles.profileInfo}>
            <Text variant="h2">{doctor.name}</Text>
            <Text variant="body" color="secondary">{doctor.specialization}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <Badge label={`${doctor.experience} yrs`} variant="gold" />
          <Badge label={`★ ${doctor.rating}`} variant="outline" />
          <Badge label={formatCurrency(doctor.consultationFee)} variant="gold" />
        </View>
        <Text variant="bodySmall" color="muted">{doctor.location} · {doctor.languages.join(', ')}</Text>
        <Card style={styles.about}>
          <Text variant="label">About</Text>
          <Text variant="bodySmall" color="secondary" style={styles.aboutText}>{doctor.description}</Text>
        </Card>

        <Text variant="h3" style={styles.section}>Available Slots</Text>
        {slotsLoading ? (
          <Loader message="Loading slots..." />
        ) : displaySlots.length === 0 ? (
          <Text variant="bodySmall" color="secondary">No slots found</Text>
        ) : (
          <View style={styles.slots}>
            {displaySlots.map(slot => {
              const reason = getSlotUnavailableReason(slot, bookings ?? []);
              const selected = selectedSlot?.id === slot.id;
              const title = reason === 'duplicate'
                ? `${slot.startTime} · Yours`
                : reason === 'booked'
                  ? `${slot.startTime} · Booked`
                  : reason === 'expired'
                    ? `${slot.startTime} · Expired`
                    : `${slot.date} ${slot.startTime}`;
              return (
                <Button
                  key={slot.id}
                  title={title}
                  variant={reason ? 'ghost' : selected ? 'gold' : 'outline'}
                  size="sm"
                  onPress={() => handleSlotPress(slot)}
                  accessibilityLabel={
                    reason
                      ? `${reason} slot ${slot.date} at ${slot.startTime}`
                      : `Slot ${slot.date} at ${slot.startTime}`
                  }
                  style={reason ? styles.unavailableSlot : undefined}
                />
              );
            })}
          </View>
        )}

        <Button
          title="Book Consultation"
          variant="gold"
          fullWidth
          disabled={!selectedSlot || !!selectedUnavailable}
          onPress={() =>
            selectedSlot &&
            navigation.navigate('BookingConfirm', {
              doctorId,
              slotId: selectedSlot.id,
            })
          }
          style={styles.bookBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  profile: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8E4DC' },
  profileInfo: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  about: { marginVertical: 12 },
  aboutText: { marginTop: 6, lineHeight: 22 },
  section: { marginTop: 16, marginBottom: 10 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unavailableSlot: { opacity: 0.55 },
  bookBtn: { marginTop: 28, marginBottom: 16 },
});
