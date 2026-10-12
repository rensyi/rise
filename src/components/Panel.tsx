import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { rowColor } from '../theme';

// A large rounded container that groups related content on the background.
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme<MD3Theme>();

  return (
    <View style={[styles.panel, { backgroundColor: theme.colors.elevation.level1 }]}>
      {title && (
        <Text variant="labelLarge" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

// Stacks its children as separate rounded rows. The outer corners of the first
// and last row are larger, so the group reads as one block.
export function Rows({ children }: { children: ReactNode }) {
  const theme = useTheme<MD3Theme>();
  const rows = Children.toArray(children);

  return (
    <View style={styles.rows}>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[
            styles.row,
            { backgroundColor: rowColor(theme) },
            i === 0 && styles.first,
            i === rows.length - 1 && styles.last,
          ]}
        >
          {row}
        </View>
      ))}
    </View>
  );
}

type RowProps = {
  children: ReactNode;
  stacked?: boolean; // label above its control, for controls that need the full width
  onPress?: () => void;
  accessibilityLabel?: string;
};

// The content of one row: a label at the left and a control or value at the right.
export function Row({ children, stacked, onPress, accessibilityLabel }: RowProps) {
  const content = <View style={[styles.rowContent, stacked && styles.stacked]}>{children}</View>;
  if (!onPress) return content;

  return (
    <TouchableRipple accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      {content}
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 28, padding: 10, gap: 6 },
  title: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 },
  rows: { gap: 3 },
  row: { borderRadius: 6, overflow: 'hidden' },
  first: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  last: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  stacked: { flexDirection: 'column', alignItems: 'stretch', gap: 10, paddingVertical: 14 },
});
