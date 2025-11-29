import { apiClient } from './client';

export const notificationApi = {
	getNotifications(params?: Record<string, any>) {
		return apiClient.get('/notifications', { params });
	},
	markAsRead(id: number) {
		return apiClient.put(`/notifications/${id}/read`);
	},
	markAllAsRead() {
		return apiClient.put('/notifications/read-all');
	},
	deleteNotification(id: number) {
		return apiClient.delete(`/notifications/${id}`);
	},
	getSettings() {
		return apiClient.get('/notifications/settings');
	},
	updateSettings(payload: Record<string, any>) {
	 return apiClient.put('/notifications/settings', payload);
	},
};

