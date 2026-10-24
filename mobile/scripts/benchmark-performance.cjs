/* Local CPU/SQLite benchmark. No app data or native modules are used. */
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { transformSync } = require('@babel/core');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const baselineRef = process.argv.find((arg) => arg.startsWith('--baseline-ref='))?.slice('--baseline-ref='.length) ?? 'HEAD';
const baseline = process.argv.includes('--baseline') || process.argv.some((arg) => arg.startsWith('--baseline-ref='));
const baselineFiles = new Set([
  'src/features/notes/services/note-search.ts',
  'src/features/habits/services/habit-recurrence.ts',
  'src/features/settings/repositories/settings-repository.ts',
]);

require.extensions['.ts'] = (module, filename) => {
  const relative = path.relative(root, filename).replaceAll('\\', '/');
  const source = baseline && baselineFiles.has(relative)
    ? execFileSync('git', ['show', `${baselineRef}:mobile/${relative}`], { cwd: root, encoding: 'utf8' })
    : fs.readFileSync(filename, 'utf8');
  const result = transformSync(source, {
    filename,
    babelrc: false, configFile: false,
    presets: [require.resolve('@babel/preset-typescript')],
    plugins: [({ types }) => ({ visitor: { ImportDeclaration(node) {
      if (node.node.source.value.startsWith('@/')) {
        node.node.source = types.stringLiteral(path.join(root, 'src', node.node.source.value.slice(2)));
      }
    } } }), require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  module._compile(result.code, filename);
};

const { filterNotes } = require('../src/features/notes/services/note-search.ts');
const { getHabitsDueOnDate, createHabitCalendarSelector } = require('../src/features/habits/services/habit-recurrence.ts');
const { createSqliteTestDatabase } = require('../src/test/sqlite-test-database.ts');
const { database } = createSqliteTestDatabase();
let reads = 0;
let writes = 0;
const getFirst = database.getFirstAsync.bind(database);
const run = database.runAsync.bind(database);
database.getFirstAsync = (...args) => { reads++; return getFirst(...args); };
database.runAsync = (...args) => { writes++; return run(...args); };
const clientPath = path.join(root, 'src/storage/database/client.ts');
require.cache[clientPath] = { id: clientPath, filename: clientPath, loaded: true,
  exports: { getDatabaseAsync: async () => database } };
const { runMigrationsAsync } = require('../src/storage/migrations/index.ts');
const { SettingsRepository } = require('../src/features/settings/repositories/settings-repository.ts');

function measure(work) {
  const samples = [];
  for (let sample = 0; sample < 15; sample++) {
    const started = performance.now();
    work();
    samples.push(performance.now() - started);
  }
  samples.sort((a, b) => a - b);
  return Number(samples[7].toFixed(3));
}

(async () => {
  await runMigrationsAsync(database);
  await SettingsRepository.update({ lastActiveRoute: '/habits' });
  reads = 0; writes = 0;
  for (let index = 0; index < 100; index++) await SettingsRepository.update({ lastActiveRoute: '/habits' });
  const settings = { reads, writes };
  const scenarios = [50, 2000].map((size) => {
    const notes = Array.from({ length: size }, (_, index) => ({ id: `n${index}`, type: 'text',
      title: `Nota ${index}`, content: 'Lectura, español y English\n'.repeat(40), items: [] }));
    const habits = Array.from({ length: size }, (_, index) => ({ id: `h${index}`, isActive: true,
      startDate: '2026-01-01', recurrenceType: ['daily', 'weekly', 'monthly', 'custom'][index % 4],
      customIntervalDays: 3, weeklyDays: [1, 3, 5], monthlyDays: [1, 15, 31] }));
    const dates = Array.from({ length: 31 }, (_, index) => `2026-10-${String(index + 1).padStart(2, '0')}`);
    const queries = ['lectura', 'English', 'español', 'missing', 'nota'];
    const select = createHabitCalendarSelector ? createHabitCalendarSelector(habits) : (date) => getHabitsDueOnDate(habits, date);
    global.gc?.();
    const initialHeap = process.memoryUsage().heapUsed;
    let matches = 0;
    const searchMs = measure(() => { for (const query of queries) matches += filterNotes(notes, query).length; });
    const calendarMs = measure(() => { for (let pass = 0; pass < 2; pass++) {
      for (const date of dates) matches += select(date).length;
    } });
    const coldCalendarMs = measure(() => {
      const cold = createHabitCalendarSelector ? createHabitCalendarSelector(habits) : (date) => getHabitsDueOnDate(habits, date);
      for (let pass = 0; pass < 2; pass++) for (const date of dates) matches += cold(date).length;
    });
    global.gc?.();
    return { size, fiveSearchesMedianMs: searchMs, twoCalendarPassesMedianMs: calendarMs,
      coldCalendarMedianMs: coldCalendarMs,
      retainedHeapDeltaBytes: global.gc ? process.memoryUsage().heapUsed - initialHeap : null, checksum: matches };
  });
  const result = { node: process.version, platform: process.platform, baseline,
    baselineCommit: baseline ? execFileSync('git', ['rev-parse', baselineRef], { cwd: root, encoding: 'utf8' }).trim() : null,
    settings, scenarios,
    heapUsedBytes: process.memoryUsage().heapUsed,
    limitations: 'Node CPU/SQLite only; not Android startup, frames, native memory or battery.' };
  const json = JSON.stringify(result, null, 2);
  const output = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  if (output) fs.writeFileSync(path.resolve(output), json + '\n');
  process.stdout.write(json + '\n');
  await database.closeAsync();
})().catch((error) => { console.error(error); process.exitCode = 1; });
