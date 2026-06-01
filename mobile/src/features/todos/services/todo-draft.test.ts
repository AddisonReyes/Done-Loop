import { TextLimits } from '@/shared/constants/text-limits';

import { normalizeTodoCreateDraft, normalizeTodoUpdateDraft } from './todo-draft';

describe('todo draft normalization', () => {
  it('trims text, limits length, and preserves valid dates', () => {
    const draft = normalizeTodoCreateDraft({
      title: `  ${'a'.repeat(TextLimits.title + 5)}  `,
      description: '  details  ',
      priority: 2,
      dueAt: '2026-05-31',
    });

    expect(draft?.title).toHaveLength(TextLimits.title);
    expect(draft?.description).toBe('details');
    expect(draft?.dueAt).toBe('2026-05-31');
  });

  it('rejects empty required titles and invalid dates', () => {
    expect(normalizeTodoCreateDraft({ title: '   ', priority: 1 })).toBeNull();
    expect(
      normalizeTodoUpdateDraft({ title: 'Valid', priority: 1, dueAt: '2026-02-31' })
    ).toMatchObject({ dueAt: undefined });
  });
});

