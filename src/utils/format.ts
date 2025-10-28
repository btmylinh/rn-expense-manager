// utils/format.ts
export function formatCurrency(value: number, locale: string = 'vi-VN', currency: string = 'VND') {
	return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatDate(date: Date | string, locale: string = 'vi-VN') {
	const d = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}
