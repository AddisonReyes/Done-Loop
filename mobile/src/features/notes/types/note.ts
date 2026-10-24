export type NoteType = 'text' | 'checklist';

export type NoteChecklistItemDraft = {
  id: string;
  content: string;
  isCompleted: boolean;
};

export type NoteDraft = {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  isPinned: boolean;
  items: NoteChecklistItemDraft[];
};

export type NoteChecklistItem = NoteChecklistItemDraft & {
  noteId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  items: NoteChecklistItem[];
};
