// screens/tools/ToolsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ToolCardProps {
	icon: string;
	name: string;
	description: string;
	color: string;
	onPress: () => void;
}

const ToolCard = ({ icon, name, description, color, onPress }: ToolCardProps) => {
	const theme = useAppTheme();
	
	return (
		<Card style={[styles.toolCard, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
			<Card.Content style={styles.toolCardContent}>
				<View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
					<MaterialCommunityIcons 
						name={icon as any} 
						size={40} 
						color={color} 
					/>
				</View>
				<Text style={[styles.toolName, { color: theme.colors.onSurface }]}>
					{name}
				</Text>
				<Text style={[styles.toolDescription, { color: theme.colors.onSurfaceVariant }]}>
					{description}
				</Text>
			</Card.Content>
		</Card>
	);
};

export default function ToolsScreen() {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();

	const tools = [
		{
			id: 'budgets',
			icon: 'wallet-outline',
			name: 'Ngân sách',
			description: 'Quản lý chi tiêu theo kế hoạch',
			color: '#FF8A00',
			onPress: () => navigation.navigate('Budgets')
		},
		{
			id: 'savings',
			icon: 'target',
			name: 'Mục tiêu tiết kiệm',
			description: 'Tiết kiệm cho tương lai',
			color: '#4CAF50',
			onPress: () => navigation.navigate('SavingsGoals')
		},
		{
			id: 'recurring',
			icon: 'repeat',
			name: 'Chi tiêu định kỳ',
			description: 'Dự báo & nhắc nhở chi tiêu',
			color: '#F43F5E',
			onPress: () => navigation.navigate('RecurringExpenses')
		},
		{
			id: 'chatbot',
			icon: 'robot-happy-outline',
			name: 'Chatbot tài chính',
			description: 'Hỏi đáp & gợi ý chi tiêu',
			color: '#7C3AED',
			onPress: () => navigation.navigate('Chatbot')
		}
	];

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<AppBar title="Công cụ" />
			
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header Section */}
				<View style={styles.headerSection}>
					<Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
						Công cụ quản lý tài chính
					</Text>
					<Text style={[styles.headerDescription, { color: theme.colors.onSurfaceVariant }]}>
						Chọn công cụ phù hợp để quản lý tài chính hiệu quả
					</Text>
				</View>

				{/* Tools Grid */}
				<View style={styles.grid}>
					{tools.map((tool) => (
						<ToolCard
							key={tool.id}
							icon={tool.icon}
							name={tool.name}
							description={tool.description}
							color={tool.color}
							onPress={tool.onPress}
						/>
					))}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	headerSection: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
	},
	headerDescription: {
		fontSize: 16,
		lineHeight: 22,
	},
	grid: {
		padding: 16,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	toolCard: {
		width: '48%',
		marginBottom: 16,
		minHeight: 160,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	toolCardContent: {
		alignItems: 'center',
		paddingVertical: 20,
		paddingHorizontal: 12,
	},
	iconContainer: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12,
	},
	toolName: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 4,
	},
	toolDescription: {
		fontSize: 12,
		textAlign: 'center',
		lineHeight: 16,
	},
	comingSoonSection: {
		paddingHorizontal: 16,
		paddingVertical: 24,
		marginTop: 16,
	},
	comingSoonTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	comingSoonDescription: {
		fontSize: 14,
		lineHeight: 20,
	},
});