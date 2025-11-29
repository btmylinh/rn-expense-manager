import { apiClient } from './client';

interface ActivateStreakPayload {
	activity_type?: string;
	date?: string;
}

interface UpdateSettingsPayload {
	daily_goal?: number;
	reminder_time?: string;
	reminder_enabled?: number;
	daily_reminder_enabled?: number;
	weekend_mode?: number;
}

export const streakApi = {
	getStreak() {
		return apiClient.get('/streaks');
	},
	updateStreak(payload: Record<string, any>) {
		return apiClient.put('/streaks', payload);
	},
	getHistory(params?: Record<string, any>) {
		return apiClient.get('/streaks/history', { params });
	},
	activate(payload?: ActivateStreakPayload) {
		return apiClient.post('/streaks/activate', payload);
	},
	getSettings() {
		return apiClient.get('/streaks/settings');
	},
	updateSettings(payload: UpdateSettingsPayload) {
		return apiClient.put('/streaks/settings', payload);
	},
};



