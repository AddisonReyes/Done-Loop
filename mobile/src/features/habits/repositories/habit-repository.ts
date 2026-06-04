import { createLocalId } from '@/storage/database/ids';
import {
  fromSQLiteBoolean,
  nullableString,
  optionalString,
  toSQLiteBoolean,
} from '@/storage/database/sqlite-mappers';
import { getDatabaseAsync } from '@/storage/database/client';

import type { CreateHabitInput, Habit, HabitRecurrenceType, UpdateHabitInput } from '../types';

type HabitRow = {
  id: string;
  name: string;
  description: string | null;
  recurrence_type: HabitRecurrenceType;
  custom_interval_days: number | null;
  weekly_days?: string | null;
  monthly_days?: string | null;
  reminder_time: string | null;
  reminders_enabled: number;
  notification_id?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function serializeNumberList(values: number[] | undefined): string | null {
  return values && values.length > 0 ? JSON.stringify(values) : null;
}

function parseNumberList(value: string | null | undefined): number[] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => Number.isInteger(item))
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: optionalString(row.description),
    recurrenceType: row.recurrence_type,
    customIntervalDays: row.custom_interval_days ?? undefined,
    weeklyDays: parseNumberList(row.weekly_days),
    monthlyDays: parseNumberList(row.monthly_days),
    reminderTime: optionalString(row.reminder_time),
    remindersEnabled: fromSQLiteBoolean(row.reminders_enabled),
    notificationId: optionalString(row.notification_id ?? null),
    isActive: fromSQLiteBoolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: optionalString(row.deleted_at),
  };
}

export const HabitRepository = {
  async create(input: CreateHabitInput): Promise<Habit> {
    const database = await getDatabaseAsync();
    const now = new Date().toISOString();
    const habit: Habit = {
      id: createLocalId('habit'),
      name: input.name,
      description: input.description,
      recurrenceType: input.recurrenceType,
      customIntervalDays: input.customIntervalDays,
      weeklyDays: input.weeklyDays,
      monthlyDays: input.monthlyDays,
      reminderTime: input.reminderTime,
      remindersEnabled: input.remindersEnabled ?? false,
      notificationId: input.notificationId,
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await database.runAsync(
      `INSERT INTO habits (
        id,
        name,
        description,
        recurrence_type,
        custom_interval_days,
        weekly_days,
        monthly_days,
        reminder_time,
        reminders_enabled,
        notification_id,
        is_active,
        created_at,
        updated_at,
        deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      habit.id,
      habit.name,
      nullableString(habit.description),
      habit.recurrenceType,
      habit.customIntervalDays ?? null,
      serializeNumberList(habit.weeklyDays),
      serializeNumberList(habit.monthlyDays),
      nullableString(habit.reminderTime),
      toSQLiteBoolean(habit.remindersEnabled),
      nullableString(habit.notificationId),
      toSQLiteBoolean(habit.isActive),
      habit.createdAt,
      habit.updatedAt,
      nullableString(habit.deletedAt)
    );

    return habit;
  },

  async listAll(): Promise<Habit[]> {
    const database = await getDatabaseAsync();
    const rows = await database.getAllAsync<HabitRow>(
      'SELECT * FROM habits ORDER BY created_at DESC;'
    );
    return rows.map(mapHabitRow);
  },

  async listActive(): Promise<Habit[]> {
    const database = await getDatabaseAsync();
    const rows = await database.getAllAsync<HabitRow>(
      `SELECT * FROM habits
       WHERE is_active = 1 AND deleted_at IS NULL
       ORDER BY created_at DESC;`
    );
    return rows.map(mapHabitRow);
  },

  async findById(id: string): Promise<Habit | null> {
    const database = await getDatabaseAsync();
    const row = await database.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?;', id);
    return row ? mapHabitRow(row) : null;
  },

  async update(id: string, input: UpdateHabitInput): Promise<Habit | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const database = await getDatabaseAsync();
    const next: Habit = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await database.runAsync(
      `UPDATE habits
       SET name = ?,
           description = ?,
           recurrence_type = ?,
           custom_interval_days = ?,
           weekly_days = ?,
           monthly_days = ?,
           reminder_time = ?,
           reminders_enabled = ?,
           notification_id = ?,
           is_active = ?,
           updated_at = ?,
           deleted_at = ?
       WHERE id = ?;`,
      next.name,
      nullableString(next.description),
      next.recurrenceType,
      next.customIntervalDays ?? null,
      serializeNumberList(next.weeklyDays),
      serializeNumberList(next.monthlyDays),
      nullableString(next.reminderTime),
      toSQLiteBoolean(next.remindersEnabled),
      nullableString(next.notificationId),
      toSQLiteBoolean(next.isActive),
      next.updatedAt,
      nullableString(next.deletedAt),
      id
    );

    return next;
  },

  async deleteById(id: string): Promise<boolean> {
    const database = await getDatabaseAsync();
    const now = new Date().toISOString();
    const result = await database.runAsync(
      `UPDATE habits
       SET is_active = 0, deleted_at = ?, updated_at = ?
       WHERE id = ?;`,
      now,
      now,
      id
    );
    return result.changes > 0;
  },
};
