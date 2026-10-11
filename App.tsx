import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/HomeScreen';
import { darkTheme, lightTheme } from './src/theme';

// Labels for the time picker's own buttons.
registerTranslation('en', en);

export default function App() {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        <HomeScreen />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
