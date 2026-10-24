import { createLocalId } from '@/storage/database/ids';

import { createNoteDraft, hasMeaningfulNote, normalizeNoteDraft, toNoteDraft } from './note-draft';

jest.mock('@/storage/database/ids', () => ({ createLocalId: jest.fn(() => 'note_test') }));

describe('note drafts', () => {
  it('reserves an ID without producing a meaningful empty note', () => {
    const draft = createNoteDraft('checklist');
    expect(createLocalId).toHaveBeenCalledWith('note');
    expect(draft).toEqual({
      id: 'note_test', type: 'checklist', title: '', content: '', isPinned: false, items: [],
    });
    expect(hasMeaningfulNote(draft)).toBe(false);
  });

  it('accepts substantive title, body, or checklist text', () => {
    const draft = createNoteDraft('checklist');
    expect(hasMeaningfulNote({ ...draft, title: '  Heading  ' })).toBe(true);
    expect(hasMeaningfulNote({ ...draft, content: '\n  Body  \n' })).toBe(true);
    expect(hasMeaningfulNote({
      ...draft, items: [{ id: 'item_1', content: '  Milk ', isCompleted: true }],
    })).toBe(true);
    expect(hasMeaningfulNote({
      ...draft, title: ' \n', content: '\t', isPinned: true,
      items: [{ id: 'item_1', content: ' \n\t', isCompleted: true }],
    })).toBe(false);
  });

  it('omits blank placeholders without trimming or truncating writing', () => {
    const content = `  ${'x'.repeat(2000)}\n\n  indented\n`;
    const draft = {
      ...createNoteDraft('checklist'), title: '  Title  ', content,
      items: [
        { id: 'blank', content: ' \n', isCompleted: false },
        { id: 'real', content: '  Keep spacing  ', isCompleted: true },
      ],
    };
    expect(normalizeNoteDraft(draft)).toEqual({ ...draft, items: [draft.items[1]] });
    expect(draft.items).toHaveLength(2);
    expect(normalizeNoteDraft({ ...draft, type: 'text' }).items).toEqual([]);
  });

  it('copies persisted data into an independently editable draft', () => {
    const draft = toNoteDraft({
      id: 'note_1', type: 'checklist', title: '', content: '', isPinned: false,
      createdAt: '2026-10-11T00:00:00.000Z', updatedAt: '2026-10-11T00:00:00.000Z',
      items: [{
        id: 'item_1', noteId: 'note_1', content: 'Milk', isCompleted: true, position: 0,
        createdAt: '2026-10-11T00:00:00.000Z', updatedAt: '2026-10-11T00:00:00.000Z',
      }],
    });
    expect(draft.items).toEqual([{ id: 'item_1', content: 'Milk', isCompleted: true }]);
    expect(Object.keys(draft)).not.toContain('updatedAt');
  });
});
