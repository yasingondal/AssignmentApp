import { initMockApi } from '@/core/api/mockApiRouter';
import { healthRecordRepository } from '@/features/health-records/data/healthRecordRepository';

initMockApi();

describe('healthRecordRepository', () => {
  it('loads first page for timeline screen', async () => {
    const result = await healthRecordRepository.getRecords({ search: '' }, 1, 50);
    expect(result.data).toHaveLength(50);
    expect(result.data[0]?.id).toMatch(/^hr-/);
  });
});
