import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppearanceProvider } from './src/context/AppearanceContext';
import { AppNavigation } from './src/navigation/AppNavigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <AppNavigation />
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}

export default App;
