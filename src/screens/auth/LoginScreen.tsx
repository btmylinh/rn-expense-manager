import React, { useState, useMemo } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigators/AuthNavigator';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
}

const isEmail = (v: string) => /.+@.+\..+/.test(v);

export default function LoginScreen({ navigation }: LoginScreenProps) {
	const theme = useAppTheme();
  const { login, isLoading } = useAuth();
	// Dev mode: pre-fill credentials for faster testing
	const [email, setEmail] = useState('newstart@test.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const emailError = useMemo(() => (email.length === 0 ? '' : isEmail(email) ? '' : 'Email không hợp lệ'), [email]);
  const passwordError = useMemo(() => (password.length === 0 ? '' : password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : ''), [password]);

  const handleLogin = async () => {
    setLoginError(null);
    
    if (!email.trim() || !password.trim()) {
      setLoginError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (emailError || passwordError) {
      setLoginError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const result = await login(email.trim(), password);
    if (!result.success) {
      setLoginError(result.message || 'Đăng nhập thất bại');
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
            Chào mừng trở lại
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Đăng nhập để tiếp tục quản lý chi tiêu
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
				<TextInput
					label="Email"
					value={email}
					onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
					autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            error={!!emailError}
				/>
        {!!emailError && <HelperText type="error" visible={!!emailError} style={styles.errorText}>{emailError}</HelperText>}

				<TextInput
					label="Mật khẩu"
					value={password}
					onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            error={!!passwordError}
          />
        {!!passwordError && <HelperText type="error" visible={!!passwordError} style={styles.errorText}>{passwordError}</HelperText>}

          <Button
            mode="text"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
            labelStyle={{ fontSize: 14 }}
          >
            Quên mật khẩu?
          </Button>

          {loginError && (
            <HelperText type="error" visible={!!loginError} style={{ textAlign: 'center', marginBottom: 8 }}>
              {loginError}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || !email.trim() || !password.trim()}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            Đăng nhập
          </Button>
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            Chưa có tài khoản?{' '}
          </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            compact
            labelStyle={{ fontSize: 14 }}
          >
            Đăng ký ngay
          </Button>
        </View>
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
    marginBottom: 23,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  loginButton: {
    borderRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 14,
  },
});