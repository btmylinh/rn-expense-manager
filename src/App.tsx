// App.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './navigators/RootNavigator';
import CustomSplashScreen from './components/CustomSplashScreen';
import { lightTheme } from './theme';
import { registerTranslation, en } from 'react-native-paper-dates';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';

// Đăng ký locale cho react-native-paper-dates (dùng tiếng Anh cho 'vi' nếu không có bản dịch)
registerTranslation('vi', en);

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [showCustomSplash, setShowCustomSplash] = useState(true);

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load fonts, make any API calls you need to do here
                // You can add real loading logic here
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                console.warn(e);
            } finally {
                // Tell the application to render
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            // Hide the native splash screen
            await SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    const handleCustomSplashFinish = () => {
        setShowCustomSplash(false);
    };

    if (!appIsReady) {
        return null;
    }

    // Show custom splash screen with animation
    if (showCustomSplash) {
        return (
            <PaperProvider theme={lightTheme}>
                <CustomSplashScreen onFinish={handleCustomSplashFinish} />
            </PaperProvider>
        );
    }

    return (
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <KeyboardProvider>
            <SafeAreaProvider>
                <PaperProvider theme={lightTheme}>
                        <AuthProvider>
                            <NotificationProvider>
                    <RootNavigator />
                            </NotificationProvider>
                        </AuthProvider>
                </PaperProvider>
            </SafeAreaProvider>
        </KeyboardProvider>
        </View>
    );
}
