import { apiClient } from './client';

export interface CategoryPayload {
	name: string;
	type: number;
	icon?: string;
	color?: string;
}

export const userCategoryApi = {
	getUserCategories(params?: { type?: number }) {
		return apiClient.get('/user-categories', { params });
	},
	getCategoryById(id: number) {
		return apiClient.get(`/user-categories/${id}`);
	},
	createCategory(payload: CategoryPayload) {
		return apiClient.post('/user-categories', payload);
	},
	updateCategory(id: number, payload: Partial<CategoryPayload>) {
		return apiClient.put(`/user-categories/${id}`, payload);
	},
	deleteCategory(id: number) {
		return apiClient.delete(`/user-categories/${id}`);
	},
	getListCategory() {
		return apiClient.get('/user-categories/list-category');
	},
	createManyCategories(categories: CategoryPayload[]) {
		return apiClient.post('/user-categories/create-many', categories);
	},
};

