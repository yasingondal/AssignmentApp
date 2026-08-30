import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Image, Pressable } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Text,
  Card,
  ErrorState,
  ScreenContainer,
  ScreenHeader,
  Badge,
  DetailShimmer,
} from '@/design-system/components';
import { healthRecordRepository } from '@/features/health-records/data/healthRecordRepository';
import type { HealthStackParamList } from '@/app/navigation/types';
import type { Attachment } from '@/features/health-records/domain/types';
import { RECORD_TYPE_LABELS } from '@/features/health-records/domain/types';
import {
  RECORD_TYPE_COLORS,
  RECORD_TYPE_ICONS,
  RECORD_TYPE_DETAIL_FIELDS,
  RECORD_TYPE_SECTION_TITLES,
} from '@/features/health-records/domain/constants';
import { formatDate } from '@/core/utils/dateGrouping';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { FadeInView } from '@/design-system/components/FadeInView';
import { AttachmentPreviewModal } from '@/features/health-records/presentation/components/AttachmentPreviewModal';

export function HealthRecordDetailScreen() {
  const route = useRoute<RouteProp<HealthStackParamList, 'HealthRecordDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HealthStackParamList>>();
  const { recordId } = route.params;
  const { theme } = useTheme();
  const networkStatus = useNetworkStatus();
  const [preview, setPreview] = useState<Attachment | null>(null);

  const { data: record, isLoading, isError, refetch } = useQuery({
    queryKey: ['health-record', recordId],
    queryFn: () => healthRecordRepository.getRecordById(recordId),
  });

  const typeDetails = useMemo(() => {
    if (!record) {
      return [];
    }
    return RECORD_TYPE_DETAIL_FIELDS[record.type]
      .map(key => ({ key, label: key.replace(/_/g, ' '), value: record.metadata?.[key] }))
      .filter(entry => Boolean(entry.value));
  }, [record]);

  if (isLoading) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader title="Record Details" subtitle="Loading your health record" onBack={() => navigation.goBack()} />
        <DetailShimmer />
      </ScreenContainer>
    );
  }

  if (isError || !record) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader title="Record Details" onBack={() => navigation.goBack()} />
        <ErrorState message="Could not load this health record." onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const typeColor = RECORD_TYPE_COLORS[record.type];
  const typeFields = RECORD_TYPE_DETAIL_FIELDS[record.type];
  const metadataEntries = Object.entries(record.metadata ?? {}).filter(
    ([key]) => key !== 'record_category' && !typeFields.includes(key),
  );

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader
        title={RECORD_TYPE_LABELS[record.type]}
        subtitle={formatDate(record.date)}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <Card style={[styles.heroCard, { borderColor: theme.colors.borderLight }]}>
            <View style={[styles.accentBar, { backgroundColor: typeColor }]} />
            <View style={styles.heroInner}>
              <View style={styles.heroTop}>
                <View style={[styles.typeIcon, { backgroundColor: typeColor + '14', borderColor: typeColor + '40' }]}>
                  <Text style={styles.typeEmoji}>{RECORD_TYPE_ICONS[record.type]}</Text>
                </View>
                <View style={styles.heroText}>
                  <Badge label={RECORD_TYPE_LABELS[record.type]} variant="gold" />
                  <Text variant="h2" style={styles.heroTitle}>{record.title}</Text>
                  <Text variant="bodySmall" color="secondary">
                    Recorded on {formatDate(record.date)}
                  </Text>
                </View>
              </View>

              {record.provider ? (
                <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Text variant="caption" color="muted">Healthcare provider</Text>
                  <Text variant="label" style={{ color: theme.colors.primary }}>{record.provider}</Text>
                </View>
              ) : null}
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={80}>
          <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
            <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
            <View style={styles.sectionInner}>
              <Text variant="label" style={styles.sectionTitle}>Summary</Text>
              <Text variant="bodySmall" color="secondary" style={styles.description}>
                {record.description}
              </Text>
            </View>
          </Card>
        </FadeInView>

        {typeDetails.length ? (
          <FadeInView delay={100}>
            <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
              <View style={[styles.sectionAccent, { backgroundColor: typeColor }]} />
              <View style={styles.sectionInner}>
                <Text variant="label" style={styles.sectionTitle}>
                  {RECORD_TYPE_SECTION_TITLES[record.type]}
                </Text>
                <View style={styles.metaList}>
                  {typeDetails.map((entry, index) => (
                    <View key={entry.key}>
                      {index > 0 ? (
                        <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                      ) : null}
                      <View style={styles.metaRow}>
                        <Text variant="caption" color="muted" style={styles.metaKey}>
                          {entry.label}
                        </Text>
                        <Text variant="bodySmall" style={styles.metaValue}>{entry.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {record.tags?.length ? (
          <FadeInView delay={120}>
            <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
              <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
              <View style={styles.sectionInner}>
                <Text variant="label" style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tags}>
                  {record.tags.map(tag => (
                    <Badge key={tag} label={tag} variant="outline" />
                  ))}
                </View>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {record.attachments?.length ? (
          <FadeInView delay={160}>
            <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
              <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
              <View style={styles.sectionInner}>
                <View style={styles.sectionHeaderRow}>
                  <Text variant="label" style={styles.sectionTitle}>Attachments</Text>
                  <Badge label={`${record.attachments.length} file${record.attachments.length === 1 ? '' : 's'}`} variant="gold" />
                </View>
                <View style={styles.attachments}>
                  {record.attachments.map(att => (
                    <Pressable
                      key={att.id}
                      onPress={() => setPreview(att)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${att.name} preview`}
                      style={[styles.attachmentCard, { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surfaceMuted }]}
                    >
                      {att.type === 'image' ? (
                        <Image
                          source={{ uri: att.thumbnailUrl ?? att.url }}
                          style={styles.attachmentImage}
                          accessibilityLabel={att.name}
                        />
                      ) : (
                        <View style={[styles.pdfPreview, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                          {att.thumbnailUrl ? (
                            <Image
                              source={{ uri: att.thumbnailUrl }}
                              style={styles.pdfThumb}
                              accessibilityLabel={`${att.name} thumbnail`}
                            />
                          ) : (
                            <Text style={styles.pdfIcon}>📄</Text>
                          )}
                          <View style={[styles.pdfOverlay, { backgroundColor: 'rgba(15, 61, 50, 0.72)' }]}>
                            <Text style={styles.pdfIconSmall}>📄</Text>
                            <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>PDF</Text>
                          </View>
                        </View>
                      )}
                      <View style={styles.attachmentMeta}>
                        <Text variant="label" numberOfLines={1}>{att.name}</Text>
                        <Text variant="caption" color="muted">
                          {att.type === 'image' ? 'Image' : 'PDF'} · Tap to view large
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        <FadeInView delay={200}>
          <Card style={[styles.sectionCard, { borderColor: theme.colors.borderLight }]}>
            <View style={[styles.sectionAccent, { backgroundColor: theme.colors.accent }]} />
            <View style={styles.sectionInner}>
              <Text variant="label" style={styles.sectionTitle}>Record information</Text>
              <View style={styles.metaList}>
                <View style={styles.metaRow}>
                  <Text variant="caption" color="muted">Record ID</Text>
                  <Text variant="bodySmall" style={styles.metaValue}>{record.id}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                <View style={styles.metaRow}>
                  <Text variant="caption" color="muted">Type</Text>
                  <Text variant="bodySmall" style={styles.metaValue}>{RECORD_TYPE_LABELS[record.type]}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                <View style={styles.metaRow}>
                  <Text variant="caption" color="muted">Date</Text>
                  <Text variant="bodySmall" style={styles.metaValue}>{formatDate(record.date)}</Text>
                </View>
                {metadataEntries.map(([key, value]) => (
                  <View key={key}>
                    <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                    <View style={styles.metaRow}>
                      <Text variant="caption" color="muted" style={styles.metaKey}>
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text variant="bodySmall" style={styles.metaValue}>{value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </FadeInView>
      </ScrollView>

      <AttachmentPreviewModal
        visible={Boolean(preview)}
        attachment={preview}
        attachments={record.attachments}
        onClose={() => setPreview(null)}
        onSelect={setPreview}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  accentBar: { height: 4, width: '100%' },
  heroCard: { padding: 0, overflow: 'hidden' },
  heroInner: { padding: 16, gap: 14 },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  typeIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  typeEmoji: { fontSize: 30 },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { lineHeight: 30 },
  infoRow: { padding: 12, borderRadius: 12, gap: 4 },
  sectionCard: { padding: 0, overflow: 'hidden' },
  sectionAccent: { height: 3, width: '100%' },
  sectionInner: { padding: 14, gap: 10 },
  sectionTitle: { marginBottom: 2, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  description: { lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachments: { gap: 12 },
  attachmentCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  attachmentImage: { width: '100%', height: 200, backgroundColor: '#F0EBE3' },
  pdfPreview: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pdfThumb: { width: '100%', height: '100%' },
  pdfOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pdfIcon: { fontSize: 36 },
  pdfIconSmall: { fontSize: 28 },
  attachmentMeta: { padding: 12, gap: 4 },
  metaList: { gap: 0 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 12 },
  metaKey: { textTransform: 'capitalize', flex: 1 },
  metaValue: { fontWeight: '600', textAlign: 'right', flex: 1 },
  divider: { height: StyleSheet.hairlineWidth },
});
