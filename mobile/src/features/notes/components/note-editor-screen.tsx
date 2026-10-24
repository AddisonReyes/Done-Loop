import { router, useFocusEffect, useIsFocused, usePreventRemove } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useNoteEditor } from '@/features/notes/hooks/use-note-editor';
import { useNotesNavigationGuard } from '@/features/notes/services/navigation-guard';
import type { NoteChecklistItemDraft, NoteType } from '@/features/notes/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { EmptyState } from '@/shared/components/empty-state';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';
import { VirtualizedScreenScaffold } from '@/shared/components/virtualized-screen-scaffold';

import { NoteActionButton } from './note-action-button';
import { NoteChecklistItem } from './note-checklist-item';

type NoteEditorScreenProps = { id?: string; type?: NoteType };

function confirmAction(title: string, message: string, confirmLabel: string, cancelLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

export function NoteEditorScreen({ id, type }: NoteEditorScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const editor = useNoteEditor({ id, type });
  const isFocused = useIsFocused();
  const { registerGuard, requestLeave } = useNotesNavigationGuard();
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const leavePromiseRef = useRef<Promise<boolean> | null>(null);
  const allowLeaveRef = useRef(false);
  const deleteBusyRef = useRef(false);
  const checklistRef = useRef<FlatList<NoteChecklistItemDraft>>(null);
  const focusRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusAttemptsRef = useRef(0);

  useEffect(() => {
    if (!focusItemId || !editor.draft) return;
    const index = editor.draft.items.findIndex((item) => item.id === focusItemId);
    if (index < 0) return;
    const frame = requestAnimationFrame(() => {
      checklistRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
    });
    return () => {
      cancelAnimationFrame(frame);
      if (focusRetryRef.current) clearTimeout(focusRetryRef.current);
    };
  }, [editor.draft, focusItemId]);

  const leave = useCallback((): Promise<boolean> => {
    if (allowLeaveRef.current) return Promise.resolve(true);
    if (deleteBusyRef.current) return Promise.resolve(false);
    if (leavePromiseRef.current) return leavePromiseRef.current;

    const pending = (async () => {
      setIsLeaving(true);
      try {
        const deleteClearedNote = async () => {
          const approved = await confirmAction(t('notes.emptyConfirmTitle'), t('notes.emptyConfirmMessage'), t('notes.deleteEmpty'), t('notes.keepEditing'));
          if (!approved) return false;
          const deleted = await editorRef.current.deleteNote();
          if (!deleted) setActionError(t('notes.deleteError'));
          allowLeaveRef.current = deleted;
          return deleted;
        };
        if (editorRef.current.getCurrentState()?.isCleared) return await deleteClearedNote();
        const saved = await editorRef.current.flush();
        if (!saved && editorRef.current.getCurrentState()?.isCleared) return await deleteClearedNote();
        allowLeaveRef.current = saved;
        return saved;
      } finally {
        setIsLeaving(false);
        leavePromiseRef.current = null;
      }
    })();
    leavePromiseRef.current = pending;
    return pending;
  }, [t]);

  useFocusEffect(useCallback(() => registerGuard(leave), [leave, registerGuard]));

  const disablePrevention = usePreventRemove(
    isFocused && !allowLeaveRef.current && (editor.isDirty || editor.isCleared || editor.saveStatus === 'saving' || editor.saveStatus === 'error' || isLeaving || isConfirmingDelete || editor.isDeleting),
    ({ repeat }) => {
      void requestLeave().then((allowed) => { if (allowed) repeat(); });
    },
  );

  const goBack = () => {
    void requestLeave().then((allowed) => {
      if (allowed) {
        disablePrevention();
        router.dismissTo('/notes');
      }
    });
  };

  const markEdited = () => {
    allowLeaveRef.current = false;
    setActionError(null);
  };

  const confirmDelete = async () => {
    if (deleteBusyRef.current || leavePromiseRef.current) return;
    deleteBusyRef.current = true;
    setIsConfirmingDelete(true);
    try {
      const approved = await confirmAction(t('notes.deleteConfirmTitle'), t('notes.deleteConfirmMessage'), t('notes.delete'), t('notes.cancel'));
      if (!approved) return;
      if (await editorRef.current.deleteNote()) {
        allowLeaveRef.current = true;
        disablePrevention();
        router.dismissTo('/notes');
      } else {
        setActionError(t('notes.deleteError'));
      }
    } finally {
      deleteBusyRef.current = false;
      setIsConfirmingDelete(false);
    }
  };

  const disabled = isLeaving || isConfirmingDelete || editor.isDeleting;
  const backButton = <NoteActionButton icon="arrow-left" label={t('notes.back')} disabled={disabled} onPress={goBack} />;

  if (!editor.draft) {
    return (
      <ScreenScaffold title={t('notes.title')}>
        {backButton}
        {editor.isLoading ? <ThemedText themeColor="textSecondary">{t('notes.loading')}</ThemedText> : (
          <EmptyState
            message={t(editor.notFound ? 'notes.notFound' : 'notes.loadError')}
            actionLabel={editor.notFound ? undefined : t('notes.retry')}
            onAction={editor.notFound ? undefined : () => void editor.reload()}
          />
        )}
      </ScreenScaffold>
    );
  }

  const draft = editor.draft;
  const nonemptyItems = draft.items.filter((item) => item.content.trim());
  const addItem = (afterId?: string) => {
    markEdited();
    focusAttemptsRef.current = 0;
    setFocusItemId(editor.addItem(afterId));
  };
  const header = (
    <>
      <View style={styles.toolbar}>
        {backButton}
        <View style={styles.toolbarActions}>
          <NoteActionButton icon={draft.isPinned ? 'pin' : 'pin-outline'} label={t(draft.isPinned ? 'notes.unpin' : 'notes.pin')} selected={draft.isPinned} disabled={disabled} onPress={() => { markEdited(); editor.togglePin(); }} />
          {editor.isPersisted ? <NoteActionButton icon="trash-can-outline" label={t('notes.delete')} destructive disabled={disabled} onPress={() => void confirmDelete()} /> : null}
        </View>
      </View>
      <TextInput
        accessibilityLabel={t('notes.titleLabel')}
        placeholder={t('notes.titlePlaceholder')}
        placeholderTextColor={theme.textSecondary}
        value={draft.title}
        editable={!disabled}
        onChangeText={(value) => { markEdited(); editor.setTitle(value); }}
        style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
      />
      <View accessibilityLiveRegion="polite">
        <ThemedText type="small" themeColor={editor.saveStatus === 'error' || actionError ? 'warning' : 'textSecondary'}>
          {actionError ?? t(`notes.saveStatus.${editor.saveStatus}`)}
        </ThemedText>
      </View>
      {editor.saveStatus === 'error' && !actionError ? (
        <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={() => void editor.flush()} style={styles.retry}>
          <ThemedText type="smallBold" themeColor="accentStrong">{t('notes.retry')}</ThemedText>
        </Pressable>
      ) : null}
      {draft.type === 'checklist' ? (
        <ThemedText type="small" themeColor="accentStrong">{t('notes.progress', { completed: nonemptyItems.filter((item) => item.isCompleted).length, total: nonemptyItems.length })}</ThemedText>
      ) : null}
    </>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      {draft.type === 'text' ? (
        <ScreenScaffold title={t('notes.types.text')} keyboardShouldPersistTaps="handled">
          {header}
          <TextInput
            accessibilityLabel={t('notes.contentLabel')}
            placeholder={t('notes.contentPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={draft.content}
            editable={!disabled}
            onChangeText={(value) => { markEdited(); editor.setContent(value); }}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.bodyInput, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
          />
        </ScreenScaffold>
      ) : (
        <VirtualizedScreenScaffold
          title={t('notes.types.checklist')}
          data={draft.items}
          keyExtractor={(item) => item.id}
          listRef={checklistRef}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            checklistRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
            if (focusAttemptsRef.current >= 3) return;
            focusAttemptsRef.current += 1;
            focusRetryRef.current = setTimeout(() => {
              checklistRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
            }, 80);
          }}
          listHeader={header}
          listFooter={(
            <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => addItem()} style={[styles.add, { backgroundColor: theme.accentSoft, borderColor: theme.borderStrong }]}>
              <ThemedText type="smallBold" themeColor="accentStrong">{t('notes.addItem')}</ThemedText>
            </Pressable>
          )}
          renderItem={({ item, index }) => (
            <NoteChecklistItem
              item={item}
              index={index}
              count={draft.items.length}
              autoFocus={focusItemId === item.id}
              onFocus={() => { if (focusItemId === item.id) setFocusItemId(null); }}
              disabled={disabled}
              onChange={(content) => { markEdited(); editor.updateItem(item.id, content); }}
              onToggle={() => { markEdited(); editor.toggleItem(item.id); }}
              onMove={(direction) => { markEdited(); editor.moveItem(item.id, direction); }}
              onInsert={() => addItem(item.id)}
              onDelete={() => {
                const remove = () => { markEdited(); editor.deleteItem(item.id); };
                if (!item.content.trim()) { remove(); return; }
                Alert.alert(t('notes.deleteItemTitle'), item.content, [
                  { text: t('notes.cancel'), style: 'cancel' },
                  { text: t('notes.deleteItemAction'), style: 'destructive', onPress: remove },
                ]);
              }}
            />
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  toolbarActions: { flexDirection: 'row', gap: Spacing.two },
  input: { borderRadius: 16, borderWidth: 1, fontFamily: Fonts.sans, fontSize: 16, minHeight: 48, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  bodyInput: { minHeight: 240, lineHeight: 24 },
  retry: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.two },
  add: { alignItems: 'center', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: Spacing.three },
});
