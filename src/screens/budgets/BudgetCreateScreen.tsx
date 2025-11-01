import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput, Button, RadioButton, Snackbar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import { fakeApi } from '../../services/fakeApi';
import { useAppTheme, getIconColor } from '../../theme';
import WalletSelectModal from '../../components/WalletSelectModal';
import CategorySelectModal from '../../components/CategorySelectModal';
import { DatePickerModal } from 'react-native-paper-dates';
import AppBar from '../../components/AppBar';

// helper format yyyy-mm-dd
function toLocalYMD(d: Date) {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, '0');
	const day = d.getDate().toString().padStart(2, '0');
	return `${y}-${m}-${day}`;
}
function formatVN(dateStr: string) {
	const d = new Date(dateStr);
	return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
}

function getCurrentPeriods() {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	// week Mon-Sun
	const day = now.getDay();
	const diffToMonday = (day + 6) % 7;
	const weekStart = new Date(y, m, now.getDate() - diffToMonday);
	const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
	// month
	const monthStart = new Date(y, m, 1);
	const monthEnd = new Date(y, m + 1, 0);
	// quarter
	const q = Math.floor(m / 3);
	const quarterStart = new Date(y, q * 3, 1);
	const quarterEnd = new Date(y, q * 3 + 3, 0);
	// year
	const yearStart = new Date(y, 0, 1);
	const yearEnd = new Date(y, 12, 0);
	return {
		week: { start: toLocalYMD(weekStart), end: toLocalYMD(weekEnd) },
		month: { start: toLocalYMD(monthStart), end: toLocalYMD(monthEnd) },
		quarter: { start: toLocalYMD(quarterStart), end: toLocalYMD(quarterEnd) },
		year: { start: toLocalYMD(yearStart), end: toLocalYMD(yearEnd) },
	};
}

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetCreate'>;

