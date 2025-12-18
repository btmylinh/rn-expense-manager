// hooks/useRecurringExpenseReminders.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { recurringExpenseApi } from '../api/recurringExpenseApi';
import { useAuth } from '../contexts/AuthContext';

interface RecurringExpenseReminder {
	expense: any;
	daysUntilDue: number;
}

/**
 * Hook to check and manage recurring expense reminders
 * This hook automatically checks for upcoming recurring expenses
 * and creates notifications when expenses are due soon
 * Uses exponential backoff for polling to reduce server load
 */
export function useRecurringExpenseReminders() {
	const { user } = useAuth();
	const userId = user?.id;
	const [reminders, setReminders] = useState<RecurringExpenseReminder[]>([]);
	const [loading, setLoading] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const backoffDelayRef = useRef<number>(5 * 60 * 1000); // Start with 5 minutes
	const maxBackoffDelay = 30 * 60 * 1000; // Max 30 minutes
	const minBackoffDelay = 2 * 60 * 1000; // Min 2 minutes

	const checkReminders = useCallback(async () => {
		if (!userId) {
			setReminders([]);
			return;
		}
		
		setLoading(true);
		try {
			// Fetch active recurring expenses
			const response = await recurringExpenseApi.getRecurringExpenses({
				is_active: 1,
				limit: 1000,
				sortBy: 'next_due_date',
				sortOrder: 'ASC',
			});

			const expenses = response.data?.data?.expenses || [];
			const now = new Date();
			// Set time to start of day để so sánh chính xác
			now.setHours(0, 0, 0, 0);
			const upcomingReminders: RecurringExpenseReminder[] = [];

			// Calculate reminders for each active expense
			expenses.forEach((expense: any) => {
				if (!expense.next_due_date) return;

				const dueDate = new Date(expense.next_due_date);
				// Set time to start of day để so sánh chính xác
				dueDate.setHours(0, 0, 0, 0);
				const diffTime = dueDate.getTime() - now.getTime();
				// Math.floor để trong ngày tới hạn (diffDays = 0) được tính là "tới hạn", không phải "quá hạn"
				const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

				// Với frequency = "daily": Chỉ hiển thị khi đúng ngày (diffDays = 0) hoặc quá hạn (diffDays < 0)
				// Không hiển thị "sắp đến hạn" vì nó lặp lại mỗi ngày
				if (expense.frequency === 'daily') {
					// Chỉ hiển thị khi đúng ngày hoặc quá hạn
					if (diffDays <= 0) {
						upcomingReminders.push({
							expense: {
								id: expense.id,
								name: expense.name,
								amount: Number(expense.amount),
								user_category_id: expense.user_category_id,
								wallet_id: expense.wallet_id,
								frequency: expense.frequency,
								next_due_date: expense.next_due_date,
								reminder_days_before: expense.reminder_days_before,
								note: expense.note,
								is_active: expense.is_active,
							},
							daysUntilDue: diffDays,
						});
					}
				} else {
					// Với weekly/monthly/yearly: Hiển thị theo reminder window
					// Check if within reminder window (0 = tới hạn trong ngày, > 0 = sắp tới hạn, < 0 = quá hạn)
					const reminderDaysBefore = expense.reminder_days_before ?? 1;
					if (diffDays <= reminderDaysBefore) {
						upcomingReminders.push({
							expense: {
								id: expense.id,
								name: expense.name,
								amount: Number(expense.amount),
								user_category_id: expense.user_category_id,
								wallet_id: expense.wallet_id,
								frequency: expense.frequency,
								next_due_date: expense.next_due_date,
								reminder_days_before: expense.reminder_days_before,
								note: expense.note,
								is_active: expense.is_active,
							},
							daysUntilDue: diffDays,
						});
					}
				}
			});

			setReminders(upcomingReminders);

			// Reset backoff on success
			backoffDelayRef.current = minBackoffDelay;
		} catch (error) {
			console.error('Error checking reminders:', error);
			// Exponential backoff on error
			backoffDelayRef.current = Math.min(
				backoffDelayRef.current * 2,
				maxBackoffDelay
			);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		if (!userId) {
			setReminders([]);
			return;
		}

		// Check reminders on mount
		checkReminders();

		// Set up polling with current backoff delay
		const scheduleNextCheck = () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			intervalRef.current = setTimeout(() => {
				checkReminders();
				scheduleNextCheck();
			}, backoffDelayRef.current);
		};

		scheduleNextCheck();

		return () => {
			if (intervalRef.current) {
				clearTimeout(intervalRef.current);
			}
		};
	}, [userId, checkReminders]);

	return {
		reminders,
		loading,
		checkReminders
	};
}

