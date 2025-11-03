// screens/DashboardScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../theme';

export default function DashboardScreen() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, padding: theme.spacing(3) }}>
			<Text style={[theme.semantic.typography.h2, { color: theme.colors.onSurface }]}>Tổng quan</Text>
			<View style={{ height: theme.spacing(3) }} />
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant }]}>Biểu đồ cột so sánh tổng chi tiêu tuần/tháng này với tuần/tháng trước</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant }]}>Biểu đồ tròn thống kê tổng chi tiêu theo danh mục</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant }]}>top 3 danh mục chi tiêu nhiều nhất</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant }]}>top 3 giao dịch gần đây</Text>
		</View>
	);
}
