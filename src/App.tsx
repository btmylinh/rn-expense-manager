// App.tsx
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import RootNavigator from './navigators/RootNavigator';
import { lightTheme } from './theme';
import { registerTranslation, en } from 'react-native-paper-dates';

// Đăng ký locale cho react-native-paper-dates (dùng tiếng Anh cho 'vi' nếu không có bản dịch)
registerTranslation('vi', en);

export default function App() {
    return (
        <KeyboardProvider>
            <SafeAreaProvider>
                <PaperProvider theme={lightTheme}>
                    <RootNavigator />
                </PaperProvider>
            </SafeAreaProvider>
        </KeyboardProvider>
    );
}
