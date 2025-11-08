// components/RecentTransactionsWidget.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme, getIconColor } from '../../theme';
import { formatCurrency } from '../../utils/format';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Transaction {
	id: number;
	title: string;
	displayAmount: number;
	isIncome: boolean;
	formattedDate: string;
	category?: {
		name: string;
		icon?: string;
	};
}

interface RecentTransactionsWidgetProps {
	transactions: Transaction[];
}

const RecentTransactionsWidget = ({ transactions }: RecentTransactionsWidgetProps) => {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();

	if (transactions.length === 0) {
		return null;
	}

	return (
		<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
			<Card.Content>
				<TouchableOpacity 
					onPress={() => navigation.navigate('TransactionList', { budgetId: 0 })}
					style={[styles.header, { borderBottomColor: theme.colors.outline + '30' }]}
				>
					<View style={styles.headerLeft}>
						<MaterialCommunityIcons 
							name="clock-outline" 
							size={24} 
							color={theme.colors.primary} 
						/>
						<Text style={[styles.title, { color: theme.colors.onSurface }]}>
							Giao dịch gần đây
						</Text>
					</View>
					<MaterialCommunityIcons 
						name="chevron-right" 
						size={24} 
						color={theme.colors.onSurfaceVariant} 
					/>
				</TouchableOpacity>

				<View style={styles.list}>
					{transactions.map((tx) => {
						const categoryColor = getIconColor(tx.category?.icon, theme);

						return (
							<View key={tx.id} style={styles.transactionItem}>
								<View style={[styles.transactionIcon, { backgroundColor: categoryColor + '22' }]}>
									<MaterialCommunityIcons
										name={(tx.category?.icon as any) || 'tag-outline'}
										size={20}
										color={categoryColor}
									/>
								</View>
								<View style={styles.transactionInfo}>
									<Text style={[styles.transactionTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
										{tx.title}
									</Text>
									<Text style={[styles.transactionMeta, { color: theme.colors.onSurfaceVariant }]}>
										{tx.category?.name} • {tx.formattedDate}
									</Text>
								</View>
								<Text style={[
									styles.transactionAmount,
									{ color: tx.isIncome ? '#22C55E' : '#EF4444' }
								]}>
									{tx.isIncome ? '+' : '-'}{formatCurrency(tx.displayAmount)}
								</Text>
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
		gap: 12,
	},
	transactionItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
	},
	transactionIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	transactionInfo: {
		flex: 1,
	},
	transactionTitle: {
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 3,
	},
	transactionMeta: {
		fontSize: 12,
	},
	transactionAmount: {
		fontSize: 15,
		fontWeight: '700',
	},
});

export default RecentTransactionsWidget;

