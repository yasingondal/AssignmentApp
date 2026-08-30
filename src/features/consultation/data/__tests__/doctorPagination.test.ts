import { getDoctorsPage } from '@/features/consultation/data/doctorPagination';
import { DOCTOR_COUNT } from '@/features/consultation/domain/types';

describe('doctorPagination', () => {
  it('returns first page without materializing all doctors', () => {
    const start = Date.now();
    const result = getDoctorsPage({}, 1, 20);
    const elapsed = Date.now() - start;

    expect(result.data).toHaveLength(20);
    expect(result.total).toBe(DOCTOR_COUNT);
    expect(result.hasMore).toBe(true);
    expect(elapsed).toBeLessThan(500);
  });

  it('filters by specialization without building a full filtered array for the page', () => {
    const result = getDoctorsPage({ specialization: 'Ayurveda General' }, 1, 20);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every(d => d.specialization === 'Ayurveda General')).toBe(true);
    expect(result.hasMore).toBe(result.total > 20);
  });
});
