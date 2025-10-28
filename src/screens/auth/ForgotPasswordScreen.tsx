// screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, HelperText, Text } from 'react-native-paper';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme } from '../../theme';

export default function ForgotPasswordScreen({ navigation }: any) {
	const theme = useAppTheme();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const onSubmit = async () => {
		setError(null);
		try {
			setLoading(true);
			const result = await fakeApi.resetPassword(email);
			if (result.success) {
				setDone(true);
			} else {
				setError(result.message);
			}
		} catch (e: any) {
			setError(e.message ?? 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={{ padding: theme.spacing(3), gap: theme.spacing(2), flex: 1, justifyContent: 'center' }}>
			<Text variant="titleLarge">Quên mật khẩu</Text>
			<TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
			{!!error && <HelperText type="error">{error}</HelperText>}
			{done ? (
				<Button mode="contained" onPress={() => navigation.navigate('Login')}>Về đăng nhập</Button>
			) : (
				<Button mode="contained" loading={loading} onPress={onSubmit}>Gửi yêu cầu</Button>
			)}
		</View>
	);
}
