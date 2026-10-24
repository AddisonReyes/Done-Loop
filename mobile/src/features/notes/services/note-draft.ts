import { createLocalId } from '@/storage/database/ids';

import type { Note, NoteDraft, NoteType } from '../types';

export function createNoteDraft(type: NoteType): NoteDraft {
  return {
    id: createLocalId('note'),
    type,
    title: '',
    content: '',
    isPinned: false,
    items: [],
  };
}

export function toNoteDraft(note: Note): NoteDraft {
  return {
    id: note.id,
    type: note.type,
    title: note.title,
    content: note.content,
    isPinned: note.isPinned,
    items: note.items.map(({ id, content, isCompleted }) => ({ id, content, isCompleted })),
  };
}

export function hasMeaningfulNote(draft: NoteDraft): boolean {
  return Boolean(
    draft.title.trim() || draft.content.trim() ||
    (draft.type === 'checklist' && draft.items.some((item) => item.content.trim()))
  );
}

export function normalizeNoteDraft(draft: NoteDraft): NoteDraft {
  return {
    ...draft,
    items: draft.type === 'checklist'
      ? draft.items.filter((item) => item.content.trim()).map((item) => ({ ...item }))
      : [],
  };
}
