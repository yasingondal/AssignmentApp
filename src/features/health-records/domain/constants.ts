import type { RecordType } from '@/features/health-records/domain/types';

export const HEALTH_TAG_POOL = [
  'routine', 'urgent', 'follow-up', 'annual', 'chronic',
  'acute', 'preventive', 'ayurvedic', 'allergy', 'immunity',
] as const;

export const RECORD_TYPE_ICONS: Record<RecordType, string> = {
  lab_report: '🧪',
  prescription: '💊',
  consultation: '🩺',
  vaccination: '💉',
  allergy: '🌿',
};

export const RECORD_TYPE_COLORS: Record<RecordType, string> = {
  lab_report: '#3D6B8E',
  prescription: '#1B7A5A',
  consultation: '#0F3D32',
  vaccination: '#7A5C00',
  allergy: '#C0392B',
};

/** Human-readable labels for type-specific metadata shown on the detail screen. */
export const RECORD_TYPE_DETAIL_FIELDS: Record<RecordType, string[]> = {
  lab_report: ['test_name', 'marker', 'result_value', 'unit', 'reference_range', 'status'],
  prescription: ['medication', 'dosage', 'duration', 'instructions', 'refill'],
  consultation: ['specialty', 'mode', 'chief_complaint', 'follow_up', 'notes'],
  vaccination: ['vaccine_name', 'dose', 'site', 'lot_number', 'next_due'],
  allergy: ['allergen', 'severity', 'reaction', 'onset', 'status'],
};

export const RECORD_TYPE_SECTION_TITLES: Record<RecordType, string> = {
  lab_report: 'Lab results',
  prescription: 'Prescription details',
  consultation: 'Consultation notes',
  vaccination: 'Vaccination details',
  allergy: 'Allergy profile',
};
