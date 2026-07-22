import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Subjects: undefined;
  NewNoteTab: undefined; // botón central (+), intercepta y navega a NewNote
  Study: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  SubjectForm: { subjectId?: string };
  SubjectMemory: { subjectId: string };
  ActiveClass: { sessionId: string };
  CloseClass: { sessionId: string };
  NewNote: { subjectId?: string; sessionId?: string };
  Explain: { subjectId: string; question?: string };
  Faltas: undefined;
  Tasks: undefined;
  RecordClass: { sessionId: string };
  StudyClass: { sessionId: string };
  Review: { subjectId: string };
};
