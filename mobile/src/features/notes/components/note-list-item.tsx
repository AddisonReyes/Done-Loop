import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Note } from '@/features/notes/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

import { NoteActionButton } from './note-action-button';

type NoteListItemProps = {
  note: Note;
  editedLabel: string;
  onOpen: () => void;
  onTogglePin: () => void;
  isPinning?: boolean;
};

export function NoteListItem({ note, editedLabel, onOpen, onTogglePin, isPinning = false }: NoteListItemProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const title = note.title.trim() || t('notes.untitled');
  const preview = note.type === 'text'
    ? note.content
    : note.items.map((item) => item.content).join('\n');
  const completed = note.items.filter((item) => item.isCompleted).length;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('notes.openNote', { title })}
          onPress={onOpen}
          style={({ pressed }) => [styles.open, pressed && styles.pressed]}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name={note.type === 'checklist' ? 'format-list-checks' : 'note-text-outline'}
              size={20}
              color={theme.textSecondary}
            />
            <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>{title}</ThemedText>
          </View>
          {preview.trim() ? <ThemedText type="small" numberOfLines={3}>{preview}</ThemedText> : null}
          {note.type === 'checklist' ? (
            <ThemedText type="small" themeColor="accentStrong">
              {t('notes.progress', { completed, total: note.items.length })}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">{editedLabel}</ThemedText>
        </Pressable>
        <NoteActionButton
          icon={note.isPinned ? 'pin' : 'pin-outline'}
          label={t(note.isPinned ? 'notes.unpin' : 'notes.pin')}
          selected={note.isPinned}
          disabled={isPinning}
          onPress={onTogglePin}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 0,
    padding: Spacing.three,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  open: {
    flex: 1,
    gap: Spacing.two,
    minHeight: 44,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  title: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.72 },
});
