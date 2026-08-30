import React, { memo, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Card, Text } from '@/design-system/components';
import type { Attachment, HealthRecord } from '@/features/health-records/domain/types';
import { RECORD_TYPE_LABELS } from '@/features/health-records/domain/types';
import { RECORD_TYPE_COLORS, RECORD_TYPE_ICONS } from '@/features/health-records/domain/constants';
import { formatDate, parseDateParts } from '@/core/utils/dateGrouping';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { AttachmentPreviewModal } from '@/features/health-records/presentation/components/AttachmentPreviewModal';

interface HealthRecordItemProps {
  record: HealthRecord;
  index?: number;
  onPress?: (recordId: string) => void;
}

function formatDateParts(date: string): { day: string; month: string; year: string } {
  const { year, month, day } = parseDateParts(date);
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return {
    day: String(day).padStart(2, '0'),
    month: monthNames[month]!,
    year: String(year),
  };
}

export const HealthRecordItem = memo(function HealthRecordItem({
  record,
  onPress,
}: HealthRecordItemProps) {
  const { theme } = useTheme();
  const [preview, setPreview] = useState<Attachment | null>(null);
  const ignoreCardPressRef = React.useRef(false);
  const typeColor = RECORD_TYPE_COLORS[record.type];
  const attachmentCount = record.attachments?.length ?? 0;
  const dateParts = useMemo(() => formatDateParts(record.date), [record.date]);
  const previewAttachment = record.attachments?.[0];

  const openAttachment = (attachment: Attachment) => {
    ignoreCardPressRef.current = true;
    setPreview(attachment);
  };

  const handleCardPress = () => {
    if (ignoreCardPressRef.current) {
      ignoreCardPressRef.current = false;
      return;
    }
    onPress?.(record.id);
  };

  return (
    <>
      <Card
        onPress={onPress ? handleCardPress : undefined}
        style={[styles.card, { borderColor: theme.colors.borderLight }]}
        accessibilityLabel={`${RECORD_TYPE_LABELS[record.type]}: ${record.title}`}
      >
        <View style={[styles.accentBar, { backgroundColor: typeColor }]} />

        <View style={styles.inner}>
          <View style={styles.mainRow}>
            <Pressable
              onPress={previewAttachment ? () => openAttachment(previewAttachment) : undefined}
              disabled={!previewAttachment}
              accessibilityRole={previewAttachment ? 'button' : undefined}
              accessibilityLabel={previewAttachment ? `View ${previewAttachment.name}` : undefined}
              style={[styles.media, { backgroundColor: typeColor + '14', borderColor: typeColor + '33' }]}
            >
              {previewAttachment?.type === 'image' || previewAttachment?.thumbnailUrl ? (
                <Image
                  source={{ uri: previewAttachment.thumbnailUrl ?? previewAttachment.url }}
                  style={styles.mediaImage}
                  accessibilityLabel={previewAttachment.name}
                />
              ) : (
                <View style={styles.mediaFallback}>
                  <Text style={styles.mediaEmoji}>{RECORD_TYPE_ICONS[record.type]}</Text>
                </View>
              )}
              {previewAttachment?.type === 'pdf' ? (
                <View style={[styles.pdfCorner, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.pdfCornerText}>PDF</Text>
                </View>
              ) : null}
              {attachmentCount > 1 ? (
                <View style={[styles.mediaBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.mediaBadgeText}>+{attachmentCount - 1}</Text>
                </View>
              ) : null}
            </Pressable>

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Badge label={RECORD_TYPE_LABELS[record.type]} variant="gold" />
                <View style={[styles.datePill, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Text variant="caption" color="muted">{formatDate(record.date)}</Text>
                </View>
              </View>

              <Text variant="label" style={styles.title} numberOfLines={2}>
                {record.title}
              </Text>

              {record.provider ? (
                <Text variant="caption" color="secondary" numberOfLines={1} style={styles.provider}>
                  {record.provider}
                </Text>
              ) : null}

              {record.description ? (
                <Text variant="caption" color="muted" numberOfLines={2} style={styles.preview}>
                  {record.description}
                </Text>
              ) : null}
            </View>

            <View style={[styles.dateStack, { borderLeftColor: theme.colors.borderLight }]}>
              <Text variant="h3" style={[styles.dateDay, { color: theme.colors.primary }]}>
                {dateParts.day}
              </Text>
              <Text variant="caption" style={[styles.dateMonth, { color: theme.colors.accent }]}>
                {dateParts.month}
              </Text>
              <Text variant="caption" color="muted">{dateParts.year}</Text>
            </View>
          </View>

          {record.tags?.length ? (
            <View style={styles.tags}>
              {record.tags.slice(0, 4).map(tag => (
                <Badge key={tag} label={tag} variant="outline" />
              ))}
              {record.tags.length > 4 ? (
                <Badge label={`+${record.tags.length - 4}`} variant="outline" />
              ) : null}
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.footer}>
            <View style={styles.footerMeta}>
              {attachmentCount > 0 ? (
                <View style={styles.attachmentRow}>
                  {record.attachments!.slice(0, 3).map(att => (
                    <Pressable
                      key={att.id}
                      onPress={() => openAttachment(att)}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${att.name}`}
                      style={[styles.miniThumb, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}
                    >
                      {att.type === 'image' || att.thumbnailUrl ? (
                        <Image
                          source={{ uri: att.thumbnailUrl ?? att.url }}
                          style={styles.miniThumbImage}
                          accessibilityLabel={att.name}
                        />
                      ) : (
                        <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>PDF</Text>
                      )}
                    </Pressable>
                  ))}
                  <Text variant="caption" color="secondary" style={styles.attachmentLabel}>
                    {attachmentCount} attachment{attachmentCount === 1 ? '' : 's'} · tap to view
                  </Text>
                </View>
              ) : (
                <Text variant="caption" color="muted">No attachments</Text>
              )}
            </View>

            {onPress ? (
              <View style={[styles.actionChip, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }]}>
                <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                  Open
                </Text>
                <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>›</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>

      <AttachmentPreviewModal
        visible={Boolean(preview)}
        attachment={preview}
        attachments={record.attachments}
        onClose={() => setPreview(null)}
        onSelect={setPreview}
      />
    </>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 0, overflow: 'hidden' },
  accentBar: { height: 4, width: '100%' },
  inner: { padding: 14, gap: 12 },
  mainRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  media: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mediaEmoji: { fontSize: 28 },
  pdfCorner: {
    position: 'absolute',
    left: 6,
    top: 6,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pdfCornerText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  mediaBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  mediaBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  content: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  datePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  provider: { marginTop: 2 },
  preview: { lineHeight: 18, marginTop: 2 },
  dateStack: {
    alignItems: 'center',
    paddingLeft: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    minWidth: 52,
    gap: 1,
  },
  dateDay: { fontSize: 22, lineHeight: 24, fontWeight: '800' },
  dateMonth: { fontWeight: '800', letterSpacing: 0.6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  divider: { height: StyleSheet.hairlineWidth },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  footerMeta: { flex: 1, minWidth: 0 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniThumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniThumbImage: { width: '100%', height: '100%' },
  attachmentLabel: { flexShrink: 1 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
