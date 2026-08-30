export const DOCTOR_COUNT = 5000;

export const SPECIALIZATIONS = [
  'Ayurveda General',
  'Panchakarma',
  'Dermatology',
  'Gynecology',
  'Pediatrics',
  'Orthopedics',
  'Cardiology',
  'Neurology',
  'Gastroenterology',
  'Psychiatry',
] as const;

export const LANGUAGES = ['Hindi', 'English', 'Sanskrit', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati'] as const;

export const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];
export type Language = (typeof LANGUAGES)[number];

export interface Doctor {
  id: string;
  name: string;
  avatar: string;
  specialization: Specialization;
  experience: number;
  rating: number;
  consultationFee: number;
  languages: Language[];
  location: string;
  availability: boolean;
  description: string;
}

export type SlotStatus = 'available' | 'expired' | 'booked' | 'conflict';

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  dateTime: string;
  status: SlotStatus;
}

export type BookingStatus =
  | 'pending'
  | 'syncing'
  | 'confirmed'
  | 'failed'
  | 'conflict'
  | 'expired'
  | 'cancelled';

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  status: BookingStatus;
  createdAt: string;
  idempotencyKey?: string;
  failureReason?: string;
}

export type DoctorSortOption = 'rating' | 'experience' | 'fee_asc' | 'fee_desc' | 'name';

export interface DoctorFilters {
  search?: string;
  specialization?: Specialization;
  minExperience?: number;
  minRating?: number;
  maxFee?: number;
  language?: Language;
  availabilityOnly?: boolean;
}

export interface CreateBookingPayload {
  doctorId: string;
  slotId: string;
  idempotencyKey: string;
}
