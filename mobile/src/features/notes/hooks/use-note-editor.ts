import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { createAppEventSource, emitAppEvent } from '@/shared/events/app-events';
import { createLocalId } from '@/storage/database/ids';

import { NotesRepository } from '../repositories/notes-repository';
import { NoteAutosave, type NoteEditorState } from '../services/note-autosave';
import { createNoteDraft, toNoteDraft } from '../services/note-draft';
import type { NoteDraft, NoteType } from '../types';

type NoteEditorOptions = {
  id?: string;
  type?: NoteType;
};

type EditorLoadState = {
  editor: NoteEditorState | null;
  isLoading: boolean;
  loadError: boolean;
  notFound: boolean;
};

const initialLoadState: EditorLoadState = {
  editor: null,
  isLoading: true,
  loadError: false,
  notFound: false,
};

export function useNoteEditor({ id, type = 'text' }: NoteEditorOptions) {
  const [state, setState] = useState<EditorLoadState>(initialLoadState);
  const controllerRef = useRef<NoteAutosave | null>(null);
  const mountedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const [eventSource] = useState(() => createAppEventSource('notes'));

  const reload = useCallback(async () => {
    if (controllerRef.current?.getState().isDirty) {
      return;
    }

    const generation = ++loadGenerationRef.current;
    controllerRef.current?.dispose();
    controllerRef.current = null;
    setState(initialLoadState);

    try {
      const note = id ? await NotesRepository.findById(id) : null;
      if (!mountedRef.current || generation !== loadGenerationRef.current) {
        return;
      }
      if (id && !note) {
        setState({ editor: null, isLoading: false, loadError: false, notFound: true });
        return;
      }

      const controller = new NoteAutosave({
        draft: note ? toNoteDraft(note) : createNoteDraft(type),
        isPersisted: Boolean(note),
        save: async (draft, isPersisted) => {
          if (isPersisted) {
            await NotesRepository.updateDraft(draft);
          } else {
            await NotesRepository.create(draft);
          }
        },
        delete: NotesRepository.deleteById,
        onCommitted: (noteId) => emitAppEvent('notesChanged', { source: eventSource, id: noteId }),
        onChange: (editor) => {
          if (mountedRef.current && generation === loadGenerationRef.current) {
            setState({ editor, isLoading: false, loadError: false, notFound: false });
          }
        },
      });
      controllerRef.current = controller;
      setState({ editor: controller.getState(), isLoading: false, loadError: false, notFound: false });
    } catch {
      if (mountedRef.current && generation === loadGenerationRef.current) {
        setState({ editor: null, isLoading: false, loadError: true, notFound: false });
      }
    }
  }, [eventSource, id, type]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = setTimeout(() => { void reload(); }, 0);
    return () => {
      mountedRef.current = false;
      loadGenerationRef.current += 1;
      clearTimeout(timer);
      const controller = controllerRef.current;
      controllerRef.current = null;
      if (controller) {
        void controller.flush();
        controller.dispose();
      }
    };
  }, [reload]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void controllerRef.current?.flush();
      }
    });
    return () => subscription.remove();
  }, []);

  const changeDraft = useCallback((change: (draft: NoteDraft) => NoteDraft, immediate = false) => {
    const controller = controllerRef.current;
    if (controller) {
      controller.changeDraft(change(controller.getState().draft), immediate);
    }
  }, []);

  const setTitle = useCallback((title: string) => {
    changeDraft((draft) => draft.title === title ? draft : { ...draft, title });
  }, [changeDraft]);

  const setContent = useCallback((content: string) => {
    changeDraft((draft) => draft.type !== 'text' || draft.content === content ? draft : { ...draft, content });
  }, [changeDraft]);

  const togglePin = useCallback(() => {
    changeDraft((draft) => ({ ...draft, isPinned: !draft.isPinned }), true);
  }, [changeDraft]);

  const addItem = useCallback((afterId?: string): string => {
    const itemId = createLocalId('note_item');
    changeDraft((draft) => {
      if (draft.type !== 'checklist') {
        return draft;
      }
      const items = [...draft.items];
      const afterIndex = afterId ? items.findIndex((item) => item.id === afterId) : -1;
      const index = afterIndex < 0 ? items.length : afterIndex + 1;
      items.splice(index, 0, { id: itemId, content: '', isCompleted: false });
      return { ...draft, items };
    }, true);
    return itemId;
  }, [changeDraft]);

  const updateItem = useCallback((itemId: string, content: string) => {
    changeDraft((draft) => {
      const current = draft.items.find((item) => item.id === itemId);
      return !current || current.content === content ? draft : {
        ...draft,
        items: draft.items.map((item) => item.id === itemId ? { ...item, content } : item),
      };
    });
  }, [changeDraft]);

  const toggleItem = useCallback((itemId: string) => {
    changeDraft((draft) => !draft.items.some((item) => item.id === itemId) ? draft : {
      ...draft,
      items: draft.items.map((item) => item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item),
    }, true);
  }, [changeDraft]);

  const deleteItem = useCallback((itemId: string) => {
    changeDraft((draft) => !draft.items.some((item) => item.id === itemId) ? draft : {
      ...draft,
      items: draft.items.filter((item) => item.id !== itemId),
    }, true);
  }, [changeDraft]);

  const moveItem = useCallback((itemId: string, direction: -1 | 1) => {
    changeDraft((draft) => {
      const index = draft.items.findIndex((item) => item.id === itemId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= draft.items.length) {
        return draft;
      }
      const items = [...draft.items];
      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
      return { ...draft, items };
    }, true);
  }, [changeDraft]);

  const getCurrentState = useCallback(() => controllerRef.current?.getState() ?? null, []);
  const flush = useCallback(() => controllerRef.current?.flush() ?? Promise.resolve(true), []);
  const deleteNote = useCallback(() => controllerRef.current?.deleteNote() ?? Promise.resolve(false), []);

  return {
    draft: state.editor?.draft ?? null,
    isLoading: state.isLoading,
    loadError: state.loadError,
    notFound: state.notFound,
    saveStatus: state.editor?.saveStatus ?? 'idle',
    isPersisted: state.editor?.isPersisted ?? false,
    isDeleting: state.editor?.isDeleting ?? false,
    isDirty: state.editor?.isDirty ?? false,
    isCleared: state.editor?.isCleared ?? false,
    getCurrentState,
    reload,
    setTitle,
    setContent,
    togglePin,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    moveItem,
    flush,
    deleteNote,
  };
}
