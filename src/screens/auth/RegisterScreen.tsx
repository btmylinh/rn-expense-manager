// screens/RegisterScreen.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, TextInput, HelperText, Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isAxiosError } from 'axios';
import { authApi } from '../../api/authApi';
import { useAppTheme } from '../../theme';
import { AuthStackParamList } from '../../navigators/AuthNavigator';
import { getErrorMessage } from '../../utils/errorHandler';

const isEmail = (v: string) => /.+@.+\..+/.test(v);

// Validate password theo yêu cầu backend: ít nhất 8 ký tự, có chữ hoa, chữ thường và số
const validatePassword = (password: string): { isValid: boolean; message: string } => {
	if (password.length === 0) {
		return { isValid: true, message: '' };
	}
	if (password.length < 8) {
		return { isValid: false, message: 'Mật khẩu tối thiểu 8 ký tự' };
	}
	const hasLowerCase = /[a-z]/.test(password);
	const hasUpperCase = /[A-Z]/.test(password);
	const hasNumber = /\d/.test(password);
	const hasOnlyAllowedChars = /^[a-zA-Z\d]+$/.test(password);
	
	if (!hasLowerCase) {
		return { isValid: false, message: 'Mật khẩu phải có chữ thường' };
	}
	if (!hasUpperCase) {
		return { isValid: false, message: 'Mật khẩu phải có chữ hoa' };
	}
	if (!hasNumber) {
		return { isValid: false, message: 'Mật khẩu phải có số' };
	}
	if (!hasOnlyAllowedChars) {
		return { isValid: false, message: 'Mật khẩu chỉ được chứa chữ và số' };
	}
	return { isValid: true, message: '' };
};

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
	const [emailExists, setEmailExists] = useState(false);
	const [checkingEmail, setCheckingEmail] = useState(false);
	const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const nameError = useMemo(() => (name.length === 0 ? '' : name.trim().length < 2 ? 'Tên tối thiểu 2 ký tự' : ''), [name]);
	
	const emailFormatError = useMemo(() => {
		if (email.length === 0) return '';
		if (!isEmail(email)) return 'Email không hợp lệ';
		return '';
	}, [email]);
	
	const emailError = useMemo(() => {
		if (emailFormatError) return emailFormatError;
		if (emailExists) return 'Email đã được sử dụng';
		return '';
	}, [emailFormatError, emailExists]);
	
	const passwordValidation = useMemo(() => validatePassword(password), [password]);
	const passwordError = passwordValidation.message;
	const confirmPasswordError = useMemo(() => {
		if (confirmPassword.length === 0) return '';
		if (password !== confirmPassword) return 'Mật khẩu không khớp';
		return '';
	}, [password, confirmPassword]);

	// Check email exists khi email hợp lệ và user đã nhập xong
	useEffect(() => {
		// Clear timeout cũ nếu có
		if (emailCheckTimeoutRef.current) {
			clearTimeout(emailCheckTimeoutRef.current);
		}

		// Reset email exists khi email thay đổi
		setEmailExists(false);

		// Chỉ check nếu email hợp lệ và không rỗng
		if (!email.trim() || emailFormatError) {
			return;
		}

		// Debounce: đợi 500ms sau khi user ngừng gõ
		emailCheckTimeoutRef.current = setTimeout(async () => {
			try {
				setCheckingEmail(true);
				const response = await authApi.checkEmail(email.trim().toLowerCase());
				const responseData = response.data;
				const exists = responseData?.data?.exists ?? responseData?.exists ?? false;
				setEmailExists(exists);
			} catch (error) {
				// Nếu lỗi, không set emailExists để không block user
				console.error('Error checking email:', error);
			} finally {
				setCheckingEmail(false);
			}
		}, 500);

		return () => {
			if (emailCheckTimeoutRef.current) {
				clearTimeout(emailCheckTimeoutRef.current);
			}
		};
	}, [email, emailFormatError]);

	const onSubmit = async () => {
		setFormError(null);
		
		// Kiểm tra tất cả các trường bắt buộc
		if (!name.trim() || !email.trim() || !password || !confirmPassword) {
			setFormError('Vui lòng điền đầy đủ thông tin');
			return;
		}
		
		// Kiểm tra validation từng trường theo thứ tự
		if (nameError) {
			setFormError(nameError);
			return;
		}
		
		if (emailError) {
			setFormError(emailError);
			return;
		}
		
		// Kiểm tra lại email exists trước khi submit (nếu đang check thì đợi)
		if (checkingEmail) {
			setFormError('Đang kiểm tra email...');
			return;
		}
		
		if (emailExists) {
			setFormError('Email đã được sử dụng');
			return;
		}
		
		if (!passwordValidation.isValid || passwordError) {
			setFormError(passwordError || 'Mật khẩu không hợp lệ');
			return;
		}
		
		if (confirmPasswordError) {
			setFormError(confirmPasswordError);
			return;
		}
		
		// Tất cả validation đã pass, gửi request
		try {
			setLoading(true);
			const payload = {
				name: name.trim(),
				email: email.trim().toLowerCase(),
				password,
			};
			await authApi.register(payload);
			navigation.navigate('ConfirmEmail', { email: payload.email });
		} catch (error) {
			const errorMessage = getErrorMessage(error, 'Đã xảy ra lỗi khi đăng ký');
			// Nếu lỗi là email đã tồn tại, set emailExists
			if (errorMessage.includes('Email') && (errorMessage.includes('đã') || errorMessage.includes('tồn tại') || errorMessage.includes('exists'))) {
				setEmailExists(true);
			}
			setFormError(errorMessage);
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
						right={checkingEmail ? <ActivityIndicator size="small" color={theme.colors.primary} /> : undefined}
						error={!!emailError}
						style={styles.input}
					/>
					{!!emailError && <HelperText type="error" visible={!!emailError} style={styles.errorText}>{emailError}</HelperText>}
					{!emailError && checkingEmail && <HelperText type="info" visible={true} style={styles.errorText}>Đang kiểm tra email...</HelperText>}

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
						<View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
							<Text style={[styles.errorBannerText, { color: theme.colors.onErrorContainer }]}>
							{formError}
							</Text>
						</View>
					)}

					<Button 
						mode="contained" 
						loading={loading} 
						disabled={loading || checkingEmail || !!nameError || !!emailError || !!passwordError || !!confirmPasswordError || !name.trim() || !email.trim() || !password || !confirmPassword}
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
	errorBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
		minHeight: 48,
	},
	errorBannerText: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center',
	},
});
