import { apiClient } from './client';

export const userApi = {
	getProfile() {
		return apiClient.get('/users/me');
	},
	updateProfile(payload: { name?: string; avatar_url?: string }) {
		return apiClient.put('/users/me', payload);
	},
	getUserById(id: number) {
		return apiClient.get(`/users/${id}`);
	},
};

