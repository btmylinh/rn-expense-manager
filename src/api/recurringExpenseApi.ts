import { apiClient } from './client';

export interface RecurringExpensePayload {
	name: string;
	amount: number;
	user_category_id: number;
	wallet_id: number;
	frequency: string;
	start_date?: string; // Optional - backend không sử dụng field này
	end_date?: string;
	is_active?: number;
	notes?: string;
	next_due_date?: string;
	reminder_days_before?: number;
}

export const recurringExpenseApi = {
	getRecurringExpenses(params?: Record<string, any>) {
		return apiClient.get('/recurring-expenses', { params });
	},
	getRecurringExpenseById(id: number) {
		return apiClient.get(`/recurring-expenses/${id}`);
	},
	createRecurringExpense(payload: RecurringExpensePayload) {
		return apiClient.post('/recurring-expenses', payload);
	},
	updateRecurringExpense(id: number, payload: Partial<RecurringExpensePayload>) {
		return apiClient.put(`/recurring-expenses/${id}`, payload);
	},
	deleteRecurringExpense(id: number) {
		return apiClient.delete(`/recurring-expenses/${id}`);
	},
	detectRecurringExpenses(payload?: Record<string, any>) {
		return apiClient.post('/recurring-expenses/detect', payload);
	},
	predictNextMonthExpenses(params?: Record<string, any>) {
		return apiClient.get('/recurring-expenses/predict', { params });
	},
};



