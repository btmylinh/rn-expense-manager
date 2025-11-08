// components/SummaryWidget.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { formatCurrency } from '../../utils/format';

interface SummaryWidgetProps {
	income: number;
	expense: number;
	incomeChange?: number;
	expenseChange?: number;
	timeRange: 'week' | 'month';
}

const SummaryWidget = ({ income, expense, incomeChange, expenseChange, timeRange }: SummaryWidgetProps) => {
	const theme = useAppTheme();

	return (
		<View style={styles.container}>
			{/* Income Card */}
			<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
				<Card.Content>
					<View style={styles.cardHeader}>
						<Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
							Thu nhập
						</Text>
						<MaterialCommunityIcons name="trending-up" size={20} color="#22C55E" />
					</View>
					<Text style={[styles.amount, { color: '#22C55E' }]}>
						{formatCurrency(income)}
					</Text>
					{incomeChange !== undefined && incomeChange !== 0 && (
						<Text style={[styles.change, { color: incomeChange > 0 ? '#22C55E' : '#EF4444' }]}>
							{incomeChange > 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}% so với {timeRange === 'week' ? 'tuần trước' : 'tháng trước'}
						</Text>
					)}
				</Card.Content>
			</Card>

			{/* Expense Card */}
			<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
				<Card.Content>
					<View style={styles.cardHeader}>
						<Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
							Chi tiêu
						</Text>
						<MaterialCommunityIcons name="trending-down" size={20} color="#EF4444" />
					</View>
					<Text style={[styles.amount, { color: '#EF4444' }]}>
						{formatCurrency(expense)}
					</Text>
					{expenseChange !== undefined && expenseChange !== 0 && (
						<Text style={[styles.change, { color: expenseChange > 0 ? '#EF4444' : '#22C55E' }]}>
							{expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% so với {timeRange === 'week' ? 'tuần trước' : 'tháng trước'}
						</Text>
					)}
				</Card.Content>
			</Card>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginBottom: 16,
		gap: 12,
	},
	card: {
		flex: 1,
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
	},
	amount: {
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 4,
	},
	change: {
		fontSize: 12,
		fontWeight: '500',
	},
});

export default SummaryWidget;

