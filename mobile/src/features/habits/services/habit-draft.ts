import { TextLimits } from '@/shared/constants/text-limits';

import type { CreateHabitInput, UpdateHabitInput } from '../types';

export function isReminderTime(value: string | undefined): value is string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function normalizeCustomIntervalDays(value: number | undefined): number | undefined {
  if (!Number.isInteger(value) || value === undefined) {
    return undefined;
  }

  return value > 0 ? value : undefined;
}

export function normalizeHabitCreateDraft(input: CreateHabitInput): CreateHabitInput | null {
  const name = input.name.trim().slice(0, TextLimits.title);
  const description = input.description?.trim().slice(0, TextLimits.description);

  if (!name) {
    return null;
  }

  return {
    ...input,
    name,
    description: description || undefined,
    customIntervalDays: normalizeCustomIntervalDays(input.customIntervalDays),
    reminderTime: isReminderTime(input.reminderTime) ? input.reminderTime : undefined,
    isActive: input.isActive ?? true,
  };
}

export function normalizeHabitUpdateDraft(input: UpdateHabitInput): UpdateHabitInput | null {
  const name = input.name?.trim().slice(0, TextLimits.title);
  const description = input.description?.trim().slice(0, TextLimits.description);

  if (input.name !== undefined && !name) {
    return null;
  }

  return {
    ...input,
    name,
    description: description || undefined,
    customIntervalDays: normalizeCustomIntervalDays(input.customIntervalDays),
    reminderTime: isReminderTime(input.reminderTime) ? input.reminderTime : undefined,
  };
}

