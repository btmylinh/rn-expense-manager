// screens/ConfirmEmailScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { isAxiosError } from 'axios';
import { authApi } from '../../api/authApi';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import VerificationCodeInput from '../../components/VerificationCodeInput';
import { getErrorMessage } from '../../utils/errorHandler';

export default function ConfirmEmailScreen({ route, navigation }: any) {
	const theme = useAppTheme();
	const { verifyRegistrationOtp } = useAuth();
	const { email, otp: otpFromRoute } = route.params ?? {};
	const [otp, setOtp] = useState<string>(otpFromRoute ?? '');
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async () => {
		setError(null);
		if (!otp || otp.length !== 6) {
			setError('Mã OTP phải có 6 chữ số');
			return;
		}
		try {
			setLoading(true);
			const result = await verifyRegistrationOtp(email, otp);
			
			if (result.success) {
			// Navigate to setup after successful confirmation
				// Setup screen will check if user has wallets
				navigation.replace('Setup');
			} else {
				setError(result.message || 'Xác thực thất bại');
			}
		} catch (error) {
			setError(getErrorMessage(error, 'Xác thực thất bại'));
		} finally {
			setLoading(false);
		}
	};

	const onResend = async () => {
		setError(null);
		try {
			setResending(true);
			await authApi.resendRegistrationOtp({ email });
				setError(null);
		} catch (error) {
			setError(getErrorMessage(error, 'Gửi lại mã thất bại'));
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
						Xác nhận email
					</Text>
				</View>

				{/* Verification Code Input Widget */}
				<VerificationCodeInput
					email={email}
					code={otp}
					onCodeChange={setOtp}
					onSubmit={onSubmit}
					onResend={onResend}
					loading={loading}
					resending={resending}
					error={error}
					label="Mã OTP"
					submitLabel="Xác nhận"
					resendLabel="Gửi lại mã OTP"
					autoFocus={!otpFromRoute}
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
