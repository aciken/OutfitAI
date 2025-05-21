import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_bottom',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="options" />
      <Stack.Screen name="OutfitItemAdd" />
    </Stack>
  );
}
