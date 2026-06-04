import { TextLimits } from '@/shared/constants/text-limits';

import type { CreateHabitInput, UpdateHabitInput } from '../types';

const weeklyDayMin = 1;
const weeklyDayMax = 7;
const monthlyDayMin = 1;
const monthlyDayMax = 31;

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

function normalizeDayList(values: number[] | undefined, min: number, max: number): number[] | undefined {
  if (!values) {
    return undefined;
  }

  const normalized = [...new Set(values)]
    .filter((value) => Number.isInteger(value) && value >= min && value <= max)
    .sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCreateRecurrence(input: CreateHabitInput): Pick<
  CreateHabitInput,
  'customIntervalDays' | 'weeklyDays' | 'monthlyDays'
> {
  if (input.recurrenceType === 'weekly') {
    return {
      customIntervalDays: undefined,
      weeklyDays: normalizeDayList(input.weeklyDays, weeklyDayMin, weeklyDayMax),
      monthlyDays: undefined,
    };
  }

  if (input.recurrenceType === 'monthly') {
    return {
      customIntervalDays: undefined,
      weeklyDays: undefined,
      monthlyDays: normalizeDayList(input.monthlyDays, monthlyDayMin, monthlyDayMax),
    };
  }

  if (input.recurrenceType === 'custom') {
    return {
      customIntervalDays: normalizeCustomIntervalDays(input.customIntervalDays),
      weeklyDays: undefined,
      monthlyDays: undefined,
    };
  }

  return {
    customIntervalDays: undefined,
    weeklyDays: undefined,
    monthlyDays: undefined,
  };
}

function normalizeUpdateRecurrence(input: UpdateHabitInput): Pick<
  UpdateHabitInput,
  'customIntervalDays' | 'weeklyDays' | 'monthlyDays'
> {
  if (!input.recurrenceType) {
    const recurrence: Pick<UpdateHabitInput, 'customIntervalDays' | 'weeklyDays' | 'monthlyDays'> = {};

    if ('customIntervalDays' in input) {
      recurrence.customIntervalDays = normalizeCustomIntervalDays(input.customIntervalDays);
    }

    if ('weeklyDays' in input) {
      recurrence.weeklyDays = normalizeDayList(input.weeklyDays, weeklyDayMin, weeklyDayMax);
    }

    if ('monthlyDays' in input) {
      recurrence.monthlyDays = normalizeDayList(input.monthlyDays, monthlyDayMin, monthlyDayMax);
    }

    return recurrence;
  }

  return normalizeCreateRecurrence(input as CreateHabitInput);
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
    ...normalizeCreateRecurrence(input),
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

  const draft: UpdateHabitInput = {
    ...input,
    ...normalizeUpdateRecurrence(input),
  };

  if ('name' in input) {
    draft.name = name;
  }

  if ('description' in input) {
    draft.description = description || undefined;
  }

  if ('reminderTime' in input) {
    draft.reminderTime = isReminderTime(input.reminderTime) ? input.reminderTime : undefined;
  }

  return draft;
}
