import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import type { RootStackParamList, TabParamList } from './types';
import { TabBar } from './TabBar';

import { HomeScreen } from '../features/home/HomeScreen';
import { SubjectsScreen } from '../features/subjects/SubjectsScreen';
import { SubjectFormScreen } from '../features/subjects/SubjectFormScreen';
import { SubjectMemoryScreen } from '../features/subjects/SubjectMemoryScreen';
import { StudyScreen } from '../features/study/StudyScreen';
import { MoreScreen } from '../features/settings/MoreScreen';
import { ActiveClassScreen } from '../features/sessions/ActiveClassScreen';
import { CloseClassScreen } from '../features/sessions/CloseClassScreen';
import { NewNoteScreen } from '../features/notes/NewNoteScreen';
import { ExplainScreen } from '../features/study/ExplainScreen';
import { FaltasScreen } from '../features/attendance/FaltasScreen';
import { TasksScreen } from '../features/tasks/TasksScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Placeholder() {
  return null;
}

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Subjects" component={SubjectsScreen} />
      <Tab.Screen name="NewNoteTab" component={Placeholder} />
      <Tab.Screen name="Study" component={StudyScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const headerStyle = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text },
  contentStyle: { backgroundColor: colors.bg },
};

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="SubjectForm"
        component={SubjectFormScreen}
        options={{ title: 'Materia', presentation: 'modal' }}
      />
      <Stack.Screen
        name="SubjectMemory"
        component={SubjectMemoryScreen}
        options={{ title: 'Memoria de materia' }}
      />
      <Stack.Screen
        name="ActiveClass"
        component={ActiveClassScreen}
        options={{ title: 'Clase activa' }}
      />
      <Stack.Screen
        name="CloseClass"
        component={CloseClassScreen}
        options={{ title: 'Cerrar clase', presentation: 'modal' }}
      />
      <Stack.Screen
        name="NewNote"
        component={NewNoteScreen}
        options={{ title: 'Nueva nota', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Explain"
        component={ExplainScreen}
        options={{ title: 'Repaso con IA' }}
      />
      <Stack.Screen
        name="Faltas"
        component={FaltasScreen}
        options={{ title: 'Faltas' }}
      />
      <Stack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'Pendientes' }}
      />
    </Stack.Navigator>
  );
}
