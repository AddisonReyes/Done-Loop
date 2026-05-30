#!/usr/bin/env bash
set -euo pipefail

root="${1:-.}"
cd "$root"

echo "== Expo / React Native Project Inspect =="

if [ -f package.json ]; then
  echo
  echo "-- package.json scripts --"
  node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts||{}).map(k=>k+': '+p.scripts[k]).join('\n')||'(none)')"

  echo
  echo "-- key dependencies --"
  node -e "const p=require('./package.json'); const d={...(p.dependencies||{}),...(p.devDependencies||{})}; ['expo','react-native','react','typescript','expo-router','@react-navigation/native','nativewind','tamagui','react-native-paper','@tanstack/react-query','zustand','redux','@reduxjs/toolkit','jest','vitest','eslint'].forEach(k=>{ if(d[k]) console.log(k+': '+d[k]) })"
else
  echo "package.json not found"
fi

echo
echo "-- config files --"
for f in app.json app.config.js app.config.ts eas.json tsconfig.json babel.config.js metro.config.js; do
  [ -f "$f" ] && echo "$f"
done

echo
echo "-- routing hints --"
[ -d app ] && echo "app/ directory present"
[ -f app/_layout.tsx ] && echo "Expo Router layout found: app/_layout.tsx"
[ -d src/app ] && echo "src/app directory present"
find . \
  \( -path './node_modules' -o -path './.expo' -o -path './ios/build' -o -path './android/build' \) -prune \
  -o -maxdepth 3 -type f \( -name '*Navigator.tsx' -o -name '*navigation*.ts' -o -name '*navigation*.tsx' \) -print 2>/dev/null \
  | sed 's#^\./##' | sort

echo
echo "-- native folders --"
if [ -d ios ]; then
  echo "ios/"
fi
if [ -d android ]; then
  echo "android/"
fi
