import { generateHealthRecord, getAllRecordIndices } from '@/features/health-records/data/recordGenerator';
import { filterHealthRecords } from '@/features/health-records/domain/recordFilters';
import { RECORD_TYPES } from '@/features/health-records/domain/types';
import { RECORD_TYPE_DETAIL_FIELDS } from '@/features/health-records/domain/constants';

describe('patient timeline record types', () => {
  it('generates all five required record types evenly', () => {
    const sample = getAllRecordIndices().slice(0, 50).map(generateHealthRecord);
    const types = new Set(sample.map(record => record.type));
    expect([...types].sort()).toEqual([...RECORD_TYPES].sort());

    for (const type of RECORD_TYPES) {
      expect(sample.filter(record => record.type === type).length).toBe(10);
    }
  });

  it('supports filtering the timeline by each record type', () => {
    const records = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(generateHealthRecord);
    for (const type of RECORD_TYPES) {
      const filtered = filterHealthRecords(records, { type });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(record => record.type === type)).toBe(true);
    }
  });

  it('includes type-specific metadata for each record type', () => {
    for (let i = 1; i <= 5; i++) {
      const record = generateHealthRecord(i);
      const fields = RECORD_TYPE_DETAIL_FIELDS[record.type];
      for (const field of fields) {
        expect(record.metadata[field]).toBeTruthy();
      }
      expect(record.metadata.record_category).toBe(record.type);
    }
  });
});
