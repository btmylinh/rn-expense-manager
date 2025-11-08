// screens/recurring/RecurringExpensesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert, TouchableOpacity, Platform } from 'react-native';
import { Card, Button, FAB, IconButton, TextInput, List, Switch, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme, getIconColor } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { fakeApi } from '../../services/fakeApi';
import AppBar from '../../components/AppBar';
import BottomSheet from '../../components/BottomSheet';
import CategorySelectModal from '../../components/CategorySelectModal';
import FrequencySelectModal from '../../components/FrequencySelectModal';
import DateTimePicker from '@react-native-community/datetimepicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RecurringExpense {
	id: number;
	userId: number;
	name: string;
	amount: number;
	categoryId: number;
	categoryName?: string;
	categoryIcon?: string;
	categoryColor?: string;
	frequency: RecurringFrequency;
	nextDueDate: string;
	isActive: boolean;
	isAutoDetected: boolean;
	confidence: number;
	reminderDaysBefore: number;
	note?: string;
	createdAt: string;
	updatedAt: string;
}

export default function RecurringExpensesScreen() {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();
	const { user } = useAuth();
	const userId = user?.id || 1;
	const insets = useSafeAreaInsets();
	
	const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
	const [showDetectDialog, setShowDetectDialog] = useState(false);
	const [detectedPatterns, setDetectedPatterns] = useState<any[]>([]);
	const [detectingPatterns, setDetectingPatterns] = useState(false);
	const [showPredictionDialog, setShowPredictionDialog] = useState(false);
	const [predictions, setPredictions] = useState<any>(null);
	const [loadingPrediction, setLoadingPrediction] = useState(false);
	
	// Form state
	const [formName, setFormName] = useState('');
	const [formAmount, setFormAmount] = useState('');
	const [formCategoryId, setFormCategoryId] = useState<number>(0);
	const [formFrequency, setFormFrequency] = useState<RecurringFrequency>('monthly');
	const [formNextDueDate, setFormNextDueDate] = useState(new Date());
	const [formReminderDays, setFormReminderDays] = useState('1');
	const [formNote, setFormNote] = useState('');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showFrequencyModal, setShowFrequencyModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	
	const [categories, setCategories] = useState<any[]>([]);
	const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

	useEffect(() => {
		loadCategories();
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			loadExpenses();
		}, [])
	);

	const loadCategories = async () => {
		try {
			const response = await fakeApi.getUserCategories(userId);
			// Filter only expense categories (type = 2)
			const expenseCategories = response.filter((cat: any) => cat.type === 2);
			setCategories(expenseCategories);
			if (expenseCategories.length > 0 && formCategoryId === 0) {
				setFormCategoryId(expenseCategories[0].id);
			}
		} catch (error) {
			console.error('Error loading categories:', error);
		}
	};

	const loadExpenses = async () => {
		try {
			const response = await fakeApi.getRecurringExpenses(userId);
			if (response.success) {
				setExpenses(response.data);
			}
		} catch (error) {
			console.error('Error loading recurring expenses:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const handleRefresh = () => {
		setRefreshing(true);
		loadExpenses();
	};

	const handleDetectPatterns = async () => {
		setDetectingPatterns(true);
		try {
			const response = await fakeApi.detectRecurringExpenses(userId);
			if (response.success) {
				setDetectedPatterns(response.data);
				setShowDetectDialog(true);
			}
		} catch (error) {
			console.error('Error detecting patterns:', error);
			Alert.alert('Lỗi', 'Không thể phát hiện pattern chi tiêu');
		} finally {
			setDetectingPatterns(false);
		}
	};

	const handlePredictNextMonth = async () => {
		setLoadingPrediction(true);
		setShowPredictionDialog(true);
		try {
			const response = await fakeApi.predictNextMonthExpenses(userId);
			if (response.success) {
				setPredictions(response.data);
			}
		} catch (error) {
			console.error('Error predicting expenses:', error);
			Alert.alert('Lỗi', 'Không thể dự báo chi tiêu');
		} finally {
			setLoadingPrediction(false);
		}
	};

	const handleAddFromPattern = async (pattern: any) => {
		try {
			const response = await fakeApi.createRecurringExpense(userId, {
				name: pattern.name,
				amount: pattern.amount,
				categoryId: pattern.categoryId,
				frequency: pattern.frequency,
				nextDueDate: pattern.nextDueDate,
				reminderDaysBefore: 2,
				note: `Phát hiện tự động (${pattern.occurrences} lần, độ tin cậy ${pattern.confidence}%)`
			});
			
			if (response.success) {
				Alert.alert('Thành công', 'Đã thêm chi tiêu định kỳ');
				loadExpenses();
				// Remove from detected patterns
				setDetectedPatterns(prev => prev.filter(p => p !== pattern));
			}
		} catch (error) {
			console.error('Error adding expense:', error);
			Alert.alert('Lỗi', 'Không thể thêm chi tiêu định kỳ');
		}
	};

	const openAddDialog = () => {
		resetForm();
		setShowAddDialog(true);
	};

	const openEditDialog = (expense: RecurringExpense) => {
		setEditingExpense(expense);
		setFormName(expense.name);
		setFormAmount(expense.amount.toString());
		setFormCategoryId(expense.categoryId);
		setFormFrequency(expense.frequency);
		setFormNextDueDate(new Date(expense.nextDueDate));
		setFormReminderDays(expense.reminderDaysBefore.toString());
		setFormNote(expense.note || '');
		setShowEditDialog(true);
	};

	const resetForm = () => {
		setFormName('');
		setFormAmount('');
		setFormCategoryId(categories.length > 0 ? categories[0].id : 0);
		setFormFrequency('monthly');
		setFormNextDueDate(new Date());
		setFormReminderDays('1');
		setFormNote('');
	};

	const handleSaveExpense = async () => {
		if (!formName.trim() || !formAmount || formCategoryId === 0) {
			Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
			return;
		}

		const amount = parseFloat(formAmount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert('Lỗi', 'Số tiền không hợp lệ');
			return;
		}

		try {
			const data = {
				name: formName.trim(),
				amount: Math.abs(amount), // Ensure positive amount
				categoryId: formCategoryId,
				frequency: formFrequency,
				nextDueDate: formNextDueDate.toISOString().split('T')[0],
				reminderDaysBefore: parseInt(formReminderDays) || 1,
				note: formNote.trim()
			};

			const response = await fakeApi.createRecurringExpense(userId, data);
			
			if (response.success) {
				Alert.alert('Thành công', 'Đã thêm chi tiêu định kỳ');
				setShowAddDialog(false);
				loadExpenses();
				resetForm();
			}
		} catch (error) {
			console.error('Error saving expense:', error);
			Alert.alert('Lỗi', 'Không thể lưu chi tiêu định kỳ');
		}
	};

	const handleUpdateExpense = async () => {
		if (!editingExpense) return;

		if (!formName.trim() || !formAmount || formCategoryId === 0) {
			Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
			return;
		}

		const amount = parseFloat(formAmount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert('Lỗi', 'Số tiền không hợp lệ');
			return;
		}

		try {
			const data = {
				name: formName.trim(),
				amount: Math.abs(amount),
				categoryId: formCategoryId,
				frequency: formFrequency,
				nextDueDate: formNextDueDate.toISOString().split('T')[0],
				reminderDaysBefore: parseInt(formReminderDays) || 1,
				note: formNote.trim()
			};

			const response = await fakeApi.updateRecurringExpense(userId, editingExpense.id, data);
			
			if (response.success) {
				Alert.alert('Thành công', 'Đã cập nhật chi tiêu định kỳ');
				setShowEditDialog(false);
				setEditingExpense(null);
				loadExpenses();
			}
		} catch (error) {
			console.error('Error updating expense:', error);
			Alert.alert('Lỗi', 'Không thể cập nhật chi tiêu định kỳ');
		}
	};

	const handleToggleActive = async (expense: RecurringExpense) => {
		try {
			const response = await fakeApi.updateRecurringExpense(userId, expense.id, {
				isActive: !expense.isActive
			});
			
			if (response.success) {
				loadExpenses();
			}
		} catch (error) {
			console.error('Error toggling expense:', error);
		}
	};

	const handleDeleteExpense = (expense: RecurringExpense) => {
		Alert.alert(
			'Xác nhận xóa',
			`Bạn có chắc muốn xóa "${expense.name}"?`,
			[
				{ text: 'Hủy', style: 'cancel' },
				{
					text: 'Xóa',
					style: 'destructive',
					onPress: async () => {
						try {
							const response = await fakeApi.deleteRecurringExpense(userId, expense.id);
							if (response.success) {
								Alert.alert('Thành công', 'Đã xóa chi tiêu định kỳ');
								loadExpenses();
							}
						} catch (error) {
							console.error('Error deleting expense:', error);
							Alert.alert('Lỗi', 'Không thể xóa chi tiêu định kỳ');
						}
					}
				}
			]
		);
	};

	const getFrequencyLabel = (frequency: RecurringFrequency) => {
		const labels = {
			daily: 'Hàng ngày',
			weekly: 'Hàng tuần',
			monthly: 'Hàng tháng',
			yearly: 'Hàng năm'
		};
		return labels[frequency];
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
	};

	const getDaysUntilDue = (dateString: string) => {
		const dueDate = new Date(dateString);
		const today = new Date();
		const diffTime = dueDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const getFilteredExpenses = () => {
		switch (activeFilter) {
			case 'active':
				return expenses.filter(e => e.isActive);
			case 'inactive':
				return expenses.filter(e => !e.isActive);
			default:
				return expenses;
		}
	};

	const filteredExpenses = getFilteredExpenses();
	const totalMonthlyAmount = expenses
		.filter(e => e.isActive && e.frequency === 'monthly')
		.reduce((sum, e) => sum + e.amount, 0);

	const selectedCategory = categories.find(c => c.id === formCategoryId);

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<AppBar title="Chi tiêu định kỳ" />
			
			<ScrollView
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
				}
			>
				{/* Summary Card */}
				<Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Card.Content>
						<View style={styles.summaryRow}>
							<View style={styles.summaryItem}>
								<MaterialCommunityIcons name="repeat" size={24} color={theme.colors.primary} />
								<Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
									Tổng số
								</Text>
								<Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
									{expenses.length}
								</Text>
							</View>
							<View style={styles.summaryItem}>
								<MaterialCommunityIcons name="calendar-month" size={24} color={theme.colors.primary} />
								<Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
									Chi hàng tháng
								</Text>
								<Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
									{totalMonthlyAmount.toLocaleString('vi-VN')} đ
								</Text>
							</View>
						</View>
					</Card.Content>
				</Card>

				{/* Action Buttons */}
				<View style={styles.actionButtons}>
					<Button
						mode="outlined"
						icon="chart-line"
						onPress={handlePredictNextMonth}
						style={styles.actionButton}
					>
						Dự báo tháng sau
					</Button>
					<Button
						mode="outlined"
						icon="auto-fix"
						onPress={handleDetectPatterns}
						loading={detectingPatterns}
						style={styles.actionButton}
					>
						AI phát hiện
					</Button>
				</View>

				{/* Filter Buttons */}
				<View style={styles.filterContainer}>
					<TouchableOpacity
						style={[
							styles.filterButton,
							activeFilter === 'all' && styles.filterButtonActive,
							{ backgroundColor: activeFilter === 'all' ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
						]}
						onPress={() => setActiveFilter('all')}
					>
						<Text style={[
							styles.filterButtonText,
							{ color: activeFilter === 'all' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
						]}>
							Tất cả
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.filterButton,
							activeFilter === 'active' && styles.filterButtonActive,
							{ backgroundColor: activeFilter === 'active' ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
						]}
						onPress={() => setActiveFilter('active')}
					>
						<Text style={[
							styles.filterButtonText,
							{ color: activeFilter === 'active' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
						]}>
							Đang hoạt động
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.filterButton,
							activeFilter === 'inactive' && styles.filterButtonActive,
							{ backgroundColor: activeFilter === 'inactive' ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
						]}
						onPress={() => setActiveFilter('inactive')}
					>
						<Text style={[
							styles.filterButtonText,
							{ color: activeFilter === 'inactive' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
						]}>
							Tạm dừng
						</Text>
					</TouchableOpacity>
				</View>

				{/* Expenses List */}
				{filteredExpenses.length === 0 ? (
					<View style={styles.emptyState}>
						<MaterialCommunityIcons 
							name="repeat-off" 
							size={64} 
							color={theme.colors.onSurfaceVariant} 
						/>
						<Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
							Chưa có chi tiêu định kỳ nào
						</Text>
						<Button mode="contained" onPress={openAddDialog} style={{ marginTop: 16 }}>
							Thêm chi tiêu định kỳ
						</Button>
					</View>
				) : (
					<View style={styles.expensesList}>
						{filteredExpenses.map((expense) => {
							const daysUntilDue = getDaysUntilDue(expense.nextDueDate);
							const isOverdue = daysUntilDue < 0;
							const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= expense.reminderDaysBefore;

							return (
								<Card 
									key={expense.id} 
									style={[
										styles.expenseCard,
										!expense.isActive && styles.inactiveCard,
										{ backgroundColor: "#ffff", borderColor: getIconColor(expense.categoryIcon, theme)}
									]}
								>
									<Card.Content>
										<View style={styles.expenseHeader}>
											<View style={[styles.expenseIcon, { backgroundColor: getIconColor(expense.categoryIcon, theme) + '22' }]}>
												<MaterialCommunityIcons
													name={expense.categoryIcon as any || 'help-circle'}
													size={28}
													color={getIconColor(expense.categoryIcon, theme)}
												/>
											</View>
											<View style={styles.expenseInfo}>
												<Text style={[styles.expenseName, { color: theme.colors.onSurface }]}>
													{expense.name}
												</Text>
												<View style={styles.expenseMetaRow}>
													<Text style={[styles.expenseMeta, { color: theme.colors.onSurfaceVariant }]}>
														{expense.categoryName}
													</Text>
													<Text style={[styles.expenseMeta, { color: theme.colors.onSurfaceVariant }]}>
														• {getFrequencyLabel(expense.frequency)}
													</Text>
												</View>
											</View>
											<View style={styles.expenseActions}>
												<IconButton
													icon="pencil"
													size={20}
													onPress={() => openEditDialog(expense)}
												/>
												<IconButton
													icon="delete"
													size={20}
													onPress={() => handleDeleteExpense(expense)}
												/>
											</View>
										</View>

										<Divider style={{ marginVertical: 12 }} />

										<View style={styles.expenseDetails}>
											<View style={styles.detailRow}>
												<Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
													Số tiền:
												</Text>
												<Text style={[styles.detailValue, { color: theme.colors.error }]}>
													-{expense.amount.toLocaleString('vi-VN')} đ
												</Text>
											</View>
											<View style={styles.detailRow}>
												<Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
													Ngày tiếp theo:
												</Text>
												<Text style={[
													styles.detailValue, 
													{ color: isOverdue ? theme.colors.error : theme.colors.onSurface }
												]}>
													{formatDate(expense.nextDueDate)}
													{isOverdue && ' (Quá hạn)'}
													{isDueSoon && !isOverdue && ` (Còn ${daysUntilDue} ngày)`}
												</Text>
											</View>
											{expense.note && (
												<View style={[styles.noteContainer, { borderTopColor: theme.colors.outline + '30', borderTopWidth: 1 }]}>
													<Text style={[styles.noteLabel, { color: theme.colors.onSurfaceVariant }]}>
														Ghi chú:
													</Text>
													<Text 
														style={[styles.noteValue, { color: theme.colors.onSurface }]}
														numberOfLines={0}
													>
														{expense.note}
													</Text>
												</View>
											)}
										</View>

										<View style={styles.expenseFooter}>
											<View style={styles.expenseBadges}>
												{expense.isAutoDetected && (
													<View style={[styles.badge, styles.autoBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
														<MaterialCommunityIcons 
															name="auto-fix" 
															size={14} 
															color={theme.colors.onSecondaryContainer}
															style={styles.badgeIcon}
														/>
														<Text style={[styles.badgeText, { color: theme.colors.onSecondaryContainer }]}>
															Tự động ({expense.confidence}%)
														</Text>
													</View>
												)}
												{isDueSoon && !isOverdue && (
													<View style={[styles.badge, styles.dueBadge, { backgroundColor: theme.colors.errorContainer }]}>
														<MaterialCommunityIcons 
															name="bell-ring" 
															size={14} 
															color={theme.colors.onErrorContainer}
															style={styles.badgeIcon}
														/>
														<Text style={[styles.badgeText, { color: theme.colors.onErrorContainer }]}>
															Sắp đến hạn
														</Text>
													</View>
												)}
												{isOverdue && (
													<View style={[styles.badge, styles.overdueBadge, { backgroundColor: theme.colors.error }]}>
														<MaterialCommunityIcons 
															name="alert-circle" 
															size={14} 
															color="#FFFFFF"
															style={styles.badgeIcon}
														/>
														<Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
															Quá hạn
														</Text>
													</View>
												)}
											</View>
											<Switch
												value={expense.isActive}
												onValueChange={() => handleToggleActive(expense)}
												color={theme.colors.primary}
											/>
										</View>
									</Card.Content>
								</Card>
							);
						})}
					</View>
				)}

				<View style={{ height: 100 }} />
			</ScrollView>

			<FAB
				icon="plus"
				style={[
					styles.fab, 
					{ 
						backgroundColor: theme.colors.primary,
						bottom: insets.bottom, 
					}
				]}
				onPress={openAddDialog}
			/>

			{/* Add/Edit BottomSheet */}
			<BottomSheet
				visible={showAddDialog || showEditDialog}
				onDismiss={() => {
					setShowAddDialog(false);
					setShowEditDialog(false);
					setEditingExpense(null);
				}}
				title={showEditDialog ? 'Chỉnh sửa' : 'Thêm chi tiêu định kỳ'}
				titleIcon="plus-circle"
				height="90%"
			>
				<ScrollView style={styles.bottomSheetScroll} contentContainerStyle={styles.bottomSheetContent}>
					<View style={styles.dialogContent}>
						{/* Basic Information Section */}
						<View style={styles.formSection}>
							<View style={[styles.sectionHeader, { borderBottomColor: theme.colors.outline + '30', borderBottomWidth: 1 }]}>
								<MaterialCommunityIcons 
									name="information-outline" 
									size={20} 
									color={theme.colors.primary} 
									style={{ marginRight: 8 }}
								/>
								<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
									Thông tin cơ bản
								</Text>
							</View>
							
							<TouchableOpacity
								onPress={() => setShowCategoryModal(true)}
								style={[styles.selectButton, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
							>
								<View style={styles.selectButtonContent}>
									<View style={styles.selectButtonText}>
										<Text style={[styles.selectButtonValue, { color: theme.colors.onSurface }]}>
											{selectedCategory ? (
												<View style={{ flexDirection: 'row', alignItems: 'center' }}>
													<MaterialCommunityIcons
														name={selectedCategory.icon as any}
														size={20}
														color={getIconColor(selectedCategory.icon, theme)}
														style={{ marginRight: 15 }}
													/>
													<Text>{selectedCategory.name}</Text>
												</View>
											) : (
												'Chọn danh mục'
											)}
										</Text>
									</View>
								</View>
								<MaterialCommunityIcons
									name="chevron-down"
									size={20}
									color={theme.colors.onSurfaceVariant}
								/>
							</TouchableOpacity>
							
							<TextInput
								label="Tên chi tiêu"
								value={formName}
								onChangeText={setFormName}
								mode="outlined"
								style={styles.input}
								left={<TextInput.Icon icon="tag-outline" />}
							/>

							<TextInput
								label="Số tiền"
								value={formAmount}
								onChangeText={setFormAmount}
								mode="outlined"
								keyboardType="numeric"
								style={styles.input}
								left={<TextInput.Icon icon="currency-usd" />}
								right={<TextInput.Affix text="đ" />}
							/>
						</View>

						{/* Category & Schedule Section */}
						<View style={styles.formSection}>
							<View style={[styles.sectionHeader, { borderBottomColor: theme.colors.outline + '30', borderBottomWidth: 1 }]}>
								<MaterialCommunityIcons 
									name="calendar-clock-outline" 
									size={20} 
									color={theme.colors.primary} 
									style={{ marginRight: 8 }}
								/>
								<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
									Lịch trình
								</Text>
							</View>

							<TouchableOpacity
								onPress={() => setShowFrequencyModal(true)}
								style={[styles.selectButton, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
							>
								<View style={styles.selectButtonContent}>
									<MaterialCommunityIcons
										name="repeat"
										size={20}
										color={theme.colors.primary}
										style={{ marginRight: 12 }}
									/>
									<View style={styles.selectButtonText}>
										<Text style={[styles.selectButtonValue, { color: theme.colors.onSurface }]}>
											{getFrequencyLabel(formFrequency)}
										</Text>
									</View>
								</View>
								<MaterialCommunityIcons
									name="chevron-down"
									size={20}
									color={theme.colors.onSurfaceVariant}
								/>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => setShowDatePicker(true)}
								style={[styles.selectButton, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
							>
								<View style={styles.selectButtonContent}>
									<MaterialCommunityIcons
										name="calendar-outline"
										size={20}
										color={theme.colors.primary}
										style={{ marginRight: 12 }}
									/>
									<View style={styles.selectButtonText}>
										<Text style={[styles.selectButtonValue, { color: theme.colors.onSurface }]}>
											{formatDate(formNextDueDate.toISOString())}
										</Text>
									</View>
								</View>
								<MaterialCommunityIcons
									name="calendar-edit"
									size={20}
									color={theme.colors.onSurfaceVariant}
								/>
							</TouchableOpacity>

							{showDatePicker && (
								<DateTimePicker
									value={formNextDueDate}
									mode="date"
									display="default"
									onChange={(event, date) => {
										setShowDatePicker(false);
										if (date) setFormNextDueDate(date);
									}}
								/>
							)}
						</View>

						{/* Reminder & Notes Section */}
						<View style={styles.formSection}>
							<View style={[styles.sectionHeader, { borderBottomColor: theme.colors.outline + '30', borderBottomWidth: 1 }]}>
								<MaterialCommunityIcons 
									name="bell-outline" 
									size={20} 
									color={theme.colors.primary} 
									style={{ marginRight: 8 }}
								/>
								<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
									Nhắc nhở 
								</Text>
							</View>

							<TextInput
								label="Nhắc trước (ngày)"
								value={formReminderDays}
								onChangeText={setFormReminderDays}
								mode="outlined"
								keyboardType="numeric"
								style={styles.input}
								left={<TextInput.Icon icon="bell-ring-outline" />}
								right={<TextInput.Affix text="ngày" />}
							/>

							<TextInput
								label="Ghi chú (tùy chọn, tối đa 255 ký tự)"
								value={formNote}
								onChangeText={(text) => {
									// Giới hạn tối đa 255 ký tự
									if (text.length <= 255) {
										setFormNote(text);
									}
								}}
								mode="outlined"
								multiline
								numberOfLines={4}
								style={styles.input}
								maxLength={255}
								left={<TextInput.Icon icon="note-text-outline" />}
								right={
									formNote.length > 0 && (
										<TextInput.Affix 
											text={`${formNote.length}/255`} 
											textStyle={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}
										/>
									)
								}
							/>
						</View>
					</View>
					
					{/* Action Buttons */}
					<View style={[styles.bottomSheetActions, { borderTopColor: theme.colors.outline + '30' }]}>
						<Button
							mode="outlined"
							onPress={() => {
								setShowAddDialog(false);
								setShowEditDialog(false);
								setEditingExpense(null);
							}}
							style={[styles.bottomSheetButton, styles.cancelButton, { flex: 1, marginRight: 12 }]}
							labelStyle={styles.buttonLabel}
						>
							Hủy
						</Button>
						<Button
							mode="contained"
							onPress={showEditDialog ? handleUpdateExpense : handleSaveExpense}
							style={[styles.bottomSheetButton, styles.submitButton, { flex: 1 }]}
							labelStyle={styles.buttonLabel}
							icon={showEditDialog ? "check-circle" : "plus-circle"}
						>
							{showEditDialog ? 'Cập nhật' : 'Thêm'}
						</Button>
					</View>
				</ScrollView>
			</BottomSheet>

				{/* Detected Patterns BottomSheet */}
				<BottomSheet
					visible={showDetectDialog}
					onDismiss={() => setShowDetectDialog(false)}
					title="Chi tiêu AI phát hiện được"
					titleIcon="auto-fix"
					height="80%"
				>
					<ScrollView 
						style={styles.bottomSheetScroll}
						contentContainerStyle={styles.bottomSheetContent}
					>
						{detectedPatterns.length === 0 ? (
							<View style={styles.emptyDetected}>
								<MaterialCommunityIcons 
									name="chart-line-variant" 
									size={48} 
									color={theme.colors.onSurfaceVariant} 
									style={{ marginBottom: 12, opacity: 0.5 }}
								/>
								<Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 15 }}>
									Không phát hiện được pattern chi tiêu nào
								</Text>
							</View>
						) : (
							<View style={styles.patternsList}>
								{detectedPatterns.map((pattern, index) => (
									<Card key={index} style={[styles.patternCard, { backgroundColor: theme.colors.surface }]}>
										<Card.Content>
											<View style={styles.patternCardContent}>
												<View style={[styles.patternIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
													<MaterialCommunityIcons 
														name="auto-fix"
														size={24}
														color={theme.colors.onPrimaryContainer}
													/>
												</View>
												<View style={styles.patternCardInfo}>
													<Text style={[styles.patternCardName, { color: theme.colors.onSurface }]}>
														{pattern.name}
													</Text>
													<Text style={[styles.patternCardMeta, { color: theme.colors.onSurfaceVariant }]}>
														{pattern.amount.toLocaleString('vi-VN')} đ • {getFrequencyLabel(pattern.frequency)}
													</Text>
													<View style={styles.patternCardBadges}>
														<View style={[styles.confidenceBadge, { backgroundColor: theme.colors.primaryContainer }]}>
															<Text style={[styles.confidenceText, { color: theme.colors.onPrimaryContainer }]}>
																{pattern.confidence}% tin cậy
															</Text>
														</View>
														<Text style={[styles.patternOccurrences, { color: theme.colors.onSurfaceVariant }]}>
															{pattern.occurrences} lần xuất hiện
														</Text>
													</View>
												</View>
												<Button
													mode="contained"
													compact
													onPress={() => handleAddFromPattern(pattern)}
													style={styles.patternAddButton}
												>
													Thêm
												</Button>
											</View>
										</Card.Content>
									</Card>
								))}
							</View>
						)}
					</ScrollView>
				</BottomSheet>

				{/* Prediction BottomSheet */}
				<BottomSheet
					visible={showPredictionDialog}
					onDismiss={() => setShowPredictionDialog(false)}
					title="Dự báo chi tiêu tháng sau"
					titleIcon="chart-line"
					height="80%"
				>
					<ScrollView 
						style={styles.bottomSheetScroll}
						contentContainerStyle={styles.bottomSheetContent}
						showsVerticalScrollIndicator={false}
					>
						{loadingPrediction ? (
							<View style={styles.loadingPrediction}>
								<MaterialCommunityIcons 
									name="chart-line" 
									size={48} 
									color={theme.colors.primary} 
									style={{ marginBottom: 16, opacity: 0.6 }}
								/>
								<Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
									Đang tính toán dự báo...
								</Text>
							</View>
						) : predictions ? (
							<View style={styles.predictionContent}>
								{/* Summary Card - Redesigned */}
								<Card style={[styles.predictionSummaryCard, { backgroundColor: theme.colors.surfaceVariant}]}>
									<Card.Content style={styles.predictionSummaryContent}>
										<View style={styles.predictionSummaryHeader}>
											<View style={[styles.predictionIconContainer, { backgroundColor: theme.colors.primary }]}>
												<MaterialCommunityIcons 
													name="chart-line-variant" 
													size={32} 
													color="#FFFFFF" 
												/>
											</View>
											<View style={styles.predictionSummaryInfo}>
												<Text style={[styles.predictionLabel, { color: theme.colors.onSurfaceVariant }]}>
													Tổng dự kiến tháng {predictions.summary.month}
												</Text>
												<Text style={[styles.predictionTotal, { color: theme.colors.primary }]}>
													{predictions.summary.totalAmount.toLocaleString('vi-VN')} đ
												</Text>
												<View style={styles.predictionMetaRow}>
													<View style={[styles.predictionMetaBadge, { backgroundColor: theme.colors.surface }]}>
														<MaterialCommunityIcons 
															name="receipt-outline" 
															size={16} 
															color={theme.colors.primary} 
														/>
														<Text style={[styles.predictionMetaBadgeText, { color: theme.colors.onSurface }]}>
															{predictions.summary.totalCount} khoản
														</Text>
													</View>
													<View style={[styles.predictionMetaBadge, { backgroundColor: theme.colors.surface }]}>
														<MaterialCommunityIcons 
															name="calendar-outline" 
															size={16} 
															color={theme.colors.primary} 
														/>
														<Text style={[styles.predictionMetaBadgeText, { color: theme.colors.onSurface }]}>
															{predictions.summary.month}
														</Text>
													</View>
												</View>
											</View>
										</View>
									</Card.Content>
								</Card>

								{/* Category Breakdown - Redesigned */}
								{Object.keys(predictions.summary.byCategory).length > 0 && (
									<View style={styles.predictionCategoriesSection}>
										<View style={styles.predictionSectionHeader}>
											<MaterialCommunityIcons 
												name="chart-pie" 
												size={22} 
												color={theme.colors.primary} 
											/>
											<Text style={[styles.predictionSectionTitle, { color: theme.colors.onSurface }]}>
												Phân bổ theo danh mục
											</Text>
										</View>
										
										<View style={styles.predictionCategoriesList}>
											{Object.entries(predictions.summary.byCategory)
												.sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
												.map(([category, amount]: [string, any], index) => {
													// Map category name to icon
													const getCategoryIcon = (catName: string) => {
														const name = catName.toLowerCase();
														if (name.includes('nhà') || name.includes('cửa')) return 'home-outline';
														if (name.includes('hóa đơn') || name.includes('dịch vụ')) return 'lightbulb-outline';
														if (name.includes('giải trí')) return 'gamepad-variant-outline';
														if (name.includes('di chuyển')) return 'car-outline';
														if (name.includes('sức khỏe')) return 'hospital-box-outline';
														if (name.includes('ăn') || name.includes('uống')) return 'silverware-fork-knife';
														if (name.includes('mua') || name.includes('sắm')) return 'shopping-outline';
														return 'tag-outline';
													};
													
													const categoryIcon = getCategoryIcon(category);
													const categoryIconColor = getIconColor(categoryIcon, theme);
													const percentage = ((amount / predictions.summary.totalAmount) * 100).toFixed(1);
													
													return (
														<Card 
															key={category} 
															style={[
																styles.predictionCategoryCard,
																{ backgroundColor: theme.colors.surface },
																index > 0 && { marginTop: 12 }
															]}
														>
															<Card.Content style={styles.predictionCategoryCardContent}>
																<View style={styles.predictionCategoryItem}>
																	<View style={[styles.predictionCategoryIcon, { backgroundColor: categoryIconColor + '22' }]}>
																		<MaterialCommunityIcons
																			name={categoryIcon as any}
																			size={22}
																			color={categoryIconColor}
																		/>
																	</View>
																	<View style={styles.predictionCategoryInfo}>
																		<View style={styles.predictionCategoryHeader}>
																			<Text style={[styles.predictionCategoryName, { color: theme.colors.onSurface }]}>
																				{category}
																			</Text>
																			<Text style={[styles.predictionCategoryAmountText, { color: theme.colors.error }]}>
																				{amount.toLocaleString('vi-VN')} đ
																			</Text>
																		</View>
																		<View style={styles.predictionCategoryProgressContainer}>
																			<View style={[styles.predictionCategoryProgressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
																				<View 
																					style={[
																						styles.predictionCategoryProgressFill, 
																						{ 
																							width: `${percentage}%` as any,
																							backgroundColor: categoryIconColor
																						}
																					]} 
																				/>
																			</View>
																			<Text style={[styles.predictionCategoryPercentage, { color: theme.colors.onSurfaceVariant }]}>
																				{percentage}%
																			</Text>
																		</View>
																	</View>
																</View>
															</Card.Content>
														</Card>
													);
												})}
										</View>
									</View>
								)}
								</View>
							) : (
								<View style={styles.emptyPrediction}>
									<MaterialCommunityIcons 
										name="chart-line-variant" 
										size={64} 
										color={theme.colors.onSurfaceVariant} 
										style={{ marginBottom: 16, opacity: 0.4 }}
									/>
									<Text style={[styles.emptyPredictionText, { color: theme.colors.onSurfaceVariant }]}>
										Chưa có dữ liệu dự báo
									</Text>
									<Text style={[styles.emptyPredictionSubtext, { color: theme.colors.onSurfaceVariant }]}>
										Thêm chi tiêu định kỳ để xem dự báo
									</Text>
								</View>
							)}
					</ScrollView>
				</BottomSheet>

			{/* Category Select Modal */}
			<CategorySelectModal
				visible={showCategoryModal}
				categories={categories}
				selectedId={formCategoryId}
				onDismiss={() => setShowCategoryModal(false)}
				onSelect={(id) => {
					setFormCategoryId(id);
					setShowCategoryModal(false);
				}}
				title="Chọn danh mục"
				mode="budget"
			/>

			{/* Frequency Select Modal */}
			<FrequencySelectModal
				visible={showFrequencyModal}
				selectedValue={formFrequency}
				onDismiss={() => setShowFrequencyModal(false)}
				onSelect={(value) => {
					setFormFrequency(value);
					setShowFrequencyModal(false);
				}}
				title="Chọn tần suất"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	summaryCard: {
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 12,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	summaryItem: {
		alignItems: 'center',
		flex: 1,
	},
	summaryLabel: {
		fontSize: 13,
		marginTop: 6,
	},
	summaryValue: {
		fontSize: 18,
		fontWeight: '700',
		marginTop: 4,
	},
	actionButtons: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginBottom: 12,
		gap: 8,
	},
	actionButton: {
		flex: 1,
	},
	filterContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginBottom: 12,
		gap: 8,
	},
	filterButton: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	filterButtonActive: {
		// Active state handled by backgroundColor in component
	},
	filterButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 64,
		paddingHorizontal: 32,
	},
	emptyText: {
		fontSize: 16,
		marginTop: 16,
		textAlign: 'center',
	},
	expensesList: {
		paddingHorizontal: 16,
	},
	expenseCard: {
		marginBottom: 12,
		borderRadius: 12,
		borderWidth: 1,
	},
	inactiveCard: {
		opacity: 0.6,
	},
	expenseHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	expenseIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	expenseInfo: {
		flex: 1,
	},
	expenseName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	expenseMetaRow: {
		flexDirection: 'row',
		gap: 4,
		alignItems: 'center',
	},
	expenseMeta: {
		fontSize: 13,
	},
	expenseActions: {
		flexDirection: 'row',
	},
	expenseDetails: {
		gap: 8,
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	detailLabel: {
		fontSize: 14,
	},
	detailValue: {
		fontSize: 14,
		textAlign: 'right',
		flex: 1,
	},
	noteContainer: {
		marginTop: 12,
		paddingTop: 12,
	},
	noteLabel: {
		fontSize: 13,
		fontWeight: '600',
		marginBottom: 8,
	},
	noteValue: {
		fontSize: 14,
		lineHeight: 22,
		flexShrink: 1,
	},
	expenseFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 12,
	},
	expenseBadges: {
		flexDirection: 'row',
		gap: 8,
		flex: 1,
		flexWrap: 'wrap',
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
	},
	badgeIcon: {
		marginRight: 4,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: '500',
	},
	autoBadge: {
		// Styles handled by backgroundColor in component
	},
	dueBadge: {
		// Styles handled by backgroundColor in component
	},
	overdueBadge: {
		// Styles handled by backgroundColor in component
	},
	fab: {
		position: 'absolute',
		margin: 16,
		right: 0,
		bottom: 0,
	},
	dialogContent: {
		paddingHorizontal: 20,
		paddingVertical: 8,
	},
	bottomSheetScroll: {
		flex: 1,
	},
	bottomSheetContent: {
		paddingBottom: 5,
	},
	bottomSheetActions: {
		flexDirection: 'row',
		borderTopWidth: 1,
		padding: 8,
		margin: 8,
	},
	bottomSheetButton: {
		minHeight: 20,
		borderRadius: 12,
	},
	cancelButton: {
		borderWidth: 1.5,
	},
	submitButton: {
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	buttonLabel: {
		fontSize: 15,
		fontWeight: '600',
		letterSpacing: 0.3,
	},
	formSection: {
		marginBottom: 24,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		paddingBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.2,
	},
	selectButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderWidth: 1,
		borderRadius: 12,
		marginBottom: 12,
	},
	selectButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	selectButtonText: {
		flex: 1,
		marginLeft: 4,
	},
	selectButtonValue: {
		fontSize: 15,
		fontWeight: '600',
	},
	input: {
		marginBottom: 12,
	},
	menuButton: {
		justifyContent: 'flex-start',
	},
	categoryButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	emptyDetected: {
		padding: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	patternsList: {
		paddingHorizontal: 4,
		gap: 12,
	},
	patternCard: {
		marginBottom: 8,
		borderRadius: 12,
	},
	patternCardContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	patternIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	patternCardInfo: {
		flex: 1,
	},
	patternCardName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	patternCardMeta: {
		fontSize: 13,
		marginBottom: 8,
	},
	patternCardBadges: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexWrap: 'wrap',
	},
	patternOccurrences: {
		fontSize: 12,
	},
	patternAddButton: {
		marginLeft: 8,
	},
	patternItem: {
		paddingHorizontal: 0,
	},
	patternRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	confidenceBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
		minWidth: 50,
		alignItems: 'center',
	},
	confidenceText: {
		fontSize: 12,
		fontWeight: '600',
	},
	loadingPrediction: {
		padding: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		fontSize: 15,
		fontWeight: '500',
	},
	predictionContent: {
		paddingHorizontal: 4,
		paddingTop: 4,
	},
	predictionSummaryCard: {
		marginBottom: 20,
		borderRadius: 16,
		elevation: 2,
	},
	predictionSummaryContent: {
		paddingVertical: 20,
		paddingHorizontal: 20,
	},
	predictionSummaryHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	predictionIconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	predictionSummaryInfo: {
		flex: 1,
	},
	predictionLabel: {
		fontSize: 14,
		marginBottom: 8,
		fontWeight: '500',
	},
	predictionTotal: {
		fontSize: 32,
		fontWeight: '700',
		marginBottom: 12,
		letterSpacing: -0.5,
	},
	predictionMetaRow: {
		flexDirection: 'row',
		gap: 8,
		flexWrap: 'wrap',
	},
	predictionMetaBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
		gap: 6,
	},
	predictionMetaBadgeText: {
		fontSize: 12,
		fontWeight: '500',
	},
	predictionCategoriesSection: {
		marginTop: 4,
	},
	predictionSectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
		paddingHorizontal: 4,
	},
	predictionSectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		marginLeft: 8,
	},
	predictionCategoriesList: {
		marginTop: 4,
	},
	predictionCategoryCard: {
		borderRadius: 12,
		elevation: 1,
	},
	predictionCategoryCardContent: {
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	predictionCategoryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	predictionCategoryProgressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	predictionCategoryItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
	},
	predictionCategoryIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	predictionCategoryInfo: {
		flex: 1,
	},
	predictionCategoryName: {
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 8,
	},
	predictionCategoryMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	predictionCategoryProgressBar: {
		flex: 1,
		height: 6,
		borderRadius: 3,
		overflow: 'hidden',
	},
	predictionCategoryProgressFill: {
		height: '100%',
		borderRadius: 3,
	},
	predictionCategoryPercentage: {
		fontSize: 12,
		fontWeight: '600',
		minWidth: 40,
		textAlign: 'right',
	},
	predictionCategoryAmount: {
		alignItems: 'flex-end',
		marginLeft: 12,
	},
	predictionCategoryAmountText: {
		fontSize: 15,
		fontWeight: '700',
	},
	predictionDialogActions: {
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	emptyPrediction: {
		padding: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyPredictionText: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	emptyPredictionSubtext: {
		fontSize: 14,
		textAlign: 'center',
		opacity: 0.7,
	},
});

