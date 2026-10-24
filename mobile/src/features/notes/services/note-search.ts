import type { Note } from '../types';

function normalizeSearchText(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

export function filterNotes(notes: Note[], query: string): Note[] {
  const searchText = normalizeSearchText(query.trim());
  if (!searchText) {
    return notes;
  }

  return notes.filter((note) => (
    normalizeSearchText(note.title).includes(searchText) ||
    normalizeSearchText(note.content).includes(searchText) ||
    note.items.some((item) => normalizeSearchText(item.content).includes(searchText))
  ));
}
