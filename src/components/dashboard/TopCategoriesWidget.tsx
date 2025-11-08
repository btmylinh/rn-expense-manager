// components/TopCategoriesWidget.tsx
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

interface CategorySpending {
	category: {
		id: number;
		name: string;
		icon?: string;
	};
	amount: number;
}

interface TopCategoriesWidgetProps {
	categories: CategorySpending[];
}

const TopCategoriesWidget = ({ categories }: TopCategoriesWidgetProps) => {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();

	if (categories.length === 0) {
		return null;
	}

	return (
		<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
			<Card.Content>
				<TouchableOpacity 
					onPress={() => {
						// Navigate to Tabs
						navigation.navigate('Tabs');
					}}
					style={[styles.header, { borderBottomColor: theme.colors.outline + '30' }]}
				>
					<View style={styles.headerLeft}>
						<MaterialCommunityIcons 
							name="trophy" 
							size={24} 
							color={theme.colors.primary} 
						/>
						<Text style={[styles.title, { color: theme.colors.onSurface }]}>
							Top 3 danh mục chi tiêu
						</Text>
					</View>
					<MaterialCommunityIcons 
						name="chevron-right" 
						size={24} 
						color={theme.colors.onSurfaceVariant} 
					/>
				</TouchableOpacity>

				<View style={styles.list}>
					{categories.map((item, index) => {
						const categoryColor = getIconColor(item.category.icon, theme);
						return (
							<View key={item.category.id} style={styles.categoryItem}>
								<View style={styles.categoryRank}>
									<Text style={[styles.rankText, { color: theme.colors.onSurfaceVariant }]}>
										#{index + 1}
									</Text>
								</View>
								<View style={[styles.categoryIcon, { backgroundColor: categoryColor + '22' }]}>
									<MaterialCommunityIcons
										name={(item.category.icon as any) || 'tag-outline'}
										size={24}
										color={categoryColor}
									/>
								</View>
								<View style={styles.categoryInfo}>
									<Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
										{item.category.name}
									</Text>
								</View>
								<Text style={[styles.categoryAmount, { color: theme.colors.error }]}>
									{formatCurrency(item.amount)}
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
	categoryItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
	},
	categoryRank: {
		width: 40,
		alignItems: 'center',
	},
	rankText: {
		fontSize: 14,
		fontWeight: '600',
	},
	categoryIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	categoryInfo: {
		flex: 1,
	},
	categoryName: {
		fontSize: 16,
		fontWeight: '600',
	},
	categoryAmount: {
		fontSize: 16,
		fontWeight: '700',
	},
});

export default TopCategoriesWidget;

