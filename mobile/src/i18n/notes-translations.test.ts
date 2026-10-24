import { translations } from './translations';

function entries(value: object, prefix = ''): [string, string][] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string' ? [[path, child]] : entries(child, path);
  });
}

describe('Notes translations', () => {
  it('provides the same nonempty strings and interpolation parameters in English and Spanish', () => {
    const english = entries(translations.en.notes);
    const spanish = new Map(entries(translations.es.notes));
    expect(english.map(([key]) => key).sort()).toEqual([...spanish.keys()].sort());
    for (const [key, text] of english) {
      const translated = spanish.get(key);
      expect(translated?.trim().length).toBeGreaterThan(0);
      expect(translated?.match(/\{\{\w+\}\}/g)).toEqual(text.match(/\{\{\w+\}\}/g));
    }
    expect(translations.en.tabs.notes).toBe('Notes');
    expect(translations.es.tabs.notes).toBe('Notas');
  });
});
