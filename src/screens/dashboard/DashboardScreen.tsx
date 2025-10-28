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
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant }]}>Sắp có charts và thẻ thống kê…</Text>
		</View>
	);
}
