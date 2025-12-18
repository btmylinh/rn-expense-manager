import axios, { AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../common/config';
import { getSecureItem } from '../utils/storage';

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 20000,
	headers: {
		'Content-Type': 'application/json',
	},
});

apiClient.interceptors.request.use(
	async config => {
		try {
			const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		} catch (error) {
			console.warn('Failed to attach auth token', error);
		}
		if (__DEV__) {
			console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
		}
		return config;
	},
	error => Promise.reject(error)
);

apiClient.interceptors.response.use(
	response => {
		// Check if response has code field (backend format)
		const responseData = response.data;
		if (responseData && typeof responseData === 'object' && 'code' in responseData) {
			// If code is not SUCCESS, treat as handled error (not system error)
			if (responseData.code !== 'SUCCESS') {
				if (__DEV__) {
					console.log(`[API Handled Error] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
						code: responseData.code,
						message: responseData.message,
						data: responseData.data,
					});
				}
				// Return as resolved promise so frontend can handle it
				return response;
			}
		}
		
		if (__DEV__) {
			console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
		}
		return response;
	},
	(error: AxiosError) => {
		// Check if this is a handled error from backend (has code and message)
		const responseData = error.response?.data;
		if (responseData && typeof responseData === 'object' && 'code' in responseData && 'message' in responseData) {
			// This is a handled error from backend, not a system error
			// Backend intentionally returned this error with a clear message
			if (__DEV__) {
				console.log(`[API Handled Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
					code: responseData.code,
					message: responseData.message,
					status: error.response?.status,
				});
			}
			// Still reject so frontend can catch and display the message
			return Promise.reject(error);
		}
		
		// Network errors or other system errors (no clear message from backend)
		if (__DEV__) {
			console.error('[API System Error]', {
				url: error.config?.url,
				method: error.config?.method,
				status: error.response?.status,
				message: error.message,
				response: error.response?.data,
			});
		}
		return Promise.reject(error);
	}
);


