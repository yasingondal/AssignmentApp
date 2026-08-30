import { filterDoctors, sortDoctors } from '@/features/consultation/domain/doctorFilters';
import { generateDoctor } from '@/features/consultation/data/doctorGenerator';
import type { Doctor } from '@/features/consultation/domain/types';

describe('filterDoctors', () => {
  const doctors: Doctor[] = [1, 2, 3, 4, 5].map(generateDoctor);

  it('filters by search query on name', () => {
    const firstName = doctors[0]!.name.split(' ')[1]!;
    const result = filterDoctors(doctors, { search: firstName });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(d => d.name.toLowerCase().includes(firstName.toLowerCase()))).toBe(true);
  });

  it('filters by specialization', () => {
    const spec = doctors[0]!.specialization;
    const result = filterDoctors(doctors, { specialization: spec });
    expect(result.every(d => d.specialization === spec)).toBe(true);
  });

  it('filters by min rating', () => {
    const result = filterDoctors(doctors, { minRating: 4.5 });
    expect(result.every(d => d.rating >= 4.5)).toBe(true);
  });

  it('filters by max fee', () => {
    const result = filterDoctors(doctors, { maxFee: 500 });
    expect(result.every(d => d.consultationFee <= 500)).toBe(true);
  });

  it('filters by availability', () => {
    const result = filterDoctors(doctors, { availabilityOnly: true });
    expect(result.every(d => d.availability)).toBe(true);
  });

  it('sorts by rating descending', () => {
    const sorted = sortDoctors(doctors, 'rating');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.rating).toBeLessThanOrEqual(sorted[i - 1]!.rating);
    }
  });

  it('sorts by experience descending', () => {
    const sorted = sortDoctors(doctors, 'experience');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.experience).toBeLessThanOrEqual(sorted[i - 1]!.experience);
    }
  });

  it('sorts by fee ascending and descending', () => {
    const lowToHigh = sortDoctors(doctors, 'fee_asc');
    const highToLow = sortDoctors(doctors, 'fee_desc');
    for (let i = 1; i < lowToHigh.length; i++) {
      expect(lowToHigh[i]!.consultationFee).toBeGreaterThanOrEqual(lowToHigh[i - 1]!.consultationFee);
    }
    for (let i = 1; i < highToLow.length; i++) {
      expect(highToLow[i]!.consultationFee).toBeLessThanOrEqual(highToLow[i - 1]!.consultationFee);
    }
  });

  it('sorts by name alphabetically', () => {
    const sorted = sortDoctors(doctors, 'name');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.name.localeCompare(sorted[i - 1]!.name)).toBeGreaterThanOrEqual(0);
    }
  });
});
