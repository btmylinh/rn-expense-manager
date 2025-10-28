// screens/TransactionsScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../theme';

export default function TransactionsScreen() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, padding: theme.spacing(3), alignItems: 'center', justifyContent: 'center' }}>
			<Text style={[theme.semantic.typography.h3, { color: theme.colors.onSurface }]}>Chưa có giao dịch</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing(1) }]}>Nhấn "+" để thêm giao dịch đầu tiên</Text>
		</View>
	);
}
