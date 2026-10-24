import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import { subscribeToAppEvent } from '@/shared/events/app-events';
import { createSharedReads } from '@/shared/services/shared-reads';

const reads = createSharedReads();
subscribeToAppEvent('habitsChanged', () => reads.invalidate());

export const invalidateHabitReads = reads.invalidate;
export function readHabits() {
  return reads.read('habits', () => HabitRepository.listVisibleForHistory());
}
export function readHabitCompletions(start: string, end: string) {
  return reads.read(`completions:${start}:${end}`, () => HabitCompletionRepository.listByDateRange(start, end));
}
