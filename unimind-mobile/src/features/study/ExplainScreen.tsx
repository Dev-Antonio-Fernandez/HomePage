import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../theme';
import { Subjects } from '../../db';
import type { Subject } from '../../db/types';
import { AIService, MissingKeyError } from '../../ai';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'Explain'>;

export function ExplainScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { subjectId } = route.params;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [question, setQuestion] = useState(route.params?.question ?? '');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Subjects.getSubject(subjectId).then(setSubject);
  }, [subjectId]);

  const ask = async () => {
    if (question.trim().length === 0) {
      Alert.alert('Escribe una pregunta');
      return;
    }
    setLoading(true);
    setAnswer('');
    try {
      const res = await AIService.explainDoubt({ subjectId, question: question.trim() });
      setAnswer(res);
    } catch (e) {
      if (e instanceof MissingKeyError) {
        Alert.alert('IA no configurada', 'Configura tu API key en Ajustes.', [
          { text: 'Ir a Ajustes', onPress: () => nav.navigate('Tabs', { screen: 'More' }) },
          { text: 'Cerrar', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Error', (e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text variant="title">Repaso con IA</Text>
      <Text variant="muted">{subject?.name}</Text>
      <Text variant="faint">
        La IA responde usando solo el contexto de tus notas de esta materia.
      </Text>

      <Input
        label="¿Qué quieres entender?"
        value={question}
        onChangeText={setQuestion}
        placeholder="Ej. Explícame los cargos y abonos con un ejemplo"
        multiline
      />
      <Button label="Preguntar" onPress={ask} loading={loading} />

      {answer ? (
        <Card accent={colors.primaryBorder}>
          <Text variant="body" style={styles.answer}>{answer}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  answer: { lineHeight: 22 },
});
