// screens/auth/TwoFactorAuthScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme } from '../../theme';
import { AuthStackParamList } from '../../navigators/AuthNavigator';
import { useAuth } from '../../contexts/AuthContext';
import VerificationCodeInput from '../../components/VerificationCodeInput';

interface TwoFactorAuthScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'TwoFactorAuth'>;
  route: {
    params: {
      email: string;
    };
  };
}

export default function TwoFactorAuthScreen({ route, navigation }: TwoFactorAuthScreenProps) {
	const theme = useAppTheme();
	const { loginWith2FA } = useAuth();
	const { email } = route.params ?? {};
	const [code, setCode] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Debug log khi component mount
	useEffect(() => {
		if (__DEV__) {
			console.log('✅ TwoFactorAuthScreen mounted', { email });
		}
	}, [email]);

	const onSubmit = async () => {
		setError(null);
		if (!code || code.length !== 6) {
			setError('Mã xác thực phải có 6 chữ số');
			return;
		}
		try {
			setLoading(true);
			const result = await loginWith2FA(email, code);
			
			if (!result.success) {
				setError(result.message || 'Xác thực thất bại');
				return;
			}
			
			// Navigation will be handled by AuthContext
		} catch (e: any) {
			setError(e.message ?? 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	const onResendCode = async () => {
		setError(null);
		try {
			setResending(true);
			const result = await fakeApi.resend2FACode(email);
			if (result.success) {
				setError(null);
			} else {
				setError(result.message || 'Gửi lại mã thất bại');
			}
		} catch (e: any) {
			setError(e.message ?? 'Đã xảy ra lỗi');
		} finally {
			setResending(false);
		}
	};

	return (
		<KeyboardAvoidingView 
			style={[styles.container, { backgroundColor: theme.colors.background }]}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.content}>
				{/* Logo/Icon Section */}
				<View style={styles.logoSection}>
					<View style={[styles.logoCircle, { backgroundColor: theme.colors.primary + '15' }]}>
						<Image
							source={require('../../assets/images/logo.png')}
							style={{ width: 72, height: 72 }}
							resizeMode="contain"
						/>
					</View>
					<Text style={[styles.title, { color: theme.colors.onBackground }]}>
						Xác thực 2 bước
					</Text>
				</View>

				{/* Verification Code Input Widget */}
				<VerificationCodeInput
					email={email}
					code={code}
					onCodeChange={setCode}
					onSubmit={onSubmit}
					onResend={onResendCode}
					loading={loading}
					resending={resending}
					error={error}
					label="Mã xác thực"
					submitLabel="Xác thực"
					resendLabel="Gửi lại mã"
					autoFocus
				/>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	logoSection: {
		alignItems: 'center',
		marginBottom: 32,
	},
	logoCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 8,
	},
});

