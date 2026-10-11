import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/HomeScreen';
import { resolveDark } from './src/lib/time';
import { darkTheme, lightTheme } from './src/theme';
import { useRise } from './src/useRise';

// Labels for the time picker's own buttons.
registerTranslation('en', en);

export default function App() {
  // State lives here, above the theme provider, because the theme setting is part of it.
  const rise = useRise();
  const dark = resolveDark(rise.config.theme, useColorScheme() === 'dark');

  return (
    <SafeAreaProvider>
      <PaperProvider theme={dark ? darkTheme : lightTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <HomeScreen rise={rise} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
