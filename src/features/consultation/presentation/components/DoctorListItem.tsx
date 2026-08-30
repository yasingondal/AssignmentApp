import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Badge, Card, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme/ThemeContext';
import type { Doctor } from '@/features/consultation/domain/types';
import { formatCurrency } from '@/core/utils/currency';

interface DoctorListItemProps {
  doctor: Doctor;
  onPress: (doctorId: string) => void;
  index?: number;
}

/** Memoized row — stable props from FlashList keep recycle cheap. */
export const DoctorListItem = memo(function DoctorListItem({ doctor, onPress }: DoctorListItemProps) {
  const { theme } = useTheme();

  return (
    <Card
      onPress={() => onPress(doctor.id)}
      style={styles.card}
      accessibilityLabel={`Doctor ${doctor.name}, ${doctor.specialization}, ${doctor.location}`}
    >
      <View style={styles.row}>
        <Image source={{ uri: doctor.avatar }} style={styles.avatar} accessibilityLabel={`${doctor.name} photo`} />
        <View style={styles.info}>
          <Text variant="h3" numberOfLines={1}>{doctor.name}</Text>
          <Text variant="bodySmall" color="secondary">{doctor.specialization}</Text>
          <View style={styles.meta}>
            <Badge label={`★ ${doctor.rating}`} variant="gold" />
            <Badge label={`${doctor.experience} yrs`} variant="outline" />
          </View>
        </View>
        <View style={styles.fee}>
          <Text variant="label" style={{ color: theme.colors.primary }}>{formatCurrency(doctor.consultationFee)}</Text>
          <Text variant="caption" color="muted">{doctor.location}</Text>
        </View>
      </View>
      {!doctor.availability && (
        <Text variant="caption" color="warning" style={styles.unavail}>Currently unavailable</Text>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8E4DC' },
  info: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  fee: { alignItems: 'flex-end', gap: 4 },
  unavail: { marginTop: 8 },
});
