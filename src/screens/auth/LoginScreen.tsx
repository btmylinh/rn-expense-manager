// screens/LoginScreen.tsx
import React, { useMemo, useState } from 'react';
import { View, AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, TextInput, HelperText, Text } from 'react-native-paper';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme } from '../../theme';

const isEmail = (v: string) => /.+@.+\..+/.test(v);

export default function LoginScreen({ navigation }: any) {
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
			const result = await fakeApi.login(email, password);

			if (!result.success) {
				setFormError(result.message || 'Đăng nhập thất bại');
				return;
			}

			// Check setup status
			if (result.user) {
				const setupStatus = await fakeApi.getSetupStatus(result.user.id);
				const needsSetup = !setupStatus.hasWallet || !setupStatus.hasCurrency || !setupStatus.hasCategories;

				if (needsSetup) {
					navigation.replace('Setup', { email: result.user.email, userId: result.user.id });
				} else {
					navigation.replace('Tabs', { initialTab: 'Thêm' });
				}
			} else {
				setFormError('Thông tin người dùng không hợp lệ');
			}
		} catch (e: any) {
			setFormError(e.message ?? 'Đã xảy ra lỗi');
			AccessibilityInfo.announceForAccessibility?.('Lỗi: ' + (e.message ?? 'Đã xảy ra lỗi'));
		} finally {
			setLoading(false);
		}
	};

	const handleDemoLogin = async () => {
		try {
			setLoading(true);
			const result = await fakeApi.quickLoginDemo();
			if (result.success && result.user) {
				navigation.replace('Tabs');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: 'height' })} style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
				<View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing(3) }}>
					{/* Header / Logo */}
					<View style={{ alignItems: 'center', marginBottom: theme.spacing(3) }}>
						<Text style={[theme.semantic.typography.h2, { color: theme.colors.primary }]}>Money Manager</Text>
					</View>
					{/* Form */}
					<TextInput
						accessibilityLabel="Email"
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
						accessibilityLabel="Mật khẩu"
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
					{!!passwordError && <HelperText type="error" style={{ marginBottom: 8 }}>{passwordError}</HelperText>}
					<View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
						<Button onPress={() => navigation.navigate('ForgotPassword')} compact>{'Quên mật khẩu?'}</Button>
					</View>
					{/* Actions */}
					<Button mode="contained" loading={loading} onPress={onSubmit} style={{ alignSelf: 'center', width: '90%', minHeight: 48, justifyContent: 'center', borderRadius: theme.radius.pill, marginBottom: 8 }}>
						Đăng nhập
					</Button>
					{!!formError && <HelperText type="error" style={{ textAlign: 'center', marginBottom: 8 }}>{formError}</HelperText>}
					<Button mode="outlined" loading={loading} onPress={handleDemoLogin} style={{ alignSelf: 'center', width: '90%', minHeight: 48, justifyContent: 'center', borderRadius: theme.radius.pill, marginBottom: 8 }}>
						Đăng nhập Demo
					</Button>
					{/* Footer switch */}
					<View style={{ alignItems: 'center', marginTop: theme.spacing(1) }}>
						<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant }]}>Chưa có tài khoản? <Text onPress={() => navigation.navigate('Register')} style={{ color: theme.colors.primary }}>Đăng ký ngay</Text></Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
