import {
  createSeededRandom,
  pick,
  pickN,
  randomFloat,
  randomInt,
} from '@/core/utils/seededRandom';
import {
  HEALTH_RECORD_COUNT,
  RECORD_TYPES,
  type HealthRecord,
  type RecordType,
} from '@/features/health-records/domain/types';
import { HEALTH_TAG_POOL } from '@/features/health-records/domain/constants';

const PROVIDERS = [
  'Dr. Sharma', 'Dr. Patel', 'Apollo Diagnostics', 'Max Lab',
  'Fortis Hospital', 'AIIMS Delhi', 'City Clinic', 'Wellness Center',
];

const TITLES: Record<RecordType, string[]> = {
  lab_report: ['Complete Blood Count', 'Lipid Profile', 'Thyroid Panel', 'Liver Function Test', 'Vitamin D Test'],
  prescription: ['Ayurvedic Medicine', 'Herbal Supplements', 'Pain Relief', 'Digestive Care', 'Skin Treatment'],
  consultation: ['General Checkup', 'Follow-up Visit', 'Specialist Consultation', 'Teleconsultation', 'Wellness Review'],
  vaccination: ['COVID-19 Booster', 'Flu Vaccine', 'Hepatitis B', 'Tetanus', 'Typhoid'],
  allergy: ['Pollen Allergy', 'Food Allergy', 'Drug Allergy', 'Dust Mite', 'Latex Sensitivity'],
};

