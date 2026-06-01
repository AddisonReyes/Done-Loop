export type SQLiteBoolean = 0 | 1;

export function toSQLiteBoolean(value: boolean): SQLiteBoolean {
  return value ? 1 : 0;
}

export function fromSQLiteBoolean(value: number): boolean {
  return value === 1;
}

export function optionalString(value: string | null): string | undefined {
  return value ?? undefined;
}

export function nullableString(value: string | undefined): string | null {
  return value ?? null;
}
