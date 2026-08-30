import type { PaginatedResponse } from '@/core/api/types';
import {
  doctorMatchesFilters,
  hasDoctorFilters,
} from '@/features/consultation/domain/doctorFilters';
import type { Doctor, DoctorFilters } from '@/features/consultation/domain/types';
import { generateDoctor, getAllDoctorIndices } from '@/features/consultation/data/doctorGenerator';

/**
 * Streams a page of doctors without materializing the full 5K filtered array.
 * Unfiltered path is O(pageSize); filtered path scans indices until the page is filled
 * and continues only far enough to compute `total`/`hasMore`.
 */
export function getDoctorsPage(
  filters: DoctorFilters,
  page: number,
  pageSize: number,
): PaginatedResponse<Doctor> {
  const indices = getAllDoctorIndices();
  const skip = (page - 1) * pageSize;

  if (!hasDoctorFilters(filters)) {
    const slice = indices.slice(skip, skip + pageSize);
    return {
      data: slice.map(generateDoctor),
      total: indices.length,
      page,
      pageSize,
      hasMore: skip + pageSize < indices.length,
    };
  }

  const data: Doctor[] = [];
  let matchCount = 0;

  for (const index of indices) {
    const doctor = generateDoctor(index);
    if (!doctorMatchesFilters(doctor, filters)) {
      continue;
    }

    if (matchCount >= skip && data.length < pageSize) {
      data.push(doctor);
    }
    matchCount++;
  }

  return {
    data,
    total: matchCount,
    page,
    pageSize,
    hasMore: matchCount > skip + data.length,
  };
}
