import { apiClient } from './client';

export const twoFactorApi = {
	getStatus() {
		return apiClient.get('/auth/2fa/status');
	},
	update(enabled: boolean) {
		return apiClient.put('/auth/2fa', { enabled });
	},
	enable() {
		return this.update(true);
	},
	disable() {
		return this.update(false);
	},
	resendCode(email: string) {
		return apiClient.post('/auth/2fa/resend', { email });
	},
	verifyCode(payload: { email: string; code: string }) {
		return apiClient.post('/auth/2fa/verify', payload);
	},
};

