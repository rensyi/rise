import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Button,
  type MD3Theme,
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { formatTime, timeOf } from '../lib/time';
import { pickerTheme, rowColor } from '../theme';

type Props = {
  label: string;
  value: string;
  hour24: boolean;
  large?: boolean; // a full-width block with the time in large type
  onChange: (time: string) => void;
};

// A button showing a time; pressing it opens the Material 3 time picker.
export default function TimeField({ label, value, hour24, large, onChange }: Props) {
  const theme = useTheme<MD3Theme>();
  const [open, setOpen] = useState(false);
  const [hours, minutes] = value.split(':').map(Number);

  return (
    <>
      {large ? (
        <TouchableRipple
          borderless
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${formatTime(value, hour24)}`}
          onPress={() => setOpen(true)}
          style={[styles.large, { backgroundColor: rowColor(theme) }]}
        >
          <Text variant="displaySmall" style={styles.largeText}>
            {formatTime(value, hour24)}
          </Text>
        </TouchableRipple>
      ) : (
        <Button
          mode="contained"
          onPress={() => setOpen(true)}
          accessibilityLabel={`${label}, ${formatTime(value, hour24)}`}
        >
          {formatTime(value, hour24)}
        </Button>
      )}
      {/* Mounted only while open: the picker keeps its own copy of the time, and
          would otherwise reopen showing a choice the user cancelled. */}
      {open && (
        <ThemeProvider theme={pickerTheme(theme)}>
          <TimePickerModal
            visible
            onDismiss={() => setOpen(false)}
            onConfirm={(picked) => {
              setOpen(false);
              onChange(timeOf(new Date(2000, 0, 1, picked.hours, picked.minutes)));
            }}
            hours={hours}
            minutes={minutes}
            label={label}
            use24HourClock={hour24}
            locale="en"
          />
        </ThemeProvider>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  large: { alignSelf: 'stretch', alignItems: 'center', borderRadius: 28, paddingVertical: 18 },
  largeText: { fontFamily: 'Rubik_500Medium' },
});
