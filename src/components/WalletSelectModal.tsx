import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';
import { formatCurrency } from '../utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';

interface WalletSelectModalProps {
	visible: boolean;
	wallets: Array<{ id: number; name: string; amount?: number; currency?: string }>;
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
	wallets,
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

				{wallets.length === 0 ? (
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
});
