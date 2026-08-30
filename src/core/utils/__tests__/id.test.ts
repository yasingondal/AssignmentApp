import { generateId } from '@/core/utils/id';

describe('generateId', () => {
  it('returns unique string ids', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(8);
  });
});
