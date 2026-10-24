import { useLocalSearchParams } from 'expo-router';

import { InvalidNoteRoute } from '@/features/notes/components/invalid-note-route';
import { NoteEditorScreen } from '@/features/notes/components/note-editor-screen';

export default function NewNoteScreen() {
  const { type } = useLocalSearchParams<{ type?: string | string[] }>();
  if (type !== undefined && type !== 'text' && type !== 'checklist') return <InvalidNoteRoute />;
  return <NoteEditorScreen type={type ?? 'text'} />;
}
