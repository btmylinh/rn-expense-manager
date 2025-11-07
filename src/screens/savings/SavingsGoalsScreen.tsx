// screens/savings/SavingsGoalsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Button, FAB, Menu, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { fakeApi } from '../../services/fakeApi';
import SavingsGoalCard from '../../components/SavingsGoalCard';
import AppBar from '../../components/AppBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SavingsGoalsScreen() {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();
	const { user } = useAuth();
	const userId = user?.id || 1;
	
	const [goals, setGoals] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [sortMenuVisible, setSortMenuVisible] = useState(false);
	const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'progress_high' | 'progress_low'>('newest');

	const loadGoals = async () => {
		try {
			const response = await fakeApi.getSavingsGoals(userId);
			if (response.success) {
				// Filter out cancelled goals
				const activeGoals = response.data.filter((goal: any) => goal.status !== 'cancelled');
				setGoals(activeGoals);
			}
		} catch (error) {
			console.error('Error loading savings goals:', error);
		} finally {
			setLoading(false);
		}
	};

	// Sort goals (show all goals, no filtering)
	const getSortedGoals = () => {
		let sortedGoals = [...goals];

		// Apply sort
		switch (sortBy) {
			case 'newest':
				sortedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				break;
			case 'deadline':
				sortedGoals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
				break;
			case 'progress_high':
				sortedGoals.sort((a, b) => (b.progress || 0) - (a.progress || 0));
				break;
			case 'progress_low':
				sortedGoals.sort((a, b) => (a.progress || 0) - (b.progress || 0));
				break;
		}

		return sortedGoals;
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadGoals();
		setRefreshing(false);
	};

	const handleGoalPress = (goalId: number) => {
		navigation.navigate('SavingsGoalDetail', { goalId });
	};

	const handleAddMoney = async (goalId: number, amount: number, note?: string, walletId?: number | null): Promise<boolean> => {
		try {
		// If walletId is provided, create transaction to deduct from wallet
		if (walletId) {
			try {
				await fakeApi.createTransaction(userId, {
					walletId,
					userCategoryId: 1, // "Tiết kiệm" category
					amount: amount,
					transactionDate: new Date().toISOString().split('T')[0],
					content: `Tiết kiệm cho mục tiêu`,
					type: 0, // Expense type
				});
			} catch (transactionError) {
				console.error('Error creating transaction:', transactionError);
				return false;
			}
		}

			const response = await fakeApi.addContribution(userId, goalId, amount, note);
			if (response.success) {
				await loadGoals(); // Refresh the list
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error adding contribution:', error);
			return false;
		}
	};

	const handleCreateGoal = () => {
		navigation.navigate('SavingsGoalCreate', {});
	};

	const handleEditGoal = (goalId: number) => {
		navigation.navigate('SavingsGoalCreate', { goalId });
	};

	// Load goals when component mounts
	useEffect(() => {
		loadGoals();
	}, []);

	// Refresh goals when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			loadGoals();
		}, [])
	);

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<AppBar title="Mục tiêu tiết kiệm" onBack={() => navigation.goBack()} />
				<View style={styles.centerContent}>
					<Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
						Đang tải...
					</Text>
				</View>
			</View>
		);
	}

	const sortedGoals = getSortedGoals();
	const getSortLabel = () => {
		switch (sortBy) {
			case 'newest': return 'Mới nhất';
			case 'deadline': return 'Sắp đến hạn';
			case 'progress_high': return 'Tiến độ cao';
			case 'progress_low': return 'Tiến độ thấp';
		}
	};

	// Get empty state content
	const getEmptyStateContent = () => {
		return {
			icon: 'target',
			title: 'Chưa có mục tiêu tiết kiệm',
			description: 'Tạo mục tiêu tiết kiệm để theo dõi tiến độ và đạt được những điều bạn mong muốn.',
			buttonText: 'Tạo mục tiêu đầu tiên',
			onButtonPress: handleCreateGoal
		};
	};

	if (sortedGoals.length === 0) {
		const emptyState = getEmptyStateContent();
		
		return (
			<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<AppBar title="Mục tiêu tiết kiệm" onBack={() => navigation.goBack()} />
				

				<ScrollView
					contentContainerStyle={styles.emptyContainer}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
				>
					<Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
						<Card.Content style={styles.emptyContent}>
							<View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
								<MaterialCommunityIcons
									name={emptyState.icon as any}
									size={64}
									color={theme.colors.primary}
								/>
							</View>

							<Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
								{emptyState.title}
							</Text>

							<Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
								{emptyState.description}
							</Text>

						<View style={styles.emptyFeatures}>
							<View style={styles.emptyFeatureItem}>
								<MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.primary} />
								<Text style={[styles.emptyFeatureText, { color: theme.colors.onSurface }]}>
									Theo dõi tiến độ trực quan
								</Text>
							</View>

							<View style={styles.emptyFeatureItem}>
								<MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.primary} />
								<Text style={[styles.emptyFeatureText, { color: theme.colors.onSurface }]}>
									Đặt deadline và nhắc nhở
								</Text>
							</View>

							<View style={styles.emptyFeatureItem}>
								<MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
								<Text style={[styles.emptyFeatureText, { color: theme.colors.onSurface }]}>
									Nhận thông báo khi hoàn thành
								</Text>
							</View>
						</View>

						<Button
							mode="contained"
							icon="plus"
							onPress={emptyState.onButtonPress}
							style={styles.emptyButton}
						>
							{emptyState.buttonText}
						</Button>
						</Card.Content>
					</Card>
				</ScrollView>

			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				onPress={handleCreateGoal}
			/>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<AppBar title="Mục tiêu tiết kiệm" onBack={() => navigation.goBack()} />
			
		{/* Sort Options */}
		<View style={styles.filtersContainer}>
			<Menu
				visible={sortMenuVisible}
				onDismiss={() => setSortMenuVisible(false)}
				anchor={
					<Chip
						icon="sort"
						onPress={() => setSortMenuVisible(true)}
						style={styles.sortChip}
					>
						{getSortLabel()}
					</Chip>
				}
			>
				<Menu.Item
					onPress={() => {
						setSortBy('newest');
						setSortMenuVisible(false);
					}}
					title="Mới nhất"
					leadingIcon="clock"
				/>
				<Menu.Item
					onPress={() => {
						setSortBy('deadline');
						setSortMenuVisible(false);
					}}
					title="Sắp đến hạn"
					leadingIcon="calendar-alert"
				/>
				<Menu.Item
					onPress={() => {
						setSortBy('progress_high');
						setSortMenuVisible(false);
					}}
					title="Tiến độ cao nhất"
					leadingIcon="trending-up"
				/>
				<Menu.Item
					onPress={() => {
						setSortBy('progress_low');
						setSortMenuVisible(false);
					}}
					title="Tiến độ thấp nhất"
					leadingIcon="trending-down"
				/>
			</Menu>
		</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{sortedGoals.map((goal) => (
					<SavingsGoalCard
						key={goal.id}
						goal={goal}
						onPress={() => handleGoalPress(goal.id)}
						onAddMoney={(amount, note, walletId) => handleAddMoney(goal.id, amount, note, walletId)}
						onEdit={() => handleEditGoal(goal.id)}
					/>
				))}
			</ScrollView>

			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				onPress={handleCreateGoal}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	filtersContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
	},
	sortChip: {
		alignSelf: 'flex-start',
	},
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		marginTop: 20,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingBottom: 80, // Space for FAB
	},
	fab: {
		position: 'absolute',
		margin: 16,
		right: 0,
		bottom: 0,
	},
	
	// Empty State Styles
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	emptyCard: {
		width: '100%',
		maxWidth: 400,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	emptyContent: {
		alignItems: 'center',
		paddingVertical: 32,
		paddingHorizontal: 24,
	},
	emptyIconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 12,
	},
	emptyDescription: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	emptyFeatures: {
		width: '100%',
		marginBottom: 32,
	},
	emptyFeatureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	emptyFeatureText: {
		fontSize: 14,
		marginLeft: 12,
		flex: 1,
	},
	emptyButton: {
		paddingHorizontal: 24,
	},
});