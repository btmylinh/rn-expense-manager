import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { userCategoryApi } from '../api/userCategoryApi';
import { walletApi } from '../api/walletApi';
import { useAuth } from './AuthContext';

export interface UserCategory {
	id: number;
	name: string;
	type?: number;
	icon?: string;
	color?: string;
}

export interface WalletSummary {
	id: number;
	name: string;
	amount?: number;
	currency?: string;
	isDefault: boolean;
	icon?: string;
	[key: string]: any;
}

interface MetadataContextValue {
	categories: UserCategory[];
	wallets: WalletSummary[];
	isLoadingCategories: boolean;
	isLoadingWallets: boolean;
	ensureCategories: () => Promise<UserCategory[]>;
	ensureWallets: () => Promise<WalletSummary[]>;
	refreshCategories: () => Promise<UserCategory[]>;
	refreshWallets: () => Promise<WalletSummary[]>;
	getCategoryById: (id?: number | null) => UserCategory | undefined;
	getWalletById: (id?: number | null) => WalletSummary | undefined;
	defaultWallet: WalletSummary | null;
}

const MetadataContext = createContext<MetadataContextValue | undefined>(undefined);

const toArray = (payload: any): any[] => {
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload.items)) return payload.items;
	if (Array.isArray(payload.data)) return payload.data;
	if (Array.isArray(payload.wallets)) return payload.wallets;
	if (Array.isArray(payload.categories)) return payload.categories;
	if (Array.isArray(payload.data?.items)) return payload.data.items;
	if (Array.isArray(payload.data?.wallets)) return payload.data.wallets;
	return [];
};

const normalizeCategory = (raw: any): UserCategory | null => {
	const id = raw?.id ?? raw?.user_category_id ?? raw?.userCategoryId;
	if (!id) return null;
	return {
		id: id as number,
		name: raw?.name ?? raw?.category_name ?? 'Chưa đặt tên',
		type: raw?.type as number | undefined,
		icon: raw?.icon ?? raw?.category_icon ?? 'tag-outline',
		color: raw?.color ?? raw?.category_color,
	};
};

const normalizeWallet = (raw: any): WalletSummary | null => {
	const id = raw?.id ?? raw?.wallet_id ?? raw?.walletId;
	if (!id) return null;
	const amountSource = raw?.amount ?? raw?.balance ?? raw?.wallet_amount;
	const numericAmount = amountSource as number | undefined;
	const isDefaultFlag =
		raw?.isDefault === true ||
		raw?.is_default === 1 ||
		raw?.is_default === true ||
		raw?.default === true;

	return {
		...raw,
		id: id as number,
		name: raw?.name ?? raw?.wallet_name ?? 'Ví chưa đặt tên',
		amount: numericAmount,
		currency: raw?.currency ?? raw?.wallet_currency ?? 'VND',
		isDefault: !!isDefaultFlag,
		icon: raw?.icon,
		is_default: isDefaultFlag ? 1 : raw?.is_default ?? 0,
	};
};

