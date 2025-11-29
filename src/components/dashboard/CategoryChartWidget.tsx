// components/CategoryChartWidget.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme, getIconColor } from '../../theme';
import { formatCurrency } from '../../utils/format';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CategoryChartWidgetProps {
	data: any[];
	totalAmount: number;
}

const CategoryChartWidget = ({ data, totalAmount }: CategoryChartWidgetProps) => {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();

	return (
		<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
			<Card.Content>
				<TouchableOpacity 
					onPress={() => {
						// Navigate to Tabs with Reports tab if available
						// For now, just navigate to Tabs
						navigation.navigate('Tabs');
					}}
					style={[styles.header, { borderBottomColor: theme.colors.outline + '30' }]}
				>
					<View style={styles.headerLeft}>
						<MaterialCommunityIcons 
							name="chart-pie" 
							size={24} 
							color={theme.colors.primary} 
						/>
						<Text style={[styles.title, { color: theme.colors.onSurface }]}>
							Chi tiêu theo danh mục
						</Text>
					</View>
					<MaterialCommunityIcons 
						name="chevron-right" 
						size={24} 
						color={theme.colors.onSurfaceVariant} 
					/>
				</TouchableOpacity>

				{data.length > 0 ? (
					<View style={styles.pieChartContainer}>
						<PieChart
							data={data}
							radius={100}
							innerRadius={50}
							innerCircleColor={theme.colors.surface}
							centerLabelComponent={() => {
								return (
									<View style={styles.centerLabel}>
										<Text style={[styles.centerLabelText, { color: theme.colors.onSurface }]}>
											{formatCurrency(totalAmount)}
										</Text>
										<Text style={[styles.centerLabelSubtext, { color: theme.colors.onSurfaceVariant }]}>
											Tổng chi
										</Text>
									</View>
								);
							}}
						/>
						<View style={styles.pieChartLegend}>
							{/* Chia legend thành 2-3 cột tùy số lượng */}
							{(() => {
								const itemsPerColumn = data.length > 10 ? Math.ceil(data.length / 3) : Math.ceil(data.length / 2);
								const columns: any[][] = [];
								for (let i = 0; i < data.length; i += itemsPerColumn) {
									columns.push(data.slice(i, i + itemsPerColumn));
								}
								
								return (
									<View style={styles.legendColumns}>
										{columns.map((column, colIndex) => (
											<View key={colIndex} style={styles.legendColumn}>
												{column.map((item, index) => {
													return (
														<View key={item.category.id || `item-${colIndex}-${index}`} style={styles.legendItem}>
															<MaterialCommunityIcons
																name={(item.category.icon as any) || 'tag-outline'}
																size={16}
																color={getIconColor(item.category.icon, theme)}
																style={styles.legendIcon}
															/>
															<View style={styles.legendTextContainer}>
																<Text style={[styles.legendText, { color: theme.colors.onSurface }]} numberOfLines={1}>
																	{item.category.name}
																</Text>
																<Text style={[styles.legendAmount, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
																	{item.text}
																</Text>
															</View>
														</View>
													);
												})}
											</View>
										))}
									</View>
								);
							})()}
						</View>
					</View>
				) : (
					<View style={styles.emptyChart}>
						<View style={styles.emptyIconWrapper}>
							<MaterialCommunityIcons name="chart-donut" size={48} color={theme.colors.onSurfaceVariant} />
						</View>
						<Text style={[styles.emptyText, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>
							Khám phá chi tiêu của bạn
						</Text>
						<Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
							Ghi chép để phân tích theo danh mục
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
	pieChartContainer: {
		alignItems: 'center',
		marginTop: 16,
	},
	centerLabel: {
		alignItems: 'center',
	},
	centerLabelText: {
		fontSize: 16,
		fontWeight: '700',
	},
	centerLabelSubtext: {
		fontSize: 12,
	},
	pieChartLegend: {
		marginTop: 16,
		width: '100%',
	},
	legendColumns: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		flexWrap: 'wrap',
	},
	legendColumn: {
		flex: 1,
		minWidth: '45%',
		marginBottom: 8,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		paddingRight: 8,
	},
	legendIcon: {
		marginRight: 8,
	},
	legendTextContainer: {
		flex: 1,
	},
	legendText: {
		fontSize: 12,
		marginBottom: 2,
	},
	legendAmount: {
		fontSize: 11,
		fontWeight: '600',
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

export default CategoryChartWidget;

