import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../theme';
import { formatCurrency } from '../utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import { walletApi } from '../api/walletApi';
import { useAuth } from '../contexts/AuthContext';

interface WalletSelectModalProps {
	visible: boolean;
	selectedWalletId?: number | null;
	onDismiss: () => void;
	onSelect: (id: number | null) => void;
	title?: string;
	allowNone?: boolean;
	noneLabel?: string;
	noneDescription?: string;
	showBalance?: boolean;
}

export default function WalletSelectModal({
	visible,
	selectedWalletId = null,
	onDismiss,
	onSelect,
	title = 'Chọn ví',
	allowNone = false,
	noneLabel = 'Không trừ ví',
	noneDescription = 'Chỉ ghi nhận lại số liệu',
	showBalance = true,
}: WalletSelectModalProps) {
	const theme = useAppTheme();
	const { user } = useAuth();
	const [wallets, setWallets] = useState<Array<{ id: number; name: string; amount?: number; currency?: string }>>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (visible && user?.id) {
			loadWallets();
		} else if (!visible) {
			// Reset state when modal closes
			setWallets([]);
			setError(null);
		}
	}, [visible, user?.id]);

	const loadWallets = async () => {
		if (!user?.id) {
			setError('Chưa đăng nhập');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const response = await walletApi.getWallets();
			
			// Handle different response formats
			const walletsData = response.data?.wallets || response.data?.data?.wallets || response.data || [];
			
			if (!Array.isArray(walletsData)) {
				console.warn('[WalletSelectModal] Invalid wallets data format:', walletsData);
				setWallets([]);
				setError('Định dạng dữ liệu không hợp lệ');
				return;
			}

			setWallets(walletsData);
			
			if (walletsData.length === 0) {
				setError(null); // Empty is OK, not an error
			}
		} catch (error: any) {
			console.error('[WalletSelectModal] Error loading wallets:', error);
			setWallets([]);
			setError('Không thể tải danh sách ví. Vui lòng thử lại.');
		} finally {
			setLoading(false);
		}
	};

	const handleSelect = (walletId: number | null) => {
		onSelect(walletId);
		onDismiss();
	};

	return (
		<BottomSheet
			visible={visible}
			onDismiss={onDismiss}
			title={title}
			titleIcon="wallet-outline"
			height="60%"
			zIndex={10000}
		>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
							Đang tải danh sách ví...
						</Text>
					</View>
				) : error ? (
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons
							name="alert-circle-outline"
							size={48}
							color={theme.colors.error}
							style={{ marginBottom: 12 }}
						/>
						<Text style={[styles.emptyText, { color: theme.colors.error }]}>{error}</Text>
						<TouchableOpacity
							onPress={loadWallets}
							style={[styles.retryButton, { backgroundColor: theme.colors.primaryContainer, marginTop: 16 }]}
						>
							<Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>Thử lại</Text>
						</TouchableOpacity>
					</View>
				) : (
					<>
						{allowNone && (
					<TouchableOpacity
						style={[
							styles.walletItem,
							styles.noneItem,
							{
								borderColor: selectedWalletId === null ? theme.colors.primary : 'transparent',
								backgroundColor:
									selectedWalletId === null ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
							},
						]}
						onPress={() => handleSelect(null)}
					>
						<View style={styles.walletLeft}>
							<View style={[styles.walletIcon, { backgroundColor: theme.colors.outlineVariant + '33' }]}>
								<MaterialCommunityIcons
									name="wallet-outline"
									size={24}
									color={theme.colors.outline}
								/>
							</View>
							<View style={styles.walletInfo}>
								<Text
									style={[
										styles.walletName,
										{
											color:
												selectedWalletId === null
													? theme.colors.primary
													: theme.colors.onSurface,
										},
									]}
								>
									{noneLabel}
								</Text>
								{!!noneDescription && (
									<Text
										style={[
											styles.walletAmount,
											{
												color:
													selectedWalletId === null
														? theme.colors.primary
														: theme.colors.onSurfaceVariant,
											},
										]}
									>
										{noneDescription}
									</Text>
								)}
							</View>
						</View>
						{selectedWalletId === null && (
							<MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
						)}
					</TouchableOpacity>
				)}

				{wallets.length === 0 && !loading && !error ? (
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons
							name="wallet-outline"
							size={48}
							color={theme.colors.onSurfaceVariant}
							style={{ marginBottom: 12, opacity: 0.5 }}
						/>
						<Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Chưa có ví nào</Text>
					</View>
				) : (
					wallets.map(wallet => (
						<TouchableOpacity
							key={wallet.id}
							style={styles.walletItem}
							onPress={() => handleSelect(wallet.id)}
						>
							<View style={styles.walletLeft}>
								<View style={[styles.walletIcon, { backgroundColor: theme.colors.primary + '22' }]}>
									<MaterialCommunityIcons name="wallet-outline" size={24} color={theme.colors.primary} />
								</View>
								<View style={styles.walletInfo}>
									<Text style={[styles.walletName, { color: theme.colors.onSurface }]}>{wallet.name}</Text>
									{showBalance && (
										<Text style={[styles.walletAmount, { color: theme.colors.onSurfaceVariant }]}>
											{formatCurrency(wallet.amount || 0)} {wallet.currency || ''}
										</Text>
									)}
								</View>
							</View>
							{selectedWalletId === wallet.id && (
								<MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
							)}
						</TouchableOpacity>
					))
				)}
					</>
				)}
			</ScrollView>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
		gap: 12,
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 48,
	},
	emptyText: {
		fontSize: 15,
	},
	loadingContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 48,
	},
	loadingText: {
		fontSize: 14,
		marginTop: 12,
	},
	walletItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 10,
		borderRadius: 12,
	},
	noneItem: {
		borderStyle: 'dashed',
	},
	walletLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	walletIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	walletInfo: {
		flex: 1,
	},
	walletName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	walletAmount: {
		fontSize: 14,
	},
	retryButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	retryButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
});
