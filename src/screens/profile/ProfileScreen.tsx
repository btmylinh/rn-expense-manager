// screens/ProfileScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../theme';

export default function ProfileScreen() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, padding: theme.spacing(3) }}>
			<Text style={[theme.semantic.typography.h2, { color: theme.colors.onSurface }]}>Hồ sơ</Text>
			<Text style={[theme.semantic.typography.body, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing(2) }]}>Sắp có thông tin người dùng, cài đặt, bảo mật.</Text>
		</View>
	);
}
