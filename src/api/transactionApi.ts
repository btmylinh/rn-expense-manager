import { apiClient } from './client';

export interface TransactionPayload {
	wallet_id: number;
	user_category_id: number;
	amount: number;
	type: 1 | 2;
	transaction_date: string;
	content?: string;
	note?: string;
}

export interface TransactionQuery {
	wallet_id?: number;
	user_category_id?: number;
	type?: number;
	start_date?: string;
	end_date?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export const transactionApi = {
	getTransactions(params?: TransactionQuery) {
		return apiClient.get('/transactions', { params });
	},
	getTransactionById(id: number) {
		return apiClient.get(`/transactions/${id}`);
	},
	createTransaction(payload: TransactionPayload) {
		return apiClient.post('/transactions', payload);
	},
	updateTransaction(id: number, payload: Partial<TransactionPayload>) {
		return apiClient.put(`/transactions/${id}`, payload);
	},
	deleteTransaction(id: number) {
		return apiClient.delete(`/transactions/${id}`);
	},
};

