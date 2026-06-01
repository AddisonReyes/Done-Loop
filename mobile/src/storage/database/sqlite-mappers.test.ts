import {
  fromSQLiteBoolean,
  nullableString,
  optionalString,
  toSQLiteBoolean,
} from './sqlite-mappers';

describe('sqlite mappers', () => {
  it('maps booleans to sqlite integers', () => {
    expect(toSQLiteBoolean(true)).toBe(1);
    expect(toSQLiteBoolean(false)).toBe(0);
    expect(fromSQLiteBoolean(1)).toBe(true);
    expect(fromSQLiteBoolean(0)).toBe(false);
  });

  it('maps optional strings to nullable sqlite values', () => {
    expect(nullableString('value')).toBe('value');
    expect(nullableString(undefined)).toBeNull();
    expect(optionalString('value')).toBe('value');
    expect(optionalString(null)).toBeUndefined();
  });
});

