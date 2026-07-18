import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatTile } from '../../components/ui/StatTile';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { colors, spacing, radius, fontSize } from '../../theme';
import {
  greeting,
  weekDates,
  WEEKDAYS_SHORT,
  isoDate,
  relativeToNow,
  hmToMinutes,
} from '../../utils/dates';
import { summarizeAbsences, riskColor } from '../../utils/attendance';
import { Attendance, Schedule, Sessions, Subjects, Tasks } from '../../db';
import type { ClassOfDay } from '../../db/repositories/schedule';
import type { TaskWithSubject } from '../../db/repositories/tasks';
import { Settings } from '../../db';
import { useRootNav } from '../../navigation/hooks';

interface NowInfo {
  cls: ClassOfDay;
  sessionId: string | null;
  marked: boolean;
  inProgress: boolean; // true = en curso; false = próxima (empieza pronto)
}

interface HomeData {
  name: string;
  classes: ClassOfDay[];
  remaining: number;
  limitTotal: number;
  worstRisk: string;
  pending: TaskWithSubject[];
  now: NowInfo | null;
  last:
    | (Awaited<ReturnType<typeof Sessions.mostRecentSession>>)
    | null;
}

// Encuentra la clase en curso (o la próxima si empieza en <= 20 min) de hoy.
async function detectNow(): Promise<NowInfo | null> {
  const now = new Date();
  const todayClasses = await Schedule.classesForWeekday(now.getDay());
  if (todayClasses.length === 0) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let picked: ClassOfDay | null = null;
  let inProgress = false;
  for (const c of todayClasses) {
    const start = hmToMinutes(c.start_time);
    const end = hmToMinutes(c.end_time);
    if (nowMin >= start && nowMin < end) {
      picked = c;
      inProgress = true;
      break;
    }
  }
  if (!picked) {
    // No hay clase en curso: busca la próxima que empiece dentro de 20 min.
    for (const c of todayClasses) {
      const start = hmToMinutes(c.start_time);
      if (start - nowMin > 0 && start - nowMin <= 20) {
        picked = c;
        inProgress = false;
        break;
      }
    }
  }
  if (!picked) return null;

  const session = await Sessions.todaySessionForSubject(picked.subject_id);
  const marked = session
    ? !!(await Attendance.attendanceForSession(session.id))
    : false;
  return { cls: picked, sessionId: session?.id ?? null, marked, inProgress };
}

const QUICK_ACTIONS = [
  { key: 'note', emoji: '✏️', label: 'Nueva nota', color: colors.primary },
  { key: 'doubt', emoji: '❓', label: 'Registrar duda', color: colors.info },
  { key: 'attend', emoji: '✅', label: 'Marcar asistencia', color: colors.success },
  { key: 'review', emoji: '🧠', label: 'Repasar con IA', color: colors.warning },
] as const;