const LAB_MARKERS = ['Hemoglobin', 'Cholesterol', 'TSH', 'ALT', 'Vitamin D'];
const MEDICATIONS = ['Ashwagandha', 'Triphala', 'Brahmi', 'Turmeric Capsule', 'Neem Extract'];
const SPECIALTIES = ['Ayurveda General', 'Panchakarma', 'Dermatology', 'Pediatrics', 'Cardiology'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe'];
const DOSE_NUMBERS = ['1', '2', '3', 'Booster'];

const recordCache = new Map<number, HealthRecord>();

/** Timeline anchor: newest records start in Aug 2026 and go backward. */
const TIMELINE_END = Date.UTC(2026, 7, 31, 12, 0, 0); // 31 Aug 2026
const TIMELINE_SPAN_DAYS = 5 * 365; // ~5 years → 2026 down through 2021

export function clearHealthRecordCache(): void {
  recordCache.clear();
}

function buildTypeMetadata(type: RecordType, title: string, rng: () => number): Record<string, string> {
  switch (type) {
    case 'lab_report':
      return {
        test_name: title,
        marker: pick(rng, LAB_MARKERS),
        result_value: `${randomFloat(rng, 3, 180, 1)}`,
        unit: pick(rng, ['mg/dL', 'g/dL', 'IU/L', 'ng/mL']),
        reference_range: 'Within lab reference range',
        status: pick(rng, ['Normal', 'Borderline', 'Follow-up advised']),
      };
    case 'prescription':
      return {
        medication: pick(rng, MEDICATIONS),
        dosage: pick(rng, ['1 tablet twice daily', '5 ml after meals', '2 capsules at night']),
        duration: pick(rng, ['7 days', '14 days', '30 days']),
        instructions: 'Take with warm water after food',
        refill: pick(rng, ['Not required', '1 refill allowed']),
      };
    case 'consultation':
      return {
        specialty: pick(rng, SPECIALTIES),
        mode: pick(rng, ['In-person', 'Video', 'Phone']),
        chief_complaint: pick(rng, ['Fatigue', 'Digestion', 'Skin concern', 'Immunity', 'Stress']),
        follow_up: pick(rng, ['2 weeks', '1 month', 'As needed']),
        notes: 'Lifestyle and diet guidance provided',
      };
    case 'vaccination':
      return {
        vaccine_name: title,
        dose: pick(rng, DOSE_NUMBERS),
        site: pick(rng, ['Left arm', 'Right arm']),
        lot_number: `LOT-${randomInt(rng, 10000, 99999)}`,
        next_due: pick(rng, ['Not scheduled', 'After 6 months', 'Annual']),
      };
    case 'allergy':
      return {
        allergen: title.replace(' Allergy', '').replace(' Sensitivity', ''),
        severity: pick(rng, SEVERITIES),
        reaction: pick(rng, ['Rash', 'Itching', 'Sneezing', 'Swelling', 'GI discomfort']),
        onset: pick(rng, ['Childhood', 'Adult onset', 'Recent']),
        status: pick(rng, ['Active', 'Managed', 'Resolved']),
      };
    default:
      return {};
  }
}

function buildDescription(type: RecordType, title: string, dateStr: string, metadata: Record<string, string>): string {
  switch (type) {
    case 'lab_report':
      return `${title} from ${dateStr}. ${metadata.marker} measured ${metadata.result_value} ${metadata.unit} (${metadata.status}).`;
    case 'prescription':
      return `${title} issued on ${dateStr}. ${metadata.medication} — ${metadata.dosage} for ${metadata.duration}.`;
    case 'consultation':
      return `${title} on ${dateStr} (${metadata.mode}). Specialty: ${metadata.specialty}. Complaint: ${metadata.chief_complaint}.`;
    case 'vaccination':
      return `${title} administered on ${dateStr}. Dose ${metadata.dose}, lot ${metadata.lot_number}.`;
    case 'allergy':
      return `${title} documented on ${dateStr}. Severity ${metadata.severity} with ${metadata.reaction}. Status: ${metadata.status}.`;
    default:
      return `${title} record from ${dateStr}.`;
  }
}

export function generateHealthRecord(index: number): HealthRecord {
  if (recordCache.has(index)) {
    return recordCache.get(index)!;
  }

  const rng = createSeededRandom(index * 6271 + 99);
  // Evenly cycle all five patient record types across the timeline.
  const type = RECORD_TYPES[(index - 1) % RECORD_TYPES.length]!;
  const title = pick(rng, TITLES[type]);
  const daysAgo = randomInt(rng, 0, TIMELINE_SPAN_DAYS);
  const date = new Date(TIMELINE_END - daysAgo * 24 * 60 * 60 * 1000);
  const dateStr = date.toISOString().split('T')[0]!;
  const numTags = randomInt(rng, 1, 3);
  const tags = pickN(rng, HEALTH_TAG_POOL, numTags);
  const hasAttachments = type === 'lab_report' || type === 'prescription' ? rng() > 0.2 : rng() > 0.45;
  const numAttachments = hasAttachments ? randomInt(rng, 1, 2) : 0;
  const attachments = Array.from({ length: numAttachments }, (_, i) => {
    const isPdf = type === 'lab_report' || type === 'prescription' ? rng() > 0.35 : rng() > 0.55;
    const thumb = `https://picsum.photos/seed/thumb${index}${i}/100/100`;
    const fullImage = `https://picsum.photos/seed/hr${index}${i}/900/1200`;
    return {
      id: `att-${index}-${i}`,
      type: isPdf ? ('pdf' as const) : ('image' as const),
      url: isPdf ? `https://picsum.photos/seed/pdf${index}${i}/900/1200` : fullImage,
      name: isPdf ? `${type}_${index}.pdf` : `Image_${index}_${i + 1}.jpg`,
      thumbnailUrl: isPdf ? `https://picsum.photos/seed/pdf${index}${i}/300/400` : thumb,
    };
  });

  const typeMetadata = buildTypeMetadata(type, title, rng);
  const metadata: Record<string, string> = {
    source: 'amrutam-health',
    version: '1',
    record_category: type,
    ...typeMetadata,
  };

  const record: HealthRecord = {
    id: `hr-${index}`,
    type,
    title,
    description: buildDescription(type, title, dateStr, typeMetadata),
    date: dateStr,
    provider: type !== 'allergy' ? pick(rng, PROVIDERS) : undefined,
    tags,
    attachments,
    metadata,
  };

  recordCache.set(index, record);
  return record;
}

export function getAllRecordIndices(): number[] {
  return Array.from({ length: HEALTH_RECORD_COUNT }, (_, i) => i + 1);
}

export function getHealthRecordById(id: string): HealthRecord | undefined {
  const match = id.match(/^hr-(\d+)$/);
  if (!match) {
    return undefined;
  }
  const index = parseInt(match[1]!, 10);
  if (index < 1 || index > HEALTH_RECORD_COUNT) {
    return undefined;
  }
  return generateHealthRecord(index);
}
