import { apiClient } from './client';

export const reportApi = {
	getReports(params?: Record<string, any>) {
		return apiClient.get('/reports', { params });
	},
	exportReport(params?: Record<string, any>) {
		return apiClient.get('/reports/export', { params });
	},
};

