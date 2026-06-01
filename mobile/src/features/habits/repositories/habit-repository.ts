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
  reminder_time: string | null;
  reminders_enabled: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: optionalString(row.description),
    recurrenceType: row.recurrence_type,
    customIntervalDays: row.custom_interval_days ?? undefined,
    reminderTime: optionalString(row.reminder_time),
    remindersEnabled: fromSQLiteBoolean(row.reminders_enabled),
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
      reminderTime: input.reminderTime,
      remindersEnabled: input.remindersEnabled ?? false,
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
        reminder_time,
        reminders_enabled,
        is_active,
        created_at,
        updated_at,
        deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      habit.id,
      habit.name,
      nullableString(habit.description),
      habit.recurrenceType,
      habit.customIntervalDays ?? null,
      nullableString(habit.reminderTime),
      toSQLiteBoolean(habit.remindersEnabled),
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
           reminder_time = ?,
           reminders_enabled = ?,
           is_active = ?,
           updated_at = ?,
           deleted_at = ?
       WHERE id = ?;`,
      next.name,
      nullableString(next.description),
      next.recurrenceType,
      next.customIntervalDays ?? null,
      nullableString(next.reminderTime),
      toSQLiteBoolean(next.remindersEnabled),
      toSQLiteBoolean(next.isActive),
      next.updatedAt,
      nullableString(next.deletedAt),
      id
    );

    return next;
  },

  async deleteById(id: string): Promise<boolean> {
    const database = await getDatabaseAsync();
    const result = await database.runAsync('DELETE FROM habits WHERE id = ?;', id);
    return result.changes > 0;
  },
};
