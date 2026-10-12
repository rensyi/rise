import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type { Data } from '../storage';

// Home-screen widgets exist only on Android, and only in the app's own build.
// The widget package reaches for native code as soon as it is loaded, and Expo
// Go does not have that code, so nothing here loads it unless this is true.
export const widgetsAvailable = () => Platform.OS === 'android' && !isRunningInExpoGo();

// require, not import: an import at the top of the file would load the
// package, and the widgets drawn with it, at start-up.
const widgets = () => require('./widgets') as typeof import('./widgets');

// Tells Android what to run when a widget is added, refreshed or tapped. Call
// once at start-up, outside React: Android also runs it with the app closed.
export function registerWidgets(): void {
  if (!widgetsAvailable()) return;
  const { registerWidgetTaskHandler } =
    require('react-native-android-widget') as typeof import('react-native-android-widget');
  registerWidgetTaskHandler(widgets().widgetTaskHandler);
}

// Redraws every widget on the home screen from the app's current data.
export async function refreshWidgets(data: Data, hour24: boolean): Promise<void> {
  if (!widgetsAvailable()) return;
  await widgets().drawAll(data, hour24);
}
