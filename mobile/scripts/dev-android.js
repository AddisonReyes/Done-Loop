#!/usr/bin/env node

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const bootTimeoutMs = 300_000;

function expandHomePath(value) {
  return value
    .replace(/^~(?=\/|$)/, os.homedir())
    .replace(/^\$HOME(?=\/|$)/, os.homedir());
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    const value = expandHomePath(rawValue);

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(__dirname, '..', '.env.local'));

function resolveExecutable(name, relativeCandidates) {
  const direct = spawnSync('sh', ['-lc', `command -v ${name}`], { encoding: 'utf8' });
  const directPath = direct.stdout.trim();

  if (directPath) {
    return directPath;
  }

  const sdkRoots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT]
    .filter(Boolean);

  for (const sdkRoot of sdkRoots) {
    for (const candidate of relativeCandidates) {
      const executablePath = path.join(sdkRoot, candidate);
      if (fs.existsSync(executablePath)) {
        return executablePath;
      }
    }
  }

  return null;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function hasBootedDevice(adbPath) {
  if (!hasConnectedDevice(adbPath)) {
    return false;
  }

  const bootState = run(adbPath, ['shell', 'getprop', 'sys.boot_completed']).stdout.trim();
  const bootAnimation = run(adbPath, ['shell', 'getprop', 'init.svc.bootanim']).stdout.trim();
  return bootState === '1' && bootAnimation === 'stopped';
}

function hasConnectedDevice(adbPath) {
  return run(adbPath, ['devices']).stdout
    .split('\n')
    .slice(1)
    .some((line) => /\tdevice$/.test(line.trim()));
}

function listAvds(emulatorPath) {
  return run(emulatorPath, ['-list-avds']).stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function startEmulator(emulatorPath, avdName) {
  const child = spawn(emulatorPath, ['-avd', avdName], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function waitForBoot(adbPath) {
  const startedAt = Date.now();
  let lastProgressAt = 0;

  while (Date.now() - startedAt < bootTimeoutMs) {
    if (hasBootedDevice(adbPath)) {
      return;
    }

    if (Date.now() - lastProgressAt > 15_000) {
      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
      console.log(`Waiting for Android emulator to boot... ${elapsedSeconds}s`);
      lastProgressAt = Date.now();
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error('Android emulator did not finish booting in time. If it is still opening, run npm run dev again.');
}

async function ensureAndroidDevice() {
  const adbPath = resolveExecutable('adb', [path.join('platform-tools', 'adb')]);
  const emulatorPath = resolveExecutable('emulator', [path.join('emulator', 'emulator')]);

  if (!adbPath) {
    throw new Error('adb was not found. Set ANDROID_HOME or ANDROID_SDK_ROOT to your Android SDK path.');
  }

  if (hasBootedDevice(adbPath)) {
    return;
  }

  if (!emulatorPath) {
    throw new Error('Android emulator was not found. Set ANDROID_HOME or ANDROID_SDK_ROOT to your Android SDK path.');
  }

  const avds = listAvds(emulatorPath);
  if (avds.length === 0) {
    throw new Error('No Android Virtual Devices found. Create one in Android Studio first.');
  }

  console.log(`Starting Android emulator: ${avds[0]}`);
  startEmulator(emulatorPath, avds[0]);
  await waitForBoot(adbPath);
}

async function main() {
  await ensureAndroidDevice();

  const npmCommand = os.platform() === 'win32' ? 'npx.cmd' : 'npx';
  const expo = spawn(npmCommand, ['expo', 'start', '--android'], {
    stdio: 'inherit',
    shell: false,
  });

  expo.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
