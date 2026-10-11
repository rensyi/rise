import { useState } from 'react';
import { Button, type MD3Theme, ThemeProvider, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { formatTime, timeOf, uses24Hour } from '../lib/time';
import { pickerTheme } from '../theme';

type Props = { label: string; value: string; onChange: (time: string) => void };

// A button showing a time; pressing it opens the Material 3 time picker.
export default function TimeField({ label, value, onChange }: Props) {
  const theme = useTheme<MD3Theme>();
  const [open, setOpen] = useState(false);
  const [hours, minutes] = value.split(':').map(Number);

  return (
    <>
      <Button
        mode="contained"
        onPress={() => setOpen(true)}
        accessibilityLabel={`${label}, ${formatTime(value)}`}
      >
        {formatTime(value)}
      </Button>
      <ThemeProvider theme={pickerTheme(theme)}>
        <TimePickerModal
          visible={open}
          onDismiss={() => setOpen(false)}
          onConfirm={(picked) => {
            setOpen(false);
            onChange(timeOf(new Date(2000, 0, 1, picked.hours, picked.minutes)));
          }}
          hours={hours}
          minutes={minutes}
          label={label}
          use24HourClock={uses24Hour()}
          locale="en"
        />
      </ThemeProvider>
    </>
  );
}
