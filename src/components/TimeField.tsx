import { useState } from 'react';
import { Button, type MD3Theme, ThemeProvider, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { formatTime, timeOf } from '../lib/time';
import { pickerTheme } from '../theme';

type Props = { label: string; value: string; hour24: boolean; onChange: (time: string) => void };

// A button showing a time; pressing it opens the Material 3 time picker.
export default function TimeField({ label, value, hour24, onChange }: Props) {
  const theme = useTheme<MD3Theme>();
  const [open, setOpen] = useState(false);
  const [hours, minutes] = value.split(':').map(Number);

  return (
    <>
      <Button
        mode="contained"
        onPress={() => setOpen(true)}
        accessibilityLabel={`${label}, ${formatTime(value, hour24)}`}
      >
        {formatTime(value, hour24)}
      </Button>
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
