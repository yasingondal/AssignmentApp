export const HEALTH_RECORD_COUNT = 10000;

export const RECORD_TYPES = [
  'lab_report',
  'prescription',
  'consultation',
  'vaccination',
  'allergy',
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  lab_report: 'Lab Report',
  prescription: 'Prescription',
  consultation: 'Consultation',
  vaccination: 'Vaccination',
  allergy: 'Allergy',
};

export interface Attachment {
  id: string;
  type: 'image' | 'pdf';
  url: string;
  name: string;
  thumbnailUrl?: string;
}

export interface HealthRecord {
  id: string;
  type: RecordType;
  title: string;
  description: string;
  date: string;
  provider?: string;
  tags: string[];
  attachments: Attachment[];
  metadata: Record<string, string>;
}

export interface HealthRecordFilters {
  search?: string;
  type?: RecordType;
  startDate?: string;
  endDate?: string;
  /** Calendar year, e.g. 2026 */
  year?: number;
  /** 0-indexed month (0 = January) */
  month?: number;
  tags?: string[];
}
