import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalProvider } from './context/GlobalProvider';
import React from 'react';
import { View, Text } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A0D2E' }}>
                    <Text style={{ color: 'white', fontSize: 18, textAlign: 'center', padding: 20 }}>
                        Something went wrong. Please restart the app.
                    </Text>
                </View>
            );
        }

        return this.props.children;
    }
}

export default function RootLayout() {
    return (
        <ErrorBoundary>
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
                                name="create"
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
                            <Stack.Screen
                                name="processing/imageResult"
                                options={{
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="utiils/Paywall"
                                options={{
                                    headerShown: false,
                                }}
                            />
                        </Stack>
                    </GlobalProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </ErrorBoundary>
    )
}