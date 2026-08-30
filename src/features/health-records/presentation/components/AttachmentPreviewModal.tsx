import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button } from '@/design-system/components';
import { useTheme } from '@/design-system/theme/ThemeContext';
import type { Attachment } from '@/features/health-records/domain/types';

interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  attachments?: Attachment[];
  visible: boolean;
  onClose: () => void;
  onSelect?: (attachment: Attachment) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AttachmentPreviewModal({
  attachment,
  attachments = [],
  visible,
  onClose,
  onSelect,
}: AttachmentPreviewModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);

  const siblings = useMemo(() => {
    if (!attachment) {
      return [];
    }
    return attachments.length ? attachments : [attachment];
  }, [attachment, attachments]);

  const currentIndex = attachment
    ? Math.max(0, siblings.findIndex(item => item.id === attachment.id))
    : 0;

  if (!attachment) {
    return null;
  }

  const previewUri =
    attachment.type === 'image'
      ? attachment.url
      : attachment.thumbnailUrl ?? attachment.url;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < siblings.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(8, 18, 14, 0.94)' }]}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.topCopy}>
            <Text variant="label" style={styles.lightText} numberOfLines={1}>
              {attachment.name}
            </Text>
            <Text variant="caption" style={styles.mutedLight}>
              {attachment.type === 'image' ? 'Image preview' : 'PDF preview'}
              {siblings.length > 1 ? ` · ${currentIndex + 1} of ${siblings.length}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          >
            <Text variant="label" style={styles.lightText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.viewer}
          maximumZoomScale={3}
          minimumZoomScale={1}
          centerContent
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {attachment.type === 'image' || attachment.thumbnailUrl ? (
            failed ? (
              <View style={[styles.fallbackCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={styles.fallbackIcon}>{attachment.type === 'pdf' ? '📄' : '🖼️'}</Text>
                <Text variant="h3">{attachment.name}</Text>
                <Text variant="bodySmall" color="secondary">
                  Preview could not be loaded
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: previewUri }}
                style={styles.largeImage}
                resizeMode="contain"
                accessibilityLabel={attachment.name}
                onError={() => setFailed(true)}
                onLoad={() => setFailed(false)}
              />
            )
          ) : (
            <View style={[styles.pdfCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.fallbackIcon}>📄</Text>
              <Text variant="h2" style={{ textAlign: 'center' }}>PDF Document</Text>
              <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
                {attachment.name}
              </Text>
              <View style={[styles.pdfBadge, { backgroundColor: theme.colors.accentMuted }]}>
                <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                  Full-page document preview
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {siblings.length > 1 ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button
              title="Previous"
              variant="outline"
              size="sm"
              disabled={!canGoPrev}
              onPress={() => {
                if (!canGoPrev) return;
                setFailed(false);
                onSelect?.(siblings[currentIndex - 1]!);
              }}
            />
            <Button
              title="Next"
              variant="gold"
              size="sm"
              disabled={!canGoNext}
              onPress={() => {
                if (!canGoNext) return;
                setFailed(false);
                onSelect?.(siblings[currentIndex + 1]!);
              }}
            />
          </View>
        ) : (
          <View style={[styles.footerSingle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button title="Done" variant="gold" fullWidth onPress={onClose} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topCopy: { flex: 1, gap: 2, minWidth: 0 },
  lightText: { color: '#FFFFFF' },
  mutedLight: { color: 'rgba(255,255,255,0.7)' },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viewer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: SCREEN_HEIGHT * 0.62,
  },
  largeImage: {
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.62,
    borderRadius: 12,
  },
  fallbackCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  pdfCard: {
    width: SCREEN_WIDTH - 48,
    minHeight: SCREEN_HEIGHT * 0.5,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pdfBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  fallbackIcon: { fontSize: 56 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  footerSingle: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
