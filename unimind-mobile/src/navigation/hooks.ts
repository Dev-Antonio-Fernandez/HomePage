import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

export type Nav = NativeStackNavigationProp<RootStackParamList>;

// Navegación tipada hacia el stack raíz desde cualquier pantalla.
export function useRootNav(): Nav {
  return useNavigation<Nav>();
}
