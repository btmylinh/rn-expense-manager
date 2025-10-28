// screens/RegisterScreen.tsx
import React, { useMemo, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, TextInput, HelperText, Text } from 'react-native-paper';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme } from '../../theme';

const isEmail = (v: string) => /.+@.+\..+/.test(v);

export default function RegisterScreen({ navigation }: any) {
	const theme = useAppTheme();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const emailError = useMemo(() => (email.length === 0 ? '' : isEmail(email) ? '' : 'Email không hợp lệ'), [email]);
	const passwordError = useMemo(() => (password.length === 0 ? '' : password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : ''), [password]);

	const onSubmit = async () => {
		setFormError(null);
		if (emailError || passwordError || !email || !password) {
			setFormError('Vui lòng kiểm tra lại thông tin');
			return;
		}
		try {
			setLoading(true);
			const result = await fakeApi.register(email, password);
			
			if (!result.success) {
				setFormError(result.message);
				return;
			}

			// Navigate to confirm email screen
			navigation.navigate('ConfirmEmail', { email });
		} catch (e: any) {
			setFormError(e.message ?? 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: 'height' })} style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
				<View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing(3) }}>
					<View style={{ alignItems: 'center', marginBottom: theme.spacing(3) }}>
						<Text style={[theme.semantic.typography.h2, { color: theme.colors.primary }]}>Tạo tài khoản</Text>
						<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>Bắt đầu quản lý chi tiêu thông minh</Text>
					</View>

					<TextInput
						label="Email"
						placeholder="Nhập email"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
						left={<TextInput.Icon icon="email-outline" />}
						error={!!emailError}
						style={{ marginBottom: 8 }}
					/>
					{!!emailError && <HelperText type="error" style={{ marginBottom: 8 }}>{emailError}</HelperText>}

					<TextInput
						label="Mật khẩu"
						placeholder="••••••"
						value={password}
						onChangeText={setPassword}
						secureTextEntry={!showPassword}
						left={<TextInput.Icon icon="lock-outline" />}
						right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(s => !s)} forceTextInputFocus={false} />}
						error={!!passwordError}
						style={{ marginBottom: 8 }}
					/>
					{!!passwordError && <HelperText type="error" style={{ marginBottom: 16 }}>{passwordError}</HelperText>}

					<Button mode="contained" loading={loading} onPress={onSubmit} style={{ alignSelf: 'center', width: '90%', minHeight: 48, justifyContent: 'center', borderRadius: theme.radius.pill, marginBottom: 8 }}>Đăng ký</Button>

					<View style={{ alignItems: 'center', marginTop: theme.spacing(1) }}>
						<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant }]}>Đã có tài khoản? <Text onPress={() => navigation.navigate('Login')} style={{ color: theme.colors.primary }}>Đăng nhập</Text></Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
