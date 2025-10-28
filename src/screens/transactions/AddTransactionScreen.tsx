// screens/AddTransactionScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme';

export default function AddTransactionScreen() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, padding: theme.spacing(3), gap: theme.spacing(2) }}>
			<TextInput label="Số tiền" keyboardType="decimal-pad" />
			<TextInput label="Nội dung" />
			<Button mode="contained" style={{ borderRadius: theme.radius.pill }}>Thêm giao dịch</Button>
		</View>
	);
}
