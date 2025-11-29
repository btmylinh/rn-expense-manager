import { apiClient } from './client';

export interface WalletPayload {
	name: string;
	amount?: number;
	currency?: string;
	is_default?: number | boolean;
	color?: string;
}

export const walletApi = {
	getWallets() {
		return apiClient.get('/wallets');
	},
	getWalletById(id: number) {
		return apiClient.get(`/wallets/${id}`);
	},
	createWallet(payload: WalletPayload) {
		return apiClient.post('/wallets', payload);
	},
	updateWallet(id: number, payload: Partial<WalletPayload>) {
		return apiClient.put(`/wallets/${id}`, payload);
	},
	deleteWallet(id: number) {
		return apiClient.delete(`/wallets/${id}`);
	},
	setDefaultWallet(id: number) {
		return walletApi.updateWallet(id, { is_default: 1 });
	},
	transfer(payload: { from_wallet_id: number; to_wallet_id: number; amount: number; note?: string }) {
		return apiClient.post('/wallets/transfer', payload);
	},
};

