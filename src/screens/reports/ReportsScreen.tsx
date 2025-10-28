// screens/ReportsScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../theme';

export default function ReportsScreen() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, padding: theme.spacing(3) }}>
			<Text style={[theme.semantic.typography.h2, { color: theme.colors.onSurface }]}>Báo cáo</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing(2) }]}>Sắp có biểu đồ và báo cáo xuất file.</Text>
		</View>
	);
}
