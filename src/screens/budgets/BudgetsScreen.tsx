// screens/BudgetsScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../theme';

export default function BudgetsScreen() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, padding: theme.spacing(3) }}>
			<Text style={[theme.semantic.typography.h2, { color: theme.colors.onSurface }]}>Ngân sách</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing(2) }]}>Sắp có quản lý ngân sách và cảnh báo.</Text>
		</View>
	);
}
