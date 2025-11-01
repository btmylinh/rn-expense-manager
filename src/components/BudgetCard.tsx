// components/BudgetCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, getIconColor } from '../theme';

interface BudgetCardProps {
	budget: {
		id: number;
		amount: number;
		startDate: string;
		endDate: string;
		userCategoryId: number;
		spent?: number;
	};
	category?: {
		id: number;
		name: string;
		icon?: string;
	};
	onPress?: () => void;
}

export default function BudgetCard({ budget, category, onPress }: BudgetCardProps) {
	const theme = useAppTheme();
	const spent = budget.spent || 0;
	const left = budget.amount - spent;
	const percent = budget.amount ? Math.min((spent / budget.amount) * 100, 100) : 0;
	const accent = getIconColor(category?.icon, theme);
	
	return (
		<TouchableOpacity onPress={onPress}>
			<View style={[styles.card, styles.cardShadow, { backgroundColor: theme.colors.surface, borderColor: accent + '33' }] }>
				<View style={styles.rowCenter}>
					{category?.icon ? (
						<View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
							<MaterialCommunityIcons 
								name={category.icon as any} 
								size={22} 
								color={accent} 
							/>
						</View>
					) : null}
					<Text style={[styles.cardTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
						{category?.name || 'Danh mục'}
					</Text>
					<View style={styles.flex1} />
					<Text style={[styles.amountText, { color: theme.colors.onSurface }]}>
						{budget.amount.toLocaleString()} đ
					</Text>
				</View>

				<View style={styles.progressRow}>
					<View style={styles.progressTrack}>
						<View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: percent > 90 ? '#ef4444' : accent }]} />
					</View>
					<Text style={[styles.leftText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>Còn lại {left.toLocaleString()} đ</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 12,
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderWidth: 1,
	},
	cardShadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 1.5,
	},
	rowCenter: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	iconWrap: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 8,
	},
	cardTitle: {
		fontWeight: '600',
		fontSize: 15,
		maxWidth: '55%',
	},
	flex1: { flex: 1 },
	amountText: { fontWeight: '700', fontSize: 14 },
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	progressTrack: {
		flex: 1,
		marginRight: 8,
		height: 8,
		backgroundColor: '#E5E7EB',
		borderRadius: 6,
		overflow: 'hidden',
	},
	progressBar: {
		height: 8,
		borderRadius: 6,
	},
	leftText: { fontSize: 12 },
});
