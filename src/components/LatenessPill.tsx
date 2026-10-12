import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';
import { type Mode, diffMinutes, latenessLabel, level } from '../lib/time';
import { tileColor, tileTextColor } from '../theme';

type Props = { target: string; time: string; mode: Mode };

// "12mins late" in the colour of that day's tile, only as wide as its text.
export default function LatenessPill({ target, time, mode }: Props) {
  const theme = useTheme<MD3Theme>();
  const tileLevel = level(target, time, mode);

  return (
    <View style={[styles.pill, { backgroundColor: tileColor(tileLevel) }]}>
      <Text variant="labelLarge" style={{ color: tileTextColor(tileLevel, theme) }}>
        {latenessLabel(diffMinutes(target, time, mode))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
});
