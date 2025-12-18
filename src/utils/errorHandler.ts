/**
 * Error handling utilities
 * Standardizes error extraction from API responses following { code, message } format
 */

export interface ApiError {
	code?: string;
	message?: string;
	data?: any;
}

/**
 * Extract error message from various error formats
 * Supports:
 * - Axios errors: error.response?.data?.message
 * - Standard API errors: { code, message }
 * - Generic errors: Error.message
 */
export function getErrorMessage(error: any, fallback: string = 'Có lỗi xảy ra'): string {
	if (!error) return fallback;

	// Axios error with response (most common case)
	if (error.response) {
		const data = error.response.data;
		
		// Handle string response
		if (typeof data === 'string') {
			// Try to parse as JSON if it looks like JSON
			try {
				const parsed = JSON.parse(data);
				if (parsed?.message) return parsed.message;
			} catch {
				// If not JSON, return the string
				return data;
			}
		}
		
		// Handle object response
		if (data && typeof data === 'object') {
			// Backend format: { code, message, data }
			if (data.message && typeof data.message === 'string') {
				return data.message;
			}
			// Alternative format: { error: { message } }
			if (data.error?.message) {
				return data.error.message;
			}
			// If message is nested in data
			if (data.data?.message) {
				return data.data.message;
			}
		}
		
		// If no data but has status, provide generic message
		if (error.response.status) {
			if (error.response.status === 429) {
				return 'Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau.';
			}
			if (error.response.status >= 500) {
				return 'Lỗi máy chủ. Vui lòng thử lại sau.';
			}
			if (error.response.status === 401) {
				return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
			}
		}
	}

	// Standard error object with message
	if (error.message && typeof error.message === 'string') {
		// Axios network error (không có response từ server)
		if (error.message === 'Network Error') {
			return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
		}

		// Avoid showing raw JSON strings
		if (error.message.startsWith('{') && error.message.includes('"error"')) {
			try {
				const parsed = JSON.parse(error.message);
				if (parsed?.error?.message) return parsed.error.message;
				if (parsed?.message) return parsed.message;
			} catch {
				// If can't parse, use fallback
			}
		} else {
			return error.message;
		}
	}

	// Error object with code and message
	if (error.code && error.message) {
		return error.message;
	}

	// Fallback to string representation
	if (typeof error === 'string') {
		return error;
	}

	return fallback;
}

/**
 * Extract error code from error object
 */
export function getErrorCode(error: any): string | undefined {
	if (!error) return undefined;

	if (error.response?.data?.code) {
		return error.response.data.code;
	}

	if (error.code) {
		return error.code;
	}

	return undefined;
}

/**
 * Check if error is a specific error code
 */
export function isErrorCode(error: any, code: string): boolean {
	return getErrorCode(error) === code;
}

/**
 * Format error for display
 * Returns { code, message } format
 */
export function formatError(error: any, fallback: string = 'Có lỗi xảy ra'): ApiError {
	return {
		code: getErrorCode(error),
		message: getErrorMessage(error, fallback),
		data: error.response?.data?.data || error.data,
	};
}

