// screens/BudgetsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';
import { fakeApi } from '../../services/fakeApi';
import { Modal, Portal, Snackbar, ProgressBar, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import AppBar from '../../components/AppBar';
import BudgetContent from './BudgetContent';
import WalletSelectModal from '../../components/WalletSelectModal';

export default function BudgetsScreen() {
  const theme = useAppTheme();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const userId = 1; // mock
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState(0);
	const [timeTabs, setTimeTabs] = useState<Array<{ label: string, startDate: string, endDate: string }>>([]);
	const [isCreateModalVisible, setCreateModalVisible] = useState(false);
	const [isEdit, setIsEdit] = useState(false);
	const [formBudget, setFormBudget] = useState<any>({});
	const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [snack, setSnack] = useState('');
	const [isDetailVisible, setDetailVisible] = useState(false);
	const [detailBudget, setDetailBudget] = useState<any>(null);
	const [budgetTransactions, setBudgetTransactions] = useState<any[]>([]);
	const [spent, setSpent] = useState(0);
	const [progressPct, setProgressPct] = useState(0);
	const [alertOver, setAlertOver] = useState(false);
	const [walletSheetVisible, setWalletSheetVisible] = useState(false);
	const [currentWalletId, setCurrentWalletId] = useState<number | undefined>(undefined);
	const [walletName, setWalletName] = useState<string>('Chọn ví');
	const [wallets, setWallets] = useState<any[]>([]);

	function toLocalYMD(d: Date) {
		const year = d.getFullYear();
		const month = (d.getMonth() + 1).toString().padStart(2, '0');
		const day = d.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	function formatVNDate(dateStr: string) {
		const d = new Date(dateStr);
		return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
	}
	function currentPeriods() {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const day = now.getDay();
		const diffToMonday = (day + 6) % 7;
		const weekStart = new Date(y, m, now.getDate() - diffToMonday);
		const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
		const monthStart = new Date(y, m, 1);
		const monthEnd = new Date(y, m + 1, 0);
		const q = Math.floor(m / 3);
		const quarterStart = new Date(y, q * 3, 1);
		const quarterEnd = new Date(y, q * 3 + 3, 0);
		const yearStart = new Date(y, 0, 1);
		const yearEnd = new Date(y, 12, 0);
		return {
			week: { start: toLocalYMD(weekStart), end: toLocalYMD(weekEnd) },
			month: { start: toLocalYMD(monthStart), end: toLocalYMD(monthEnd) },
			quarter: { start: toLocalYMD(quarterStart), end: toLocalYMD(quarterEnd) },
			year: { start: toLocalYMD(yearStart), end: toLocalYMD(yearEnd) },
		};
	}

	// Load initial wallet and categories
  useEffect(() => {
    (async () => {
			const [cats, cw, ws] = await Promise.all([
				fakeApi.getUserCategories(userId),
				fakeApi.getCurrentWalletId(userId),
				fakeApi.getWallets(userId),
			]);
      setCategories(cats);
			setWallets(ws);
			if ((cw as any)?.walletId) {
				setCurrentWalletId((cw as any).walletId);
				const w = await fakeApi.getWallet(userId, (cw as any).walletId as number);
				if ((w as any)?.wallet?.name) setWalletName((w as any).wallet.name);
			}
    })();
  }, []);

	// Load budgets by wallet (API already calculates spent and chartData)
	useEffect(() => {
		(async () => {
			if (!currentWalletId) return;
			setLoading(true);
			
			// API already filters active budgets and calculates spent/chartData
			const data = await fakeApi.getBudgets(userId, currentWalletId);
			
			// Filter only active budgets (end_date >= today)
			const now = new Date();
			const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const activeBudgets = data.filter(b => {
				const e = new Date(b.endDate);
				const eOnly = new Date(e.getFullYear(), e.getMonth(), e.getDate());
				return eOnly.getTime() >= todayOnly.getTime();
			});
			setBudgets(activeBudgets);

			// Build tabs from budget date ranges (simplified)
			const groups = new Map<string, { startDate: string, endDate: string }>();
			activeBudgets.forEach(b => {
				const key = `${b.startDate}_${b.endDate}`;
				if (!groups.has(key)) groups.set(key, { startDate: b.startDate, endDate: b.endDate });
			});
			
			const periods = currentPeriods();
			const tabs: Array<{ label: string, startDate: string, endDate: string }> = [];
			
			groups.forEach(({ startDate, endDate }) => {
				let label = `${formatVNDate(startDate)} - ${formatVNDate(endDate)}`;
				
				// Check if it matches standard periods
				if (startDate === periods.week.start && endDate === periods.week.end) label = 'Tuần này';
				else if (startDate === periods.month.start && endDate === periods.month.end) label = 'Tháng này';
				else if (startDate === periods.quarter.start && endDate === periods.quarter.end) label = 'Quý này';
				else if (startDate === periods.year.start && endDate === periods.year.end) label = 'Năm nay';
				
				tabs.push({ label, startDate, endDate });
			});
			
			// Sort tabs: standard periods first, then custom by date
			const order = { 'Tuần này': 1, 'Tháng này': 2, 'Quý này': 3, 'Năm nay': 4 };
			tabs.sort((a, b) => {
				const aOrder = (order as any)[a.label] || 99;
				const bOrder = (order as any)[b.label] || 99;
				if (aOrder !== bOrder) return aOrder - bOrder;
				return a.startDate < b.startDate ? 1 : -1; // Custom dates: newest first
			});
			
			setTimeTabs(tabs);
			setActiveTab(0);
			setLoading(false);
		})();
	}, [currentWalletId]);

	// Refresh when screen focused
	useEffect(() => {
		const unsubscribe = (navigation as any).addListener('focus', async () => {
			if (!currentWalletId) return;
			setLoading(true);
			
			// Reload categories and budgets (API already calculates spent/chartData)
			const [cats, data] = await Promise.all([
				fakeApi.getUserCategories(userId),
				fakeApi.getBudgets(userId, currentWalletId)
			]);
			
			setCategories(cats);
			
			// Filter active budgets
			const now = new Date();
			const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const activeBudgets = data.filter(b => {
				const e = new Date(b.endDate);
				const eOnly = new Date(e.getFullYear(), e.getMonth(), e.getDate());
				return eOnly.getTime() >= todayOnly.getTime();
			});
			setBudgets(activeBudgets);

			// Rebuild tabs from activeBudgets (simplified)
			const groups = new Map<string, { startDate: string, endDate: string }>();
			activeBudgets.forEach(b => {
				const key = `${b.startDate}_${b.endDate}`;
				if (!groups.has(key)) groups.set(key, { startDate: b.startDate, endDate: b.endDate });
			});
			const periods = currentPeriods();
			const standardFirst: Array<{ label: string, startDate: string, endDate: string }> = [];
			const customAfter: Array<{ label: string, startDate: string, endDate: string }> = [];
			groups.forEach(({ startDate, endDate }) => {
				let label = `${formatVNDate(startDate)} - ${formatVNDate(endDate)}`;
				if (startDate === periods.week.start && endDate === periods.week.end) label = 'Tuần này';
				else if (startDate === periods.month.start && endDate === periods.month.end) label = 'Tháng này';
				else if (startDate === periods.quarter.start && endDate === periods.quarter.end) label = 'Quý này';
				else if (startDate === periods.year.start && endDate === periods.year.end) label = 'Năm nay';
				const tab = { label, startDate, endDate };
				if (label === 'Tuần này' || label === 'Tháng này' || label === 'Quý này' || label === 'Năm nay') standardFirst.push(tab);
				else customAfter.push(tab);
			});
			const order = { 'Tuần này': 1, 'Tháng này': 2, 'Quý này': 3, 'Năm nay': 4 } as Record<string, number>;
			standardFirst.sort((a, b) => (order[a.label] || 99) - (order[b.label] || 99));
			customAfter.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
			setTimeTabs([...standardFirst, ...customAfter]);
			setActiveTab(0);

			setLoading(false);
		});
		return unsubscribe;
	}, [navigation, currentWalletId]);

	const handleSaveBudget = async () => {
		if (!formBudget.userCategoryId || !formBudget.amount || !formBudget.startDate) {
			setSnack('Vui lòng nhập đủ thông tin!'); return;
		}
		const payload = {
			userCategoryId: formBudget.userCategoryId,
			walletId: formBudget.walletId,
			amount: formBudget.amount,
			startDate: formBudget.startDate,
			endDate: formBudget.endDate,
			isRepeat: formBudget.repeat,
		};
		if (isEdit) {
			await fakeApi.updateBudget(userId, formBudget.id, payload);
			setSnack('Đã cập nhật ngân sách');
		} else {
			const res = await fakeApi.createBudget(userId, payload as any);
			if (!(res as any).success) { setSnack((res as any).message || 'Không thể tạo'); return; }
			setSnack('Đã thêm ngân sách');
		}
		const data = await fakeApi.getBudgets(userId, currentWalletId);
		setBudgets(data);
		setCreateModalVisible(false);
	};
	const handleDelete = async () => {
		if (!formBudget.id) return;
		await fakeApi.deleteBudget(userId, formBudget.id);
		setSnack('Đã xoá ngân sách');
		setCreateModalVisible(false);
		setBudgets(await fakeApi.getBudgets(userId, currentWalletId));
	};
	const openCreate = () => {
		navigation.navigate('BudgetCreate', {
			categories,
			budget: {},
			editMode: false
		});
	};
	const openEdit = (budget: any) => {
		navigation.navigate('BudgetCreate', {
			categories,
			budget,
			editMode: true
		});
	};

  return (
		<View style={[styles.container, { backgroundColor: theme.colors.background, padding: theme.spacing(3) }]}>
			{/* App Bar with wallet selector (replace title) */}
			<View style={[theme.ui.appBar, styles.appBar, { backgroundColor: theme.colors.surface, paddingTop: 0 }]}> 
				<TouchableOpacity style={styles.walletSelector} onPress={() => setWalletSheetVisible(true)}>
					<Text style={[styles.walletTitle, { color: theme.colors.onSurface }]}>{walletName}</Text>
					<IconButton icon="chevron-down" size={20} iconColor={theme.colors.onSurface} />
				
				{/* History Icon */}
				<IconButton 
					icon="history" 
					size={20} 
					iconColor={theme.colors.onSurface}
					onPress={() => navigation.navigate('BudgetHistory')}
				/>
				</TouchableOpacity>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.tabsWrap}
				contentContainerStyle={styles.tabsContent}
			>
				{timeTabs.map((tab, idx) => (
              <TouchableOpacity
						key={tab.label + tab.startDate + tab.endDate}
						style={[styles.tabBtn, { backgroundColor: activeTab === idx ? theme.colors.primary : theme.colors.surface }]}
						onPress={() => setActiveTab(idx)}
					>
						<Text style={[styles.tabText, { color: activeTab === idx ? '#fff' : theme.colors.onSurface }]}>
							{tab.label}
						</Text>
              </TouchableOpacity>
            ))}
			</ScrollView>

			{timeTabs.length > 0 ? (
				<BudgetContent
					budgets={budgets}
					categories={categories}
					timeRange={timeTabs[activeTab]}
					onEdit={openEdit}
					onViewDetail={(budgetId) => {
						navigation.navigate('BudgetDetail', { budgetId });
					}}
					onStartCreate={() => {
						const range = timeTabs[activeTab];
						navigation.navigate('BudgetCreate', {
							categories,
							budget: { startDate: range.startDate, endDate: range.endDate, walletId: currentWalletId },
							editMode: false
						});
					}}
				/>
			) : (
				<View style={styles.emptyWrap}>
					<Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Không có ngân sách hiệu lực.</Text>
          </View>
      )}
      <Portal>
				<Modal visible={isDetailVisible} onDismiss={() => setDetailVisible(false)} contentContainerStyle={[theme.ui.modalContainer, styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
					{detailBudget && (
						<>
							<View style={styles.modalHeader}>
								<Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Chi tiết ngân sách</Text>
								{alertOver && (
									<Text style={[styles.modalWarn, { color: '#d97706' }]}>Cảnh báo: Đã sử dụng {progressPct}% hạn mức!</Text>
								)}
								<Text style={[styles.modalSub, { color: theme.colors.onSurfaceVariant }]}>Từ {detailBudget.startDate} đến {detailBudget.endDate}</Text>
							</View>
							<View style={styles.modalBody}>
								<Text style={[styles.modalBodyText, { color: theme.colors.onSurface }]}>Danh mục: {categories.find((c: any) => c.id === detailBudget.userCategoryId)?.name || '-'}</Text>
								<ProgressBar progress={progressPct / 100} color={progressPct >= 80 ? '#f59e0b' : theme.colors.primary} style={styles.modalProgress} />
								<Text style={[styles.modalBodyText, { color: theme.colors.onSurfaceVariant }]}>Đã chi: {spent.toLocaleString()} / {detailBudget.amount.toLocaleString()} đ</Text>
							</View>
							<Text style={[styles.modalSectionTitle, { color: theme.colors.onSurface }]}>Giao dịch liên quan:</Text>
							<ScrollView style={styles.modalTxList}>
								{budgetTransactions.length === 0 ? <Text>Chưa có giao dịch nào.</Text> : budgetTransactions.map((t: any) => (
									<View key={t.id} style={styles.modalTxItem}>
										<Text>{t.content || '-'} | {t.amount.toLocaleString()}đ ({t.transactionDate})</Text>
									</View>))}
							</ScrollView>
							<View style={styles.modalActions}>
								<Button onPress={() => { setDetailVisible(false); openEdit(detailBudget); }}>Sửa</Button>
								<Button onPress={() => setDetailVisible(false)}>Đóng</Button>
							</View>
						</>
					)}
				</Modal>
        <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>{snack}</Snackbar>
      </Portal>

			<WalletSelectModal
				visible={walletSheetVisible}
				wallets={wallets}
				selectedWalletId={currentWalletId}
				onDismiss={() => setWalletSheetVisible(false)}
				onSelect={async (id) => {
					setCurrentWalletId(id);
					const w = await fakeApi.getWallet(userId, id);
					if ((w as any)?.wallet?.name) setWalletName((w as any).wallet.name);
					setWalletSheetVisible(false);
				}}
			/>
    </View>
  );
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	appBar: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
	walletSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    walletTitle: { fontSize: 18 },
	tabsWrap: { flexGrow: 0, marginVertical: 12 },
	tabsContent: { gap: 9 },
	tabBtn: { paddingVertical: 9, paddingHorizontal: 21, borderRadius: 18, minWidth: 80, alignItems: 'center' },
	tabText: { fontWeight: '700', fontSize: 13 },
	emptyWrap: { alignItems: 'center', marginTop: 36 },
	emptyText: { fontSize: 16 },
	createBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 12, marginTop: 18, marginBottom: 4 },
	createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
	modalContainer: { margin: 16, padding: 18, borderRadius: 14 },
	modalHeader: { alignItems: 'center', marginBottom: 16 },
	modalTitle: { fontWeight: '700', fontSize: 18 },
	modalWarn: { marginTop: 6, fontWeight: '600' },
	modalSub: { marginTop: 6 },
	modalBody: { marginBottom: 12 },
	modalBodyText: { fontWeight: '500' },
	modalProgress: { height: 11, borderRadius: 7, marginVertical: 10, backgroundColor: '#eee' },
	modalSectionTitle: { fontWeight: '600', marginVertical: 8 },
	modalTxList: { maxHeight: 180 },
	modalTxItem: { padding: 7, marginBottom: 6, backgroundColor: '#F7F7FA', borderRadius: 10 },
	modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 14 },
});
