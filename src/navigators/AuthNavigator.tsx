// navigators/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ConfirmEmailScreen from '../screens/auth/ConfirmEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import TwoFactorAuthScreen from '../screens/auth/TwoFactorAuthScreen';
import AfterRegisterSetupScreen from '../screens/setup/AfterRegisterSetupScreen';

export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ConfirmEmail: { email: string; otp?: string } | undefined;
	ForgotPassword: undefined;
	TwoFactorAuth: { email: string };
	Setup: { email?: string; userId?: number } | undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Register" component={RegisterScreen} />
			<Stack.Screen name="ConfirmEmail" component={ConfirmEmailScreen} />
			<Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
			<Stack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
			<Stack.Screen name="Setup" component={AfterRegisterSetupScreen} />
		</Stack.Navigator>
	);
}
