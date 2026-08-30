import type { Doctor, DoctorFilters, DoctorSortOption } from '@/features/consultation/domain/types';

export function hasDoctorFilters(filters: DoctorFilters): boolean {
  return Boolean(
    filters.search?.trim() ||
      filters.specialization ||
      filters.minExperience !== undefined ||
      filters.minRating !== undefined ||
      filters.maxFee !== undefined ||
      filters.language ||
      filters.availabilityOnly,
  );
}

export function doctorMatchesFilters(doctor: Doctor, filters: DoctorFilters): boolean {
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    const matches =
      doctor.name.toLowerCase().includes(q) ||
      doctor.specialization.toLowerCase().includes(q) ||
      doctor.location.toLowerCase().includes(q);
    if (!matches) {
      return false;
    }
  }

  if (filters.specialization && doctor.specialization !== filters.specialization) {
    return false;
  }
  if (filters.minExperience !== undefined && doctor.experience < filters.minExperience) {
    return false;
  }
  if (filters.minRating !== undefined && doctor.rating < filters.minRating) {
    return false;
  }
  if (filters.maxFee !== undefined && doctor.consultationFee > filters.maxFee) {
    return false;
  }
  if (filters.language && !doctor.languages.includes(filters.language)) {
    return false;
  }
  if (filters.availabilityOnly && !doctor.availability) {
    return false;
  }

  return true;
}

export function filterDoctors(doctors: Doctor[], filters: DoctorFilters): Doctor[] {
  if (!hasDoctorFilters(filters)) {
    return doctors;
  }
  return doctors.filter(doctor => doctorMatchesFilters(doctor, filters));
}

function compareId(a: { id: string }, b: { id: string }): number {
  return a.id.localeCompare(b.id);
}

export function sortDoctors(doctors: Doctor[], sort: DoctorSortOption): Doctor[] {
  const copy = [...doctors];
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || compareId(a, b));
    case 'experience':
      return copy.sort((a, b) => b.experience - a.experience || compareId(a, b));
    case 'fee_asc':
      return copy.sort((a, b) => a.consultationFee - b.consultationFee || compareId(a, b));
    case 'fee_desc':
      return copy.sort((a, b) => b.consultationFee - a.consultationFee || compareId(a, b));
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name) || compareId(a, b));
    default:
      return copy;
  }
}

export function getFilterOptions(doctors: Doctor[]) {
  return {
    specializations: [...new Set(doctors.map(d => d.specialization))].sort(),
    languages: [...new Set(doctors.flatMap(d => d.languages))].sort(),
    maxFee: Math.max(...doctors.map(d => d.consultationFee), 0),
  };
}
