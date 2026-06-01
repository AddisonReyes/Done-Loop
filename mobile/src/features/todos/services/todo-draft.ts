import { TextLimits } from '@/shared/constants/text-limits';
import { isDateKey } from '@/shared/utils/date';

import type { CreateTodoInput, UpdateTodoInput } from '../types';

export function normalizeTodoCreateDraft(
  input: Omit<CreateTodoInput, 'notificationId'>
): Omit<CreateTodoInput, 'notificationId'> | null {
  const title = input.title.trim().slice(0, TextLimits.title);
  const description = input.description?.trim().slice(0, TextLimits.description);
  const dueAt = isDateKey(input.dueAt) ? input.dueAt : undefined;

  if (!title) {
    return null;
  }

  return {
    ...input,
    title,
    description: description || undefined,
    dueAt,
  };
}

export function normalizeTodoUpdateDraft(input: UpdateTodoInput): UpdateTodoInput | null {
  const title = input.title?.trim().slice(0, TextLimits.title);
  const description = input.description?.trim().slice(0, TextLimits.description);
  const dueAt = isDateKey(input.dueAt) ? input.dueAt : undefined;

  if (input.title !== undefined && !title) {
    return null;
  }

  return {
    ...input,
    title,
    description: description || undefined,
    dueAt,
  };
}

