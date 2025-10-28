// screens/ConfirmEmailScreen.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, HelperText, Text } from 'react-native-paper';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme } from '../../theme';

export default function ConfirmEmailScreen({ route, navigation }: any) {
	const theme = useAppTheme();
	const { email, otp: otpFromRoute } = route.params ?? {};
	const [otp, setOtp] = useState<string>(otpFromRoute ?? '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async () => {
		setError(null);
		if (!otp || otp.length !== 6) {
			setError('Mã OTP phải có 6 chữ số');
			return;
		}
		try {
			setLoading(true);
			const result = await fakeApi.confirmEmail(email, otp);
			
			if (!result.success) {
				setError(result.message || 'Xác thực thất bại');
				return;
			}
			
			// Navigate to setup after successful confirmation
			navigation.replace('Setup', { email });
		} catch (e: any) {
			setError(e.message ?? 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={{ padding: theme.spacing(3), gap: theme.spacing(2), flex: 1, justifyContent: 'center' }}>
			<Text variant="titleLarge">Xác nhận email</Text>
			<TextInput label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
			{!!error && <HelperText type="error">{error}</HelperText>}
			<Button mode="contained" loading={loading} onPress={onSubmit}>Xác nhận</Button>
		</View>
	);
}
