import {
  createSeededRandom,
  pick,
  pickN,
  randomFloat,
  randomInt,
} from '@/core/utils/seededRandom';
import {
  CITIES,
  DOCTOR_COUNT,
  LANGUAGES,
  SPECIALIZATIONS,
  type Doctor,
  type Language,
  type Specialization,
} from '@/features/consultation/domain/types';

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Kavya', 'Arjun', 'Meera',
  'Sanjay', 'Divya', 'Rajesh', 'Sunita', 'Amit', 'Neha', 'Suresh', 'Pooja',
  'Deepak', 'Lakshmi', 'Ravi', 'Shreya', 'Manoj', 'Rekha', 'Nitin', 'Swati',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Gupta', 'Singh', 'Reddy', 'Iyer', 'Nair', 'Joshi',
  'Verma', 'Rao', 'Desai', 'Mehta', 'Chopra', 'Malhotra', 'Agarwal', 'Pillai',
];

const doctorCache = new Map<number, Doctor>();

export function generateDoctor(index: number): Doctor {
  if (doctorCache.has(index)) {
    return doctorCache.get(index)!;
  }

  const rng = createSeededRandom(index * 7919 + 42);
  const firstName = pick(rng, FIRST_NAMES);
  const lastName = pick(rng, LAST_NAMES);
  const specialization = pick(rng, SPECIALIZATIONS) as Specialization;
  const experience = randomInt(rng, 2, 35);
  const rating = randomFloat(rng, 3.5, 5.0, 1);
  const consultationFee = randomInt(rng, 300, 2500);
  const numLanguages = randomInt(rng, 1, 3);
  const languages = pickN(rng, LANGUAGES, numLanguages) as Language[];
  const location = pick(rng, CITIES);
  const availability = rng() > 0.15;

  const doctor: Doctor = {
    id: `doc-${index}`,
    name: `Dr. ${firstName} ${lastName}`,
    avatar: `https://i.pravatar.cc/150?u=doc${index}`,
    specialization,
    experience,
    rating,
    consultationFee,
    languages,
    location,
    availability,
    description: `Experienced ${specialization} practitioner with ${experience} years of expertise in Ayurvedic medicine. Specializes in holistic wellness and personalized treatment plans.`,
  };

  doctorCache.set(index, doctor);
  return doctor;
}

export function getAllDoctorIndices(): number[] {
  return Array.from({ length: DOCTOR_COUNT }, (_, i) => i + 1);
}

export function getDoctorById(id: string): Doctor | undefined {
  const match = id.match(/^doc-(\d+)$/);
  if (!match) {
    return undefined;
  }
  const index = parseInt(match[1]!, 10);
  if (index < 1 || index > DOCTOR_COUNT) {
    return undefined;
  }
  return generateDoctor(index);
}

export function clearDoctorCache(): void {
  doctorCache.clear();
}
