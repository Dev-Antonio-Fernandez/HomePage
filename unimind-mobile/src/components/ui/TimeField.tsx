import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing, fontSize } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  label: string;
  value: string; // "HH:MM" o ""
  onChange: (hhmm: string) => void;
  placeholder?: string;
}

function hhmmToDate(hhmm: string): Date {
  const d = new Date();
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  d.setHours(Number.isNaN(h) ? 8 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
}

function dateToHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

// Campo de hora con selector tipo carrusel (rueda nativa), sin teclear.
export function TimeField({ label, value, onChange, placeholder }: Props) {
  const [show, setShow] = useState(false);
  const date = hhmmToDate(value || '08:00');

  const open = () => {
    // Si no había valor, inicializa al default para que quede algo elegido.
    if (!value) onChange(dateToHHMM(date));
    setShow((s) => !s);
  };

  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <Pressable onPress={open} style={styles.field}>
        <Text
          style={{
            fontSize: fontSize.md,
            color: value ? colors.text : colors.textFaint,
          }}
        >
          {value || placeholder || 'Elegir hora'}
        </Text>
        <Text variant="faint">🕐</Text>
      </Pressable>

      {show ? (
        Platform.OS === 'ios' ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              is24Hour
              onChange={(_e, d) => {
                if (d) onChange(dateToHHMM(d));
              }}
              textColor={colors.text}
              style={styles.iosPicker}
            />
            <Button
              label="Listo"
              onPress={() => setShow(false)}
              variant="secondary"
            />
          </View>
        ) : (
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            is24Hour
            onChange={(e, d) => {
              setShow(false);
              if (e.type === 'set' && d) onChange(dateToHHMM(d));
            }}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  iosPicker: { alignSelf: 'stretch' },
});
