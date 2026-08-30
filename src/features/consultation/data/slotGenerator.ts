import { createSeededRandom, randomInt } from '@/core/utils/seededRandom';
import type { SlotStatus, TimeSlot } from '@/features/consultation/domain/types';

const slotCache = new Map<string, TimeSlot[]>();
const bookedSlots = new Set<string>();

export function generateSlotsForDoctor(doctorId: string): TimeSlot[] {
  if (slotCache.has(doctorId)) {
    return slotCache.get(doctorId)!;
  }

  const seed = doctorId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = createSeededRandom(seed);
  const slots: TimeSlot[] = [];
  const today = new Date();

  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = date.toISOString().split('T')[0]!;
    const numSlots = randomInt(rng, 4, 8);

    for (let s = 0; s < numSlots; s++) {
      const hour = 9 + s;
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour).padStart(2, '0')}:30`;
      const dateTime = `${dateStr}T${startTime}:00`;
      const slotId = `${doctorId}-slot-${day}-${s}`;

      let status: SlotStatus = 'available';
      if (bookedSlots.has(slotId)) {
        status = 'booked';
      } else if (new Date(dateTime).getTime() < Date.now()) {
        status = 'expired';
      } else if (rng() < 0.05) {
        status = 'booked';
      }

      slots.push({
        id: slotId,
        doctorId,
        date: dateStr,
        startTime,
        endTime,
        dateTime,
        status,
      });
    }
  }

  slotCache.set(doctorId, slots);
  return slots;
}

export function markSlotBooked(slotId: string): void {
  bookedSlots.add(slotId);
  for (const [doctorId, slots] of slotCache.entries()) {
    slotCache.set(
      doctorId,
      slots.map(s => (s.id === slotId ? { ...s, status: 'booked' as const } : s)),
    );
  }
}

export function isSlotBooked(slotId: string): boolean {
  return bookedSlots.has(slotId);
}

export function clearSlotCache(): void {
  slotCache.clear();
  bookedSlots.clear();
}

export function getSlotById(slotId: string): TimeSlot | undefined {
  for (const slots of slotCache.values()) {
    const found = slots.find(s => s.id === slotId);
    if (found) {
      return found;
    }
  }
  const doctorMatch = slotId.match(/^(doc-\d+)-slot/);
  if (doctorMatch) {
    const slots = generateSlotsForDoctor(doctorMatch[1]!);
    return slots.find(s => s.id === slotId);
  }
  return undefined;
}