export function HomeScreen() {
  const nav = useRootNav();
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());
  const [data, setData] = useState<HomeData | null>(null);
  const days = weekDates(today);

  const load = useCallback(async (weekday: number) => {
    const [subjects, classes, pending, last, nameSetting] = await Promise.all([
      Subjects.listSubjects(),
      Schedule.classesForWeekday(weekday),
      Tasks.pendingTasks(),
      Sessions.mostRecentSession(),
      Settings.getSetting('USER_NAME'),
    ]);

    let remaining = 0;
    let limitTotal = 0;
    let worst: string = colors.success;
    for (const s of subjects) {
      const used = await Subjects.absencesUsed(s.id);
      const sum = summarizeAbsences(used, s.absence_limit);
      remaining += sum.remaining;
      limitTotal += sum.limit;
      if (sum.risk === 'high') worst = colors.danger;
      else if (sum.risk === 'medium' && worst !== colors.danger)
        worst = colors.warning;
    }

    const now = await detectNow();

    setData({
      name: nameSetting || 'estudiante',
      classes,
      remaining,
      limitTotal,
      worstRisk: worst,
      pending,
      now,
      last,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(selectedDay);
    }, [load, selectedDay]),
  );

  const onSelectDay = (weekday: number) => {
    setSelectedDay(weekday);
    load(weekday);
  };

  const openClass = async (c: ClassOfDay) => {
    const sessionId = await Sessions.resumeOrOpen(c.subject_id, {
      start_time: c.start_time,
      end_time: c.end_time,
    });
    nav.navigate('ActiveClass', { sessionId });
  };

  // Registra asistencia de la clase en curso con un toque (Sí/No).
  const markNow = async (info: NowInfo, status: 'asistio' | 'falto') => {
    const sessionId = await Sessions.resumeOrOpen(info.cls.subject_id, {
      start_time: info.cls.start_time,
      end_time: info.cls.end_time,
    });
    await Attendance.markAttendance({
      subjectId: info.cls.subject_id,
      sessionId,
      status,
      retardoValue: info.cls.subject.retardo_value,
    });
    load(selectedDay);
  };

  const onQuick = (key: string) => {
    if (key === 'note') nav.navigate('NewNote', {});
    else if (key === 'doubt') nav.navigate('NewNote', {});
    else if (key === 'attend') nav.navigate('Tabs', { screen: 'Subjects' });
    else if (key === 'review') nav.navigate('Tabs', { screen: 'Study' });
  };

  const toggleTask = async (id: string, done: boolean) => {
    await Tasks.toggleTask(id, done);
    load(selectedDay);
  };

  const isToday = selectedDay === today.getDay();

  return (
    <Screen onRefresh={() => load(selectedDay)}>
      {/* Saludo */}
      <View>
        <Text variant="title">
          {greeting()}, {data?.name ?? ''} 👋
        </Text>
        <Text variant="muted">“Cada clase te acerca a tu mejor versión.”</Text>
      </View>

      {/* Selector semanal */}
      <View style={styles.week}>
        {days.map((d) => {
          const wd = d.getDay();
          const active = wd === selectedDay;
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => onSelectDay(wd)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  color: active ? colors.white : colors.textMuted,
                }}
                weight="600"
              >
                {WEEKDAYS_SHORT[wd]}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  color: active ? colors.white : colors.text,
                }}
                weight="700"
              >
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Clase AHORA — detección automática + asistencia de un toque */}
      {data?.now ? (
        <Card accent={colors.primaryBorder}>
          <View style={styles.nowHead}>
            <Badge
              label={data.now.inProgress ? 'Ahora' : 'En breve'}
              color={colors.primary}
              solid
            />
            <Text variant="faint">
              {data.now.cls.start_time} – {data.now.cls.end_time}
              {data.now.cls.room_override || data.now.cls.subject.room
                ? `  ·  ${data.now.cls.room_override || data.now.cls.subject.room}`
                : ''}
            </Text>
          </View>
          <Text variant="heading" style={{ marginTop: spacing.sm }}>
            {data.now.cls.subject.name}
          </Text>

          {/* Asistencia de un toque */}
          {data.now.marked ? (
            <Text
              variant="body"
              color={colors.success}
              style={{ marginTop: spacing.md }}
            >
              ✓ Asistencia registrada
            </Text>
          ) : (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Text variant="muted">¿Vas a asistir a esta clase?</Text>
              <View style={styles.nowButtons}>
                <Button
                  label="Sí, asistí"
                  onPress={() => markNow(data.now!, 'asistio')}
                  style={styles.flex}
                />
                <Button
                  label="No, falté"
                  onPress={() => markNow(data.now!, 'falto')}
                  variant="danger"
                  style={styles.flex}
                />
              </View>
            </View>
          )}

          <Button
            label="✏️  Tomar notas de esta clase"
            onPress={() => openClass(data.now!.cls)}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}

      {/* Clases del día */}
      <View style={styles.section}>
        <SectionHeader title={isToday ? 'Hoy tienes' : 'Clases del día'} />
        {data && data.classes.length === 0 ? (
          <Card>
            <Text variant="muted">No hay clases programadas este día.</Text>
          </Card>
        ) : (
          <Card padded={false}>
            {data?.classes.map((c, i) => (
              <Pressable
                key={c.id}
                onPress={() => openClass(c)}
                style={[
                  styles.classRow,
                  i > 0 && styles.divider,
                ]}
              >
                <View style={[styles.classDot, { backgroundColor: c.subject.color }]} />
                <View style={styles.flex}>
                  <Text variant="subheading">{c.subject.name}</Text>
                  <Text variant="muted">
                    {c.start_time} – {c.end_time}
                    {'   '}
                    {c.room_override || c.subject.room || ''}
                  </Text>
                </View>
                {isToday ? (
                  <Badge
                    label={relativeToNow(c.start_time, c.end_time)}
                    color={colors.primary}
                    soft
                  />
                ) : null}
              </Pressable>
            ))}
          </Card>
        )}
      </View>

      {/* Resumen del día */}
      <View style={styles.section}>
        <SectionHeader title="Resumen del día" />
        <View style={styles.statRow}>
          <StatTile
            label="Faltas restantes"
            value={`${data?.remaining ?? 0}/${data?.limitTotal ?? 0}`}
            valueColor={data?.worstRisk}
            icon={<Text>✅</Text>}
            onPress={() => nav.navigate('Faltas')}
          />
          <StatTile
            label="Tareas pendientes"
            value={String(data?.pending.length ?? 0)}
            icon={<Text>📋</Text>}
            onPress={() => nav.navigate('Tasks')}
          />
        </View>
      </View>

      {/* Última clase con resumen IA */}
      {data?.last ? (
        <Pressable onPress={() => nav.navigate('SubjectMemory', { subjectId: data.last!.subject_id })}>
          <SectionHeader title={`Última clase: ${data.last.subject_name}`} />
          <Card accent={colors.primaryBorder}>
            {data.last.topic ? (
              <>
                <Text variant="faint">Tema visto</Text>
                <Text variant="body" weight="600" style={{ marginBottom: spacing.sm }}>
                  {data.last.topic}
                </Text>
              </>
            ) : null}
            <Text variant="faint">Resumen IA</Text>
            <Text variant="muted">
              {data.last.ai_summary || 'Aún sin resumen. Ábrela para generarlo con IA.'}
            </Text>
          </Card>
        </Pressable>
      ) : null}

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <SectionHeader title="¿Qué quieres hacer?" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable key={a.key} style={styles.action} onPress={() => onQuick(a.key)}>
              <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
              <Text variant="faint" style={{ textAlign: 'center' }}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tareas pendientes */}
      <View style={styles.section}>
        <SectionHeader
          title="Tareas pendientes"
          action={data && data.pending.length > 3 ? 'Ver todas' : undefined}
          onAction={() => nav.navigate('Tabs', { screen: 'More' })}
        />
        {data && data.pending.length === 0 ? (
          <Card>
            <Text variant="muted">Sin tareas pendientes. 🎉</Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {data?.pending.slice(0, 4).map((t) => (
              <Card key={t.id} padded={false}>
                <Pressable style={styles.taskRow} onPress={() => toggleTask(t.id, true)}>
                  <View style={styles.checkbox} />
                  <View style={styles.flex}>
                    <Text variant="body" weight="600">{t.title}</Text>
                    {t.subject_name ? (
                      <Text variant="faint">{t.subject_name}</Text>
                    ) : null}
                  </View>
                  {t.due_date ? (
                    <Badge
                      label={t.due_date === isoDate() ? 'Hoy' : t.due_date.slice(5)}
                      color={t.due_date === isoDate() ? colors.danger : colors.textMuted}
                      soft
                    />
                  ) : null}
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  flex: { flex: 1 },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  nowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowButtons: { flexDirection: 'row', gap: spacing.sm },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  dayChipActive: {
    backgroundColor: colors.primaryStrong,
    borderColor: colors.primaryStrong,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  classDot: { width: 4, height: 38, borderRadius: 2 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  actionsGrid: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textFaint,
  },
});
