import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppearanceProvider } from './src/context/AppearanceContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigation } from './src/navigation/AppNavigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppearanceProvider>
          <AppNavigation />
        </AppearanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
