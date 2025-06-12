import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="existing"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="upload"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 