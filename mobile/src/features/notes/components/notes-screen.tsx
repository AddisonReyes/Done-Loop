import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useNotes } from '@/features/notes/hooks/use-notes';
import type { Note, NoteType } from '@/features/notes/types';
import { useDateFormatPreference } from '@/features/settings/hooks/use-date-format-preference';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { AnimatedListItem } from '@/shared/components/animated-list-item';
import { AppModal } from '@/shared/components/app-modal';
import { EmptyState } from '@/shared/components/empty-state';
import { FloatingCreateButton } from '@/shared/components/floating-create-button';
import { VirtualizedScreenScaffold } from '@/shared/components/virtualized-screen-scaffold';
import { formatDateKey, toDateKey } from '@/shared/utils/date';

import { NoteListItem } from './note-list-item';

export function NotesScreen() {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const notes = useNotes();
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const dateFormat = useDateFormatPreference();

  const startNote = (type: NoteType) => {
    setShowCreateOptions(false);
    router.push({ pathname: '/notes/new', params: { type } });
  };

  const editedLabel = (note: Note) => {
    const editedAt = new Date(note.updatedAt);
    const date = Number.isFinite(editedAt.getTime())
      ? formatDateKey(toDateKey(editedAt), locale, dateFormat)
      : t('notes.unknownDate');
    return t('notes.edited', { date });
  };

  return (
    <View style={styles.screen}>
      <VirtualizedScreenScaffold
        title={t('notes.title')}
        data={notes.notes}
        keyExtractor={(note) => note.id}
        listHeader={(
          <>
            <TextInput
              accessibilityLabel={t('notes.searchLabel')}
              placeholder={t('notes.searchPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={notes.search}
              onChangeText={notes.setSearch}
              returnKeyType="search"
              style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
            />
            {notes.errorMessage ? (
              <EmptyState message={notes.errorMessage} actionLabel={t('notes.retry')} onAction={() => void notes.reload()} />
            ) : null}
            {notes.isLoading ? <ThemedText type="small" themeColor="textSecondary">{t('notes.loading')}</ThemedText> : null}
          </>
        )}
        emptyMessage={!notes.isLoading && !notes.errorMessage
          ? t(notes.search.trim() ? 'notes.emptySearch' : 'notes.empty')
          : undefined}
        renderItem={({ item, index }) => (
          <AnimatedListItem animate={index < 24} delay={index * 18}>
            <NoteListItem
              note={item}
              editedLabel={editedLabel(item)}
              onOpen={() => router.push({ pathname: '/notes/[id]', params: { id: item.id } })}
              onTogglePin={() => void notes.setPinned(item)}
              isPinning={notes.isPinning(item.id)}
            />
          </AnimatedListItem>
        )}
      />
      <FloatingCreateButton accessibilityLabel={t('notes.create')} onPress={() => setShowCreateOptions(true)} />
      <AppModal title={t('notes.create')} visible={showCreateOptions} onClose={() => setShowCreateOptions(false)}>
        <View style={styles.options}>
          {(['text', 'checklist'] as const).map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              onPress={() => startNote(type)}
              style={({ pressed }) => [styles.option, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }, pressed && styles.pressed]}>
              <ThemedText type="smallBold">{t(`notes.types.${type}`)}</ThemedText>
            </Pressable>
          ))}
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  input: { borderRadius: 16, borderWidth: 1, fontFamily: Fonts.sans, fontSize: 16, minHeight: 48, paddingHorizontal: Spacing.three },
  options: { gap: Spacing.two },
  option: { borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: Spacing.three },
  pressed: { opacity: 0.72 },
});
