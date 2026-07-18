import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { colors, spacing, radius, subjectColors } from '../../theme';
import { Schedule, Subjects } from '../../db';
import type { ScheduleBlock } from '../../db/types';
import { WEEKDAYS_SHORT } from '../../utils/dates';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'SubjectForm'>;

export function SubjectFormScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const editingId = route.params?.subjectId;

  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState<string>(subjectColors[0]);
  const [limit, setLimit] = useState('5');
  const [retardo, setRetardo] = useState('0.5');
  const [notes, setNotes] = useState('');
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [saving, setSaving] = useState(false);

  // Estado del bloque de horario a añadir (varios días a la vez)
  const [bDays, setBDays] = useState<number[]>([]);
  const [bStart, setBStart] = useState('');
  const [bEnd, setBEnd] = useState('');

  const toggleDay = (i: number) => {
    setBDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i],
    );
  };

  const loadBlocks = useCallback(async (id: string) => {
    setBlocks(await Schedule.listBlocksForSubject(id));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const s = await Subjects.getSubject(editingId);
      if (!s) return;
      setName(s.name);
      setProfessor(s.professor ?? '');
      setRoom(s.room ?? '');
      setColor(s.color);
      setLimit(String(s.absence_limit));
      setRetardo(String(s.retardo_value));
      setNotes(s.notes ?? '');
      loadBlocks(editingId);
    })();
  }, [editingId, loadBlocks]);

  const save = async () => {
    if (name.trim().length === 0) {
      Alert.alert('Falta el nombre', 'Escribe el nombre de la materia.');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      professor: professor.trim() || null,
      room: room.trim() || null,
      color,
      absence_limit: parseInt(limit, 10) || 0,
      retardo_value: parseFloat(retardo) || 0,
      notes: notes.trim() || null,
    };
    try {
      if (editingId) {
        await Subjects.updateSubject(editingId, payload);
      } else {
        await Subjects.createSubject(payload);
      }
      nav.goBack();
    } finally {
      setSaving(false);
    }
  };

  const addBlock = async () => {
    if (!editingId) {
      Alert.alert(
        'Guarda primero',
        'Guarda la materia antes de agregar horarios.',
      );
      return;
    }
    if (bDays.length === 0) {
      Alert.alert('Elige al menos un día', 'Toca los días en que tienes esta clase.');
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(bStart) || !/^\d{1,2}:\d{2}$/.test(bEnd)) {
      Alert.alert('Hora inválida', 'Usa el formato HH:MM (ej. 10:00).');
      return;
    }
    // Crea un bloque por cada día seleccionado con el mismo horario.
    for (const day of bDays) {
      await Schedule.addBlock({
        subject_id: editingId,
        weekday: day,
        start_time: bStart,
        end_time: bEnd,
      });
    }
    setBDays([]);
    setBStart('');
    setBEnd('');
    loadBlocks(editingId);
  };

  const removeBlock = async (id: string) => {
    await Schedule.deleteBlock(id);
    if (editingId) loadBlocks(editingId);
  };

  const confirmDelete = () => {
    if (!editingId) return;
    Alert.alert('Eliminar materia', '¿Seguro? Se borrarán sus notas y registros.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Subjects.deleteSubject(editingId);
          nav.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Input label="Nombre" value={name} onChangeText={setName} placeholder="Ej. Contabilidad 2" />
      <Input label="Profesor" value={professor} onChangeText={setProfessor} placeholder="Opcional" />
      <Input label="Salón" value={room} onChangeText={setRoom} placeholder="Ej. Aula 205" />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">Color</Text>
        <View style={styles.colors}>
          {subjectColors.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.color,
                { backgroundColor: c },
                color === c && styles.colorActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={styles.flex}>
          <Input
            label="Límite de faltas"
            value={limit}
            onChangeText={setLimit}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.flex}>
          <Input
            label="Valor de retardo"
            value={retardo}
            onChangeText={setRetardo}
            keyboardType="numeric"
            hint="0, 0.5 o 1"
          />
        </View>
      </View>

      <Input
        label="Notas generales"
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcional"
        multiline
      />

      <Button label={editingId ? 'Guardar cambios' : 'Crear materia'} onPress={save} loading={saving} />

      {/* Horario */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Horario" />
        {!editingId ? (
          <Card>
            <Text variant="muted">Guarda la materia para agregar horarios.</Text>
          </Card>
        ) : (
          <>
            {blocks.map((b) => (
              <Card key={b.id} padded={false}>
                <View style={styles.blockRow}>
                  <Text variant="body" weight="600">
                    {WEEKDAYS_SHORT[b.weekday]}
                  </Text>
                  <Text variant="muted" style={styles.flex}>
                    {'  '}
                    {b.start_time} – {b.end_time}
                  </Text>
                  <Pressable onPress={() => removeBlock(b.id)} hitSlop={8}>
                    <Text style={{ color: colors.danger }}>Quitar</Text>
                  </Pressable>
                </View>
              </Card>
            ))}

            <Card>
              <Text variant="label">Agregar bloque</Text>
              <Text variant="faint">
                Toca todos los días que tengan este mismo horario.
              </Text>
              <View style={styles.dayPicker}>
                {WEEKDAYS_SHORT.map((d, i) => {
                  const on = bDays.includes(i);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => toggleDay(i)}
                      style={[styles.dayBtn, on && styles.dayBtnActive]}
                    >
                      <Text
                        style={{
                          color: on ? colors.white : colors.textMuted,
                          fontSize: 12,
                        }}
                        weight="600"
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.flex}>
                  <Input label="Inicio" value={bStart} onChangeText={setBStart} placeholder="10:00" />
                </View>
                <View style={styles.flex}>
                  <Input label="Fin" value={bEnd} onChangeText={setBEnd} placeholder="11:30" />
                </View>
              </View>
              <Button
                label={
                  bDays.length > 1
                    ? `Agregar a ${bDays.length} días`
                    : 'Agregar al horario'
                }
                onPress={addBlock}
                variant="secondary"
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          </>
        )}
      </View>

      {editingId ? (
        <Button label="Eliminar materia" onPress={confirmDelete} variant="danger" />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  color: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorActive: { borderColor: colors.white },
  rowInputs: { flexDirection: 'row', gap: spacing.md },
  blockRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  dayPicker: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.md },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  dayBtnActive: { backgroundColor: colors.primaryStrong },
});
