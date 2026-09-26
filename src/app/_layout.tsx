import { Stack } from 'expo-router';
import { ExperienceProvider, useExperience } from '../features/experience/ExperienceProvider';

function ExperienceNavigator() {
  const { settings } = useExperience();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' }, animation: settings.reducedMotion ? 'none' : 'fade', animationDuration: 300, gestureEnabled: false }} />;
}
export default function RootLayout() {
  return <ExperienceProvider><ExperienceNavigator /></ExperienceProvider>;
}
