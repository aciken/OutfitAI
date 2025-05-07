import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalProvider } from './context/GlobalProvider';


export default function RootLayout() {
    return (
        <SafeAreaProvider style={{ flex: 1 }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <GlobalProvider>
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="main"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="modal"
                    options={{
                        headerShown: false,
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                        animationDuration: 800,
                    }}
                />
                <Stack.Screen
                    name="outfit/[id]"
                    options={{
                        headerShown: false,
                        animation: 'slide_from_bottom',
                        animationDuration: 400,
                    }}
                />
            </Stack>
        </GlobalProvider>
    </GestureHandlerRootView>
</SafeAreaProvider>
    )
}
