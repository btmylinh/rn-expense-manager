// components/RecurringExpensesWidget.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme, getIconColor } from '../../theme';
import { fakeApi } from '../../services/fakeApi';
import { useAuth } from '../../contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RecurringExpensesWidget = () => {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();
	const { user } = useAuth();
	const userId = user?.id || 1;
	
	const [upcomingExpenses, setUpcomingExpenses] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadUpcomingExpenses();
	}, []);

	const loadUpcomingExpenses = async () => {
		try {
			const response = await fakeApi.getRecurringExpenses(userId);
			if (response.success) {
				// Filter active expenses and sort by next due date
				const active = response.data
					.filter((e: any) => e.isActive)
					.sort((a: any, b: any) => 
						new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
					)
					.slice(0, 3); // Show only next 3
				setUpcomingExpenses(active);
			}
		} catch (error) {
			console.error('Error loading upcoming expenses:', error);
		} finally {
			setLoading(false);
		}
	};

	const getDaysUntilDue = (dateString: string) => {
		const dueDate = new Date(dateString);
		const today = new Date();
		const diffTime = dueDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
	};

	if (loading || upcomingExpenses.length === 0) {
		return null;
	}

	return (
		<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
			<Card.Content>
				<TouchableOpacity 
					onPress={() => navigation.navigate('RecurringExpenses')}
					style={[styles.header, { borderBottomColor: theme.colors.outline + '30' }]}
				>
					<View style={styles.headerLeft}>
						<MaterialCommunityIcons 
							name="repeat" 
							size={24} 
							color={theme.colors.primary} 
						/>
						<Text style={[styles.title, { color: theme.colors.onSurface }]}>
							Chi tiêu định kỳ sắp tới
						</Text>
					</View>
					<MaterialCommunityIcons 
						name="chevron-right" 
						size={24} 
						color={theme.colors.onSurfaceVariant} 
					/>
				</TouchableOpacity>

				<View style={styles.list}>
					{upcomingExpenses.map((expense) => {
						const daysUntilDue = getDaysUntilDue(expense.nextDueDate);
						const isOverdue = daysUntilDue < 0;
						const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
						const categoryIconColor = getIconColor(expense.categoryIcon, theme);

						return (
							<View key={expense.id} style={styles.expenseItem}>
								<View style={[styles.expenseIcon, { backgroundColor: categoryIconColor + '22' }]}>
									<MaterialCommunityIcons
										name={expense.categoryIcon as any || 'help-circle'}
										size={20}
										color={categoryIconColor}
									/>
								</View>
								<View style={styles.expenseInfo}>
									<Text style={[styles.expenseName, { color: theme.colors.onSurface }]}>
										{expense.name}
									</Text>
									<Text style={[styles.expenseDate, { color: theme.colors.onSurfaceVariant }]}>
										{formatDate(expense.nextDueDate)}
										{isOverdue && ' • Quá hạn'}
										{isDueSoon && !isOverdue && ` • ${daysUntilDue} ngày`}
									</Text>
								</View>
								<View style={styles.expenseAmount}>
									<Text style={[styles.amount, { color: theme.colors.error }]}>
										-{expense.amount.toLocaleString('vi-VN')}
									</Text>
									{(isDueSoon || isOverdue) && (
										<View style={[
											styles.badge,
											{ backgroundColor: isOverdue ? theme.colors.error : theme.colors.errorContainer }
										]}>
											<MaterialCommunityIcons 
												name="bell-ring" 
												size={12} 
												color={isOverdue ? '#fff' : theme.colors.onErrorContainer}
											/>
										</View>
									)}
								</View>
							</View>
						);
					})}
				</View>
			</Card.Content>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
	},
	list: {
		gap: 14,
	},
	expenseItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 4,
	},
	expenseIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	expenseInfo: {
		flex: 1,
	},
	expenseName: {
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 3,
	},
	expenseDate: {
		fontSize: 13,
	},
	expenseAmount: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 6,
	},
	amount: {
		fontSize: 15,
		fontWeight: '700',
	},
	badge: {
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default RecurringExpensesWidget;

