import { apiClient } from './client';

export interface BudgetPayload {
	user_category_id: number;
	wallet_id: number;
	amount: number;
	start_date: string;
	end_date: string;
	is_repeat?: number;
}

export const budgetApi = {
	getBudgets(params?: Record<string, any>) {
		return apiClient.get('/budgets', { params });
	},
	getBudgetById(id: number) {
		return apiClient.get(`/budgets/${id}`);
	},
	createBudget(payload: BudgetPayload) {
		return apiClient.post('/budgets', payload);
	},
	updateBudget(id: number, payload: Partial<BudgetPayload>) {
		return apiClient.put(`/budgets/${id}`, payload);
	},
	deleteBudget(id: number) {
		return apiClient.delete(`/budgets/${id}`);
	},
};

