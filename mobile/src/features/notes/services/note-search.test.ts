import type { Note } from '../types';
import { filterNotes } from './note-search';

function note(id: string, input: Partial<Note>): Note {
  return {
    id, type: 'text', title: '', content: '', isPinned: false, items: [],
    createdAt: '2026-10-11T00:00:00.000Z', updatedAt: '2026-10-11T00:00:00.000Z',
    ...input,
  };
}

describe('note search', () => {
  const notes = [
    note('title', { title: 'ÁRBOL and NIÑO', isPinned: true }),
    note('body', { content: 'Multiline\nEveryday writing' }),
    note('checklist', {
      type: 'checklist',
      items: [{
        id: 'item_1', noteId: 'checklist', content: 'CAFÉ', isCompleted: true, position: 0,
        createdAt: '2026-10-11T00:00:00.000Z', updatedAt: '2026-10-11T00:00:00.000Z',
      }],
    }),
    note('literal', { content: '100% done_with_tasks' }),
  ];

  it('searches title, full body, and completed checklist items regardless of case', () => {
    expect(filterNotes(notes, ' árbol ')).toEqual([notes[0]]);
    expect(filterNotes(notes, 'niño')).toEqual([notes[0]]);
    expect(filterNotes(notes, 'EVERYDAY')).toEqual([notes[1]]);
    expect(filterNotes(notes, 'cafe\u0301')).toEqual([notes[2]]);
  });

  it('treats SQL pattern characters as literal user text', () => {
    expect(filterNotes(notes, '%')).toEqual([notes[3]]);
    expect(filterNotes(notes, '_')).toEqual([notes[3]]);
  });

  it('preserves ordering and handles blank queries or no matches', () => {
    expect(filterNotes(notes, ' \n')).toBe(notes);
    expect(filterNotes(notes, 'a')).toEqual([notes[0], notes[1], notes[2], notes[3]]);
    expect(filterNotes(notes, 'missing')).toEqual([]);
  });
});
