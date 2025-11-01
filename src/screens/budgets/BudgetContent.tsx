// screens/budgets/BudgetContent.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';
import BudgetCard from '../../components/BudgetCard';
import { Button } from 'react-native-paper';

interface BudgetContentProps {
	budgets: Array<{
		id: number;
		userId: number;
		userCategoryId: number;
		amount: number;
		startDate: string;
		endDate: string;
		spent?: number;
	}>;
	categories: Array<{
		id: number;
		name: string;
		icon?: string;
		color?: string;
	}>;
	timeRange: {
		label: string;
		startDate: string;
		endDate: string;
	};
	onEdit: (budget: any) => void;
	onStartCreate?: () => void;
	onViewDetail?: (budgetId: number) => void;
}

export default function BudgetContent({ budgets, categories, timeRange, onEdit, onStartCreate, onViewDetail }: BudgetContentProps) {
	const theme = useAppTheme();
	
	// Lọc ngân sách thuộc khoảng thời gian đã chọn (trùng khớp range)
	const filteredBudgets = budgets.filter(budget => {
		return budget.startDate === timeRange.startDate && budget.endDate === timeRange.endDate;
	});
	
	// Tính toán thống kê tổng quan
	const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
	const totalSpent = filteredBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);
	const totalLeft = totalBudget - totalSpent;
	const progress = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
	const overBudget = totalSpent >= totalBudget && totalBudget > 0;
	
	// Tính số ngày còn lại đến cuối khoảng thời gian
	const today = new Date();
	const endDate = new Date(timeRange.endDate);
	const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

	// Dot-arc layout config (semi-circle)
	const DOT_COUNT = 14;
	const RADIUS = 90; // px
	const CENTER_X = 105; // half of arcWrap width (210)
	const CENTER_Y = 100; // slightly lower for nicer arc (height 110)
	const START_DEG = -180; // left
	const END_DEG = 0; // right
	const filled = Math.round(progress * DOT_COUNT);
	const activeColor = overBudget || progress >= 0.9 ? '#ef4444' : theme.colors.primary;

	const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
		const t = i / (DOT_COUNT - 1); // 0..1
		const deg = START_DEG + (END_DEG - START_DEG) * t;
		const rad = (deg * Math.PI) / 180;
		const x = CENTER_X + RADIUS * Math.cos(rad);
		const y = CENTER_Y + RADIUS * Math.sin(rad);
		const isFilled = i < filled;
		return (
			<View
				key={i}
				style={[
					styles.dot,
					{
						left: x - 6,
						top: y - 6,
						backgroundColor: isFilled ? activeColor : '#E5E7EB',
						opacity: isFilled ? 1 : 0.9,
					},
				]}
			/>
		);
	});
	
	return (
		<View style={styles.container}>
			<FlatList
				data={filteredBudgets}
				keyExtractor={(item) => item.id.toString()}
				ListHeaderComponent={(
					<View style={[theme.ui.card, styles.summaryCardExtra, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outline }]}>
						{/* Dot arc progress */}
						<View style={styles.arcWrap}>
							{dots}
							<Text style={[styles.arcCenterText, { color: totalLeft < 0 ? '#ef4444' : theme.colors.primary }]}>
								{totalLeft.toLocaleString()}
							</Text>
						</View>
						<Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Số tiền bạn có thể chi</Text>

						{/* 3 cột chỉ số */}
						<View style={styles.metricsRow}>
							<View style={styles.metricItem}>
								<Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>{totalBudget.toLocaleString()} đ</Text>
								<Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>Tổng ngân sách</Text>
							</View>
							<View style={styles.metricItem}>
								<Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>{totalSpent.toLocaleString()} đ</Text>
								<Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>Tổng đã chi</Text>
							</View>
							<View style={styles.metricItem}>
								<Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>{daysLeft} ngày</Text>
								<Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>Còn lại</Text>
							</View>
						</View>

						{/* CTA add common budget for this range */}
						{onStartCreate ? (
							<View style={styles.summaryCtaWrap}>
								<Button mode="contained" onPress={onStartCreate} style={styles.summaryCta}>
									Thêm ngân sách
								</Button>
							</View>
						) : null}
					</View>
				)}
				ListEmptyComponent={(
					<View style={styles.emptyWrap}>
						<Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Không có ngân sách hiệu lực trong khoảng thời gian này.</Text>
					</View>
				)}
				renderItem={({ item }) => {
					const category = categories.find(c => c.id === item.userCategoryId);
					return (
						<BudgetCard
							budget={item}
							category={category}
							onPress={() => onViewDetail ? onViewDetail(item.id) : onEdit(item)}
						/>
					);
				}}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	emptyWrap: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
	emptyText: { fontSize: 16 },
	summaryCardExtra: { alignItems: 'center', marginBottom: 12 },
	arcWrap: {
		width: 200,
		height: 104,
		justifyContent: 'center',
		alignItems: 'center',
	},
	arcCenterText: {
		position: 'absolute',
		top: 50,
		fontSize: 22,
		fontWeight: '700',
	},
	subtitle: { marginTop: 6, fontSize: 13, fontWeight: '500' },
	metricsRow: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-around',
		marginTop: 12,
		marginBottom: 8,
	},
	metricItem: { alignItems: 'center' },
	metricValue: { fontWeight: '700', fontSize: 14 },
	metricLabel: { fontSize: 12 },
	dot: {
		position: 'absolute',
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	summaryCtaWrap: { width: '100%', marginTop: 6 },
	summaryCta: { borderRadius: 10 },
});
