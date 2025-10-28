// navigators/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from './Tabs';
import AuthNavigator from './AuthNavigator';

export type RootStackParamList = {
	Auth: undefined;
	Tabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	return (
		<NavigationContainer>
			<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
				<Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
					<Stack.Screen name="Auth" component={AuthNavigator} />
					<Stack.Screen name="Tabs" component={Tabs} />
				</Stack.Navigator>
			</SafeAreaView>
		</NavigationContainer>
	);
}
