import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import type { NoteDraft } from '@/features/notes/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

import { NoteActionButton } from './note-action-button';

type NoteChecklistItemProps = {
  item: NoteDraft['items'][number];
  index: number;
  count: number;
  autoFocus: boolean;
  onFocus: () => void;
  disabled: boolean;
  onChange: (content: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onInsert: () => void;
};

export function NoteChecklistItem({ item, index, count, autoFocus, disabled, onFocus, onChange, onToggle, onDelete, onMove, onInsert }: NoteChecklistItemProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const itemLabel = { index: index + 1 };
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <View style={[styles.card, { backgroundColor: item.isCompleted ? theme.accentSoft : theme.backgroundElement, borderColor: item.isCompleted ? theme.borderStrong : theme.border }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={t('notes.itemCompletion', itemLabel)}
          accessibilityState={{ checked: item.isCompleted, disabled }}
          disabled={disabled}
          onPress={onToggle}
          style={styles.checkbox}>
          <MaterialCommunityIcons
            name={item.isCompleted ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={item.isCompleted ? theme.accentStrong : theme.textSecondary}
          />
        </Pressable>
        <TextInput
          ref={inputRef}
          accessibilityLabel={t('notes.itemLabel', itemLabel)}
          placeholder={t('notes.itemPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={item.content}
          onChangeText={onChange}
          autoFocus={autoFocus}
          onFocus={onFocus}
          editable={!disabled}
          multiline
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={onInsert}
          style={[styles.input, { color: theme.text }, item.isCompleted && styles.completed]}
        />
      </View>
      <View style={styles.actions}>
        <NoteActionButton icon="arrow-up" label={t('notes.moveItemUp', itemLabel)} disabled={disabled || index === 0} onPress={() => onMove(-1)} />
        <NoteActionButton icon="arrow-down" label={t('notes.moveItemDown', itemLabel)} disabled={disabled || index === count - 1} onPress={() => onMove(1)} />
        <NoteActionButton icon="plus" label={t('notes.insertItemAfter', itemLabel)} disabled={disabled} onPress={onInsert} />
        <NoteActionButton icon="trash-can-outline" label={t('notes.deleteItem', itemLabel)} disabled={disabled} destructive onPress={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, gap: Spacing.two, minWidth: 0, padding: Spacing.two },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.one },
  checkbox: { alignItems: 'center', justifyContent: 'center', height: 48, width: 44 },
  input: { flex: 1, fontFamily: Fonts.sans, fontSize: 16, minHeight: 48, minWidth: 0, paddingVertical: Spacing.two, textAlignVertical: 'top' },
  completed: { textDecorationLine: 'line-through' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'flex-end' },
});
