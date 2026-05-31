import { createLocalId } from '@/storage/database/ids';
import { fromSQLiteBoolean, toSQLiteBoolean } from '@/storage/database/sqlite-mappers';
import { getDatabaseAsync } from '@/storage/database/client';

import type { HabitCompletion, UpsertHabitCompletionInput } from '../types';

type HabitCompletionRow = {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
  created_at: string;
  updated_at: string;
};

function mapHabitCompletionRow(row: HabitCompletionRow): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: fromSQLiteBoolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const HabitCompletionRepository = {
  async upsert(input: UpsertHabitCompletionInput): Promise<HabitCompletion> {
    const database = await getDatabaseAsync();
    const existing = await this.findByHabitAndDate(input.habitId, input.date);
    const now = new Date().toISOString();

    if (existing) {
      await database.runAsync(
        `UPDATE habit_completions
         SET completed = ?, updated_at = ?
         WHERE id = ?;`,
        toSQLiteBoolean(input.completed),
        now,
        existing.id
      );

      return {
        ...existing,
        completed: input.completed,
        updatedAt: now,
      };
    }

    const completion: HabitCompletion = {
      id: createLocalId('habit_completion'),
      habitId: input.habitId,
      date: input.date,
      completed: input.completed,
      createdAt: now,
      updatedAt: now,
    };

    await database.runAsync(
      `INSERT INTO habit_completions (
        id,
        habit_id,
        date,
        completed,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      completion.id,
      completion.habitId,
      completion.date,
      toSQLiteBoolean(completion.completed),
      completion.createdAt,
      completion.updatedAt
    );

    return completion;
  },

  async findByHabitAndDate(habitId: string, date: string): Promise<HabitCompletion | null> {
    const database = await getDatabaseAsync();
    const row = await database.getFirstAsync<HabitCompletionRow>(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?;',
      habitId,
      date
    );
    return row ? mapHabitCompletionRow(row) : null;
  },

  async listByHabitId(habitId: string): Promise<HabitCompletion[]> {
    const database = await getDatabaseAsync();
    const rows = await database.getAllAsync<HabitCompletionRow>(
      `SELECT * FROM habit_completions
       WHERE habit_id = ?
       ORDER BY date DESC;`,
      habitId
    );
    return rows.map(mapHabitCompletionRow);
  },

  async listByDateRange(startDate: string, endDate: string): Promise<HabitCompletion[]> {
    const database = await getDatabaseAsync();
    const rows = await database.getAllAsync<HabitCompletionRow>(
      `SELECT * FROM habit_completions
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC, habit_id ASC;`,
      startDate,
      endDate
    );
    return rows.map(mapHabitCompletionRow);
  },

  async deleteById(id: string): Promise<boolean> {
    const database = await getDatabaseAsync();
    const result = await database.runAsync('DELETE FROM habit_completions WHERE id = ?;', id);
    return result.changes > 0;
  },

  async deleteByHabitId(habitId: string): Promise<number> {
    const database = await getDatabaseAsync();
    const result = await database.runAsync('DELETE FROM habit_completions WHERE habit_id = ?;', habitId);
    return result.changes;
  },
};
