// screens/ReportsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';

export default function ReportsScreen() {
	const theme = useAppTheme();
	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<AppBar title="Báo cáo" />
			
			<View style={styles.content}>
				<Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
					<Card.Content style={styles.emptyContent}>
						<View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
							<MaterialCommunityIcons 
								name="chart-box-outline" 
								size={64} 
								color={theme.colors.primary} 
							/>
						</View>
						
						<Text style={[styles.title, { color: theme.colors.onSurface }]}>
							Khám phá báo cáo chi tiết
						</Text>
						
						<Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
							Tính năng báo cáo chi tiết đang được phát triển. Bạn sẽ sớm có thể:
						</Text>
						
						<View style={styles.features}>
							<View style={styles.featureItem}>
								<MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.primary} />
								<Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
									Xem biểu đồ phân tích chi tiết
								</Text>
							</View>
							
							<View style={styles.featureItem}>
								<MaterialCommunityIcons name="file-export" size={24} color={theme.colors.primary} />
								<Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
									Xuất báo cáo ra file Excel/PDF
								</Text>
							</View>
							
							<View style={styles.featureItem}>
								<MaterialCommunityIcons name="calendar-month" size={24} color={theme.colors.primary} />
								<Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
									So sánh theo thời gian
								</Text>
							</View>
						</View>
						
						<Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
							Trong lúc chờ đợi, hãy thêm giao dịch để có dữ liệu phân tích!
						</Text>
					</Card.Content>
				</Card>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	emptyCard: {
		width: '100%',
		maxWidth: 500,
		elevation: 2,
		borderRadius: 16,
	},
	emptyContent: {
		alignItems: 'center',
		paddingVertical: 32,
	},
	iconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
	},
	description: {
		fontSize: 15,
		textAlign: 'center',
		marginBottom: 24,
		lineHeight: 22,
		paddingHorizontal: 16,
	},
	features: {
		width: '100%',
		marginBottom: 24,
		gap: 16,
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 16,
	},
	featureText: {
		fontSize: 15,
		flex: 1,
	},
	actionText: {
		fontSize: 14,
		textAlign: 'center',
		fontStyle: 'italic',
		paddingHorizontal: 16,
	},
});
