import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NotesRepository } from '@/features/notes/repositories/notes-repository';
import { filterNotes } from '@/features/notes/services/note-search';
import type { Note } from '@/features/notes/types';
import { useTranslation } from '@/i18n';
import { createAppEventSource, emitAppEvent, subscribeToAppEvent } from '@/shared/events/app-events';

export function useNotes() {
  const { t } = useTranslation();
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [failure, setFailure] = useState<'load' | 'save' | null>(null);
  const [pendingPinIds, setPendingPinIds] = useState<ReadonlySet<string>>(new Set());
  const pendingPinIdsRef = useRef(new Set<string>());
  const [eventSource] = useState(() => createAppEventSource('notes-list'));
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const reload = useCallback(async () => {
    const request = ++requestRef.current;
    try {
      const loadedNotes = await NotesRepository.list();
      if (mountedRef.current && request === requestRef.current) {
        setAllNotes(loadedNotes);
        setFailure(null);
      }
    } catch {
      if (mountedRef.current && request === requestRef.current) setFailure('load');
    } finally {
      if (mountedRef.current && request === requestRef.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  useEffect(() => subscribeToAppEvent('notesChanged', (payload) => {
    if (payload.source !== eventSource) void reload();
  }), [eventSource, reload]);

  const setPinned = useCallback(async (note: Note) => {
    if (pendingPinIdsRef.current.has(note.id)) return false;
    pendingPinIdsRef.current.add(note.id);
    setPendingPinIds(new Set(pendingPinIdsRef.current));
    try {
      const saved = await NotesRepository.setPinned(note.id, !note.isPinned);
      if (mountedRef.current) setAllNotes((current) => current.map((item) => item.id === saved.id ? saved : item));
      await reload();
      emitAppEvent('notesChanged', { source: eventSource });
      return true;
    } catch {
      if (mountedRef.current) setFailure('save');
      return false;
    } finally {
      pendingPinIdsRef.current.delete(note.id);
      if (mountedRef.current) setPendingPinIds(new Set(pendingPinIdsRef.current));
    }
  }, [eventSource, reload]);

  const notes = useMemo(() => filterNotes(allNotes, search), [allNotes, search]);

  return {
    notes,
    search,
    setSearch,
    isLoading,
    errorMessage: failure ? t(failure === 'load' ? 'notes.loadError' : 'notes.saveError') : null,
    reload,
    setPinned,
    isPinning: (id: string) => pendingPinIds.has(id),
  };
}
