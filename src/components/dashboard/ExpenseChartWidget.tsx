// components/ExpenseChartWidget.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ExpenseChartWidgetProps {
	data: any[];
	currentExpense: number;
	previousExpense: number;
	dateRange: string;
}

const ExpenseChartWidget = ({ data, currentExpense, previousExpense, dateRange }: ExpenseChartWidgetProps) => {
	const theme = useAppTheme();

	return (
		<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
			<Card.Content>
				<View style={styles.header}>
					<MaterialCommunityIcons 
						name="chart-bar" 
						size={24} 
						color={theme.colors.primary} 
					/>
					<View style={styles.headerText}>
						<Text style={[styles.title, { color: theme.colors.onSurface }]}>
							So sánh chi tiêu
						</Text>
						<Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
							{dateRange}
						</Text>
					</View>
				</View>

				{data.length > 0 ? (
					<View style={styles.chartWrapper}>
						<BarChart
							data={data}
							width={SCREEN_WIDTH - 120}
							height={280}
							spacing={80}
							barWidth={60}
							barBorderRadius={10}
							noOfSections={5}
							maxValue={Math.max(currentExpense, previousExpense) * 1.2}
							yAxisThickness={1}
							xAxisThickness={1}
							yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
							xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 14, fontWeight: 'bold' }}
							showGradient={false}
							isAnimated
							animationDuration={800}
							backgroundColor={theme.colors.surface}
							rulesColor={theme.colors.outline}
							rulesType="solid"
						/>
					</View>
				) : (
					<View style={styles.emptyChart}>
						<View style={styles.emptyIconWrapper}>
							<MaterialCommunityIcons name="chart-bar" size={48} color={theme.colors.onSurfaceVariant} />
						</View>
						<Text style={[styles.emptyText, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>
							Hãy bắt đầu ghi chép!
						</Text>
						<Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
							Thêm giao dịch để xem biểu đồ chi tiêu
						</Text>
					</View>
				)}
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
		alignItems: 'center',
		marginBottom: 16,
		gap: 10,
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
	},
	chartWrapper: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 8,
		overflow: 'hidden',
	},
	emptyChart: {
		height: 200,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyIconWrapper: {
		opacity: 0.3,
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 15,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 13,
		textAlign: 'center',
	},
});

export default ExpenseChartWidget;