export const MetadataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isAuthenticated } = useAuth();
	const [categories, setCategories] = useState<UserCategory[]>([]);
	const [wallets, setWallets] = useState<WalletSummary[]>([]);
	const [isLoadingCategories, setIsLoadingCategories] = useState(false);
	const [isLoadingWallets, setIsLoadingWallets] = useState(false);
	const categoriesLoadedRef = useRef(false);
	const walletsLoadedRef = useRef(false);

	const resetState = useCallback(() => {
		setCategories([]);
		setWallets([]);
		categoriesLoadedRef.current = false;
		walletsLoadedRef.current = false;
	}, []);

	const loadCategories = useCallback(
		async (force = false): Promise<UserCategory[]> => {
			if (!isAuthenticated) {
				resetState();
				return [];
			}
			if (!force && categoriesLoadedRef.current) {
				return [];
			}
			setIsLoadingCategories(true);
			try {
				const response = await userCategoryApi.getUserCategories();
				const nested = toArray(response?.data?.data);
				const rawList = nested.length ? nested : toArray(response?.data);
				const normalized = rawList
					.map(normalizeCategory)
					.filter((item): item is UserCategory => !!item);
				setCategories(normalized);
				if (!force) {
					categoriesLoadedRef.current = true;
				}
				return normalized;
			} catch (error) {
				console.error('Failed to load user categories', error);
				return [];
			} finally {
				setIsLoadingCategories(false);
			}
		},
		[isAuthenticated, resetState]
	);

	const loadWallets = useCallback(
		async (force = false): Promise<WalletSummary[]> => {
			if (!isAuthenticated) {
				resetState();
				return [];
			}
			if (!force && walletsLoadedRef.current) {
				// Already loaded, return empty array (caller should use state)
				return [];
			}
			setIsLoadingWallets(true);
			try {
				const response = await walletApi.getWallets();
				const nested = toArray(response?.data?.wallets ?? response?.data?.data);
				const rawList = nested.length ? nested : toArray(response?.data);
				const normalized = rawList
					.map(normalizeWallet)
					.filter((item): item is WalletSummary => !!item);
				setWallets(normalized);
				if (!force) {
					walletsLoadedRef.current = true;
				}
				return normalized;
			} catch (error) {
				console.error('Failed to load wallets', error);
				return [];
			} finally {
				setIsLoadingWallets(false);
			}
		},
		[isAuthenticated, resetState]
	);

	useEffect(() => {
		if (!isAuthenticated) {
			resetState();
			return;
		}
		// Only load once when authenticated, use refs to prevent infinite loops
		// Set refs before calling to prevent race conditions
		const shouldLoadCategories = !categoriesLoadedRef.current;
		const shouldLoadWallets = !walletsLoadedRef.current;
		
		if (shouldLoadCategories) {
			categoriesLoadedRef.current = true;
			loadCategories().catch(console.error);
		}
		if (shouldLoadWallets) {
			walletsLoadedRef.current = true;
			loadWallets().catch(console.error);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]);

	const getCategoryById = useCallback(
		(id?: number | null) => {
			if (!id) return undefined;
			return categories.find(cat => cat.id === id);
		},
		[categories]
	);

	const getWalletById = useCallback(
		(id?: number | null) => {
			if (!id) return undefined;
			return wallets.find(wallet => wallet.id === id);
		},
		[wallets]
	);

	const defaultWallet = useMemo(() => {
		if (!wallets.length) return null;
		return wallets.find(wallet => wallet.isDefault) ?? wallets[0] ?? null;
	}, [wallets]);

	// Use refs to store latest load functions to avoid dependency issues
	const loadCategoriesRef = useRef(loadCategories);
	const loadWalletsRef = useRef(loadWallets);
	
	useEffect(() => {
		loadCategoriesRef.current = loadCategories;
		loadWalletsRef.current = loadWallets;
	}, [loadCategories, loadWallets]);
	
	// Stable callbacks that don't change on every render
	const ensureCategories = useCallback(async () => {
		if (!isAuthenticated) return [];
		if (categoriesLoadedRef.current) return [];
		return loadCategoriesRef.current(false);
	}, [isAuthenticated]);
	
	const ensureWallets = useCallback(async () => {
		if (!isAuthenticated) return [];
		if (walletsLoadedRef.current) return [];
		return loadWalletsRef.current(false);
	}, [isAuthenticated]);
	
	const refreshCategories = useCallback(() => {
		categoriesLoadedRef.current = false;
		return loadCategoriesRef.current(true);
	}, []);
	
	const refreshWallets = useCallback(() => {
		walletsLoadedRef.current = false;
		return loadWalletsRef.current(true);
	}, []);

	const contextValue = useMemo<MetadataContextValue>(
		() => ({
			categories,
			wallets,
			isLoadingCategories,
			isLoadingWallets,
			ensureCategories,
			ensureWallets,
			refreshCategories,
			refreshWallets,
			getCategoryById,
			getWalletById,
			defaultWallet,
		}),
		[
			categories,
			wallets,
			isLoadingCategories,
			isLoadingWallets,
			ensureCategories,
			ensureWallets,
			refreshCategories,
			refreshWallets,
			getCategoryById,
			getWalletById,
			defaultWallet,
		]
	);

	return <MetadataContext.Provider value={contextValue}>{children}</MetadataContext.Provider>;
};

export const useMetadata = () => {
	const context = useContext(MetadataContext);
	if (!context) {
		throw new Error('useMetadata must be used within a MetadataProvider');
	}
	return context;
};