export default function BudgetCreateScreen({ navigation, route }: Props) {
  const { categories, budget, editMode } = route.params;
	const [formBudget, setFormBudget] = useState<any>(budget || {});
  const [wallets, setWallets] = useState<any[]>([]);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
	const [showRangeSheet, setShowRangeSheet] = useState(false);
	const [tempRangeType, setTempRangeType] = useState<'week'|'month'|'quarter'|'year'|'custom'>('month');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [customRange, setCustomRange] = useState<{ startDate: Date | undefined, endDate: Date | undefined }>({ startDate: undefined, endDate: undefined });
	const [saving, setSaving] = useState(false);
	const [snack, setSnack] = useState<string>('');
  const userId = 1;
	const theme = useAppTheme();

  useEffect(() => {
		fakeApi.getWallets(userId).then((ws) => {
			setWallets(ws);
			if (!formBudget.walletId && ws[0]) setFormBudget((prev: any) => ({ ...prev, walletId: ws[0].id }));
		});
    // eslint-disable-next-line
  }, []);

	const selectedWallet = wallets.find(w => w.id === formBudget.walletId);
	const currency = selectedWallet?.currency || 'VND';
	const amountDisplay = typeof formBudget.amount === 'number' ? formBudget.amount.toLocaleString() : '';

	const currentPeriods = useMemo(() => getCurrentPeriods(), []);

	useEffect(() => {
		// infer tempRangeType from current formBudget
		if (formBudget.startDate && formBudget.endDate) {
			const { week, month, quarter, year } = currentPeriods;
			if (formBudget.startDate === week.start && formBudget.endDate === week.end) setTempRangeType('week');
			else if (formBudget.startDate === month.start && formBudget.endDate === month.end) setTempRangeType('month');
			else if (formBudget.startDate === quarter.start && formBudget.endDate === quarter.end) setTempRangeType('quarter');
			else if (formBudget.startDate === year.start && formBudget.endDate === year.end) setTempRangeType('year');
			else setTempRangeType('custom');
			if (tempRangeType === 'custom') {
				setCustomRange({ startDate: formBudget.startDate ? new Date(formBudget.startDate) : undefined, endDate: formBudget.endDate ? new Date(formBudget.endDate) : undefined });
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formBudget.startDate, formBudget.endDate, currentPeriods]);

	const canRepeat = tempRangeType !== 'custom' && !!formBudget.startDate && !!formBudget.endDate;

	async function handleSave() {
		if (!formBudget.userCategoryId || !formBudget.amount || !formBudget.startDate || !formBudget.endDate || !formBudget.walletId) return;
		setSaving(true);
		try {
			const payload = {
				userCategoryId: formBudget.userCategoryId,
				walletId: formBudget.walletId,
				amount: formBudget.amount,
				startDate: formBudget.startDate,
				endDate: formBudget.endDate,
				isRepeat: formBudget.repeat ? 1 : 0,
			};
			let res: any;
			if (editMode && formBudget.id) {
				res = await fakeApi.updateBudget(userId, formBudget.id, payload);
			} else {
				res = await fakeApi.createBudget(userId, payload as any);
			}
			if (!res || res.success === false) {
				setSnack(res?.message || 'Lưu thất bại');
			} else {
				setSnack('Lưu thành công');
				setTimeout(() => navigation.goBack(), 600);
			}
		} finally {
			setSaving(false);
		}
	}

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			{/* AppBar */}
			<AppBar
				title={editMode ? 'Sửa ngân sách' : 'Thêm ngân sách'}
				onBack={() => navigation.goBack()}
				align="center"
			/>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
				{/* Khối chọn danh mục & số tiền */}
				<View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
					{/* Hàng đầu: avatar + Chọn danh mục */}
					<TouchableOpacity style={styles.groupRow} onPress={() => setShowCategoryMenu(true)}>
						<View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}>
							{formBudget.userCategoryId ? (
								<MaterialCommunityIcons
									name={categories.find((c: any) => c.id === formBudget.userCategoryId)?.icon || 'shape'}
									size={24}
									color={getIconColor(categories.find((c: any) => c.id === formBudget.userCategoryId)?.icon, theme)}
								/>
							) : (
								<MaterialCommunityIcons name="shape" size={24} color={theme.colors.onSurfaceVariant} />
							)}
        </View>
						<Text style={[styles.groupText, { color: theme.colors.onSurface }]}>{categories.find((c: any) => c.id === formBudget.userCategoryId)?.name || 'Chọn danh mục'}</Text>
						<MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

					{/* Nhãn phụ + số tiền */}
					<View style={styles.amountRow}>
						<Text style={[styles.currencyChip, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}>{currency}</Text>
						<TextInput
							style={[styles.amountInput]}
							keyboardType="numeric"
							value={amountDisplay}
							onChangeText={(v) => {
								const raw = v.replace(/\D/g, '');
								const num = raw ? parseInt(raw, 10) : 0;
								setFormBudget((prev: any) => ({ ...prev, amount: num }));
							}}
							placeholder="0"
							underlineColorAndroid="transparent"
							theme={{ colors: { text: theme.colors.primary } } as any}
            />
        </View>
          </View>

				{/* Chọn thời gian */}
				<TouchableOpacity style={[styles.listItem, { backgroundColor: theme.colors.surface }]} onPress={() => setShowRangeSheet(true)}>
					<MaterialCommunityIcons name="calendar-month-outline" size={22} color={theme.colors.onSurfaceVariant} />
					<Text style={[styles.listItemText, { color: theme.colors.onSurface }]}>
						{formBudget.startDate && formBudget.endDate ? `${formBudget.startDate} - ${formBudget.endDate}` : 'Chọn khoảng thời gian'}
					</Text>
					<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
				</TouchableOpacity>

				{/* Chọn nguồn ngân sách (ví) */}
				<TouchableOpacity style={[styles.listItem, { backgroundColor: theme.colors.surface }]} onPress={() => setShowWalletMenu(true)}>
					<MaterialCommunityIcons name="wallet-outline" size={22} color={theme.colors.onSurfaceVariant} />
					<Text style={[styles.listItemText, { color: theme.colors.onSurface }]}>
						{selectedWallet?.name || 'Chọn ví'}
					</Text>
					<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

				{/* Lặp lại ngân sách */}
				<View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
					<TouchableOpacity style={[styles.repeatRow, { opacity: canRepeat ? 1 : 0.5 }]} onPress={() => { if (!canRepeat) return; setFormBudget((prev: any) => ({ ...prev, repeat: !prev.repeat })); }}>
						<View style={[styles.checkbox, { borderColor: theme.colors.outline, backgroundColor: formBudget.repeat && canRepeat ? theme.colors.primary : '#fff' }]}>
							{formBudget.repeat && canRepeat ? <MaterialCommunityIcons name="check" size={18} color={theme.colors.onPrimary} /> : null}
						</View>
						<View style={{ flex: 1 }}>
							<Text style={[styles.repeatTitle, { color: theme.colors.onSurface }]}>Lặp lại ngân sách này</Text>
							<Text style={[styles.repeatSub, { color: theme.colors.onSurfaceVariant }]}>Ngân sách được tự động lặp lại ở kỳ hạn tiếp theo.</Text>
							{!canRepeat ? (<Text style={[styles.repeatSub, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>Chỉ áp dụng cho tuần/tháng/quý/năm</Text>) : null}
                  </View>
        </TouchableOpacity>
				</View>

				{/* Nút Lưu */}
				<Button
					mode="contained"
					onPress={handleSave}
					disabled={saving}
				>
					{editMode ? 'Lưu' : 'Lưu'}
				</Button>
				{editMode && (
					<Button
						mode="text"
						onPress={async () => { if (!formBudget.id) return; await fakeApi.deleteBudget(userId, formBudget.id); navigation.goBack(); }}
						style={styles.deleteWrap}
						labelStyle={{ fontSize: 15 }}
					>
						Xoá
					</Button>
				)}
			</ScrollView>

			{/* Bottom sheet chọn ví */}
			<WalletSelectModal
				visible={showWalletMenu}
				wallets={wallets}
				selectedWalletId={formBudget.walletId}
				onDismiss={() => setShowWalletMenu(false)}
				onSelect={(id) => { setFormBudget((prev: any) => ({ ...prev, walletId: id })); setShowWalletMenu(false); }}
				title="Chọn ví"
			/>

			{/* Bottom sheet chọn danh mục */}
			<CategorySelectModal
				visible={showCategoryMenu}
				categories={categories}
				selectedId={formBudget.userCategoryId}
				onDismiss={() => setShowCategoryMenu(false)}
				onSelect={(id) => setFormBudget((prev: any) => ({ ...prev, userCategoryId: id }))}
				title="Chọn danh mục"
				mode="budget"
			/>

			{/* Bottom sheet chọn khoảng thời gian */}
			<Modal visible={showRangeSheet} animationType="slide" transparent onRequestClose={() => setShowRangeSheet(false)}>
				<TouchableWithoutFeedback onPress={() => setShowRangeSheet(false)}>
					<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
				</TouchableWithoutFeedback>
				<View style={styles.rangeSheet}>
					<View style={styles.dragIndicator} />
					<Text style={styles.rangeTitle}>Khoảng thời gian</Text>
					<RadioButton.Group value={tempRangeType} onValueChange={(v: any) => setTempRangeType(v)}>
						<View style={styles.radioItem}>
							<RadioButton value="week" />
							<Text style={styles.radioText}>Tuần này ({formatVN(currentPeriods.week.start)} - {formatVN(currentPeriods.week.end)})</Text>
              </View>
						<View style={styles.radioItem}>
							<RadioButton value="month" />
							<Text style={styles.radioText}>Tháng này ({formatVN(currentPeriods.month.start)} - {formatVN(currentPeriods.month.end)})</Text>
        </View>
						<View style={styles.radioItem}>
							<RadioButton value="quarter" />
							<Text style={styles.radioText}>Quý này ({formatVN(currentPeriods.quarter.start)} - {formatVN(currentPeriods.quarter.end)})</Text>
        </View>
						<View style={styles.radioItem}>
							<RadioButton value="year" />
							<Text style={styles.radioText}>Năm nay ({new Date(currentPeriods.year.start).getFullYear()})</Text>
        </View>
						<View style={[styles.radioItem, { alignItems: 'center' }]}>
							<RadioButton value="custom" />
							<TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={[styles.radioText, { textDecorationLine: 'underline' }]}>Tùy chỉnh</Text>
								{customRange.startDate && customRange.endDate ? (
									<Text style={[styles.radioText, { marginLeft: 6 }]}>({customRange.startDate.getDate().toString().padStart(2,'0')}/{(customRange.startDate.getMonth()+1).toString().padStart(2,'0')} - {customRange.endDate.getDate().toString().padStart(2,'0')}/{(customRange.endDate.getMonth()+1).toString().padStart(2,'0')})</Text>
								) : null}
							</TouchableOpacity>
          </View>
					</RadioButton.Group>
					<View style={styles.rangeActions}>
						<Button mode="outlined" onPress={() => setShowRangeSheet(false)} style={styles.rangeBtn}>Huỷ</Button>
						<Button mode="contained" onPress={() => {
							const { week, month, quarter, year } = currentPeriods;
							let start = formBudget.startDate || month.start;
							let end = formBudget.endDate || month.end;
							if (tempRangeType === 'week') { start = week.start; end = week.end; }
							else if (tempRangeType === 'month') { start = month.start; end = month.end; }
							else if (tempRangeType === 'quarter') { start = quarter.start; end = quarter.end; }
							else if (tempRangeType === 'year') { start = year.start; end = year.end; }
							else if (tempRangeType === 'custom' && customRange.startDate && customRange.endDate) {
								start = toLocalYMD(customRange.startDate);
								end = toLocalYMD(customRange.endDate);
							}
							// apply and enforce repeat rule
							setFormBudget((prev: any) => ({ ...prev, startDate: start, endDate: end, repeat: (tempRangeType === 'custom') ? 0 : prev.repeat }));
							setShowRangeSheet(false);
						}} style={styles.rangeBtn}>Lưu</Button>
					</View>
				</View>
			</Modal>

			{/* Date range picker for custom */}
			<DatePickerModal
				locale="vi"
				mode="range"
				visible={showDatePicker}
				onDismiss={() => setShowDatePicker(false)}
				onConfirm={({ startDate, endDate }) => {
					setShowDatePicker(false);
					setCustomRange({ startDate: startDate || undefined, endDate: endDate || undefined });
				}}
				startDate={customRange.startDate}
				endDate={customRange.endDate}
			/>
			{/* Snackbar */}
			<Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1500}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
	card: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
	groupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
	avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
	groupText: { fontSize: 16, fontWeight: '600' },
	subLabel: { fontSize: 13, marginBottom: 6 },
	amountRow: { flexDirection: 'row', alignItems: 'flex-end' },
	currencyChip: { fontSize: 13, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
	amountInput: { flex: 1, fontSize: 22, backgroundColor: 'transparent', fontWeight: '700' },
	listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 10 },
	listItemText: { marginLeft: 10, fontSize: 15 },
	repeatRow: { flexDirection: 'row', alignItems: 'center' },
	checkbox: { width: 22, height: 22, borderWidth: 1.7, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
	repeatTitle: { fontSize: 15, fontWeight: '600' },
	repeatSub: { fontSize: 13, marginTop: 2 },
	saveBtn: { borderRadius: 24, paddingVertical: 2, alignItems: 'center', marginTop: 12 },
	deleteWrap: { alignItems: 'center', marginTop: 8 },
	deleteText: { fontSize: 15 },
	rangeSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 16 },
	dragIndicator: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 10 },
	rangeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
	radioItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
	radioText: { fontSize: 15 },
	rangeActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
	rangeBtn: { flex: 1, marginHorizontal: 6 },
});
