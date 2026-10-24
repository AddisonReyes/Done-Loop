import type { NoteDraft } from '../types';
import { hasMeaningfulNote } from './note-draft';

export type NoteSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'empty';

export type NoteEditorState = {
  draft: NoteDraft;
  isPersisted: boolean;
  isDeleting: boolean;
  isDirty: boolean;
  isCleared: boolean;
  saveStatus: NoteSaveStatus;
};

type NoteAutosaveOptions = {
  draft: NoteDraft;
  isPersisted: boolean;
  save: (draft: NoteDraft, isPersisted: boolean) => Promise<void>;
  delete: (id: string) => Promise<boolean>;
  onChange: (state: NoteEditorState) => void;
  onCommitted: (id: string) => void;
};

export class NoteAutosave {
  private draft: NoteDraft;
  private isPersisted: boolean;
  private revision = 0;
  private savedRevision = 0;
  private hasSaved = false;
  private isSaving = false;
  private isDeleting = false;
  private hasError = false;
  private isDeleted = false;
  private isDisposed = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private savePromise: Promise<boolean> | null = null;
  private deletePromise: Promise<boolean> | null = null;

  constructor(private readonly options: NoteAutosaveOptions) {
    this.draft = options.draft;
    this.isPersisted = options.isPersisted;
  }

  getState(): NoteEditorState {
    const isMeaningful = hasMeaningfulNote(this.draft);
    const isDirty = this.revision !== this.savedRevision;
    const isCleared = this.isPersisted && !isMeaningful;
    const saveStatus: NoteSaveStatus = isCleared
      ? 'empty'
      : this.isSaving
        ? 'saving'
        : this.hasError
          ? 'error'
          : isDirty && isMeaningful
            ? 'dirty'
            : this.hasSaved
              ? 'saved'
              : 'idle';

    return {
      draft: this.draft,
      isPersisted: this.isPersisted,
      isDeleting: this.isDeleting,
      isDirty,
      isCleared,
      saveStatus,
    };
  }

  changeDraft(draft: NoteDraft, immediate = false): void {
    if (this.isDisposed || this.isDeleted || this.isDeleting || draft === this.draft) {
      return;
    }

    this.draft = draft;
    this.revision += 1;
    this.hasError = false;
    this.clearTimer();
    this.publish();

    if (!hasMeaningfulNote(draft)) {
      return;
    }

    if (immediate) {
      void this.flush();
    } else {
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, 500);
    }
  }

  async flush(): Promise<boolean> {
    this.clearTimer();
    if (this.isDeleted) {
      return true;
    }
    if (this.isDisposed || this.isDeleting) {
      return false;
    }

    if (!this.savePromise) {
      this.savePromise = this.saveLatest().finally(() => {
        this.savePromise = null;
      });
    }

    const succeeded = await this.savePromise;
    if (!succeeded) {
      return false;
    }

    // A caller can edit after the worker settles but before its promise clears.
    if (!this.isDisposed && !this.isDeleting && hasMeaningfulNote(this.draft) && this.revision !== this.savedRevision) {
      return this.flush();
    }
    return !this.isPersisted || hasMeaningfulNote(this.draft);
  }

  deleteNote(): Promise<boolean> {
    if (this.deletePromise) {
      return this.deletePromise;
    }
    if (this.isDeleted) {
      return Promise.resolve(true);
    }
    if (this.isDisposed) {
      return Promise.resolve(false);
    }

    this.clearTimer();
    this.isDeleting = true;
    this.hasError = false;
    this.publish();
    this.deletePromise = this.deleteAfterSave().finally(() => {
      this.deletePromise = null;
      this.isDeleting = false;
      this.publish();
    });
    return this.deletePromise;
  }

  dispose(): void {
    // An already requested flush keeps draining after the UI detaches.
    this.isDisposed = true;
    this.clearTimer();
  }

  private async saveLatest(): Promise<boolean> {
    // Start on a microtask so flush() installs the shared promise first.
    await Promise.resolve();
    while (!this.isDeleting && !this.isDeleted && hasMeaningfulNote(this.draft) && this.revision !== this.savedRevision) {
      this.clearTimer();
      const snapshot = this.draft;
      const snapshotRevision = this.revision;
      this.isSaving = true;
      this.hasError = false;
      this.publish();

      try {
        await this.options.save(snapshot, this.isPersisted);
      } catch {
        this.isSaving = false;
        this.hasError = true;
        this.publish();
        return false;
      }

      // A successful create still exists if the user cleared the live draft.
      this.isPersisted = true;
      this.savedRevision = snapshotRevision;
      this.hasSaved = true;
      this.isSaving = false;
      this.options.onCommitted(snapshot.id);
      this.publish();
    }

    return !this.isPersisted || hasMeaningfulNote(this.draft);
  }

  private async deleteAfterSave(): Promise<boolean> {
    await this.savePromise;
    try {
      if (this.isPersisted) {
        const deleted = await this.options.delete(this.draft.id);
        if (!deleted) {
          this.hasError = true;
          return false;
        }
        this.options.onCommitted(this.draft.id);
      }
      this.isDeleted = true;
      this.isPersisted = false;
      this.savedRevision = this.revision;
      return true;
    } catch {
      this.hasError = true;
      return false;
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private publish(): void {
    if (!this.isDisposed) {
      this.options.onChange(this.getState());
    }
  }
}
