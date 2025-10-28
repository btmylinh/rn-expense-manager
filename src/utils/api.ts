// utils/api.ts
import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../common/config';
import { getSecureItem } from './storage';

export const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 15000,
});

api.interceptors.request.use(async config => {
	const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
	if (token) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	response => response,
	error => {
		return Promise.reject(error);
	}
);
