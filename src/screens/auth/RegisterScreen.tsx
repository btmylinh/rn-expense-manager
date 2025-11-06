// screens/RegisterScreen.tsx
import React, { useMemo, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Image, StyleSheet } from 'react-native';
import { Button, TextInput, HelperText, Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme } from '../../theme';
import { AuthStackParamList } from '../../navigators/AuthNavigator';

const isEmail = (v: string) => /.+@.+\..+/.test(v);

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
	const theme = useAppTheme();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const nameError = useMemo(() => (name.length === 0 ? '' : name.length < 2 ? 'Tên tối thiểu 2 ký tự' : ''), [name]);
	const emailError = useMemo(() => (email.length === 0 ? '' : isEmail(email) ? '' : 'Email không hợp lệ'), [email]);
	const passwordError = useMemo(() => (password.length === 0 ? '' : password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : ''), [password]);
	const confirmPasswordError = useMemo(() => (confirmPassword.length === 0 ? '' : password !== confirmPassword ? 'Mật khẩu không khớp' : ''), [password, confirmPassword]);

	const onSubmit = async () => {
		setFormError(null);
		if (nameError || emailError || passwordError || confirmPasswordError || !name || !email || !password || !confirmPassword) {
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
		<KeyboardAvoidingView 
			behavior={Platform.select({ ios: 'padding', android: 'height' })} 
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<ScrollView 
				contentContainerStyle={styles.scrollContent} 
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				{/* Logo / Title */}
				<View style={styles.logoSection}>
					<View style={[styles.logoCircle, { backgroundColor: theme.colors.primary + '15' }]}>
						<Image source={require('../../assets/images/logo.png')} style={{ width: 72, height: 72 }} resizeMode="contain" />
					</View>
					<Text style={[styles.title, { color: theme.colors.onBackground }]}>Tạo tài khoản</Text>
					<Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Bắt đầu quản lý chi tiêu thông minh</Text>
				</View>

				{/* Form */}
				<View style={styles.formContainer}>
					<TextInput
						label="Họ và tên"
						placeholder="Nhập họ và tên"
						value={name}
						onChangeText={setName}
						mode="outlined"
						left={<TextInput.Icon icon="account-outline" />}
						error={!!nameError}
						style={styles.input}
					/>
					{!!nameError && <HelperText type="error" visible={!!nameError} style={styles.errorText}>{nameError}</HelperText>}

					<TextInput
						label="Email"
						placeholder="Nhập email"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
						mode="outlined"
						left={<TextInput.Icon icon="email-outline" />}
						error={!!emailError}
						style={styles.input}
					/>
					{!!emailError && <HelperText type="error" visible={!!emailError} style={styles.errorText}>{emailError}</HelperText>}

					<TextInput
						label="Mật khẩu"
						placeholder="Nhập mật khẩu"
						value={password}
						onChangeText={setPassword}
						secureTextEntry={!showPassword}
						mode="outlined"
						left={<TextInput.Icon icon="lock-outline" />}
						right={
							<TextInput.Icon 
								icon={showPassword ? 'eye-off' : 'eye'} 
								onPress={() => setShowPassword(s => !s)} 
								forceTextInputFocus={false} 
							/>
						}
						error={!!passwordError}
						style={styles.input}
					/>
					{!!passwordError && <HelperText type="error" visible={!!passwordError} style={styles.errorText}>{passwordError}</HelperText>}

					<TextInput
						label="Nhập lại mật khẩu"
						placeholder="Xác nhận mật khẩu"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						secureTextEntry={!showConfirmPassword}
						mode="outlined"
						left={<TextInput.Icon icon="lock-check-outline" />}
						right={
							<TextInput.Icon 
								icon={showConfirmPassword ? 'eye-off' : 'eye'} 
								onPress={() => setShowConfirmPassword(s => !s)} 
								forceTextInputFocus={false} 
							/>
						}
						error={!!confirmPasswordError}
						style={styles.input}
					/>
					{!!confirmPasswordError && <HelperText type="error" visible={!!confirmPasswordError} style={styles.errorText}>{confirmPasswordError}</HelperText>}

					{formError && (
						<HelperText type="error" visible={!!formError} style={{ textAlign: 'center', marginBottom: 8 }}>
							{formError}
						</HelperText>
					)}

					<Button 
						mode="contained" 
						loading={loading} 
						disabled={loading || !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
						onPress={onSubmit} 
						style={styles.submitButton}
						contentStyle={styles.submitButtonContent}
					>
						Đăng ký
					</Button>
				</View>

				<View style={styles.footerRow}>
					<Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>Đã có tài khoản? </Text>
					<Button mode="text" onPress={() => navigation.navigate('Login')} compact labelStyle={{ fontSize: 14 }}>
						Đăng nhập
					</Button>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 24,
	},
	logoSection: {
		alignItems: 'center',
		marginBottom: 24,
	},
	logoCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
	},
	formContainer: {
		width: '100%',
	},
	input: {
		marginBottom: 4,
	},
	errorText: {
		marginTop: -4,
		marginBottom: 8,
	},
	submitButton: {
		marginTop: 8,
		borderRadius: 12,
	},
	submitButtonContent: {
		paddingVertical: 8,
	},
	footerRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 18,
	},
	footerText: {
		fontSize: 14,
	},
});
