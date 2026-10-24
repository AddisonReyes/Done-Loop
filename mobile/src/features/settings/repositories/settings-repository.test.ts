import { SettingsRepository } from './settings-repository';

const mockDatabase = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
};
jest.mock('@/storage/database/client', () => ({ getDatabaseAsync: async () => mockDatabase }));

const settingsRow = {
  notifications_enabled: 0, animations_enabled: 1, theme: 'dark', accent_color: 'pink',
  app_background: 'grid', language: 'es', date_format: 'dmy',
  privacy_policy_url: 'https://done-loop.com/privacy', terms_url: 'https://done-loop.pages.dev/terms',
  last_active_route: '/notes',
};

describe('Notes route setting compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.getFirstAsync.mockResolvedValue(settingsRow);
  });

  it('recognizes a stored Notes route and preserves other preferences', async () => {
    expect(await SettingsRepository.get()).toMatchObject({
      lastActiveRoute: '/notes', theme: 'dark', accentColor: 'pink', language: 'es', appBackground: 'grid',
    });
  });

  it.each([null, '/notes/deleted_note', '/unknown'])('defaults an invalid stored route (%s) to Habits', async (route) => {
    mockDatabase.getFirstAsync.mockResolvedValue({ ...settingsRow, last_active_route: route });
    expect((await SettingsRepository.get()).lastActiveRoute).toBe('/habits');
  });

  it('persists the Notes root with a parameterized settings update', async () => {
    expect((await SettingsRepository.update({ lastActiveRoute: '/notes' })).lastActiveRoute).toBe('/notes');
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('last_active_route = excluded.last_active_route'),
      0, 1, 'dark', 'pink', 'grid', 'es', 'dmy', 'free', settingsRow.privacy_policy_url,
      settingsRow.terms_url, '/notes', expect.any(String), expect.any(String),
    );
  });
});
