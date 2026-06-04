export type HabitRecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export type Habit = {
  id: string;
  name: string;
  description?: string;
  recurrenceType: HabitRecurrenceType;
  customIntervalDays?: number;
  weeklyDays?: number[];
  monthlyDays?: number[];
  reminderTime?: string;
  remindersEnabled: boolean;
  notificationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type CreateHabitInput = {
  name: string;
  description?: string;
  recurrenceType: HabitRecurrenceType;
  customIntervalDays?: number;
  weeklyDays?: number[];
  monthlyDays?: number[];
  reminderTime?: string;
  remindersEnabled?: boolean;
  notificationId?: string;
  isActive?: boolean;
};

export type UpdateHabitInput = Partial<CreateHabitInput> & {
  deletedAt?: string;
};
