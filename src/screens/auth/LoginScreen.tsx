import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigators/AuthNavigator';
import { getErrorMessage } from '../../utils/errorHandler';
import { walletApi } from '../../api/walletApi';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
}

const isEmail = (v: string) => /.+@.+\..+/.test(v);

export default function LoginScreen({ navigation }: LoginScreenProps) {
	const theme = useAppTheme();
  const { login, isLoading } = useAuth();
	const [email, setEmail] = useState('linhbuithimy14@gmail.com');
  const [password, setPassword] = useState('12345Linh');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const loginErrorRef = useRef<string | null>(null);
  const isLoggingInRef = useRef(false);

  const emailError = useMemo(() => (email.length === 0 ? '' : isEmail(email) ? '' : 'Email không hợp lệ'), [email]);
  const passwordError = useMemo(() => (password.length === 0 ? '' : password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : ''), [password]);

  useEffect(() => {
    if (loginError) {
      loginErrorRef.current = loginError;
    }
  }, [loginError]);

  useEffect(() => {
    if (!loginError && loginErrorRef.current && !isLoggingInRef.current) {
      setLoginError(loginErrorRef.current);
    }
  }, [loginError, isLoading]);
  const handleLogin = async () => {
    setLoginError(null);
    loginErrorRef.current = null;
    isLoggingInRef.current = true;
    
    if (!email.trim() || !password.trim()) {
      setLoginError('Vui lòng nhập đầy đủ thông tin');
      loginErrorRef.current = 'Vui lòng nhập đầy đủ thông tin';
      isLoggingInRef.current = false;
      return;
    }

    if (emailError || passwordError) {
      setLoginError('Vui lòng kiểm tra lại thông tin');
      loginErrorRef.current = 'Vui lòng kiểm tra lại thông tin';
      isLoggingInRef.current = false;
      return;
    }

    try {
      const result = await login(email.trim(), password);
      isLoggingInRef.current = false;
    
      if (result.success && result.requires2FA) {
        const targetEmail = result.email || email.trim();
        setTimeout(() => {
          try {
            navigation.replace('TwoFactorAuth', { email: targetEmail });
          } catch (error) {
            try {
              navigation.navigate('TwoFactorAuth', { email: targetEmail });
            } catch (navError) {
              setLoginError('Không thể chuyển đến màn hình xác thực');
            }
          }
        }, 100);
      } else if (result.success) {
        // Kiểm tra wallets sau khi đăng nhập thành công
        try {
          const walletsResponse = await walletApi.getWallets();
          const walletsData = walletsResponse.data;
          const wallets = walletsData?.data?.wallets || walletsData?.wallets || [];
          
          if (wallets.length === 0) {
            // Chưa có ví, navigate đến Setup
            setTimeout(() => {
              navigation.replace('Setup');
            }, 100);
          }
          // Nếu đã có ví, RootNavigator sẽ tự động navigate đến Tabs
        } catch (error) {
          console.error('Failed to check wallets:', error);
          // Nếu lỗi, vẫn cho vào app (có thể check lại sau)
        }
      } else if (!result.success) {
        const errorMessage = result.message || 'Đăng nhập thất bại';
        setTimeout(() => {
          loginErrorRef.current = errorMessage;
          setLoginError(errorMessage);
        }, 100);
      }
    } catch (error) {
      isLoggingInRef.current = false;
      const errorMessage = getErrorMessage(error, 'Có lỗi xảy ra khi đăng nhập');
      setTimeout(() => {
        loginErrorRef.current = errorMessage;
        setLoginError(errorMessage);
      }, 100);
    }
	};

	return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
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

          {(loginError || loginErrorRef.current) ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={[styles.errorBannerText, { color: theme.colors.onErrorContainer }]}>
                {loginError || loginErrorRef.current}
              </Text>
            </View>
          ) : null}

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