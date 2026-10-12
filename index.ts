import { registerRootComponent } from 'expo';

import App from './App';
import { registerWidgets } from './src/widget';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Home-screen widgets (Android, in the app's own build). Android can run this
// file with the app closed, to refresh a widget or to log from one.
registerWidgets();
