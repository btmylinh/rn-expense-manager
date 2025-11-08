// hooks/useRecurringExpenseReminders.ts
import { useEffect, useState } from 'react';
import { fakeApi } from '../services/fakeApi';
import { useAuth } from '../contexts/AuthContext';

interface RecurringExpenseReminder {
	expense: any;
	daysUntilDue: number;
}

/**
 * Hook to check and manage recurring expense reminders
 * This hook automatically checks for upcoming recurring expenses
 * and creates notifications when expenses are due soon
 */
export function useRecurringExpenseReminders() {
	const { user } = useAuth();
	const userId = user?.id || 1;
	const [reminders, setReminders] = useState<RecurringExpenseReminder[]>([]);
	const [loading, setLoading] = useState(false);

	const checkReminders = async () => {
		if (!userId) return;
		
		setLoading(true);
		try {
			const response = await fakeApi.checkRecurringExpenseReminders(userId);
			if (response.success) {
				setReminders(response.data);
			}
		} catch (error) {
			console.error('Error checking reminders:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// Check reminders on mount
		checkReminders();

		// Check every 5 minutes
		const interval = setInterval(checkReminders, 5 * 60 * 1000);

		return () => clearInterval(interval);
	}, [userId]);

	return {
		reminders,
		loading,
		checkReminders
	};
}

