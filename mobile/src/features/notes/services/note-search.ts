import type { Note } from '../types';

type PreparedNoteText = { source: string[]; normalized: (string | undefined)[] };
const preparedText = new WeakMap<Note, PreparedNoteText>();

function normalizeSearchText(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

export function filterNotes(notes: Note[], query: string): Note[] {
  const searchText = normalizeSearchText(query.trim());
  if (!searchText) {
    return notes;
  }

  return notes.filter((note) => {
    const source = [note.title, note.content, ...note.items.map((item) => item.content)];
    // Long notes retain their original short-circuit matching without a second full body in memory.
    if (source.reduce((length, value) => length + value.length, 0) > 4096) {
      preparedText.delete(note);
      return source.some((value) => normalizeSearchText(value).includes(searchText));
    }
    const previous = preparedText.get(note);
    const cached: PreparedNoteText = previous && previous.source.length === source.length &&
      source.every((value, index) => value === previous.source[index]) ? previous : { source, normalized: [] };
    if (cached !== previous) preparedText.set(note, cached);
    const text = cached.normalized;
    return source.some((value, index) => {
      text[index] ??= normalizeSearchText(value);
      return text[index].includes(searchText);
    });
  });
}
