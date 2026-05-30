import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Habit } from '../types';

type HabitListItemProps = {
  habit: Habit;
  completedToday: boolean;
  editing: boolean;
  editingName: string;
  onEditingNameChange: (value: string) => void;
  onToggleToday: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeactivate: () => void;
};

export function HabitListItem({
  habit,
  completedToday,
  editing,
  editingName,
  onEditingNameChange,
  onToggleToday,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeactivate,
}: HabitListItemProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: completedToday ? theme.borderStrong : theme.border,
          backgroundColor: completedToday ? theme.accentSoft : theme.surfaceSoft,
          shadowColor: theme.glow,
        },
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completedToday }}
        onPress={onToggleToday}
        style={[
          styles.check,
            {
                borderColor: completedToday ? theme.accentStrong : theme.border,
                backgroundColor: completedToday ? theme.accent : theme.backgroundSelected,
              },
        ]}>
        <ThemedText type="smallBold" style={completedToday && styles.checkText}>
          {completedToday ? '✓' : ''}
        </ThemedText>
      </Pressable>

      <View style={styles.body}>
        {editing ? (
          <TextInput
            accessibilityLabel="Editar hábito"
            value={editingName}
            onChangeText={onEditingNameChange}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSaveEdit}
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.surfaceStrong,
              },
            ]}
            placeholderTextColor={theme.textSecondary}
          />
        ) : (
          <>
            <ThemedText type="smallBold" style={completedToday && styles.completedTitle}>
              {habit.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {completedToday ? 'Completado hoy' : 'Pendiente hoy'}
            </ThemedText>
          </>
        )}

        <View style={styles.actions}>
          {editing ? (
            <>
              <ActionButton label="Guardar" onPress={onSaveEdit} />
              <ActionButton label="Cancelar" onPress={onCancelEdit} muted />
            </>
          ) : (
            <>
              <ActionButton label="Editar" onPress={onStartEdit} />
              <ActionButton label="Desactivar" onPress={onDeactivate} muted />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  muted?: boolean;
  onPress: () => void;
};

function ActionButton({ label, muted, onPress }: ActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: muted ? theme.backgroundSelected : theme.accentSoft },
        { borderColor: muted ? theme.border : theme.borderStrong },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" themeColor={muted ? 'textSecondary' : 'accentStrong'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 2,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    gap: Spacing.two,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.two,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.72,
  },
});
