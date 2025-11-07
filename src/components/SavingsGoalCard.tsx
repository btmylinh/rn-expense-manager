// components/SavingsGoalCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Portal, Modal, TextInput, Snackbar, Chip } from 'react-native-paper';
import { useAppTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import {fakeApi} from '../services/fakeApi';

interface SavingsGoalCardProps {
	goal: {
		id: number;
		name: string;
		targetAmount: number;
		currentAmount: number;
		deadline: string;
		icon: string;
		color: string;
		currency?: string;
		status: string;
		progress?: number;
	};
	onPress?: () => void;
	onAddMoney?: (amount: number, note?: string, walletId?: number | null) => Promise<boolean>;
	onEdit?: () => void;
}

export default function SavingsGoalCard({ goal, onPress, onAddMoney, onEdit }: SavingsGoalCardProps) {
	const theme = useAppTheme();
	const { user } = useAuth();
	const userId = user?.id || 0;
	const progress = goal.progress || 0;
	const remaining = goal.targetAmount - goal.currentAmount;
	const accent = goal.color || theme.colors.primary;
	
	// Currency helpers
	const currency = goal.currency || 'VND';
	const currencySymbol = currency === 'USD' ? '$' : 'đ';
	
	const formatAmount = (amount: number) => {
		if (currency === 'USD') {
			return amount.toLocaleString('en-US');
		} else {
			return amount.toLocaleString('vi-VN');
		}
	};
	
	// Quick add money modal state
	const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
	const [addAmount, setAddAmount] = useState('');
	const [addNote, setAddNote] = useState('');
	const [addingMoney, setAddingMoney] = useState(false);
	const [snackMessage, setSnackMessage] = useState('');
	
	// Wallet selection state
	const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
	const [wallets, setWallets] = useState<any[]>([]);
	const [showWalletDropdown, setShowWalletDropdown] = useState(false);
	
	// Load wallets when modal opens
	React.useEffect(() => {
		if (addMoneyModalVisible) {
			loadWallets();
		}
	}, [addMoneyModalVisible]);
	
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
	
	// Calculate days remaining and goal state
	const today = new Date();
	const deadlineDate = new Date(goal.deadline);
	const timeDiff = deadlineDate.getTime() - today.getTime();
	const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
	
	// Determine goal state
	const getGoalState = () => {
		if (goal.status === 'completed') {
			return {
				type: 'completed',
				backgroundColor: '#E8F5E9',
				borderColor: '#22c55e',
				statusColor: '#22c55e',
				statusText: 'Đã đạt mục tiêu!',
				statusIcon: 'check-circle',
				badge: { text: 'Hoàn thành', color: '#22c55e' },
				progressColor: '#22c55e'
			};
		}
		
		if (daysRemaining < 0 && goal.status === 'active' && goal.currentAmount < goal.targetAmount) {
			const overdueDays = Math.abs(daysRemaining);
			return {
				type: 'overdue',
				backgroundColor: theme.colors.surface,
				borderColor: '#ef4444',
				statusColor: '#ef4444',
				statusText: `Quá hạn ${overdueDays} ngày`,
				statusIcon: 'alert-circle',
				badge: { text: 'Quá hạn', color: '#ef4444' },
				progressColor: '#f59e0b'
			};
		}
		
		if (daysRemaining <= 7 && daysRemaining > 0 && goal.status === 'active') {
			return {
				type: 'urgent',
				backgroundColor: theme.colors.surface,
				borderColor: '#f59e0b',
				statusColor: '#f59e0b',
				statusText: `Còn ${daysRemaining} ngày`,
				statusIcon: 'clock-alert',
				badge: { text: 'Gấp', color: '#f59e0b' },
				progressColor: accent
			};
		}
		
		// Default active state
		return {
			type: 'active',
			backgroundColor: theme.colors.surface,
			borderColor: accent + '33',
			statusColor: theme.colors.onSurfaceVariant,
			statusText: `Còn ${Math.max(daysRemaining, 0)} ngày`,
			statusIcon: 'calendar',
			badge: null,
			progressColor: accent
		};
	};

	const goalState = getGoalState();

	// Format currency
	const formatCurrency = (amount: number) => {
		return formatAmount(amount) + ' ' + currencySymbol;
	};

	// Handle quick add money
	const handleQuickAddMoney = async () => {
		if (!onAddMoney) return;
		
		const amount = parseFloat(addAmount.replace(/[^0-9]/g, ''));
		if (!amount || amount <= 0) {
			setSnackMessage('Vui lòng nhập số tiền hợp lệ');
			return;
		}

		try {
			setAddingMoney(true);
			const success = await onAddMoney(amount, addNote.trim() || undefined, selectedWalletId);
			
			if (success) {
				setAddAmount('');
				setAddNote('');
				setAddMoneyModalVisible(false);
				setSnackMessage(`Đã thêm ${formatCurrency(amount)} vào mục tiêu`);
			}
		} catch (error) {
			setSnackMessage('Có lỗi xảy ra khi thêm tiền');
		} finally {
			setAddingMoney(false);
		}
	};

	return (
		<>
			<TouchableOpacity onPress={onPress}>
				<View style={[
					styles.card, 
					styles.cardShadow, 
					{ 
						borderColor: accent + '33',
						borderWidth: 1,
					}
				]}>
					

					{/* Completion Check Icon */}
					{goalState.type === 'completed' && (
						<View style={[styles.completionIcon, { backgroundColor: goalState.statusColor }]}>
							<MaterialCommunityIcons
								name="check"
								size={16}
								color="#FFFFFF"
							/>
						</View>
					)}

					{/* Header with icon, name and status */}
					<View style={styles.header}>
						<View style={styles.titleRow}>
							<View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
								<MaterialCommunityIcons 
									name={goal.icon as any} 
									size={22} 
									color={accent} 
								/>
							</View>
							<View style={styles.titleContainer}>
								<Text style={[styles.goalName, { color: theme.colors.onSurface }]} numberOfLines={1}>
									{goal.name}
								</Text>
								<View style={styles.statusRow}>
									<MaterialCommunityIcons
										name={goalState.statusIcon as any}
										size={14}
										color={goalState.statusColor}
									/>
									<Text style={[styles.statusText, { color: goalState.statusColor }]}>
										{goalState.statusText}
									</Text>
								</View>
							</View>
						</View>
						<View style={styles.headerActions}>
							<Text style={[styles.targetAmount, { color: theme.colors.onSurface }]}>
								{formatCurrency(goal.targetAmount)}
							</Text>
							{goal.status === 'active' && onEdit && (
								<TouchableOpacity
									style={styles.editButton}
									onPress={onEdit}
									hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
								>
									<MaterialCommunityIcons
										name="pencil"
										size={16}
										color={theme.colors.onSurfaceVariant}
									/>
								</TouchableOpacity>
							)}
						</View>
					</View>

					{/* Progress section */}
					<View style={styles.progressSection}>
						<View style={styles.progressInfo}>
							<Text style={[styles.currentAmount, { color: theme.colors.onSurface }]}>
								{formatCurrency(goal.currentAmount)}
							</Text>
							<Text style={[styles.progressPercent, { color: goalState.progressColor }]}>
								{progress.toFixed(0)}%
							</Text>
						</View>
						
						<View style={styles.progressTrack}>
							<View style={[
								styles.progressBar, 
								{ 
									width: `${Math.min(progress, 100)}%`, 
									backgroundColor: goalState.progressColor
								}
							]} />
						</View>
						
						{goalState.type === 'completed' ? (
							<Text style={[styles.completedText, { color: goalState.statusColor }]}>
								Đã đạt mục tiêu!
							</Text>
						) : (
							<Text style={[styles.remainingText, { color: theme.colors.onSurfaceVariant }]}>
								Còn thiếu {formatCurrency(remaining)}
							</Text>
						)}
					</View>

					{/* Footer with deadline and action button */}
					<View style={styles.footer}>
						<View style={styles.deadlineContainer}>
							<MaterialCommunityIcons 
								name="calendar-outline" 
								size={16} 
								color={theme.colors.onSurfaceVariant} 
							/>
							<Text style={[styles.deadlineText, { color: theme.colors.onSurfaceVariant }]}>
								{new Date(goal.deadline).toLocaleDateString('vi-VN')}
							</Text>
						</View>
						
						{goal.status === 'active' && onAddMoney && (
							<Button
								mode="contained"
								compact
								onPress={() => setAddMoneyModalVisible(true)}
								style={[{ backgroundColor: accent }]}
							>
								Thêm tiền
							</Button>
						)}
					</View>
				</View>
			</TouchableOpacity>

			{/* Quick Add Money Modal */}
			<Portal>
				<Modal
					visible={addMoneyModalVisible}
					onDismiss={() => setAddMoneyModalVisible(false)}
					contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
				>
					<Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
						Thêm tiền vào "{goal.name}"
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
						placeholder="VD: Tiền lương, tiền thưởng..."
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
							onPress={handleQuickAddMoney}
							loading={addingMoney}
							disabled={addingMoney || !addAmount}
							style={[styles.modalSubmitButton, { backgroundColor: accent}]}
							labelStyle={{ color: '#FFFFFF' }}
						>
							Thêm
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
		</>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 12,
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderWidth: 1,
		position: 'relative',
	},
	cardShadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 1.5,
	},
	badge: {
		position: 'absolute',
		top: 8,
		right: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		zIndex: 1,
	},
	badgeText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: '600',
	},
	completionIcon: {
		position: 'absolute',
		top: 8,
		left: 8,
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	iconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	titleContainer: {
		flex: 1,
	},
	goalName: {
		fontWeight: '600',
		fontSize: 16,
		marginBottom: 4,
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statusText: {
		fontSize: 12,
		fontWeight: '500',
		marginLeft: 4,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	targetAmount: {
		fontWeight: '700',
		fontSize: 15,
	},
	editButton: {
		marginLeft: 8,
		padding: 4,
	},
	progressSection: {
		marginBottom: 12,
	},
	progressInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	currentAmount: {
		fontWeight: '600',
		fontSize: 14,
	},
	progressPercent: {
		fontWeight: '700',
		fontSize: 14,
	},
	progressTrack: {
		height: 8,
		backgroundColor: '#E5E7EB',
		borderRadius: 6,
		overflow: 'hidden',
		marginBottom: 6,
	},
	progressBar: {
		height: 8,
		borderRadius: 6,
	},
	remainingText: {
		fontSize: 12,
		textAlign: 'center',
	},
	completedText: {
		fontSize: 12,
		textAlign: 'center',
		fontWeight: '600',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	deadlineContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	deadlineText: {
		fontSize: 12,
		marginLeft: 4,
	},
	addButton: {
		borderRadius: 16,
	},
	addButtonLabel: {
		fontSize: 12,
		fontWeight: '600',
	},
	
	// Modal Styles
	modalContainer: {
		margin: 20,
		padding: 24,
		borderRadius: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 20,
		textAlign: 'center',
	},
	modalInput: {
		marginBottom: 16,
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
	walletSection: {
		marginBottom: 16,
	},
	walletSectionTitle: {
		fontSize: 14,
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
});