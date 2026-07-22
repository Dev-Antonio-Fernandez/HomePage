import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { Formula } from '../../components/ui/Formula';
import { colors, spacing, radius } from '../../theme';
import { subjectColors } from '../../theme';
import type { StudyCard } from '../../db/repositories/studyCards';

export function StudyCardView({ card }: { card: StudyCard }) {
  const c = card.content;
  const hasFormula = !!c.formula_latex && c.formula_latex.trim().length > 0;

  return (
    <Card accent={colors.primaryBorder} style={{ gap: spacing.md }}>
      <Text variant="heading">{card.title}</Text>

      {/* Idea en una frase */}
      <View style={styles.ideaRow}>
        <Text style={styles.emoji}>💡</Text>
        <Text variant="body" style={styles.flex}>
          {c.idea}
        </Text>
      </View>

      {/* Fórmula bonita (como en el cuaderno) */}
      {hasFormula ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="faint">Fórmula</Text>
          <Formula latex={c.formula_latex as string} />
        </View>
      ) : null}

      {/* Desglose de la fórmula, cada símbolo con su color */}
      {c.breakdown && c.breakdown.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="faint">Qué significa cada parte</Text>
          {c.breakdown.map((b, i) => {
            const color = subjectColors[i % subjectColors.length];
            return (
              <View key={i} style={styles.breakRow}>
                <View style={[styles.symbol, { backgroundColor: withAlpha(color), borderColor: color }]}>
                  <Text style={{ color }} weight="700">
                    {b.symbol}
                  </Text>
                </View>
                <Text variant="body" style={styles.flex}>
                  {b.meaning}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Ejemplo numérico paso a paso */}
      {c.steps && c.steps.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="faint">Ejemplo paso a paso</Text>
          {c.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={{ color: colors.white, fontSize: 12 }} weight="700">
                  {i + 1}
                </Text>
              </View>
              <Text variant="body" style={styles.flex}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Mini check */}
      {c.check && c.check.length > 0 ? (
        <View style={styles.check}>
          <Text variant="label" color={colors.primary}>
            ✅ Ponte a prueba
          </Text>
          {c.check.map((q, i) => (
            <Text key={i} variant="muted" style={{ marginTop: spacing.xs }}>
              • {q}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function withAlpha(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return colors.surfaceAlt;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.15)`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emoji: { fontSize: 18 },
  ideaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  breakRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  symbol: {
    minWidth: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  check: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
