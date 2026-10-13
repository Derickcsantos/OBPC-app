import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppearanceProvider, useAppearance } from './src/context/AppearanceContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigation } from './src/navigation/AppNavigation';

const AppContent = () => {
  const { preferencesReady } = useAppearance();
  return preferencesReady ? <AppNavigation /> : null;
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppearanceProvider>
          <AppContent />
        </AppearanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
