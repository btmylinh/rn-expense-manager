// screens/savings/SavingsGoalCreateScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Card, Snackbar, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { fakeApi } from '../../services/fakeApi';
import AppBar from '../../components/AppBar';
import DateTimePicker from '@react-native-community/datetimepicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SavingsGoalCreateRouteProp = RouteProp<RootStackParamList, 'SavingsGoalCreate'>;

// Predefined icons for goals
const GOAL_ICONS = [
	'laptop', 'car', 'home', 'airplane', 'gift', 'heart',
	'camera', 'gamepad-variant', 'book', 'music', 'dumbbell', 'bicycle',
	'shield-check', 'piggy-bank', 'diamond', 'trophy', 'star', 'target'
];

// Predefined colors
const GOAL_COLORS = [
	'#FF8A00', '#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#FF9800',
	'#795548', '#607D8B', '#E91E63', '#3F51B5', '#009688', '#8BC34A'
];

// Currency options
const CURRENCIES = [
	{ code: 'VND', symbol: 'đ'},
	{ code: 'USD', symbol: '$'}
];

export default function SavingsGoalCreateScreen() {
	const theme = useAppTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<SavingsGoalCreateRouteProp>();
	const { user } = useAuth();
	const userId = user?.id || 1;
	
	const { goalId } = route.params || {};
	const isEditMode = !!goalId;
	
	// Form state
	const [name, setName] = useState('');
	const [targetAmount, setTargetAmount] = useState('');
	const [currentAmount, setCurrentAmount] = useState('0');
	const [deadline, setDeadline] = useState(new Date());
	const [selectedIcon, setSelectedIcon] = useState('target');
	const [selectedColor, setSelectedColor] = useState('#FF8A00');
	const [selectedCurrency, setSelectedCurrency] = useState('VND');
	const [loading, setLoading] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [snackMessage, setSnackMessage] = useState('');
	
	// Validation errors
	const [errors, setErrors] = useState<{[key: string]: string}>({});

	// Load existing goal data if editing
	useEffect(() => {
		if (isEditMode && goalId) {
			loadGoalData();
		}
	}, [goalId, isEditMode]);

	const loadGoalData = async () => {
		try {
			setLoading(true);
			const response = await fakeApi.getSavingsGoalDetail(userId, goalId!);
		if (response.success && response.data) {
			const goal = response.data;
			setName(goal.name);
			setTargetAmount(goal.targetAmount.toString());
			setCurrentAmount(goal.currentAmount.toString());
			setDeadline(new Date(goal.deadline));
			setSelectedIcon(goal.icon);
			setSelectedColor(goal.color);
			setSelectedCurrency(goal.currency || 'VND');
		}
		} catch (error) {
			console.error('Error loading goal:', error);
			setSnackMessage('Không thể tải thông tin mục tiêu');
		} finally {
			setLoading(false);
		}
	};

	// Calculate monthly savings needed
	const calculateMonthlySavings = () => {
		const target = parseFloat(targetAmount) || 0;
		const current = parseFloat(currentAmount) || 0;
		const remaining = target - current;
		
		if (remaining <= 0) return 0;
		
		const today = new Date();
		const deadlineDate = new Date(deadline);
		const monthsDiff = (deadlineDate.getFullYear() - today.getFullYear()) * 12 + 
						  (deadlineDate.getMonth() - today.getMonth());
		
		if (monthsDiff <= 0) return remaining;
		
		return remaining / monthsDiff;
	};

	// Validation
	const validateForm = () => {
		const newErrors: {[key: string]: string} = {};
		
		if (!name.trim()) {
			newErrors.name = 'Tên mục tiêu không được để trống';
		}
		
		const target = parseFloat(targetAmount);
		if (!target || target <= 0) {
			newErrors.targetAmount = 'Số tiền mục tiêu phải lớn hơn 0';
		}
		
		const current = parseFloat(currentAmount) || 0;
		if (current < 0) {
			newErrors.currentAmount = 'Số tiền hiện có không được âm';
		}
		
		if (current > target) {
			newErrors.currentAmount = 'Số tiền hiện có không được lớn hơn mục tiêu';
		}
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const deadlineDate = new Date(deadline);
		deadlineDate.setHours(0, 0, 0, 0);
		
		if (deadlineDate <= today) {
			newErrors.deadline = 'Ngày mục tiêu phải sau hôm nay';
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Handle form submission
	const handleSubmit = async () => {
		if (!validateForm()) return;
		
		try {
			setLoading(true);
			
			const goalData = {
				name: name.trim(),
				targetAmount: parseFloat(targetAmount),
				deadline: deadline.toISOString().split('T')[0],
				icon: selectedIcon,
				color: selectedColor,
				currency: selectedCurrency
			};
			
			let response;
			if (isEditMode) {
				response = await fakeApi.updateSavingsGoal(userId, goalId!, goalData);
			} else {
				response = await fakeApi.createSavingsGoal(userId, goalData);
				// If there's initial amount, add it as a contribution
				if (parseFloat(currentAmount) > 0) {
					await fakeApi.addContribution(userId, response.data.id, parseFloat(currentAmount), 'Số tiền ban đầu');
				}
			}
			
			if (response.success) {
				setSnackMessage(isEditMode ? 'Cập nhật mục tiêu thành công!' : 'Tạo mục tiêu thành công!');
				setTimeout(() => {
					navigation.goBack();
				}, 1000);
			} else {
				setSnackMessage('Có lỗi xảy ra');
			}
		} catch (error) {
			console.error('Error saving goal:', error);
			setSnackMessage('Có lỗi xảy ra khi lưu mục tiêu');
		} finally {
			setLoading(false);
		}
	};

	const getCurrentCurrency = () => {
		return CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
	};

	const formatCurrency = (value: string) => {
		const number = parseFloat(value.replace(/[^0-9]/g, ''));
		if (isNaN(number)) return '';
		
		if (selectedCurrency === 'USD') {
			return number.toLocaleString('en-US');
		} else {
			return number.toLocaleString('vi-VN');
		}
	};

	const handleAmountChange = (value: string, setter: (val: string) => void) => {
		const cleanValue = value.replace(/[^0-9]/g, '');
		setter(cleanValue);
	};

	const monthlySavings = calculateMonthlySavings();

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<AppBar 
				title={isEditMode ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới'} 
				onBack={() => navigation.goBack()} 
			/>
			
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				{/* Goal Name */}
				<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
							Thông tin mục tiêu
						</Text>
						
						<TextInput
							label="Tên mục tiêu *"
							value={name}
							onChangeText={setName}
							mode="outlined"
							style={styles.input}
							error={!!errors.name}
							placeholder="VD: Mua laptop, Du lịch Đà Lạt..."
						/>
						{errors.name && (
							<Text style={[styles.errorText, { color: theme.colors.error }]}>
								{errors.name}
							</Text>
						)}
					</Card.Content>
				</Card>

				{/* Amount Information */}
				<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
							Thông tin số tiền
						</Text>
						
						<TextInput
							label="Số tiền mục tiêu *"
							value={formatCurrency(targetAmount)}
							onChangeText={(value) => handleAmountChange(value, setTargetAmount)}
							mode="outlined"
							style={styles.input}
							keyboardType="numeric"
							error={!!errors.targetAmount}
							right={<TextInput.Affix text={getCurrentCurrency().symbol} />}
						/>
						{errors.targetAmount && (
							<Text style={[styles.errorText, { color: theme.colors.error }]}>
								{errors.targetAmount}
							</Text>
						)}
						
						{!isEditMode && (
							<>
								<TextInput
									label="Số tiền hiện có"
									value={formatCurrency(currentAmount)}
									onChangeText={(value) => handleAmountChange(value, setCurrentAmount)}
									mode="outlined"
									style={styles.input}
									keyboardType="numeric"
									error={!!errors.currentAmount}
									right={<TextInput.Affix text={getCurrentCurrency().symbol} />}
								/>
								{errors.currentAmount && (
									<Text style={[styles.errorText, { color: theme.colors.error }]}>
										{errors.currentAmount}
									</Text>
								)}
							</>
						)}
						
						{/* Currency Selection - Simple Tabs */}
						<View style={styles.currencySection}>
							<Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
								Đơn vị tiền tệ
							</Text>
							<SegmentedButtons
								value={selectedCurrency}
								onValueChange={setSelectedCurrency}
								buttons={[
									{
										value: 'VND',
										label: 'đ VND',
										icon: 'currency-usd'
									},
									{
										value: 'USD', 
										label: '$ USD',
										icon: 'currency-usd'
									}
								]}
								style={styles.currencySegments}
							/>
						</View>
						
						{/* Monthly savings calculation */}
						{monthlySavings > 0 && (
							<View style={[styles.calculationBox, { backgroundColor: theme.colors.primaryContainer }]}>
								<MaterialCommunityIcons 
									name="calculator" 
									size={20} 
									color={theme.colors.primary} 
								/>
								<Text style={[styles.calculationText, { color: "#000" }]}>
									Cần tiết kiệm ~{monthlySavings.toLocaleString()}{getCurrentCurrency().symbol}/tháng để đạt mục tiêu
								</Text>
							</View>
						)}
					</Card.Content>
				</Card>

				{/* Deadline */}
				<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
							Thời hạn
						</Text>
						
						<TouchableOpacity
							style={[styles.dateButton, { borderColor: errors.deadline ? theme.colors.error : theme.colors.outline }]}
							onPress={() => setShowDatePicker(true)}
						>
							<MaterialCommunityIcons 
								name="calendar" 
								size={24} 
								color={theme.colors.onSurface} 
							/>
							<Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
								{deadline.toLocaleDateString('vi-VN')}
							</Text>
						</TouchableOpacity>
						{errors.deadline && (
							<Text style={[styles.errorText, { color: theme.colors.error }]}>
								{errors.deadline}
							</Text>
						)}
						
						{showDatePicker && (
							<DateTimePicker
								value={deadline}
								mode="date"
								display="default"
								onChange={(event, selectedDate) => {
									setShowDatePicker(false);
									if (selectedDate) {
										setDeadline(selectedDate);
									}
								}}
								minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
							/>
						)}
					</Card.Content>
				</Card>

				{/* Icon Selection */}
				<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
							Chọn biểu tượng
						</Text>
						
						<View style={styles.iconGrid}>
							{GOAL_ICONS.map((icon) => (
								<TouchableOpacity
									key={icon}
									style={[
										styles.iconButton,
										{ 
											backgroundColor: selectedIcon === icon ? selectedColor + '33' : theme.colors.surfaceVariant,
											borderColor: selectedIcon === icon ? selectedColor : 'transparent'
										}
									]}
									onPress={() => setSelectedIcon(icon)}
								>
									<MaterialCommunityIcons
										name={icon as any}
										size={24}
										color={selectedIcon === icon ? selectedColor : theme.colors.onSurfaceVariant}
									/>
								</TouchableOpacity>
							))}
						</View>
					</Card.Content>
				</Card>

				{/* Color Selection */}
				<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
							Chọn màu sắc
						</Text>
						
						<View style={styles.colorGrid}>
							{GOAL_COLORS.map((color) => (
								<TouchableOpacity
									key={color}
									style={[
										styles.colorButton,
										{ 
											backgroundColor: color,
											borderColor: selectedColor === color ? color : 'transparent',
											borderWidth: selectedColor === color ? 3 : 1
										}
									]}
									onPress={() => setSelectedColor(color)}
								>
									{selectedColor === color && (
										<MaterialCommunityIcons
											name="check"
											size={16}
											color="#FFFFFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</Card.Content>
				</Card>

			</ScrollView>

			{/* Submit Button */}
			<View style={[styles.buttonContainer, { backgroundColor: theme.colors.background }]}>
				<Button
					mode="contained"
					onPress={handleSubmit}
					loading={loading}
					disabled={loading}
					style={styles.submitButton}
					contentStyle={styles.submitButtonContent}
				>
					{isEditMode ? 'Cập nhật mục tiêu' : 'Tạo mục tiêu'}
				</Button>
			</View>

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
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 100,
	},
	card: {
		marginBottom: 16,
		borderRadius: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	input: {
		marginBottom: 8,
	},
	errorText: {
		fontSize: 12,
		marginTop: 4,
		marginBottom: 8,
	},
	calculationBox: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		marginTop: 8,
	},
	calculationText: {
		fontSize: 14,
		fontWeight: '500',
		marginLeft: 8,
		flex: 1,
	},
	dateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 8,
	},
	dateText: {
		fontSize: 16,
		marginLeft: 12,
	},
	iconGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	iconButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
	},
	colorGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	colorButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
	},
	currencySection: {
		marginBottom: 16,
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 8,
	},
	currencySegments: {
		marginHorizontal: 0,
	},
	buttonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		paddingBottom: 32,
	},
	submitButton: {
		borderRadius: 24,
	},
	submitButtonContent: {
		paddingVertical: 8,
	},
});
