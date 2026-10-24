import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type NoteActionButtonProps = {
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  destructive?: boolean;
};

export function NoteActionButton({
  label,
  icon,
  onPress,
  disabled = false,
  selected = false,
  destructive = false,
}: NoteActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
          borderColor: selected ? theme.borderStrong : theme.border,
          opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
        },
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={destructive ? theme.danger : selected ? theme.accentStrong : theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
