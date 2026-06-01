import { parseReminderTime } from './reminder-time';

describe('parseReminderTime', () => {
  it('parses valid twenty-four-hour times', () => {
    expect(parseReminderTime('09:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseReminderTime('23:59')).toEqual({ hour: 23, minute: 59 });
  });

  it('rejects malformed or out-of-range times', () => {
    expect(parseReminderTime()).toBeNull();
    expect(parseReminderTime('9:05')).toBeNull();
    expect(parseReminderTime('24:00')).toBeNull();
    expect(parseReminderTime('12:60')).toBeNull();
  });
});

