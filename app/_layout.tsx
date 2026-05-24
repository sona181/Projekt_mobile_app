import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565C0',
    secondary: '#0288D1',
    background: '#F5F7FA',
    surface: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 260,
              contentStyle: { backgroundColor: '#F1F5F9' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 200 }} />
            <Stack.Screen name="(auth)/login" options={{ animation: 'fade', animationDuration: 220 }} />
            <Stack.Screen name="(auth)/register" options={{ animation: 'slide_from_bottom', animationDuration: 280 }} />
            <Stack.Screen name="course/[slug]" options={{ animation: 'slide_from_right', animationDuration: 260 }} />
            <Stack.Screen name="course/[slug]/lesson/[lessonId]" options={{ animation: 'slide_from_right', animationDuration: 260 }} />
            <Stack.Screen name="instructor/create-course" options={{ animation: 'slide_from_bottom', animationDuration: 320 }} />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
