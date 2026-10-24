import { useLocalSearchParams } from 'expo-router';

import { InvalidNoteRoute } from '@/features/notes/components/invalid-note-route';
import { NoteEditorScreen } from '@/features/notes/components/note-editor-screen';

export default function ExistingNoteScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || id.trim().length === 0) return <InvalidNoteRoute />;
  return <NoteEditorScreen key={id} id={id} />;
}
