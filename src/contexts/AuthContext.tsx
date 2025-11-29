import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { STORAGE_KEYS } from '../common/config';
import { authApi, twoFactorApi } from '../api';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../utils/storage';

interface User {
  id: number;
  email: string;
  name?: string;
  role?: string;
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requires2FA?: boolean; email?: string }>;
  loginWith2FA: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  verifyRegistrationOtp: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const accessToken = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (accessToken) {
        try {
          const profile = await fetchCurrentUser();
          if (profile) {
            setUser(profile);
            return;
          }
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) {
            await clearSession();
            return;
          }
          console.error('Error refreshing session:', error);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeUser = (raw: any): User | null => {
    if (!raw) return null;

    const id = raw.id ?? raw.userId ?? raw.user_id;
    const email = raw.email ?? raw.userEmail ?? raw.user_email;

    if (!id || !email) {
      return null;
    }

    return {
      id: id as number,
      email: String(email),
      name: raw.name ?? raw.fullName ?? raw.displayName ?? undefined,
      role: raw.role ?? raw.userRole ?? undefined,
      verified: raw.verified ?? raw.isVerified ?? raw.is_verified ?? false,
    };
  };

  const fetchCurrentUser = async (): Promise<User | null> => {
    const response = await authApi.getMe();
    const responseData = response.data;
    const payload = responseData?.data?.user ?? responseData?.user ?? responseData;
    return normalizeUser(payload);
  };

  const persistTokens = async (accessToken: string, refreshToken: string) => {
    await Promise.all([
      setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  };

  const clearSession = async () => {
    setUser(null);
    await Promise.all([
      deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  };

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (isAxiosError(error)) {
      const responseData = error.response?.data as { 
        message?: string; 
        code?: string;
        data?: any;
      };
      
      if (responseData?.message) {
        return responseData.message;
      }
      
      if (responseData?.code) {
        return `Lỗi: ${responseData.code}`;
      }
      
      if (error.response?.statusText) {
        return error.response.statusText;
      }
    }
    if (error instanceof Error) {
      return error.message || fallback;
    }
    return fallback;
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      
      if (response.status === 401 || response.status === 400) {
        const responseData = response.data as { code?: string; message?: string; data?: any };
        const errorMessage = responseData?.message || 'Đăng nhập thất bại';
        return { success: false, message: errorMessage, requires2FA: false };
      }
      
      const responseData = response.data;
      const payload = responseData?.data || responseData;

      if ((payload as any)?.requires2FA) {
        return {
          success: true,
          requires2FA: true,
          email: (payload as any).email || email,
          message: responseData?.message || (payload as any).message,
        };
      }

      if (!payload?.accessToken || !payload?.refreshToken) {
        return { success: false, message: 'Phản hồi đăng nhập không hợp lệ', requires2FA: false };
      }

      await persistTokens(payload.accessToken, payload.refreshToken);

      let currentUser: User | null = null;

      try {
        currentUser = await fetchCurrentUser();
      } catch (error) {
        if (payload.user) {
          currentUser = normalizeUser(payload.user);
        }

        if (!currentUser) {
          throw error;
        }
      }

      if (!currentUser) {
        await clearSession();
        return { success: false, message: 'Không thể lấy thông tin người dùng', requires2FA: false };
      }

      setUser(currentUser);
        
      return { success: true, requires2FA: false };
    } catch (error) {
      await clearSession();
      const message = extractErrorMessage(error, 'Có lỗi xảy ra khi đăng nhập');
      return { success: false, message, requires2FA: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWith2FA = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      const response = await twoFactorApi.verifyCode({ email, code });
      const responseData = response.data;
      const payload = responseData?.data || responseData;

      if (!payload?.accessToken || !payload?.refreshToken) {
        return { success: false, message: responseData?.message || payload?.message || 'Phản hồi không hợp lệ' };
      }

      await persistTokens(payload.accessToken, payload.refreshToken);

      let currentUser: User | null = null;
      try {
        currentUser = await fetchCurrentUser();
      } catch {
        currentUser = normalizeUser(payload.user);
      }

      if (!currentUser) {
        await clearSession();
        return { success: false, message: 'Không thể lấy thông tin người dùng' };
      }

      setUser(currentUser);
      return { success: true };
    } catch (error) {
      const message = extractErrorMessage(error, 'Có lỗi xảy ra khi xác thực');
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistrationOtp = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.verifyRegistrationOtp({ email, code });
      const responseData = response.data;
      const payload = responseData?.data || responseData;

      if (!payload?.accessToken || !payload?.refreshToken) {
        return { success: false, message: responseData?.message || payload?.message || 'Phản hồi không hợp lệ' };
      }

      await persistTokens(payload.accessToken, payload.refreshToken);

      let currentUser: User | null = null;
      try {
        currentUser = await fetchCurrentUser();
      } catch {
        currentUser = normalizeUser(payload.user);
      }

      if (!currentUser) {
        await clearSession();
        return { success: false, message: 'Không thể lấy thông tin người dùng' };
      }

      setUser(currentUser);
      return { success: true };
    } catch (error) {
      const message = extractErrorMessage(error, 'Xác thực OTP thất bại');
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const current = await fetchCurrentUser();
      if (current) {
        setUser(current);
      }
    } catch (error) {
      console.error('Failed to refresh user profile', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWith2FA,
    verifyRegistrationOtp,
    logout,
    isAuthenticated: !!user,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};