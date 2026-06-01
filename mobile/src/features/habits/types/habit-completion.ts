export type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertHabitCompletionInput = {
  habitId: string;
  date: string;
  completed: boolean;
};
