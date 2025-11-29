import { apiClient } from './client';

export interface SendMessagePayload {
	content: string;
	metadata?: Record<string, any>;
}

export const chatApi = {
	getFAQs() {
		return apiClient.get('/chat/faqs');
	},
	getHistory(params?: Record<string, any>) {
		return apiClient.get('/chat/messages', { params });
	},
	sendMessage(payload: SendMessagePayload) {
		return apiClient.post('/chat/messages', payload);
	},
};

