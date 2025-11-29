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

	// Axios error with response
	if (error.response?.data) {
		const data = error.response.data;
		if (typeof data === 'string') return data;
		if (data.message) return data.message;
		if (data.error?.message) return data.error.message;
	}

	// Standard error object with message
	if (error.message && typeof error.message === 'string') {
		return error.message;
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

