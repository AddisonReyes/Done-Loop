import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import ExistingNoteScreen from '@/app/notes/[id]';
import NewNoteScreen from '@/app/notes/new';

let mockParams: { id?: string | string[]; type?: string | string[] } = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));
jest.mock('@/features/notes/components/note-editor-screen', () => ({
  NoteEditorScreen: ({ id, type }: { id?: string; type?: string }) => <MockText>{id ? `Existing ${id}` : `New ${type}`}</MockText>,
}));
jest.mock('@/features/notes/components/invalid-note-route', () => ({ InvalidNoteRoute: () => <MockText>Invalid route</MockText> }));

describe('Notes routes', () => {
  it.each(['text', 'checklist'])('accepts %s for new notes', (type) => {
    mockParams = { type };
    render(<NewNoteScreen />);
    expect(screen.getByText(`New ${type}`)).toBeTruthy();
  });

  it('defaults an omitted note type to text', () => {
    mockParams = {};
    render(<NewNoteScreen />);
    expect(screen.getByText('New text')).toBeTruthy();
  });

  it.each(['other', ['text', 'checklist']])('rejects an invalid or repeated type %s', (type) => {
    mockParams = { type };
    render(<NewNoteScreen />);
    expect(screen.getByText('Invalid route')).toBeTruthy();
  });

  it('accepts a singular note id', () => {
    mockParams = { id: 'note_1' };
    render(<ExistingNoteScreen />);
    expect(screen.getByText('Existing note_1')).toBeTruthy();
  });

  it.each([undefined, '', ' ', ['note_1', 'note_2']])('rejects a missing, blank, or repeated id %s', (id) => {
    mockParams = { id };
    render(<ExistingNoteScreen />);
    expect(screen.getByText('Invalid route')).toBeTruthy();
  });
});
