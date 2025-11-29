import { apiClient } from './client';

export interface SavingsGoalPayload {
	name: string;
	target_amount: number;
	current_amount?: number;
	deadline?: string;
	color?: string;
	icon?: string;
	currency?: string;
	description?: string;
	status?: string;
}

export interface ContributionPayload {
	amount: number;
	note?: string;
	wallet_id?: number;
}

export const savingsGoalApi = {
	getSavingsGoals(params?: Record<string, any>) {
		return apiClient.get('/savings-goals', { params });
	},
	getSavingsGoalById(id: number) {
		return apiClient.get(`/savings-goals/${id}`);
	},
	createSavingsGoal(payload: SavingsGoalPayload) {
		return apiClient.post('/savings-goals', payload);
	},
	updateSavingsGoal(id: number, payload: Partial<SavingsGoalPayload>) {
		return apiClient.put(`/savings-goals/${id}`, payload);
	},
	deleteSavingsGoal(id: number) {
		return apiClient.delete(`/savings-goals/${id}`);
	},
	createContribution(goalId: number, payload: ContributionPayload) {
		return apiClient.post(`/savings-goals/${goalId}/contributions`, payload);
	},
	getContributions(goalId: number) {
		return apiClient.get(`/savings-goals/${goalId}/contributions`);
	},
};

