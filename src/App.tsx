// App.tsx
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigators/RootNavigator';
import { lightTheme } from './theme';

export default function App() {
	return (
		<SafeAreaProvider>
			<PaperProvider theme={lightTheme}>
				<RootNavigator />
			</PaperProvider>
		</SafeAreaProvider>
	);
}
