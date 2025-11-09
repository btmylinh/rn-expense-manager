// screens/reports/ReportExportScreen.tsx
import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, Menu, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { fakeApi } from '../../services/fakeApi';
import { useAuth } from '../../contexts/AuthContext';
import AppBar from '../../components/AppBar';
import { DatePickerModal } from 'react-native-paper-dates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Paths, File } from 'expo-file-system';

interface Transaction {
	id: number;
	userId: number;
	walletId: number;
	userCategoryId: number;
	amount: number;
	transactionDate: string;
	content: string;
	type: number;
	note?: string;
	categoryName?: string;
	categoryIcon?: string;
	walletName?: string;
	typeName?: string;
}

export default function ReportExportScreen({ navigation }: any) {
	const theme = useAppTheme();
	const { user } = useAuth();
	const userId = user?.id || 1;
	const insets = useSafeAreaInsets();

	// State
	const [wallets, setWallets] = useState<any[]>([]);
	const [categories, setCategories] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [exporting, setExporting] = useState(false);

	// Filter state
	const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
	const [selectedType, setSelectedType] = useState<number | null>(null); // 1: income, 2: expense, null: all
	const [timeRangeType, setTimeRangeType] = useState<'all' | 'thisMonth' | 'thisYear' | 'custom'>('all');
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [showDateRangePicker, setShowDateRangePicker] = useState(false);
	const [showWalletMenu, setShowWalletMenu] = useState(false);
	const [showTypeMenu, setShowTypeMenu] = useState(false);
	const [showTimeRangeMenu, setShowTimeRangeMenu] = useState(false);

	// Preview data
	const [previewData, setPreviewData] = useState<any>(null);

	// Load data
	useEffect(() => {
		loadData();
	}, []);

	// Update preview when filters change
	useEffect(() => {
		loadPreview();
	}, [selectedWalletId, selectedType, timeRangeType, startDate, endDate]);

	const loadData = async () => {
		try {
			setLoading(true);
			const [ws, cats] = await Promise.all([
				fakeApi.getWallets(userId),
				fakeApi.getUserCategories(userId),
			]);
			setWallets(ws as any[]);
			setCategories(cats as any[]);
		} catch (error) {
			console.error('Error loading data:', error);
			Alert.alert('Lỗi', 'Không thể tải dữ liệu');
		} finally {
			setLoading(false);
		}
	};

	const getDateRange = () => {
		const now = new Date();
		let start: Date | null = null;
		let end: Date | null = null;

		switch (timeRangeType) {
			case 'thisMonth':
				start = new Date(now.getFullYear(), now.getMonth(), 1);
				end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
				break;
			case 'thisYear':
				start = new Date(now.getFullYear(), 0, 1);
				end = new Date(now.getFullYear(), 11, 31);
				break;
			case 'custom':
				start = startDate;
				end = endDate;
				break;
			case 'all':
			default:
				start = null;
				end = null;
				break;
		}

		return { start, end };
	};

	const loadPreview = async () => {
		try {
			const { start, end } = getDateRange();
			
			const result = await fakeApi.exportReportExcel(userId, {
				walletId: selectedWalletId || undefined,
				type: selectedType || undefined,
				startDate: start ? start.toISOString().split('T')[0] : undefined,
				endDate: end ? end.toISOString().split('T')[0] : undefined,
			});

			if (result.success) {
				setPreviewData(result);
			}
		} catch (error) {
			console.error('Error loading preview:', error);
		}
	};

	const formatDate = (date: Date | null) => {
		if (!date) return 'Chưa chọn';
		return date.toLocaleDateString('vi-VN');
	};

	const getWalletDisplayText = () => {
		if (selectedWalletId === null) return 'Tất cả ví';
		const wallet = wallets.find(w => w.id === selectedWalletId);
		return wallet ? wallet.name : 'Tất cả ví';
	};

	const getTypeDisplayText = () => {
		if (selectedType === null) return 'Tất cả';
		if (selectedType === 1) return 'Thu nhập';
		if (selectedType === 2) return 'Chi tiêu';
		return 'Tất cả';
	};

	const getTimeRangeDisplayText = () => {
		switch (timeRangeType) {
			case 'all':
				return 'Tất cả thời gian';
			case 'thisMonth':
				return 'Tháng này';
			case 'thisYear':
				return 'Năm nay';
			case 'custom':
				return 'Khoảng thời gian tùy chọn';
			default:
				return 'Tất cả thời gian';
		}
	};

	const formatDateRange = () => {
		if (!startDate && !endDate) return 'Tất cả thời gian';
		if (startDate && endDate) {
			return `${formatDate(startDate)} - ${formatDate(endDate)}`;
		}
		if (startDate) return `Từ ${formatDate(startDate)}`;
		if (endDate) return `Đến ${formatDate(endDate)}`;
		return 'Tất cả thời gian';
	};

	const exportToCSV = async () => {
		if (!previewData || previewData.data.length === 0) {
			Alert.alert('Thông báo', 'Không có dữ liệu để xuất');
			return;
		}

		try {
			setExporting(true);

			// Prepare CSV data
			const headers = ['Ngày', 'Loại', 'Danh mục', 'Nội dung', 'Số tiền', 'Ví', 'Ghi chú'];
			
			// Escape CSV values (handle commas, quotes, newlines)
			const escapeCSV = (value: any): string => {
				if (value === null || value === undefined) return '';
				const str = String(value);
				if (str.includes(',') || str.includes('"') || str.includes('\n')) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			};

			// Create CSV rows
			const csvRows = [
				headers.map(escapeCSV).join(','),
				...previewData.data.map((tx: Transaction) => [
					new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
					tx.typeName || (tx.type === 1 ? 'Thu nhập' : 'Chi tiêu'),
					tx.categoryName || 'Chưa phân loại',
					tx.content || '',
					tx.type === 1 ? tx.amount : -tx.amount,
					tx.walletName || 'Chưa xác định',
					tx.note || '',
				].map(escapeCSV).join(',')),
			];

			// Add BOM for UTF-8 to ensure proper display in Excel
			const csvContent = '\uFEFF' + csvRows.join('\n');

			// Generate file name
			const fileName = `BaoCao_${new Date().toISOString().split('T')[0]}.csv`;
			
			// Create file in document directory using expo-file-system
			const file = new File(Paths.document, fileName);
			
			// Create file if it doesn't exist
			if (!file.exists) {
				file.create({ overwrite: true });
			}
			
			// Write content to file
			file.write(csvContent, { encoding: 'utf8' });
			
			const filePath = file.uri;

			Alert.alert(
				'Thành công', 
				`Đã lưu báo cáo: ${fileName}\n\nĐường dẫn: ${filePath}`,
				[{ text: 'OK' }]
			);
		} catch (error: any) {
			console.error('Error exporting:', error);
			Alert.alert('Lỗi', 'Không thể xuất báo cáo');
		} finally {
			setExporting(false);
		}
	};

	const selectedWallet = wallets.find(w => w.id === selectedWalletId);

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<AppBar
				title="Xuất báo cáo"
				align="center"
			/>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Filter Section */}
				<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
					<Card.Content>
						<View style={styles.sectionHeader}>
							<MaterialCommunityIcons 
								name="filter-variant" 
								size={24} 
								color={theme.colors.primary} 
								style={styles.sectionIcon}
							/>
							<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
								Bộ lọc
							</Text>
						</View>

						{/* Wallet Selection */}
						<View style={styles.filterItem}>
							<Text style={[styles.filterLabel, { color: theme.colors.onSurfaceVariant }]}>
								Chọn ví
							</Text>
							<Menu
								visible={showWalletMenu}
								onDismiss={() => setShowWalletMenu(false)}
								anchor={
									<TouchableOpacity
										onPress={() => setShowWalletMenu(true)}
										style={[
											styles.dropdownButton,
											{ backgroundColor: theme.colors.surfaceVariant },
										]}
									>
										<Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
											{getWalletDisplayText()}
										</Text>
										<MaterialCommunityIcons
											name="chevron-down"
											size={20}
											color={theme.colors.onSurfaceVariant}
										/>
									</TouchableOpacity>
								}
							>
								<Menu.Item
									onPress={() => {
										setSelectedWalletId(null);
										setShowWalletMenu(false);
									}}
									title="Tất cả ví"
								/>
								{wallets.map(wallet => (
									<Menu.Item
										key={wallet.id}
										onPress={() => {
											setSelectedWalletId(wallet.id);
											setShowWalletMenu(false);
										}}
										title={wallet.name}
									/>
								))}
							</Menu>
						</View>

						{/* Type Selection */}
						<View style={styles.filterItem}>
							<Text style={[styles.filterLabel, { color: theme.colors.onSurfaceVariant }]}>
								Loại giao dịch
							</Text>
							<Menu
								visible={showTypeMenu}
								onDismiss={() => setShowTypeMenu(false)}
								anchor={
									<TouchableOpacity
										onPress={() => setShowTypeMenu(true)}
										style={[
											styles.dropdownButton,
											{ backgroundColor: theme.colors.surfaceVariant },
										]}
									>
										<Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
											{getTypeDisplayText()}
										</Text>
										<MaterialCommunityIcons
											name="chevron-down"
											size={20}
											color={theme.colors.onSurfaceVariant}
										/>
									</TouchableOpacity>
								}
							>
								<Menu.Item
									onPress={() => {
										setSelectedType(null);
										setShowTypeMenu(false);
									}}
									title="Tất cả"
								/>
								<Menu.Item
									onPress={() => {
										setSelectedType(1);
										setShowTypeMenu(false);
									}}
									title="Thu nhập"
								/>
								<Menu.Item
									onPress={() => {
										setSelectedType(2);
										setShowTypeMenu(false);
									}}
									title="Chi tiêu"
								/>
							</Menu>
						</View>

						{/* Date Range Selection */}
						<View style={styles.filterItem}>
							<Text style={[styles.filterLabel, { color: theme.colors.onSurfaceVariant }]}>
								Khoảng thời gian
							</Text>
							
							{/* Time Range Type Selection */}
							<Menu
								visible={showTimeRangeMenu}
								onDismiss={() => setShowTimeRangeMenu(false)}
								anchor={
									<TouchableOpacity
										onPress={() => setShowTimeRangeMenu(true)}
										style={[
											styles.dropdownButton,
											{ backgroundColor: theme.colors.surfaceVariant },
										]}
									>
										<Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
											{getTimeRangeDisplayText()}
										</Text>
										<MaterialCommunityIcons
											name="chevron-down"
											size={20}
											color={theme.colors.onSurfaceVariant}
										/>
									</TouchableOpacity>
								}
							>
								<Menu.Item
									onPress={() => {
										setTimeRangeType('all');
										setStartDate(null);
										setEndDate(null);
										setShowTimeRangeMenu(false);
									}}
									title="Tất cả thời gian"
								/>
								<Menu.Item
									onPress={() => {
										setTimeRangeType('thisMonth');
										setStartDate(null);
										setEndDate(null);
										setShowTimeRangeMenu(false);
									}}
									title="Tháng này"
								/>
								<Menu.Item
									onPress={() => {
										setTimeRangeType('thisYear');
										setStartDate(null);
										setEndDate(null);
										setShowTimeRangeMenu(false);
									}}
									title="Năm nay"
								/>
								<Menu.Item
									onPress={() => {
										setTimeRangeType('custom');
										setShowTimeRangeMenu(false);
									}}
									title="Khoảng thời gian tùy chọn"
								/>
							</Menu>

							{/* Custom Date Range Picker */}
							{timeRangeType === 'custom' && (
								<View style={styles.customDateRange}>
									<TouchableOpacity
										onPress={() => setShowDateRangePicker(true)}
										style={[
											styles.dateRangeButton,
											{ backgroundColor: theme.colors.surfaceVariant },
										]}
									>
										<MaterialCommunityIcons
											name="calendar-range"
											size={18}
											color={theme.colors.onSurfaceVariant}
											style={styles.dateButtonIcon}
										/>
										<Text style={[styles.dateButtonText, { color: theme.colors.onSurfaceVariant }]}>
											{startDate && endDate
												? `${formatDate(startDate)} - ${formatDate(endDate)}`
												: startDate
													? `Từ ${formatDate(startDate)}`
													: endDate
														? `Đến ${formatDate(endDate)}`
														: 'Chọn khoảng thời gian'}
										</Text>
									</TouchableOpacity>
								</View>
							)}
						</View>
					</Card.Content>
				</Card>

				{/* Preview Section */}
				{previewData && (
					<Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
						<Card.Content>
							<View style={styles.sectionHeader}>
								<MaterialCommunityIcons 
									name="eye-outline" 
									size={24} 
									color={theme.colors.primary} 
									style={styles.sectionIcon}
								/>
								<Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
									Xem trước
								</Text>
							</View>

							{/* Summary Cards */}
							<View style={styles.previewSummary}>
								{/* Row 1: Tổng giao dịch */}
								<View style={[
									styles.previewCard,
									styles.previewCardFullWidth,
									{ 
										backgroundColor: theme.colors.surfaceVariant,
										borderLeftColor: theme.colors.primary,
										borderLeftWidth: 4,
									}
								]}>
									<MaterialCommunityIcons 
										name="file-document-multiple-outline" 
										size={24} 
										color={theme.colors.primary} 
									/>
									<Text style={[styles.previewLabel, { color: theme.colors.onSurfaceVariant }]}>
										Tổng giao dịch
									</Text>
									<Text style={[styles.previewValue, { color: theme.colors.onSurface }]}>
										{previewData.summary.total}
									</Text>
								</View>
								
								{/* Row 2: Tổng thu và Tổng chi */}
								<View style={styles.previewSummaryRow}>
									<View style={[
										styles.previewCard,
										styles.previewCardHalfWidth,
										{ 
											backgroundColor: theme.colors.surfaceVariant,
											borderLeftColor: '#22C55E',
											borderLeftWidth: 4,
										}
									]}>
										<MaterialCommunityIcons 
											name="trending-up" 
											size={24} 
											color="#22C55E" 
										/>
										<Text style={[styles.previewLabel, { color: theme.colors.onSurfaceVariant }]}>
											Tổng thu
										</Text>
										<Text style={[styles.previewValue, { color: '#22C55E' }]}>
											{formatCurrency(previewData.summary.income)}
										</Text>
									</View>
									<View style={[
										styles.previewCard,
										styles.previewCardHalfWidth,
										{ 
											backgroundColor: theme.colors.surfaceVariant,
											borderLeftColor: '#EF4444',
											borderLeftWidth: 4,
										}
									]}>
										<MaterialCommunityIcons 
											name="trending-down" 
											size={24} 
											color="#EF4444" 
										/>
										<Text style={[styles.previewLabel, { color: theme.colors.onSurfaceVariant }]}>
											Tổng chi
										</Text>
										<Text style={[styles.previewValue, { color: '#EF4444' }]}>
											{formatCurrency(previewData.summary.expense)}
										</Text>
									</View>
								</View>
							</View>

							{previewData.data.length > 0 ? (
								<View style={styles.previewList}>
									<View style={styles.previewListHeader}>
										<MaterialCommunityIcons 
											name="format-list-bulleted" 
											size={18} 
											color={theme.colors.onSurfaceVariant} 
										/>
										<Text style={[styles.previewListTitle, { color: theme.colors.onSurfaceVariant }]}>
											Mẫu dữ liệu (hiển thị 5 giao dịch đầu tiên)
										</Text>
									</View>
									{previewData.data.slice(0, 5).map((tx: Transaction, index: number) => (
										<View 
											key={tx.id} 
											style={[
												styles.previewListItem,
												index === previewData.data.slice(0, 5).length - 1 && styles.previewListItemLast,
												{ borderBottomColor: theme.colors.outline + '30' }
											]}
										>
											<View style={styles.previewListItemLeft}>
												<View style={styles.previewListItemHeader}>
													{tx.categoryIcon && (
														<MaterialCommunityIcons 
															name={tx.categoryIcon as any as any} 
															size={16} 
															color={theme.colors.onSurfaceVariant} 
															style={styles.previewListItemIcon}
														/>
													)}
													<Text style={[styles.previewListItemDate, { color: theme.colors.onSurfaceVariant }]}>
														{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
													</Text>
												</View>
												<Text style={[styles.previewListItemContent, { color: theme.colors.onSurface }]}>
													{tx.content || 'Giao dịch'}
												</Text>
												{tx.categoryName && (
													<Text style={[styles.previewListItemCategory, { color: theme.colors.onSurfaceVariant }]}>
														{tx.categoryName}
													</Text>
												)}
											</View>
											<View style={styles.previewListItemRight}>
												<Text style={[
													styles.previewListItemAmount,
													{ color: tx.type === 1 ? '#22C55E' : '#EF4444' },
												]}>
													{tx.type === 1 ? '+' : '-'}{formatCurrency(tx.amount)}
												</Text>
											</View>
										</View>
									))}
								</View>
							) : (
								<View style={styles.emptyState}>
									<MaterialCommunityIcons 
										name="file-document-outline" 
										size={48} 
										color={theme.colors.onSurfaceVariant + '80'} 
									/>
									<Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
										Không có dữ liệu để xuất
									</Text>
								</View>
							)}
						</Card.Content>
					</Card>
				)}

				{/* Export Button */}
				<View style={[styles.exportButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
					<Button
						mode="contained"
						onPress={exportToCSV}
						loading={exporting}
						disabled={!previewData || previewData.data.length === 0 || exporting}
						style={[
							styles.exportButton,
							{ backgroundColor: theme.colors.primary },
						]}
						labelStyle={styles.exportButtonLabel}
						icon="file-export"
					>
						Xuất báo cáo CSV
					</Button>
				</View>
			</ScrollView>

			{/* Date Range Picker */}
			<DatePickerModal
				locale="vi"
				mode="range"
				visible={showDateRangePicker}
				onDismiss={() => setShowDateRangePicker(false)}
				startDate={startDate || undefined}
				endDate={endDate || undefined}
				onConfirm={(params) => {
					if (params.startDate) {
						setStartDate(params.startDate as Date);
					}
					if (params.endDate) {
						setEndDate(params.endDate as Date);
					}
					setShowDateRangePicker(false);
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	card: {
		marginHorizontal: 16,
		marginTop: 16,
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionIcon: {
		marginRight: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
	},
	filterLabelContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	filterLabelIcon: {
		marginRight: 6,
	},
	filterItem: {
		marginBottom: 20,
	},
	filterLabel: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	filterButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	filterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 12,
	},
	filterButtonIcon: {
		marginRight: 6,
	},
	filterButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	dropdownButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		marginTop: 8,
	},
	dropdownText: {
		fontSize: 14,
		fontWeight: '500',
		flex: 1,
	},
	dateButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	dateButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 12,
	},
	dateButtonIcon: {
		marginRight: 6,
	},
	dateButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	customDateRange: {
		marginTop: 12,
	},
	dateRangeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
	},
	previewSummary: {
		marginBottom: 20,
		gap: 12,
	},
	previewSummaryRow: {
		flexDirection: 'row',
		gap: 12,
	},
	previewCard: {
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	previewCardFullWidth: {
		width: '100%',
	},
	previewCardHalfWidth: {
		flex: 1,
	},
	previewLabel: {
		fontSize: 12,
		marginTop: 8,
		marginBottom: 4,
		fontWeight: '500',
	},
	previewValue: {
		fontSize: 16,
		fontWeight: '700',
	},
	previewList: {
		marginTop: 8,
	},
	previewListHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
		gap: 6,
	},
	previewListTitle: {
		fontSize: 14,
		fontWeight: '600',
	},
	previewListItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
	previewListItemLast: {
		borderBottomWidth: 0,
	},
	previewListItemLeft: {
		flex: 1,
		marginRight: 12,
	},
	previewListItemHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	previewListItemIcon: {
		marginRight: 6,
	},
	previewListItemDate: {
		fontSize: 12,
		fontWeight: '500',
	},
	previewListItemContent: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 2,
	},
	previewListItemCategory: {
		fontSize: 12,
		marginTop: 2,
	},
	previewListItemRight: {
		alignItems: 'flex-end',
	},
	previewListItemAmount: {
		fontSize: 15,
		fontWeight: '700',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
		paddingHorizontal: 20,
	},
	emptyStateText: {
		fontSize: 14,
		marginTop: 12,
		textAlign: 'center',
	},
	exportButtonContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	exportButton: {
		borderRadius: 12,
		paddingVertical: 4,
	},
	exportButtonLabel: {
		fontSize: 16,
		fontWeight: '600',
		paddingVertical: 4,
	},
});

