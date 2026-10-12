import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';

type Props = { title: string; subtitle?: string; children?: ReactNode };

// The large page title that opens every screen. Children are round tools at the right.
export default function BigTitle({ title, subtitle, children }: Props) {
  const theme = useTheme<MD3Theme>();

  return (
    <View style={styles.wrap}>
      <View style={styles.text}>
        <Text
          variant="displayMedium"
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.title}
        >
          {title}
        </Text>
        {subtitle && (
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        )}
      </View>
      {children && <View style={styles.tools}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: 'Rubik_500Medium', letterSpacing: -0.5 },
  tools: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
});
