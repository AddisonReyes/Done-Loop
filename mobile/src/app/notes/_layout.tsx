import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { anchor: 'index' };

export default function NotesLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />;
}
