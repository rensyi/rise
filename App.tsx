// Imported one weight at a time: the package root would bundle all fourteen font files.
import { Rubik_400Regular } from '@expo-google-fonts/rubik/400Regular';
import { Rubik_500Medium } from '@expo-google-fonts/rubik/500Medium';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { resolveDark } from './src/lib/time';
import Shell from './src/Shell';
import { darkTheme, lightTheme } from './src/theme';
import { useRise } from './src/useRise';

// Labels for the time picker's own buttons.
registerTranslation('en', en);

export default function App() {
  // State lives here, above the theme provider, because the theme setting is part of it.
  const rise = useRise();
  const dark = resolveDark(rise.config.theme, useColorScheme() === 'dark');
  const [fontsLoaded, fontError] = useFonts({ Rubik_400Regular, Rubik_500Medium });

  // Wait for Rubik so text does not jump from the system font. If it fails to
  // load, carry on: the app works in the system font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={dark ? darkTheme : lightTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Shell rise={rise} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
