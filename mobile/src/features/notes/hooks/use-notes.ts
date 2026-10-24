import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NotesRepository } from '@/features/notes/repositories/notes-repository';
import { filterNotes } from '@/features/notes/services/note-search';
import type { Note } from '@/features/notes/types';
import { useTranslation } from '@/i18n';
import { createAppEventSource, emitAppEvent } from '@/shared/events/app-events';
import { useDomainRefresh } from '@/shared/hooks/use-domain-refresh';

function sortNotes(notes: Note[]): Note[] {
  return notes.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) ||
    (a.updatedAt === b.updatedAt ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.updatedAt > b.updatedAt ? -1 : 1));
}

export function useNotes({ isFocused = true }: { isFocused?: boolean } = {}) {
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
  const activeReads = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const reload = useCallback(async () => {
    const request = ++requestRef.current;
    activeReads.current += 1;
    try {
      const loadedNotes = await NotesRepository.list();
      if (mountedRef.current && request === requestRef.current) {
        setAllNotes(loadedNotes);
        setFailure(null);
      }
    } catch {
      if (mountedRef.current && request === requestRef.current) setFailure('load');
    } finally {
      activeReads.current -= 1;
      if (mountedRef.current && request === requestRef.current) setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async (ids: ReadonlySet<string> | null) => {
    if (!ids || ids.size > 8) return reload();
    const request = ++requestRef.current;
    activeReads.current += 1;
    try {
      const notes = await Promise.all([...ids].map((id) => NotesRepository.findById(id)));
      if (!mountedRef.current || request !== requestRef.current) return;
      setAllNotes((current) => sortNotes([
        ...current.filter((note) => !ids.has(note.id)),
        ...notes.filter((note): note is Note => note !== null),
      ]));
      setFailure(null);
    } catch {
      // An uncertain item update must recover through the authoritative full list.
      await reload();
    } finally {
      activeReads.current -= 1;
    }
  }, [reload]);
  useDomainRefresh('notesChanged', eventSource, isFocused, refresh);

  const setPinned = useCallback(async (note: Note) => {
    if (pendingPinIdsRef.current.has(note.id)) return false;
    pendingPinIdsRef.current.add(note.id);
    setPendingPinIds(new Set(pendingPinIdsRef.current));
    try {
      const saved = await NotesRepository.setPinned(note.id, !note.isPinned);
      if (mountedRef.current) setAllNotes((current) => sortNotes(current.map((item) => item.id === saved.id ? saved : item)));
      // A read that began before pinning could still contain the previous pin value.
      if (activeReads.current > 0) await reload();
      emitAppEvent('notesChanged', { source: eventSource, id: saved.id });
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
