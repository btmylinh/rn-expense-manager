// screens/savings/SavingsGoalDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Button, FAB, Portal, Modal, TextInput, Snackbar, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { fakeApi } from '../../services/fakeApi';
import AppBar from '../../components/AppBar';

type SavingsGoalDetailRouteProp = RouteProp<RootStackParamList, 'SavingsGoalDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SavingsGoalDetailScreen() {
	const theme = useAppTheme();
	const route = useRoute<SavingsGoalDetailRouteProp>();
	const navigation = useNavigation<NavigationProp>();
	const { user } = useAuth();
	const userId = user?.id || 1;
	const { goalId } = route.params;

	// State
	const [goal, setGoal] = useState<any>(null);
	const [contributions, setContributions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
	const [celebrationModalVisible, setCelebrationModalVisible] = useState(false);
	const [addAmount, setAddAmount] = useState('');
	const [addNote, setAddNote] = useState('');
	const [addingMoney, setAddingMoney] = useState(false);
	const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
	const [wallets, setWallets] = useState<any[]>([]);
	const [showWalletDropdown, setShowWalletDropdown] = useState(false);
	const [snackMessage, setSnackMessage] = useState('');

	// Load goal details
	const loadGoalDetail = async () => {
		try {
			setLoading(true);
			const response = await fakeApi.getSavingsGoalDetail(userId, goalId);
			if (response.success && response.data) {
				setGoal(response.data);
				setContributions(response.data.contributions || []);
			} else {
				setSnackMessage('Không thể tải thông tin mục tiêu');
			}
		} catch (error) {
			console.error('Error loading goal detail:', error);
			setSnackMessage('Có lỗi xảy ra khi tải dữ liệu');
		} finally {
			setLoading(false);
		}
	};

	// Load wallets
	const loadWallets = async () => {
		try {
			const walletList = await fakeApi.getWallets(userId);
			if (walletList && walletList.length > 0) {
				setWallets(walletList);
				// Set default wallet as selected
				const defaultWallet = walletList.find(w => w.is_default);
				if (defaultWallet) {
					setSelectedWalletId(defaultWallet.id);
				}
			}
		} catch (error) {
			console.error('Error loading wallets:', error);
		}
	};

	useEffect(() => {
		loadGoalDetail();
		loadWallets();
	}, [goalId, userId]);

	// Calculate progress and predictions
	const getProgressInfo = () => {
		if (!goal) return null;

		const progress = (goal.currentAmount / goal.targetAmount) * 100;
		const remaining = goal.targetAmount - goal.currentAmount;
		
		// Calculate days
		const today = new Date();
		const deadlineDate = new Date(goal.deadline);
		const totalDays = Math.ceil((deadlineDate.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
		const remainingDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		const elapsedDays = totalDays - remainingDays;
		
		// Calculate expected progress
		const expectedProgress = elapsedDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
		const progressDifference = progress - expectedProgress;
		
		// Predict completion date based on current rate
		let predictionText = '';
		let predictionIcon = 'trending-up';
		let predictionColor = '#22c55e';
		
		if (goal.status === 'completed') {
			predictionText = ' Chúc mừng! Bạn đã đạt mục tiêu!';
			predictionIcon = 'trophy';
			predictionColor = '#22c55e';
		} else if (remainingDays < 0) {
			const overdueDays = Math.abs(remainingDays);
			predictionText = `Mục tiêu đã quá hạn ${overdueDays} ngày. Bạn có muốn gia hạn deadline?`;
			predictionIcon = 'alert-circle';
			predictionColor = '#ef4444';
		} else if (remainingDays <= 7 && progress < 90) {
			const dailyNeeded = remaining / Math.max(remainingDays, 1);
			predictionText = `Chỉ còn ${remainingDays} ngày! Cần thêm ${formatAmount(dailyNeeded)}${currencySymbol}/ngày để kịp deadline`;
			predictionIcon = 'clock-alert';
			predictionColor = '#f59e0b';
		} else if (contributions.length > 0 && progress > 0) {
			const avgDailyContribution = goal.currentAmount / Math.max(elapsedDays, 1);
			const daysToComplete = remaining / Math.max(avgDailyContribution, 1);
			const predictedDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
			
			if (predictedDate <= deadlineDate) {
				predictionText = `Với tiến độ hiện tại, bạn sẽ đạt mục tiêu vào ${predictedDate.toLocaleDateString('vi-VN')}`;
				predictionIcon = 'trending-up';
				predictionColor = '#22c55e';
			} else {
				const delayDays = Math.ceil((predictedDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 1000));
				predictionText = `Cần tăng tốc! Hiện tại chậm hơn kế hoạch ${delayDays} ngày`;
				predictionIcon = 'alert-circle';
				predictionColor = '#f59e0b';
			}
		}

		return {
			progress: Math.min(progress, 100),
			remaining,
			remainingDays,
			progressDifference,
			predictionText,
			predictionIcon,
			predictionColor,
			isOnTrack: progressDifference >= -5 // Within 5% tolerance
		};
	};

	// Handle add money
	const handleAddMoney = async () => {
		const amount = parseFloat(addAmount.replace(/[^0-9]/g, ''));
		if (!amount || amount <= 0) {
			setSnackMessage('Vui lòng nhập số tiền hợp lệ');
			return;
		}

		try {
			setAddingMoney(true);
			
			// Create note with wallet info
			let finalNote = addNote.trim();
			const selectedWallet = wallets.find(w => w.id === selectedWalletId);
			
			if (!selectedWalletId) {
				finalNote = finalNote 
					? `${finalNote} (Không trừ ví)` 
					: 'Không trừ ví';
			} else if (selectedWallet) {
				finalNote = finalNote 
					? `${finalNote} (Từ ${selectedWallet.name})` 
					: `Từ ${selectedWallet.name}`;
			}
			
			const response = await fakeApi.addContribution(userId, goalId, amount, finalNote || undefined);
			
			// If wallet is selected, create a savings transaction
			if (selectedWalletId && response.success) {
				try {
					// Create savings transaction (category id = 1 for savings)
					await fakeApi.createTransaction(userId, {
						walletId: selectedWalletId,
						userCategoryId: 1, // Savings category
						amount: amount,
						transactionDate: new Date().toISOString().split('T')[0],
						content: `Tiết kiệm cho mục tiêu: ${goal.name}`,
						type: 0, // Expense type
					});
				} catch (transactionError) {
					console.error('Error creating transaction:', transactionError);
					// Continue even if transaction creation fails
				}
			}
			
		if (response.success && response.data) {
			setAddAmount('');
			setAddNote('');
			// Keep selected wallet for next time
			setAddMoneyModalVisible(false);
			
			// Success message based on wallet selection
			let successMessage;
			if (!selectedWalletId) {
				successMessage = 'Đã ghi nhận tiền vào mục tiêu thành công!';
			} else {
				const walletName = selectedWallet?.name || 'ví';
				successMessage = `Đã thêm tiền và trừ từ ${walletName} thành công!`;
			}
			
			// Check if goal is completed
			if (response.data.goal.progress >= 100) {
				setCelebrationModalVisible(true);
			} else {
				setSnackMessage(successMessage);
			}
			
			// Reload data
			await loadGoalDetail();
		} else {
			setSnackMessage('Có lỗi xảy ra');
		}
		} catch (error) {
			console.error('Error adding contribution:', error);
			setSnackMessage('Có lỗi xảy ra khi thêm tiền');
		} finally {
			setAddingMoney(false);
		}
	};

	// Handle delete goal
	const handleDeleteGoal = () => {
		Alert.alert(
			'Xóa mục tiêu',
			'Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác.',
			[
				{ text: 'Hủy', style: 'cancel' },
				{
					text: 'Xóa',
					style: 'destructive',
					onPress: async () => {
						try {
							const response = await fakeApi.deleteSavingsGoal(userId, goalId);
							if (response.success) {
								setSnackMessage('Đã xóa mục tiêu');
								navigation.goBack();
							} else {
								setSnackMessage(response.message || 'Có lỗi xảy ra');
							}
						} catch (error) {
							setSnackMessage('Có lỗi xảy ra khi xóa mục tiêu');
						}
					}
				}
			]
		);
	};

	// Currency helpers
	const currency = goal?.currency || 'VND';
	const currencySymbol = currency === 'USD' ? '$' : 'đ';
	
	const formatAmount = (amount: number) => {
		if (currency === 'USD') {
			return amount.toLocaleString('en-US');
		} else {
			return amount.toLocaleString('vi-VN');
		}
	};
	
	// Format currency
	const formatCurrency = (amount: number) => {
		return formatAmount(amount) + ' ' + currencySymbol;
	};

	// Format date
	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('vi-VN');
	};

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<AppBar title="Chi tiết mục tiêu" onBack={() => navigation.goBack()} />
				<View style={styles.loadingContainer}>
					<Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
						Đang tải...
					</Text>
				</View>
			</View>
		);
	}

	if (!goal) {
		return (
			<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<AppBar title="Chi tiết mục tiêu" onBack={() => navigation.goBack()} />
				<View style={styles.loadingContainer}>
					<Text style={[styles.errorText, { color: theme.colors.error }]}>
						Không tìm thấy mục tiêu
					</Text>
				</View>
			</View>
		);
	}

	const progressInfo = getProgressInfo();

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<AppBar 
				title={goal.name} 
				onBack={() => navigation.goBack()} 
				rightIcons={[
					{
						name: 'pencil',
						onPress: () => navigation.navigate('SavingsGoalCreate', { goalId }),
					},
					{
						name: 'delete',
						onPress: handleDeleteGoal,
						iconColor: theme.colors.error
					}
				]}
			/>
			
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				{/* Header Section */}
				<Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
					<Card.Content style={styles.headerContent}>
						<View style={[styles.iconContainer, { backgroundColor: goal.color + '22' }]}>
							<MaterialCommunityIcons
								name={goal.icon}
								size={48}
								color={goal.color}
							/>
						</View>
						
						<Text style={[styles.goalName, { color: theme.colors.onSurface }]}>
							{goal.name}
						</Text>
						
						{/* Progress Circle */}
						<View style={styles.progressContainer}>
							<View style={[styles.progressCircle, { borderColor: goal.color + '33' }]}>
								<View style={[
									styles.progressFill,
									{
										backgroundColor: goal.color,
										height: `${Math.min(progressInfo?.progress || 0, 100)}%`
									}
								]} />
								<View style={styles.progressTextContainer}>
									<Text style={[styles.progressPercent, { color: goal.color }]}>
										{Math.round(progressInfo?.progress || 0)}%
									</Text>
								</View>
							</View>
						</View>
						
						<Text style={[styles.amountText, { color: theme.colors.onSurface }]}>
							{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
						</Text>
					</Card.Content>
				</Card>

				{/* Stats Cards */}
				<View style={styles.statsContainer}>
					<Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
						<Card.Content style={styles.statContent}>
							<MaterialCommunityIcons name="cash-minus" size={24} color={theme.colors.primary} />
							<Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
								{formatCurrency(progressInfo?.remaining || 0)}
							</Text>
							<Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
								Còn thiếu
							</Text>
						</Card.Content>
					</Card>
					
					<Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
						<Card.Content style={styles.statContent}>
							<MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.primary} />
							<Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
								{Math.round(progressInfo?.progress || 0)}%
							</Text>
							<Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
								Tiến độ
							</Text>
						</Card.Content>
					</Card>
					
					<Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
						<Card.Content style={styles.statContent}>
							<MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} />
							<Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
								{Math.max(progressInfo?.remainingDays || 0, 0)}
							</Text>
							<Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
								Ngày còn lại
							</Text>
						</Card.Content>
					</Card>
				</View>

				{/* Prediction */}
				{progressInfo?.predictionText && (
					<Card style={[styles.predictionCard, { backgroundColor: theme.colors.surface }]}>
						<Card.Content style={styles.predictionContent}>
							<MaterialCommunityIcons
								name={progressInfo.predictionIcon as any}
								size={24}
								color={progressInfo.predictionColor}
							/>
							<Text style={[
								styles.predictionText,
								{
									color: progressInfo.predictionColor
								}
							]}>
								{progressInfo.predictionText}
							</Text>
						</Card.Content>
					</Card>
				)}

				{/* Contributions History */}
				<Card style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
							Lịch sử đóng góp
						</Text>
						
						{contributions.length === 0 ? (
							<View style={styles.emptyHistory}>
								<MaterialCommunityIcons
									name="piggy-bank-outline"
									size={48}
									color={theme.colors.onSurfaceVariant}
								/>
								<Text style={[styles.emptyHistoryText, { color: theme.colors.onSurfaceVariant }]}>
									Chưa có đóng góp nào
								</Text>
								<Text style={[styles.emptyHistorySubtext, { color: theme.colors.onSurfaceVariant }]}>
									Bắt đầu thêm tiền vào mục tiêu nhé!
								</Text>
							</View>
						) : (
							contributions.map((contribution, index) => (
								<View key={contribution.id} style={[
									styles.contributionItem,
									{ borderBottomColor: theme.colors.outline }
								]}>
									<View style={styles.contributionHeader}>
										<Text style={[styles.contributionDate, { color: theme.colors.onSurfaceVariant }]}>
											{formatDate(contribution.createdAt)}
										</Text>
										<Text style={[styles.contributionAmount, { color: goal.color }]}>
											+{formatCurrency(contribution.amount)}
										</Text>
									</View>
									{contribution.note && (
										<Text style={[styles.contributionNote, { color: theme.colors.onSurface }]}>
											{contribution.note}
										</Text>
									)}
								</View>
							))
						)}
					</Card.Content>
				</Card>
			</ScrollView>

		{/* Main Action Button */}
		<View style={[styles.actionContainer, { backgroundColor: theme.colors.background }]}>
			{goal.status === 'active' ? (
				<Button
					mode="contained"
					onPress={() => setAddMoneyModalVisible(true)}
					style={[styles.addMoneyButton, { backgroundColor: goal.color }]}
					contentStyle={styles.addMoneyButtonContent}
					icon="plus"
				>
					Thêm tiền
				</Button>
			) : goal.status === 'completed' ? (
				<Button
					mode="contained"
					onPress={() => setAddMoneyModalVisible(true)}
					style={[styles.addMoneyButton, { backgroundColor: goal.color }]}
					contentStyle={styles.addMoneyButtonContent}
					icon="piggy-bank"
				>
					Tiếp tục tiết kiệm
				</Button>
			) : null}
		</View>

			{/* Add Money Modal */}
			<Portal>
				<Modal
					visible={addMoneyModalVisible}
					onDismiss={() => setAddMoneyModalVisible(false)}
					contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
				>
					<Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
						Thêm tiền vào mục tiêu
					</Text>
					
					<TextInput
						label="Số tiền thêm vào *"
						value={addAmount}
						onChangeText={(value) => {
							const cleanValue = value.replace(/[^0-9]/g, '');
							const formattedValue = cleanValue ? parseFloat(cleanValue).toLocaleString() : '';
							setAddAmount(formattedValue);
						}}
						mode="outlined"
						style={styles.modalInput}
						keyboardType="numeric"
						right={<TextInput.Affix text={currencySymbol} />}
					/>
					
					<TextInput
						label="Ghi chú (tùy chọn)"
						value={addNote}
						onChangeText={setAddNote}
						mode="outlined"
						style={styles.modalInput}
					multiline
					numberOfLines={3}
					placeholder="VD: Tiền lương tháng 11, Tiền thưởng..."
				/>
				
				{/* Wallet Selection */}
				<View style={styles.walletSection}>
					<Text style={[styles.walletSectionTitle, { color: theme.colors.onSurface }]}>
						Chọn ví để trừ tiền
					</Text>
					<TouchableOpacity
						style={[styles.walletSelector, { 
							backgroundColor: theme.colors.surfaceVariant,
							borderColor: theme.colors.outline 
						}]}
						onPress={() => setShowWalletDropdown(true)}
					>
						<MaterialCommunityIcons 
							name={selectedWalletId ? "wallet" : "wallet-outline"} 
							size={20} 
							color={theme.colors.onSurfaceVariant} 
						/>
						<Text style={[styles.walletSelectorText, { color: theme.colors.onSurfaceVariant }]}>
							{selectedWalletId 
								? wallets.find(w => w.id === selectedWalletId)?.name || 'Chọn ví'
								: 'Không trừ ví'
							}
						</Text>
						<MaterialCommunityIcons 
							name="chevron-down" 
							size={20} 
							color={theme.colors.onSurfaceVariant} 
						/>
					</TouchableOpacity>
				</View>
				
				<View style={styles.modalActions}>
						<Button
							mode="outlined"
							onPress={() => setAddMoneyModalVisible(false)}
							style={styles.modalCancelButton}
						>
							Hủy
						</Button>
						
						<Button
							mode="contained"
							onPress={handleAddMoney}
							loading={addingMoney}
							disabled={addingMoney || !addAmount}
							style={[styles.modalSubmitButton, { backgroundColor: goal.color }]}
						>
							Thêm
						</Button>
					</View>
				</Modal>
			</Portal>

			{/* Celebration Modal */}
			<Portal>
				<Modal
					visible={celebrationModalVisible}
					onDismiss={() => setCelebrationModalVisible(false)}
					contentContainerStyle={[styles.celebrationModal, { backgroundColor: theme.colors.surface }]}
				>
					<View style={styles.celebrationContent}>
						<MaterialCommunityIcons
							name="trophy"
							size={80}
							color="#FFD700"
						/>
						<Text style={[styles.celebrationTitle, { color: theme.colors.onSurface }]}>
							 Chúc mừng! 
						</Text>
						<Text style={[styles.celebrationText, { color: theme.colors.onSurface }]}>
							Bạn đã hoàn thành mục tiêu "{goal.name}"!
						</Text>
						<Text style={[styles.celebrationAmount, { color: goal.color }]}>
							{formatCurrency(goal.targetAmount)}
						</Text>
						
						<Button
							mode="contained"
							onPress={() => {
								setCelebrationModalVisible(false);
								navigation.goBack();
							}}
							style={[styles.celebrationButton, { backgroundColor: goal.color }]}
						>
							Tuyệt vời!
						</Button>
					</View>
				</Modal>
			</Portal>

		{/* Wallet Dropdown Modal */}
		<Portal>
			<Modal
				visible={showWalletDropdown}
				onDismiss={() => setShowWalletDropdown(false)}
				contentContainerStyle={[styles.dropdownModal, { backgroundColor: theme.colors.surface }]}
			>
				<Text style={[styles.dropdownTitle, { color: theme.colors.onSurface }]}>
					Chọn ví để trừ tiền
				</Text>
				
				<ScrollView style={styles.dropdownList}>
					{/* No wallet option */}
					<TouchableOpacity
						style={[styles.dropdownItem, { 
							backgroundColor: selectedWalletId === null ? theme.colors.primaryContainer : 'transparent' 
						}]}
						onPress={() => {
							setSelectedWalletId(null);
							setShowWalletDropdown(false);
						}}
					>
						<MaterialCommunityIcons 
							name="wallet-outline" 
							size={24} 
							color={selectedWalletId === null ? theme.colors.primary : theme.colors.onSurfaceVariant} 
						/>
						<View style={styles.dropdownItemText}>
							<Text style={[styles.dropdownItemTitle, { 
								color: selectedWalletId === null ? theme.colors.primary : theme.colors.onSurface 
							}]}>
								Không trừ ví
							</Text>
							<Text style={[styles.dropdownItemSubtitle, { 
								color: selectedWalletId === null ? theme.colors.primary : theme.colors.onSurfaceVariant 
							}]}>
								Chỉ ghi nhận vào mục tiêu
							</Text>
						</View>
						{selectedWalletId === null && (
							<MaterialCommunityIcons 
								name="check" 
								size={20} 
								color={theme.colors.primary} 
							/>
						)}
					</TouchableOpacity>

					{/* Wallet options */}
					{wallets.map((wallet) => (
						<TouchableOpacity
							key={wallet.id}
							style={[styles.dropdownItem, { 
								backgroundColor: selectedWalletId === wallet.id ? theme.colors.primaryContainer : 'transparent' 
							}]}
							onPress={() => {
								setSelectedWalletId(wallet.id);
								setShowWalletDropdown(false);
							}}
						>
							<MaterialCommunityIcons 
								name="wallet" 
								size={24} 
								color={selectedWalletId === wallet.id ? theme.colors.primary : theme.colors.onSurfaceVariant} 
							/>
							<View style={styles.dropdownItemText}>
								<Text style={[styles.dropdownItemTitle, { 
									color: selectedWalletId === wallet.id ? theme.colors.primary : theme.colors.onSurface 
								}]}>
									{wallet.name}
								</Text>
								<Text style={[styles.dropdownItemSubtitle, { 
									color: selectedWalletId === wallet.id ? theme.colors.primary : theme.colors.onSurfaceVariant 
								}]}>
									{wallet.amount.toLocaleString()} {wallet.currency}
								</Text>
							</View>
							{selectedWalletId === wallet.id && (
								<MaterialCommunityIcons 
									name="check" 
									size={20} 
									color={theme.colors.primary} 
								/>
							)}
						</TouchableOpacity>
					))}
				</ScrollView>
			</Modal>
		</Portal>

		<Snackbar
			visible={!!snackMessage}
			onDismiss={() => setSnackMessage('')}
			duration={3000}
		>
			{snackMessage}
		</Snackbar>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
	},
	errorText: {
		fontSize: 16,
		textAlign: 'center',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 120,
	},
	
	// Header Section
	headerCard: {
		marginBottom: 16,
		borderRadius: 16,
	},
	headerContent: {
		alignItems: 'center',
		paddingVertical: 24,
	},
	iconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	goalName: {
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 20,
	},
	progressContainer: {
		marginBottom: 16,
	},
	progressCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 8,
		position: 'relative',
		overflow: 'hidden',
		backgroundColor: '#f3f4f6',
	},
	progressFill: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		borderRadius: 60,
	},
	progressTextContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	progressPercent: {
		fontSize: 24,
		fontWeight: '700',
	},
	amountText: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
	},
	
	// Stats Section
	statsContainer: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 16,
	},
	statCard: {
		flex: 1,
		borderRadius: 12,
	},
	statContent: {
		alignItems: 'center',
		paddingVertical: 16,
	},
	statValue: {
		fontSize: 18,
		fontWeight: '700',
		marginTop: 8,
		marginBottom: 4,
		textAlign: 'center',
	},
	statLabel: {
		fontSize: 12,
		textAlign: 'center',
	},
	
	// Prediction Section
	predictionCard: {
		marginBottom: 16,
		borderRadius: 12,
	},
	predictionContent: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	predictionText: {
		fontSize: 14,
		fontWeight: '500',
		marginLeft: 12,
		flex: 1,
	},
	
	// History Section
	historyCard: {
		borderRadius: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	emptyHistory: {
		alignItems: 'center',
		paddingVertical: 32,
	},
	emptyHistoryText: {
		fontSize: 16,
		marginTop: 12,
		fontWeight: '600',
	},
	emptyHistorySubtext: {
		fontSize: 14,
		marginTop: 4,
		textAlign: 'center',
	},
	contributionItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	contributionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	contributionDate: {
		fontSize: 14,
	},
	contributionAmount: {
		fontSize: 16,
		fontWeight: '600',
	},
	contributionNote: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	
	// Action Buttons
	actionContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		paddingBottom: 32,
	},
	addMoneyButton: {
		borderRadius: 24,
	},
	addMoneyButtonContent: {
		paddingVertical: 8,
	},
	
	// Modal Styles
	modalContainer: {
		margin: 20,
		padding: 24,
		borderRadius: 16,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 20,
		textAlign: 'center',
	},
	modalInput: {
		marginBottom: 16,
	},
	walletSection: {
		marginBottom: 16,
	},
	walletSectionTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 8,
	},
	walletSelector: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	walletSelectorText: {
		fontSize: 14,
		fontWeight: '500',
		marginHorizontal: 8,
		flex: 1,
	},
	dropdownModal: {
		margin: 20,
		borderRadius: 12,
		padding: 20,
		maxHeight: '70%',
	},
	dropdownTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
		textAlign: 'center',
	},
	dropdownList: {
		maxHeight: 300,
	},
	dropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginBottom: 4,
	},
	dropdownItemText: {
		flex: 1,
		marginLeft: 12,
	},
	dropdownItemTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 2,
	},
	dropdownItemSubtitle: {
		fontSize: 12,
		opacity: 0.7,
	},
	modalActions: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	modalCancelButton: {
		flex: 1,
	},
	modalSubmitButton: {
		flex: 1,
	},
	
	// Celebration Modal
	celebrationModal: {
		margin: 20,
		padding: 32,
		borderRadius: 20,
	},
	celebrationContent: {
		alignItems: 'center',
	},
	celebrationTitle: {
		fontSize: 28,
		fontWeight: '700',
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	celebrationText: {
		fontSize: 18,
		textAlign: 'center',
		marginBottom: 16,
		lineHeight: 24,
	},
	celebrationAmount: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 24,
	},
	celebrationButton: {
		borderRadius: 24,
		paddingHorizontal: 32,
	},
});