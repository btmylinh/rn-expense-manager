import { apiClient } from './client';

interface LoginPayload {
	email: string;
	password: string;
}

interface RegisterPayload {
	name: string;
	email: string;
	password: string;
}

interface OtpPayload {
	email: string;
	code: string;
}

interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
}

// API client cho các chức năng xác thực
// Tất cả các endpoint đều được gọi qua apiClient với baseURL đã cấu hình
export const authApi = {
	// Đăng nhập: POST /auth/login
	// Trả về accessToken, refreshToken và thông tin user
	login(payload: LoginPayload) {
		return apiClient.post('/auth/login', payload);
	},
	
	// Lấy thông tin user hiện tại: GET /auth/me
	// Cần có token trong header Authorization
	getMe() {
		return apiClient.get('/auth/me');
	},
	
	// Kiểm tra email đã tồn tại: GET /auth/check-email?email=...
	checkEmail(email: string) {
		return apiClient.get('/auth/check-email', { params: { email } });
	},
	
	// Đăng ký tài khoản mới: POST /auth/register
	// Sau khi đăng ký thành công, cần verify OTP qua email
	register(payload: RegisterPayload) {
		return apiClient.post('/auth/register', payload);
	},
	
	// Xác thực OTP khi đăng ký: POST /auth/verify-otp
	verifyRegistrationOtp(payload: OtpPayload) {
		return apiClient.post('/auth/verify-otp', payload);
	},
	
	// Gửi lại OTP: POST /auth/resend-otp
	resendRegistrationOtp(payload: { email: string }) {
		return apiClient.post('/auth/resend-otp', payload);
	},
	
	// Quên mật khẩu: POST /auth/forgot-password
	// Gửi email reset password
	forgotPassword(payload: { email: string }) {
		return apiClient.post('/auth/forgot-password', payload);
	},
	
	// Đổi mật khẩu: POST /auth/change-password
	// Cần có token trong header và mật khẩu hiện tại
	changePassword(payload: ChangePasswordPayload) {
		return apiClient.post('/auth/change-password', payload);
	},
};
