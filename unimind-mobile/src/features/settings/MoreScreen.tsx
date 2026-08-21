import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { colors, spacing, radius } from '../../theme';
import { Settings, Subjects, Tasks } from '../../db';
import type { TaskWithSubject } from '../../db/repositories/tasks';
import { seedMySchedule } from './seed';
import {
  loadConfig,
  saveConfig,
  getApiKey,
  setApiKey,
  AI_PRESETS,
  type AIConfig,
  loadSttConfig,
  saveSttConfig,
  getSttKey,
  setSttKey,
  STT_PRESETS,
  type STTConfig,
} from '../../ai';

export function MoreScreen() {
  const [name, setName] = useState('');
  const [cfg, setCfg] = useState<AIConfig | null>(null);
  const [apiKey, setKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [stt, setStt] = useState<STTConfig | null>(null);
  const [sttKey, setSttKeyInput] = useState('');
  const [sttKeySaved, setSttKeySaved] = useState(false);
  const [tasks, setTasks] = useState<TaskWithSubject[]>([]);
  const [newTask, setNewTask] = useState('');

  const load = useCallback(async () => {
    const [n, c, k, sc, sk, t] = await Promise.all([
      Settings.getSetting('USER_NAME'),
      loadConfig(),
      getApiKey(),
      loadSttConfig(),
      getSttKey(),
      Tasks.pendingTasks(),
    ]);
    setName(n ?? '');
    setCfg(c);
    setKeySaved(!!k);
    setKey('');
    setStt(sc);
    setSttKeySaved(!!sk);
    setSttKeyInput('');
    setTasks(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const saveName = async () => {
    await Settings.setSetting('USER_NAME', name.trim());
    Alert.alert('Guardado', 'Tu nombre se actualizó.');
  };

  const importSchedule = async () => {
    const existing = await Subjects.listSubjects();
    const run = async () => {
      const n = await seedMySchedule();
      Alert.alert(
        'Horario importado',
        `Se agregaron ${n} materias con sus horarios. Ajusta el límite de faltas de cada una en su pantalla de edición.`,
      );
    };
    if (existing.length > 0) {
      Alert.alert(
        'Ya tienes materias',
        'Esto agregará tus materias otra vez (pueden quedar duplicadas). ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Agregar', onPress: run },
        ],
      );
    } else {
      run();
    }
  };

  const applyPreset = (key: string) => {
    const p = AI_PRESETS[key];
    if (!p || !cfg) return;
    setCfg({
      ...cfg,
      provider: key,
      baseUrl: p.baseUrl,
      modelFast: p.fast,
      modelMain: p.main,
      modelAdvanced: p.advanced,
    });
  };

  const saveAI = async () => {
    if (!cfg) return;
    await saveConfig(cfg);
    if (apiKey.trim().length > 0) {
      await setApiKey(apiKey.trim());
      setKeySaved(true);
      setKey('');
    }
    Alert.alert('Guardado', 'Configuración de IA actualizada.');
  };

  const clearKey = async () => {
    await setApiKey('');
    setKeySaved(false);
    Alert.alert('Listo', 'API key eliminada del dispositivo.');
  };

  const applySttPreset = (key: string) => {
    const p = STT_PRESETS[key];
    if (!p || !stt) return;
    setStt({ ...stt, provider: key, baseUrl: p.baseUrl, model: p.model });
  };

  const saveStt = async () => {
    if (!stt) return;
    await saveSttConfig(stt);
    if (sttKey.trim().length > 0) {
      await setSttKey(sttKey.trim());
      setSttKeySaved(true);
      setSttKeyInput('');
    }
    Alert.alert('Guardado', 'Configuración de transcripción actualizada.');
  };

  const clearSttKey = async () => {
    await setSttKey('');
    setSttKeySaved(false);
    Alert.alert('Listo', 'API key de transcripción eliminada.');
  };

  const addTask = async () => {
    if (newTask.trim().length === 0) return;
    await Tasks.createTask({ title: newTask.trim() });
    setNewTask('');
    load();
  };

  const completeTask = async (id: string) => {
    await Tasks.toggleTask(id, true);
    load();
  };

  return (
    <Screen onRefresh={load}>
      <Text variant="title">Más</Text>

      {/* Perfil */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Perfil" />
        <Input label="Tu nombre" value={name} onChangeText={setName} placeholder="¿Cómo te llamas?" />
        <Button label="Guardar nombre" onPress={saveName} variant="secondary" />
      </View>

      {/* Importar horario */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Importar mi horario" />
        <Card>
          <Text variant="muted">
            Carga tus 6 materias de Mercadotecnia con sus horarios de un solo
            toque. Después ajusta el límite de faltas de cada una.
          </Text>
        </Card>
        <Button label="Importar horario (Mercadotecnia)" onPress={importSchedule} />
      </View>

      {/* IA */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Inteligencia artificial" />
        <Text variant="faint">
          Compatible con OpenAI, DeepSeek, Kimi (Moonshot) y cualquier API estilo OpenAI.
        </Text>

        <View style={styles.presets}>
          {Object.entries(AI_PRESETS).map(([key, p]) => (
            <Pressable
              key={key}
              onPress={() => applyPreset(key)}
              style={[
                styles.preset,
                cfg?.provider === key && styles.presetActive,
              ]}
            >
              <Text
                weight="600"
                color={cfg?.provider === key ? colors.white : colors.textMuted}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {cfg ? (
          <>
            <Input
              label="URL base"
              value={cfg.baseUrl}
              onChangeText={(v) => setCfg({ ...cfg, baseUrl: v })}
              autoCapitalize="none"
            />
            <Input
              label="Modelo rápido (barato/nano)"
              value={cfg.modelFast}
              onChangeText={(v) => setCfg({ ...cfg, modelFast: v })}
              autoCapitalize="none"
            />
            <Input
              label="Modelo principal (mini)"
              value={cfg.modelMain}
              onChangeText={(v) => setCfg({ ...cfg, modelMain: v })}
              autoCapitalize="none"
            />
            <Input
              label="Modelo avanzado (opcional)"
              value={cfg.modelAdvanced}
              onChangeText={(v) => setCfg({ ...cfg, modelAdvanced: v })}
              autoCapitalize="none"
            />
          </>
        ) : null}

        <Input
          label={keySaved ? 'API key (ya configurada — escribe para reemplazar)' : 'API key'}
          value={apiKey}
          onChangeText={setKey}
          placeholder={keySaved ? '•••••••• guardada de forma segura' : 'sk-...'}
          secureTextEntry
          autoCapitalize="none"
          hint="Se guarda cifrada en el dispositivo (SecureStore), nunca en la base de datos."
        />

        <Button label="Guardar configuración de IA" onPress={saveAI} />
        {keySaved ? (
          <Button label="Borrar API key" onPress={clearKey} variant="ghost" />
        ) : null}
      </View>

      {/* Transcripción de audio */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Transcripción de clases (audio)" />
        <Text variant="faint">
          Para grabar clases y convertirlas en notas. Groq es barato y rápido.
        </Text>

        <View style={styles.presets}>
          {Object.entries(STT_PRESETS).map(([key, p]) => (
            <Pressable
              key={key}
              onPress={() => applySttPreset(key)}
              style={[styles.preset, stt?.provider === key && styles.presetActive]}
            >
              <Text
                weight="600"
                color={stt?.provider === key ? colors.white : colors.textMuted}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {stt ? (
          <>
            <Input
              label="URL base"
              value={stt.baseUrl}
              onChangeText={(v) => setStt({ ...stt, baseUrl: v })}
              autoCapitalize="none"
            />
            <Input
              label="Modelo de transcripción"
              value={stt.model}
              onChangeText={(v) => setStt({ ...stt, model: v })}
              autoCapitalize="none"
            />
          </>
        ) : null}

        <Input
          label={
            sttKeySaved
              ? 'API key de transcripción (ya configurada — escribe para reemplazar)'
              : 'API key de transcripción'
          }
          value={sttKey}
          onChangeText={setSttKeyInput}
          placeholder={sttKeySaved ? '•••••••• guardada' : 'gsk_...'}
          secureTextEntry
          autoCapitalize="none"
          hint="Se guarda cifrada en el dispositivo (SecureStore)."
        />

        <Button label="Guardar transcripción" onPress={saveStt} />
        {sttKeySaved ? (
          <Button label="Borrar API key de transcripción" onPress={clearSttKey} variant="ghost" />
        ) : null}
      </View>

      {/* Tareas */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Todas las tareas pendientes" />
        <View style={styles.addRow}>
          <View style={styles.flex}>
            <Input value={newTask} onChangeText={setNewTask} placeholder="Nueva tarea rápida" />
          </View>
          <Button label="+" onPress={addTask} fullWidth={false} style={styles.addBtn} />
        </View>
        {tasks.length === 0 ? (
          <Card><Text variant="muted">Sin tareas pendientes. 🎉</Text></Card>
        ) : (
          tasks.map((t) => (
            <Card key={t.id} padded={false}>
              <Pressable style={styles.taskRow} onPress={() => completeTask(t.id)}>
                <View style={styles.checkbox} />
                <View style={styles.flex}>
                  <Text variant="body" weight="600">{t.title}</Text>
                  {t.subject_name ? <Text variant="faint">{t.subject_name}</Text> : null}
                </View>
                {t.source === 'ia' ? <Text variant="faint">IA</Text> : null}
              </Pressable>
            </Card>
          ))
        )}
      </View>

      {/* Acerca de */}
      <Card>
        <Text variant="subheading">UniMind Mobile</Text>
        <Text variant="muted" style={{ marginTop: spacing.xs }}>
          App personal, local-first y sin fines de lucro. Tus datos viven en tu
          teléfono; la IA solo se usa cuando tú la pides.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetActive: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  addBtn: { width: 50, height: 50 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textFaint,
  },
});
