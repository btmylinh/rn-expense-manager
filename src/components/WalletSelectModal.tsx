import React from 'react';
import { ScrollView } from 'react-native';
import { Modal, Portal, List, Text } from 'react-native-paper';
import { useAppTheme } from '../theme';
import { formatCurrency } from '../utils/format';

interface WalletSelectModalProps {
	visible: boolean;
	wallets: Array<{ id: number; name: string; amount?: number; currency?: string }>;
	selectedWalletId?: number;
	onDismiss: () => void;
	onSelect: (id: number) => void;
	title?: string;
}

export default function WalletSelectModal({ visible, wallets, selectedWalletId, onDismiss, onSelect, title = 'Chọn ví' }: WalletSelectModalProps) {
	const theme = useAppTheme();
	return (
		<Portal>
			<Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: theme.colors.surface, margin: 16, borderRadius: 16, padding: 12 }}>
				<Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, color: theme.colors.onSurface }}>{title}</Text>
				<ScrollView>
					{wallets.map((wallet) => (
						<List.Item
							left={props => <List.Icon {...props} icon="wallet-outline" color={theme.colors.primary} />}
							right={props => selectedWalletId === wallet.id ? <List.Icon {...props} icon="check" color={theme.colors.primary} /> : null}
							key={wallet.id}
							title={wallet.name}
							description={`${formatCurrency(wallet.amount || 0)} ${wallet.currency || ''}`.trim()}
							onPress={() => onSelect(wallet.id)}
							style={{ borderRadius: 8 }}
						/>
					))}
				</ScrollView>
			</Modal>
		</Portal>
	);
}
