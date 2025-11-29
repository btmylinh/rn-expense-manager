// screens/setup/AfterRegisterSetupScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator} from 'react-native';
import { Button, TextInput, Text, Chip, RadioButton, ProgressBar, Snackbar, Portal, Dialog, IconButton } from 'react-native-paper';
import CategoryCreateForm from '../../components/CategoryCreateForm';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { userCategoryApi } from '../../api/userCategoryApi';
import { walletApi } from '../../api/walletApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AfterRegisterSetupScreen({ route, navigation }: any) {
	const theme = useAppTheme();
	const { user } = useAuth();
	const [step, setStep] = useState(1);
	const totalSteps = 3;
	const progress = step / totalSteps;
	const [snack, setSnack] = useState<string | null>(null);
	const [checkingWallets, setCheckingWallets] = useState(true);

  // Step 1: Wallet (collect only, defer API)
  const [walletName, setWalletName] = useState('Ví chính');
  const [walletAmount, setWalletAmount] = useState('0'); // hiển thị dạng "1.000.000"

  // Helper: format number with thousand separators for VND
  const formatCurrency = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) return '0';
    const trimmed = numeric.replace(/^0+(?!$)/, '');
    return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseCurrencyToNumber = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    return numeric ? Number(numeric) : 0;
  };

  const handleWalletAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setWalletAmount(formatted);
  };

	// Step 2: Currency (collect only, defer API)
	const [currency, setCurrency] = useState<string>('VND');

	// Step 3: Categories
	const [suggestionItems, setSuggestionItems] = useState<any[]>([]);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
	const incomeSuggestions = useMemo(() => suggestionItems.filter(c => c.type === 1), [suggestionItems]);
	const expenseSuggestions = useMemo(() => suggestionItems.filter(c => c.type === 2), [suggestionItems]);

	// Custom categories (collected locally, defer API)
	const [customCats, setCustomCats] = useState<Array<{ name: string; type: number; icon: string }>>([]);
	const [selectedCustomIdx, setSelectedCustomIdx] = useState<number[]>([]);

	// Add-new modal state
	const [modalVisible, setModalVisible] = useState(false);
	const [newType, setNewType] = useState<number>(2);
	const [newCategoryName, setNewCategoryName] = useState('');
	const iconChoices: string[] = [
		'food', 'food-fork-drink', 'coffee', 'beer', 'cup', 'silverware-fork-knife',
		'bus', 'car', 'motorbike', 'gas-station', 'taxi', 'train', 'airplane',
		'home', 'lightbulb', 'water', 'sofa', 'broom', 'tools',
		'shopping', 'cart', 'bag-personal', 'shoe-sneaker', 'tshirt-crew', 'tag-outline',
		'wallet', 'credit-card', 'bank', 'currency-usd', 'piggy-bank', 'chart-line',
		'movie-open', 'gamepad-variant', 'music', 'ticket', 'book-open-page-variant',
		'heart', 'dumbbell', 'meditation', 'pill', 'spa', 'sleep',
		'school', 'laptop', 'book', 'pencil', 'library',
		'gift', 'party-popper', 'dog', 'cat', 'leaf'
	];
	const [newIcon, setNewIcon] = useState<string>('tag-outline');

	// Check if user already has wallets on mount
	useEffect(() => {
		const checkWallets = async () => {
			try {
				setCheckingWallets(true);
				const response = await walletApi.getWallets();
				const responseData = response.data;
				const wallets = responseData?.data?.wallets || responseData?.wallets || [];
				
				// Nếu user đã có ví, navigate thẳng đến Tabs
				if (wallets.length > 0) {
					navigation.replace('Tabs', { initialTab: 'Thêm' });
					return;
				}
				
				// Nếu chưa có ví, load categories để hiển thị setup
				const categoriesResponse = await userCategoryApi.getListCategory();
				const categories = categoriesResponse.data?.data || categoriesResponse.data || [];
				setSuggestionItems(categories);
				if (categories.length > 0) {
				setSelectedCategoryIds(categories.slice(0, 2).map((c: any) => c.id));
				}
			} catch (error) {
				console.error('Failed to check wallets:', error);
				// Nếu lỗi, vẫn hiển thị setup để user có thể tạo ví
			} finally {
				setCheckingWallets(false);
			}
		};
		
		if (user) {
			checkWallets();
		} else {
			// Nếu chưa có user, quay lại login
			navigation.replace('Login');
		}
	}, [user, navigation]);

	const toggleCategoryId = (id: number) => {
		setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
	};
	const toggleCustomIdx = (idx: number) => {
		setSelectedCustomIdx(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
	};
	const openAddModal = (type: number) => {
		setNewType(type);
		setNewCategoryName('');
		setNewIcon('tag-outline');
		setModalVisible(true);
	};

	const onBack = () => {
		if (step > 1) setStep(step - 1);
		else navigation.goBack();
	};

	const canComplete = useMemo(() => {
		const existingCount = selectedCategoryIds.length;
		const customCount = selectedCustomIdx.length;
		return existingCount + customCount > 0;
	}, [selectedCategoryIds, selectedCustomIdx]);

	const onNext = async () => {
		if (step === 1) {
			// Defer wallet creation to final step
			setStep(2);
			return;
		}
		if (step === 2) {
			// Defer currency save to final step
			setStep(3);
			return;
		}
		if (step === 3) {
			try {
				// 1) Create wallet
				await walletApi.createWallet({
					name: (walletName || 'Ví').trim(),
					amount: parseCurrencyToNumber(walletAmount),
					currency: currency,
					is_default: 1, // First wallet is default
				});
				
				// 2) Add selected suggestion categories
				const categoriesToCreate: Array<{ name: string; type: 1 | 2; icon: string }> = [];
				for (const id of selectedCategoryIds) {
					const cat = suggestionItems.find(c => c.id === id);
					if (cat) {
						categoriesToCreate.push({
							name: cat.name,
							type: (cat.type === 1 || cat.type === 2) ? cat.type : 1,
							icon: cat.icon ?? 'tag-outline',
						});
					}
				}
				
				// 3) Add custom categories collected during setup
				for (const idx of selectedCustomIdx) {
					const c = customCats[idx];
					if (c) {
						categoriesToCreate.push({
							name: c.name,
							type: (c.type === 1 || c.type === 2) ? c.type : 1,
							icon: c.icon,
						});
					}
				}
				
				// Create all categories in batch
				if (categoriesToCreate.length > 0) {
					await userCategoryApi.createManyCategories(categoriesToCreate);
				}
				
				setSnack('Thiết lập thành công!');
				setTimeout(() => navigation.replace('Tabs', { initialTab: 'Thêm' }), 700);
			} catch (error) {
				console.error('Setup error:', error);
				setSnack('Thiết lập thất bại, vui lòng thử lại');
			}
		}
	};

	if (checkingWallets) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={{ marginTop: 16, color: theme.colors.onBackground }}>Đang kiểm tra...</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, padding: theme.spacing(3), gap: theme.spacing(2) }}>
			{/* Header */}
			<View style={{ alignItems: 'center' }}>
				<Text style={[theme.semantic.typography.h2, { color: theme.colors.primary }]}>Chào mừng đến với FinMate!</Text>
			</View>

			{/* Step indicator */}
			<ProgressBar progress={progress} color={theme.colors.primary} style={{ height: 8, borderRadius: theme.radius.pill }} />
			<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant, textAlign: 'right' }]}>Bước {step}/{totalSteps}</Text>

			{/* Step content */}
			{step === 1 && (
				<View style={{ gap: theme.spacing(2) }}>
					<View style={{ alignItems: 'center' }}>
						<MaterialCommunityIcons name="wallet" size={48} color={theme.colors.primary} />
					</View>
					<Text style={theme.semantic.typography.h3}>Tạo ví đầu tiên của bạn</Text>
					<TextInput label="Tên ví" value={walletName} onChangeText={setWalletName} left={<TextInput.Icon icon="wallet" />} />
					<TextInput
						label="Số dư ban đầu"
						value={walletAmount}
						onChangeText={handleWalletAmountChange}
						keyboardType="number-pad"
						left={<TextInput.Icon icon="cash" />}
					/>
				</View>
			)}

			{step === 2 && (
				<View style={{ gap: theme.spacing(2) }}>
					<View style={{ alignItems: 'center' }}>
						<MaterialCommunityIcons name="currency-usd" size={48} color={theme.colors.primary} />
					</View>
					<Text style={theme.semantic.typography.h3}>Chọn đơn vị tiền tệ mặc định</Text>
					<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant }]}>Bạn có thể thay đổi sau trong Cài đặt.</Text>
					<RadioButton.Group onValueChange={v => setCurrency(v)} value={currency}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
							<RadioButton value="VND" />
							<Text>VNĐ</Text>
						</View>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
							<RadioButton value="USD" />
							<Text>USD</Text>
						</View>
					</RadioButton.Group>
				</View>
			)}

			{step === 3 && (
				<View style={{ gap: theme.spacing(2) }}>
					<View style={{ alignItems: 'center' }}>
						<MaterialCommunityIcons name="folder-outline" size={48} color={theme.colors.primary} />
					</View>
					<Text style={theme.semantic.typography.h3}>Chọn phân loại giao dịch</Text>
					{/* Income section */}
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 16, fontWeight: 'bold' }}>Thu nhập</Text>
						<IconButton
							icon="plus"
							mode="contained"
							size={20}
							containerColor={theme.colors.primary}
							iconColor={theme.colors.onPrimary}
							onPress={() => openAddModal(1)}
							style={{ borderRadius: theme.radius.pill }}
						/>
					</View>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{incomeSuggestions.map(s => (
							<Chip
								key={s.id}
								selected={selectedCategoryIds.includes(s.id)}
								onPress={() => toggleCategoryId(s.id)}
								style={{ borderWidth: selectedCategoryIds.includes(s.id) ? 1 : 0, borderColor: theme.colors.primary }}
								icon={() => <MaterialCommunityIcons name={(s.icon as any) || 'tag-outline'} size={18} color={theme.colors.onSurface} />}
							>
								{s.name}
							</Chip>
						))}
						{customCats.map((c, idx) => c.type === 1 ? (
							<Chip key={`c-${idx}`} selected={selectedCustomIdx.includes(idx)} onPress={() => toggleCustomIdx(idx)} style={{ borderWidth: selectedCustomIdx.includes(idx) ? 1 : 0, borderColor: theme.colors.primary }} icon={() => <MaterialCommunityIcons name={c.icon as any} size={18} color={theme.colors.onSurface} />}>{c.name}</Chip>
						) : null)}
					</View>

					{/* Expense section */}
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 16, fontWeight: 'bold' }}>Chi tiêu</Text>
						<IconButton
							icon="plus"
							mode="contained"
							size={20}
							containerColor={theme.colors.primary}
							iconColor={theme.colors.onPrimary}
							onPress={() => openAddModal(2)}
							style={{ borderRadius: theme.radius.pill }}
						/>
					</View>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{expenseSuggestions.map(s => (
							<Chip
								key={s.id}
								selected={selectedCategoryIds.includes(s.id)}
								onPress={() => toggleCategoryId(s.id)}
								style={{ borderWidth: selectedCategoryIds.includes(s.id) ? 1 : 0, borderColor: theme.colors.primary }}
								icon={() => <MaterialCommunityIcons name={(s.icon as any) || 'tag-outline'} size={18} color={theme.colors.onSurface} />}
							>
								{s.name}
							</Chip>
						))}
						{customCats.map((c, idx) => c.type === 2 ? (
							<Chip key={`c-${idx}`} selected={selectedCustomIdx.includes(idx)} onPress={() => toggleCustomIdx(idx)} style={{ borderWidth: selectedCustomIdx.includes(idx) ? 1 : 0, borderColor: theme.colors.primary }} icon={() => <MaterialCommunityIcons name={c.icon as any} size={18} color={theme.colors.onSurface} />}>{c.name}</Chip>
						) : null)}
					</View>
				</View>
			)}

			{/* Actions */}
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing(2) }}>
				{step > 1 ? (
					<Button mode="text" onPress={onBack}>Quay lại</Button>
				) : <View />}
				<Button mode="contained" onPress={onNext} disabled={step === 3 && !canComplete}>{step < totalSteps ? 'Tiếp tục' : 'Hoàn tất'}</Button>
			</View>

			{/* Modal add new category */}
			<CategoryCreateForm
				visible={modalVisible}
				onDismiss={() => setModalVisible(false)}
				initialType={newType === 1 ? 'income' : 'expense'}
				allowTypeChange={false}
				onSubmit={({ name, type, icon }) => {
					// Lưu tạm theo loại đã chọn từ nút + (không cho đổi trong form)
					const forcedType = newType; // 1 thu, 2 chi
					const item = { name, type: forcedType, icon } as any;
					setCustomCats(prev => [...prev, item]);
					setSelectedCustomIdx(prev => [...prev, (prev.length ? Math.max(...prev) : -1) + 1]);
				}}
			/>

			<Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={800}>{snack}</Snackbar>
		</View>
	);
}

