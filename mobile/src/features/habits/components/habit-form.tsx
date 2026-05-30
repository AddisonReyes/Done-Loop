import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HabitFormProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function HabitForm({ value, onChangeText, onSubmit }: HabitFormProps) {
  const theme = useTheme();
  const disabled = value.trim().length === 0;

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Nombre del hábito"
        placeholder="Nuevo hábito"
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="done"
        onSubmitEditing={disabled ? undefined : onSubmit}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: theme.surfaceStrong,
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: disabled ? theme.backgroundSelected : theme.accent,
            borderColor: disabled ? theme.border : theme.borderStrong,
          },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          Crear
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    minHeight: 48,
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    minWidth: 80,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.74,
  },
});
