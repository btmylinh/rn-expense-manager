// services/fakeApi.ts - Simple standalone fake API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simple in-memory storage
let users: Array<{id: number, email: string, password: string, verified?: boolean, name?: string}> = [];
let pendingOtps: Array<{email: string, otp: string, expires: number}> = [];
let wallets: Array<{id: number, userId: number, name: string, amount: number, currency: string, color?: string, is_default?: boolean | number}> = [];
let currentWalletByUser: Record<number, number | undefined> = {};
let categories: Array<{id: number, name: string, type: number, icon: string, color?: string}> = [];
let userCategories: Array<{id: number, userId: number, name: string, type: number, icon: string, color?: string}> = [];
let transactions: Array<{id: number, userId: number, walletId: number, userCategoryId: number, amount: number, transactionDate: string, content: string, type: number}> = [];
let budgets: Array<{id: number, userId: number, userCategoryId: number, walletId: number, amount: number, startDate: string, endDate: string, isRepeat?: number, createdAt?: string, updatedAt?: string}> = [];
let currentUserId: number | null = null;

// Initialize mock data deterministically from JSON (map snake_case -> camelCase)
const mockUserId = 1;
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const seed = require('./mockData.json');
	users = seed.users || users;
	if (seed.wallets) {
		wallets = seed.wallets.map((w: any) => ({
			id: w.id,
			userId: w.user_id,
			name: w.name,
			amount: w.amount,
			currency: w.currency,
			color: w.color,
			is_default: w.is_default,
		}));
	}
	if (seed.currentWalletByUser) currentWalletByUser = seed.currentWalletByUser;
	categories = seed.categories || categories;
	if (seed.user_categories) {
		userCategories = seed.user_categories.map((c: any) => ({ id: c.id, userId: c.user_id, name: c.name, type: c.type, icon: c.icon, color: c.color }));
	}
	if (seed.transactions) {
		transactions = seed.transactions.map((t: any) => ({
			id: t.id,
			userId: t.user_id,
			walletId: t.wallet_id,
			userCategoryId: t.user_category_id,
			amount: t.amount,
			transactionDate: t.transaction_date,
			content: t.content,
			type: t.type,
		}));
	}
	if (seed.budgets) {
		budgets = seed.budgets.map((b: any) => ({
			id: b.id,
			userId: b.user_id,
			userCategoryId: b.user_category_id,
			walletId: b.wallet_id,
			amount: b.amount,
			startDate: b.start_date,
			endDate: b.end_date,
			isRepeat: b.is_repeat ?? 0,
			createdAt: b.created_at,
			updatedAt: b.updated_at
		}));
	}
} catch {}

// Calculate wallet balances from transactions + keep seeded starting amounts if present
const calculateWalletBalances = () => {
	wallets.forEach(wallet => {
		const walletTransactions = transactions.filter(t => t.walletId === wallet.id && t.userId === wallet.userId);
		const txSum = walletTransactions.reduce((sum, t) => sum + t.amount, 0);
		if (typeof wallet.amount !== 'number') wallet.amount = 0;
		if (wallet.amount === 0) wallet.amount = txSum; // if seed amount not set, derive from tx
	});
};

calculateWalletBalances();

// Default categories with colors
const defaultCategories = [
	{ id: 1, name: 'Lương', type: 1, icon: 'briefcase-outline', color: '#10B981' },
	{ id: 2, name: 'Thưởng', type: 1, icon: 'gift-outline', color: '#F97316' },
	{ id: 3, name: 'Lãi ngân hàng', type: 1, icon: 'bank-outline', color: '#059669' },
	{ id: 4, name: 'Ăn uống', type: 2, icon: 'silverware-fork-knife', color: '#F59E0B' },
	{ id: 5, name: 'Di chuyển', type: 2, icon: 'car-outline', color: '#06B6D4' },
	{ id: 6, name: 'Nhà cửa', type: 2, icon: 'home-outline', color: '#8B5CF6' },
	{ id: 7, name: 'Mua sắm', type: 2, icon: 'shopping-outline', color: '#EC4899' },
	{ id: 8, name: 'Giải trí', type: 2, icon: 'gamepad-variant-outline', color: '#8B5CF6' },
	{ id: 9, name: 'Hóa đơn - dịch vụ', type: 2, icon: 'lightbulb-outline', color: '#F59E0B' },
	{ id: 10, name: 'Sức khỏe', type: 2, icon: 'hospital-box-outline', color: '#EF4444' },
];

// Initialize default categories if not already
if (!categories || categories.length === 0) {
	categories = [...defaultCategories];
}

// Helper to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Period helpers for budget repeat
function toLocalYMD(d: Date) {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, '0');
	const day = d.getDate().toString().padStart(2, '0');
	return `${y}-${m}-${day}`;
}
function getQuarterStart(d: Date) {
	const q = Math.floor(d.getMonth() / 3);
	return new Date(d.getFullYear(), q * 3, 1);
}
function getQuarterEnd(d: Date) {
	const q = Math.floor(d.getMonth() / 3);
	return new Date(d.getFullYear(), q * 3 + 3, 0);
}
function getPeriodType(startDate: string, endDate: string): 'week'|'month'|'quarter'|'year'|'custom' {
	const s = new Date(startDate);
	const e = new Date(endDate);
	// normalize to date-only
	const sN = new Date(s.getFullYear(), s.getMonth(), s.getDate());
	const eN = new Date(e.getFullYear(), e.getMonth(), e.getDate());
	// week Mon-Sun
	const day = sN.getDay();
	const diffToMonday = (day + 6) % 7;
	const monday = new Date(sN); monday.setDate(sN.getDate() - diffToMonday);
	const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
	if (sN.getTime() === monday.getTime() && eN.getTime() === sunday.getTime()) return 'week';
	// month boundaries
	const mStart = new Date(sN.getFullYear(), sN.getMonth(), 1);
	const mEnd = new Date(sN.getFullYear(), sN.getMonth() + 1, 0);
	if (sN.getTime() === mStart.getTime() && eN.getTime() === mEnd.getTime()) return 'month';
	// quarter
	const qStart = getQuarterStart(sN);
	const qEnd = getQuarterEnd(sN);
	if (sN.getTime() === qStart.getTime() && eN.getTime() === qEnd.getTime()) return 'quarter';
	// year
	const yStart = new Date(sN.getFullYear(), 0, 1);
	const yEnd = new Date(sN.getFullYear(), 12, 0);
	if (sN.getTime() === yStart.getTime() && eN.getTime() === yEnd.getTime()) return 'year';
	return 'custom';
}
function nextPeriod(startDate: string, endDate: string): { start: string, end: string } | null {
	const type = getPeriodType(startDate, endDate);
	if (type === 'custom') return null;
	const s = new Date(startDate);
	const e = new Date(endDate);
	if (type === 'week') {
		const s2 = new Date(s); s2.setDate(s2.getDate() + 7);
		const e2 = new Date(e); e2.setDate(e2.getDate() + 7);
		return { start: toLocalYMD(s2), end: toLocalYMD(e2) };
	}
	if (type === 'month') {
		const s2 = new Date(s.getFullYear(), s.getMonth() + 1, 1);
		const e2 = new Date(s.getFullYear(), s.getMonth() + 2, 0);
		return { start: toLocalYMD(s2), end: toLocalYMD(e2) };
	}
	if (type === 'quarter') {
		const qStart = getQuarterStart(s);
		const nextQStart = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 1);
		const nextQEnd = new Date(nextQStart.getFullYear(), nextQStart.getMonth() + 3, 0);
		return { start: toLocalYMD(nextQStart), end: toLocalYMD(nextQEnd) };
	}
	if (type === 'year') {
		const s2 = new Date(s.getFullYear() + 1, 0, 1);
		const e2 = new Date(s.getFullYear() + 1, 12, 0);
		return { start: toLocalYMD(s2), end: toLocalYMD(e2) };
	}
	return null;
}

export const fakeApi = {
	// Auth
	async register(email: string, password: string) {
		await delay(600);
		if (users.find(u => u.email === email)) {
			return { success: false, message: 'Email đã tồn tại' };
		}
		const newUser = { id: users.length + 1, email, password, verified: false };
		users.push(newUser);
		
		// Generate and store OTP (valid for 10 minutes)
		const otp = generateOTP();
		pendingOtps.push({ email, otp, expires: Date.now() + 600000 });
		
		console.log('📧 OTP for', email, ':', otp); // Log OTP for testing
		return { success: true, message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.', otp };
	},

	async quickLoginDemo() {
		await delay(300);
		const user = users.find(u => u.id === mockUserId);
		if (!user) {
			return { success: false, message: 'Không tìm thấy tài khoản demo' };
		}
		currentUserId = user.id;
		return { success: true, token: 'fake-token', user: { id: user.id, email: user.email } };
	},

	async confirmEmail(email: string, otp: string) {
		await delay(500);
		const pending = pendingOtps.find(p => p.email === email && p.otp === otp && p.expires > Date.now());
		if (!pending) {
			return { success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' };
		}
		
		const user = users.find(u => u.email === email);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		
		user.verified = true;
		pendingOtps = pendingOtps.filter(p => p.email !== email);
		return { success: true, message: 'Xác thực email thành công' };
	},

	async login(email: string, password: string) {
		await delay(500);
		const user = users.find(u => u.email === email && u.password === password);
		if (!user) {
			return { success: false, message: 'Email hoặc mật khẩu không đúng' };
		}
		if (!user.verified) {
			return { success: false, message: 'Email chưa được xác thực' };
		}
		currentUserId = user.id;
		return { success: true, token: 'fake-token', user: { id: user.id, email: user.email } };
	},

	async resetPassword(email: string) {
		await delay(400);
		const user = users.find(u => u.email === email);
		if (!user) {
			return { success: false, message: 'Email không tồn tại' };
		}
		return { success: true, message: 'Đã gửi email đặt lại mật khẩu' };
	},

	getCurrentUserId() {
		return currentUserId;
	},

	// Setup
	async getSetupStatus(userId: number) {
		await delay(250);
		return {
			hasWallet: wallets.some(w => w.userId === userId),
			hasCurrency: wallets.some(w => w.userId === userId && !!w.currency),
			hasCategories: userCategories.some(c => c.userId === userId),
		};
	},

	async getCategories() {
		await delay(200);
		return categories;
	},

	async createWallet(userId: number, name: string, amount: number, currency: string) {
		await delay(300);
		// simple name-duplicate check per user
		if (wallets.some(w => w.userId === userId && w.name.trim().toLowerCase() === name.trim().toLowerCase())) {
			return { success: false, message: 'Tên ví đã tồn tại' } as any;
		}
		const wallet = { id: wallets.length + 1, userId, name, amount, currency, is_default: wallets.every(w => w.userId !== userId) };
		wallets.push(wallet);
		if (!currentWalletByUser[userId]) {
			currentWalletByUser[userId] = wallet.id;
		}
		return { success: true, wallet };
	},

	async addCategory(userId: number, name: string, type: number, icon?: string) {
		await delay(300);
		const category = { id: userCategories.length + 1, userId, name, type, icon: icon || 'tag-outline' };
		userCategories.push(category);
		return { success: true, category };
	},

	// Transactions
	async getWallets(userId?: number) {
		await delay(200);
		const uid = userId ?? currentUserId ?? mockUserId;
		return wallets.filter(w => w.userId === uid);
	},

	async getCurrentWalletId(userId?: number) {
		await delay(100);
		const uid = userId ?? currentUserId ?? mockUserId;
		const current = currentWalletByUser[uid] ?? wallets.find(w => w.userId === uid && (w.is_default === 1 || w.is_default === true))?.id;
		return { success: true, walletId: current };
	},

	async setCurrentWallet(userId: number, walletId: number) {
		await delay(100);
		const w = wallets.find(w => w.userId === userId && w.id === walletId);
		if (!w) return { success: false, message: 'Ví không tồn tại' };
		currentWalletByUser[userId] = walletId;
		return { success: true };
	},

	async getTransactions(userId: number, walletId?: number) {
		await delay(300);
		let filtered = transactions.filter(t => t.userId === userId);
		if (walletId) {
			filtered = filtered.filter(t => t.walletId === walletId);
		}
		return filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
	},

	async addTransaction(userId: number, walletId: number, userCategoryId: number, amount: number, content: string, type: number, transactionDate?: string) {
		await delay(400);
		const transaction = { 
			id: transactions.length + 1, 
			userId, 
			walletId, 
			userCategoryId, 
			amount, 
			transactionDate: transactionDate || new Date().toISOString().split('T')[0], 
			content, 
			type 
		};
		transactions.push(transaction);
		
		// Update wallet balance
		const wallet = wallets.find(w => w.id === walletId && w.userId === userId);
		if (wallet) {
			wallet.amount += (type === 1 ? amount : -amount);
		}
		
		return { success: true, transaction };
	},

	async updateWalletBalance(walletId: number, newAmount: number) {
		await delay(200);
		const wallet = wallets.find(w => w.id === walletId);
		if (wallet) {
			wallet.amount = newAmount;
		}
		return { success: true };
	},

	async getUserCategories(userId: number) {
		await delay(200);
		return userCategories.filter(c => c.userId === userId);
	},

	// User management
	async getUser(userId: number) {
		await delay(200);
		const user = users.find(u => u.id === userId);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		return { success: true, user: { id: user.id, email: user.email, name: user.name } };
	},

	async updateUser(userId: number, data: { name?: string, email?: string }) {
		await delay(300);
		const user = users.find(u => u.id === userId);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		if (data.name) user.name = data.name;
		if (data.email) user.email = data.email;
		return { success: true, user: { id: user.id, email: user.email, name: user.name } };
	},

	async updatePassword(userId: number, oldPassword: string, newPassword: string) {
		await delay(300);
		const user = users.find(u => u.id === userId);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		if (user.password !== oldPassword) {
			return { success: false, message: 'Mật khẩu hiện tại không đúng' };
		}
		if (!newPassword || newPassword.length < 6) {
			return { success: false, message: 'Mật khẩu mới phải từ 6 ký tự' };
		}
		user.password = newPassword;
		return { success: true, message: 'Đổi mật khẩu thành công' };
	},

	// Quick transaction parsing
	async parseQuickInput(userId: number, input: string) {
		await delay(500);
		
		// Simple parsing: "đi chơi 90k, cà phê 15k" -> multiple transactions
		const transactions = [];
		const parts = input.split(',').map(p => p.trim());
		
		for (const part of parts) {
			// Extract amount (look for numbers followed by k, K, or no suffix)
			const amountMatch = part.match(/(\d+)([kK]?)/);
			if (!amountMatch) continue;
			
			let amount = parseInt(amountMatch[1]);
			if (amountMatch[2].toLowerCase() === 'k') {
				amount *= 1000;
			}
			
			// Extract description (everything before the amount)
			const desc = part.replace(/\d+[kK]?/, '').trim();
			if (!desc) continue;
			
			// Find matching category or create default
			let categoryId = 1; // Default to "Ăn uống"
			const userCats = userCategories.filter(c => c.userId === userId);
			
			// Simple keyword matching
			if (desc.toLowerCase().includes('ăn') || desc.toLowerCase().includes('cà phê') || desc.toLowerCase().includes('uống')) {
				categoryId = 1; // Ăn uống
			} else if (desc.toLowerCase().includes('chơi') || desc.toLowerCase().includes('giải trí')) {
				categoryId = 2; // Giải trí
			} else if (desc.toLowerCase().includes('xe') || desc.toLowerCase().includes('xăng') || desc.toLowerCase().includes('di chuyển')) {
				categoryId = 3; // Di chuyển
			}
			
			transactions.push({
				description: desc,
				amount: amount,
				categoryId: categoryId,
				type: 2 // Default to expense
			});
		}
		
		return { success: true, transactions };
	},

	async createQuickTransactions(userId: number, transactions: Array<{description: string, amount: number, categoryId: number, type: number}>, walletId?: number) {
		await delay(400);
		const targetWalletId = walletId || 1; // Use provided wallet or default to main wallet
		const createdTransactions = [];
		
		for (const tx of transactions) {
			const result = await this.addTransaction(userId, targetWalletId, tx.categoryId, tx.amount, tx.description, tx.type);
			if (result.success) {
				createdTransactions.push(result.transaction);
			}
		}
		
		return { success: true, transactions: createdTransactions };
	},

	// Parse text to transactions using AI (simulating OpenAI API call)
	async parseTextToTransactions(userId: number, text: string) {
		// Simulate API call delay (2-3 seconds)
		await delay(2000 + Math.random() * 1000);
		
		// Get user categories for matching
		const userCats = userCategories.filter(c => c.userId === userId);
		const defaultCategory = userCats.find(c => c.name.toLowerCase().includes('ăn uống')) || userCats[0] || { id: 1, name: 'Ăn uống', type: 2 };
		
		// Parse text to extract transactions (simulating AI parsing)
		const detectedTransactions = [];
		
		// Example patterns: "cơm 30k", "cá 50k", "31/10/2025 cơm 30k", etc.
		const lines = text.split('\n').map(l => l.trim()).filter(l => l);
		
		for (const line of lines) {
			// Extract date (if present)
			const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
			let transactionDate = new Date().toISOString().split('T')[0]; // Default to today
			if (dateMatch) {
				const [, day, month, year] = dateMatch;
				transactionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
			}
			
			// Extract amount (look for numbers followed by k, K, đ, or no suffix)
			const amountMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(?:k|K|đ|₫|d)?/i);
			if (!amountMatch) continue;
			
			let amount = parseFloat(amountMatch[1].replace(',', '.'));
			if (line.toLowerCase().includes('k')) {
				amount *= 1000;
			}
			amount = Math.round(amount);
			
			// Extract description (remove date and amount)
			let description = line
				.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '')
				.replace(/(\d+(?:[.,]\d+)?)\s*(?:k|K|đ|₫|d)?/gi, '')
				.trim();
			
			if (!description) {
				// Try to extract from common patterns
				const descMatch = line.match(/([a-zA-ZÀ-ỹ\s]+)/);
				if (descMatch) {
					description = descMatch[1].trim();
				}
			}
			
			if (!description || amount <= 0) continue;
			
			// Match category based on keywords
			let categoryId = defaultCategory.id;
			const descLower = description.toLowerCase();
			
			if (descLower.includes('ăn') || descLower.includes('cơm') || descLower.includes('cá') || descLower.includes('uống') || descLower.includes('cà phê')) {
				const foodCat = userCats.find(c => c.name.toLowerCase().includes('ăn uống'));
				if (foodCat) categoryId = foodCat.id;
			} else if (descLower.includes('chơi') || descLower.includes('giải trí') || descLower.includes('xem phim')) {
				const entCat = userCats.find(c => c.name.toLowerCase().includes('giải trí'));
				if (entCat) categoryId = entCat.id;
			} else if (descLower.includes('xe') || descLower.includes('xăng') || descLower.includes('di chuyển')) {
				const transCat = userCats.find(c => c.name.toLowerCase().includes('di chuyển'));
				if (transCat) categoryId = transCat.id;
			}
			
			detectedTransactions.push({
				id: `parsed_${Date.now()}_${detectedTransactions.length}_${Math.random()}`, // Unique temporary ID
				description,
				amount: -Math.abs(amount), // Negative for expense
				categoryId,
				type: 2, // Expense
				date: transactionDate,
				// Full category info for display
				category: userCats.find(c => c.id === categoryId) || defaultCategory
			});
		}
		
		// If no transactions detected, create default ones from common patterns
		if (detectedTransactions.length === 0) {
			const commonPatterns = [
				{ desc: 'cơm', amount: 30000 },
				{ desc: 'cá', amount: 50000 }
			];
			
			commonPatterns.forEach(({ desc, amount }, index) => {
				detectedTransactions.push({
					id: `temp_${Date.now()}_${index}_${Math.random()}`,
					description: desc,
					amount: -amount,
					categoryId: defaultCategory.id,
					type: 2,
					date: new Date().toISOString().split('T')[0],
					category: defaultCategory
				});
			});
		}
		
		return {
			success: true,
			transactions: detectedTransactions,
			count: detectedTransactions.length
		};
	},

	// Parse voice audio to transactions using AI (simulating speech-to-text + AI parsing)
	async parseVoiceToTransactions(userId: number, audioFile?: any) {
		// Simulate API call delay (3-5 seconds as specified)
		await delay(3000 + Math.random() * 2000);
		
		// Get user categories for matching
		const userCats = userCategories.filter(c => c.userId === userId);
		const defaultCategory = userCats.find(c => c.name.toLowerCase().includes('ăn uống')) || userCats[0] || { id: 1, name: 'Ăn uống', type: 2 };
		
		// Simulate voice recognition results - common voice patterns
		const voiceTranscript = "Mua cà phê 35 nghìn, ăn sáng 45 nghìn, nạp điện thoại 100 nghìn";
		
		// Parse the transcript
		const detectedTransactions = [];
		const parts = voiceTranscript.match(/([\w\sÀ-ỹ]+)\s+(\d+)\s+nghìn/g) || [];
		
		for (const part of parts) {
			const match = part.match(/([\w\sÀ-ỹ]+)\s+(\d+)\s+nghìn/);
			if (!match) continue;
			
			const [, description, amountStr] = match;
			const amount = parseInt(amountStr, 10) * 1000; // Convert thousands to actual amount
			
			if (!description || amount <= 0) continue;
			
			// Match category based on keywords
			let categoryId = defaultCategory.id;
			const descLower = description.toLowerCase();
			
			if (descLower.includes('ăn') || descLower.includes('cà phê') || descLower.includes('uống')) {
				const foodCat = userCats.find(c => c.name.toLowerCase().includes('ăn uống'));
				if (foodCat) categoryId = foodCat.id;
			} else if (descLower.includes('nạp') || descLower.includes('điện thoại')) {
				const utilityCat = userCats.find(c => c.name.toLowerCase().includes('tiện ích'));
				if (utilityCat) categoryId = utilityCat.id;
			} else if (descLower.includes('chơi') || descLower.includes('giải trí') || descLower.includes('xem phim')) {
				const entCat = userCats.find(c => c.name.toLowerCase().includes('giải trí'));
				if (entCat) categoryId = entCat.id;
			} else if (descLower.includes('xe') || descLower.includes('xăng') || descLower.includes('di chuyển')) {
				const transCat = userCats.find(c => c.name.toLowerCase().includes('di chuyển'));
				if (transCat) categoryId = transCat.id;
			}
			
			detectedTransactions.push({
				id: `voice_${Date.now()}_${detectedTransactions.length}_${Math.random()}`,
				description: description.trim(),
				amount: -Math.abs(amount), // Negative for expense
				categoryId,
				type: 2, // Expense
				date: new Date().toISOString().split('T')[0],
				category: userCats.find(c => c.id === categoryId) || defaultCategory
			});
		}
		
		// If no transactions detected from voice, create default examples
		if (detectedTransactions.length === 0) {
			const commonVoiceExamples = [
				{ desc: 'Cà phê', amount: 35000, cat: 'ăn uống' },
				{ desc: 'Ăn sáng', amount: 45000, cat: 'ăn uống' },
				{ desc: 'Nạp điện thoại', amount: 100000, cat: 'tiện ích' }
			];
			
			commonVoiceExamples.forEach(({ desc, amount, cat }, index) => {
				const matchedCat = userCats.find(c => c.name.toLowerCase().includes(cat)) || defaultCategory;
				detectedTransactions.push({
					id: `voice_${Date.now()}_${index}_${Math.random()}`,
					description: desc,
					amount: -amount,
					categoryId: matchedCat.id,
					type: 2,
					date: new Date().toISOString().split('T')[0],
					category: matchedCat
				});
			});
		}
		
		return {
			success: true,
			transactions: detectedTransactions,
			count: detectedTransactions.length
		};
	},

	// Parse image (OCR) to transactions using AI (simulating OCR + AI parsing)
	async parseImageToTransactions(userId: number, imageUri: string | null) {
		// Simulate API call delay (3-5 seconds as specified)
		await delay(3000 + Math.random() * 2000);
		
		// Get user categories for matching
		const userCats = userCategories.filter(c => c.userId === userId);
		const defaultCategory = userCats.find(c => c.name.toLowerCase().includes('ăn uống')) || userCats[0] || { id: 1, name: 'Ăn uống', type: 2 };
		
		// Simulate OCR results from receipt/invoice - typical receipt patterns
		const detectedTransactions: Array<{
			id: string | number;
			description: string;
			amount: number;
			categoryId: number;
			type: number;
			date: string;
			category: any;
		}> = [];
		
		// Common OCR detected examples from receipts
		const ocrExamples = [
			{ desc: 'Cà phê Highlands', amount: 55000, cat: 'ăn uống' },
			{ desc: 'Ăn trưa', amount: 75000, cat: 'ăn uống' },
			{ desc: 'Grab', amount: 32000, cat: 'di chuyển' }
		];
		
		ocrExamples.forEach(({ desc, amount, cat }, index) => {
			let categoryId = defaultCategory.id;
			const matchedCat = userCats.find(c => c.name.toLowerCase().includes(cat));
			if (matchedCat) categoryId = matchedCat.id;
			
			detectedTransactions.push({
				id: `ocr_${Date.now()}_${index}_${Math.random()}`,
				description: desc,
				amount: -Math.abs(amount), // Negative for expense
				categoryId,
				type: 2, // Expense
				date: new Date().toISOString().split('T')[0],
				category: userCats.find(c => c.id === categoryId) || defaultCategory
			});
		});
		
		return {
			success: true,
			transactions: detectedTransactions,
			count: detectedTransactions.length
		};
	},

	// Enhanced transaction operations for AddTransactionScreen
	async updateTransaction(userId: number, transactionId: number, data: {
		amount?: number,
		transactionDate?: string,
		content?: string,
		userCategoryId?: number,
		type?: number
	}) {
		await delay(300);
		const transaction = transactions.find(t => t.id === transactionId && t.userId === userId);
		if (!transaction) {
			return { success: false, message: 'Giao dịch không tồn tại' };
		}

		// Update transaction fields
		if (data.amount !== undefined) transaction.amount = data.amount;
		if (data.transactionDate !== undefined) transaction.transactionDate = data.transactionDate;
		if (data.content !== undefined) transaction.content = data.content;
		if (data.userCategoryId !== undefined) transaction.userCategoryId = data.userCategoryId;
		if (data.type !== undefined) transaction.type = data.type;

		// Update wallet balance if amount changed
		if (data.amount !== undefined) {
			const wallet = wallets.find(w => w.id === transaction.walletId && w.userId === userId);
			if (wallet) {
				// Calculate the difference and update wallet balance
				const oldAmount = transaction.amount;
				const newAmount = data.amount;
				const difference = newAmount - oldAmount;
				wallet.amount += difference;
			}
		}

		return { success: true, transaction };
	},

	async deleteTransaction(userId: number, transactionId: number) {
		await delay(300);
		const transactionIndex = transactions.findIndex(t => t.id === transactionId && t.userId === userId);
		if (transactionIndex === -1) {
			return { success: false, message: 'Giao dịch không tồn tại' };
		}

		const transaction = transactions[transactionIndex];
		
		// Update wallet balance (reverse the transaction)
		const wallet = wallets.find(w => w.id === transaction.walletId && w.userId === userId);
		if (wallet) {
			wallet.amount -= (transaction.type === 1 ? transaction.amount : -transaction.amount);
		}

		// Remove transaction
		transactions.splice(transactionIndex, 1);
		
		return { success: true, message: 'Xóa giao dịch thành công' };
	},

	async createTransaction(userId: number, data: {
		walletId: number,
		userCategoryId: number,
		amount: number,
		content: string,
		type: number,
		transactionDate?: string
	}) {
		await delay(400);
		const transaction = { 
			id: Math.max(0, ...transactions.map(t => t.id)) + 1, 
			userId, 
			walletId: data.walletId, 
			userCategoryId: data.userCategoryId, 
			amount: data.amount, 
			transactionDate: data.transactionDate || new Date().toISOString().split('T')[0], 
			content: data.content, 
			type: data.type 
		};
		transactions.push(transaction);
		
		// Update wallet balance
		const wallet = wallets.find(w => w.id === data.walletId && w.userId === userId);
		if (wallet) {
			wallet.amount += (data.type === 1 ? data.amount : -data.amount);
		}
		
		return { success: true, transaction };
	},

	// Wallet operations
	async getWallet(userId: number, walletId: number) {
		await delay(200);
		const wallet = wallets.find(w => w.id === walletId && w.userId === userId);
		if (!wallet) {
			return { success: false, message: 'Ví không tồn tại' };
		}
		return { success: true, wallet };
	},

	async updateWallet(userId: number, walletId: number, data: { name?: string, color?: string }) {
		await delay(300);
		const wallet = wallets.find(w => w.id === walletId && w.userId === userId);
		if (!wallet) {
			return { success: false, message: 'Ví không tồn tại' };
		}
		
		if (data.name !== undefined) wallet.name = data.name;
		if (data.color !== undefined) wallet.color = data.color;
		
		return { success: true, wallet };
	},

	async setDefaultWallet(userId: number, walletId: number) {
		await delay(200);
		const wallet = wallets.find(w => w.id === walletId && w.userId === userId);
		if (!wallet) return { success: false, message: 'Ví không tồn tại' };
		wallets.filter(w => w.userId === userId).forEach(w => { w.is_default = w.id === walletId ? 1 : 0; });
		// also move current wallet to this
		currentWalletByUser[userId] = walletId;
		return { success: true };
	},

	async deleteWallet(userId: number, walletId: number) {
		await delay(300);
		const walletIndex = wallets.findIndex(w => w.id === walletId && w.userId === userId);
		if (walletIndex === -1) {
			return { success: false, message: 'Ví không tồn tại' };
		}

		const wallet = wallets[walletIndex];
		
		// Check if it's the default wallet - if so, set another wallet as default
		if (wallet.is_default === 1 || wallet.is_default === true) {
			const otherWallets = wallets.filter(w => w.userId === userId && w.id !== walletId);
			if (otherWallets.length > 0) {
				otherWallets[0].is_default = 1;
				currentWalletByUser[userId] = otherWallets[0].id;
			} else {
				// If this is the only wallet, clear current wallet
				delete currentWalletByUser[userId];
			}
		}

		// Remove wallet
		wallets.splice(walletIndex, 1);
		
		return { success: true, message: 'Xóa ví thành công' };
	},

	// Category operations
	async getCategory(userId: number, categoryId: number) {
		await delay(200);
		const category = userCategories.find(c => c.id === categoryId && c.userId === userId);
		if (!category) {
			return { success: false, message: 'Danh mục không tồn tại' };
		}
		return { success: true, category };
	},

	async updateCategory(userId: number, categoryId: number, data: { name?: string, color?: string, icon?: string }) {
		await delay(300);
		const category = userCategories.find(c => c.id === categoryId && c.userId === userId);
		if (!category) {
			return { success: false, message: 'Danh mục không tồn tại' };
		}
		
		if (data.name !== undefined) category.name = data.name;
		if (data.color !== undefined) category.color = data.color;
		if (data.icon !== undefined) category.icon = data.icon;
		
		return { success: true, category };
	},

	async deleteCategory(userId: number, categoryId: number) {
		await delay(300);
		const categoryIndex = userCategories.findIndex(c => c.id === categoryId && c.userId === userId);
		if (categoryIndex === -1) {
			return { success: false, message: 'Danh mục không tồn tại' };
		}

		// Check if category is being used in transactions
		const isUsed = transactions.some(t => t.userCategoryId === categoryId && t.userId === userId);
		if (isUsed) {
			return { success: false, message: 'Không thể xóa danh mục đang được sử dụng' };
		}

		userCategories.splice(categoryIndex, 1);
		return { success: true, message: 'Xóa danh mục thành công' };
	},

	// Budget operations
	async getBudgets(userId: number, walletId?: number) {
		await delay(200);
		let filtered = budgets.filter(b => b.userId === userId);
		if(walletId) filtered = filtered.filter(b=>b.walletId === walletId);
		
		// Tính toán số tiền đã chi cho mỗi ngân sách (chỉ đến ngày hiện tại)
		const today = new Date();
		today.setHours(23, 59, 59, 999); // End of today
		
		const budgetsWithSpent = filtered.map(budget => {
			const relatedTransactions = transactions.filter(t => {
				const transactionDate = new Date(t.transactionDate);
				const startDate = new Date(budget.startDate);
				const endDate = new Date(budget.endDate);
				
				return (
					t.userId === userId && 
					t.userCategoryId === budget.userCategoryId &&
					t.walletId === budget.walletId && // Thêm điều kiện wallet
					t.type === 2 && // chỉ tính giao dịch chi tiêu
					transactionDate >= startDate &&
					transactionDate <= endDate &&
					transactionDate <= today // Chỉ tính đến ngày hiện tại
				);
			});
			
			const spent = relatedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
			
			// Tạo dữ liệu biểu đồ (cumulative spending by day)
			const startDate = new Date(budget.startDate);
			const endDate = new Date(budget.endDate);
			const chartData = [];
			
			// Tạo map chi tiêu theo ngày
			const dailySpending = new Map();
			relatedTransactions.forEach(t => {
				const dateKey = new Date(t.transactionDate).toDateString();
				const amount = Math.abs(t.amount);
				dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + amount);
			});
			
			// Tạo array các ngày từ startDate đến min(endDate, today)
			const currentDate = new Date(startDate);
			const maxDate = new Date(Math.min(endDate.getTime(), today.getTime()));
			let cumulativeSpending = 0;
			
			while (currentDate <= maxDate) {
				const dayString = currentDate.toDateString();
				const dailyAmount = dailySpending.get(dayString) || 0;
				cumulativeSpending += dailyAmount;
				
				chartData.push({
					date: new Date(currentDate).toISOString().split('T')[0], // YYYY-MM-DD format
					value: cumulativeSpending,
					dailyAmount
				});
				
				currentDate.setDate(currentDate.getDate() + 1);
			}
			
			return {
				...budget,
				spent,
				chartData
			};
		});
		
		return budgetsWithSpent;
	},
	async getBudgetDetail(userId: number, budgetId: number) {
		await delay(200);
		const budget = budgets.find(b => b.userId === userId && b.id === budgetId);
		if (!budget) return { success: false, message: 'Ngân sách không tồn tại' };
		return { success: true, budget };
	},
	async getBudgetTransactions(userId: number, budgetId: number) {
		await delay(300);
		const budget = budgets.find(b => b.userId === userId && b.id === budgetId);
		if (!budget) return { success: false, message: 'Ngân sách không tồn tại' };

		const today = new Date();
		today.setHours(23, 59, 59, 999);

		// Lấy tất cả giao dịch liên quan đến ngân sách này
		const relatedTransactions = transactions.filter(t => {
			const transactionDate = new Date(t.transactionDate);
			const startDate = new Date(budget.startDate);
			const endDate = new Date(budget.endDate);
			
			return (
				t.userId === userId && 
				t.userCategoryId === budget.userCategoryId &&
				t.walletId === budget.walletId &&
				transactionDate >= startDate &&
				transactionDate <= endDate
			);
		});

		// Lấy thông tin category và wallet
		const [allCategories, allWallets] = await Promise.all([
			this.getUserCategories(userId),
			this.getWallets(userId)
		]);

		// Map transactions với thông tin đầy đủ
		const transactionsWithDetails = relatedTransactions.map(t => {
			const category = allCategories.find((c: any) => c.id === t.userCategoryId);
			const wallet = allWallets.find((w: any) => w.id === t.walletId);
			
			return {
				id: t.id,
				amount: t.amount,
				type: t.type === 1 ? 'income' as const : 'expense' as const,
				date: t.transactionDate,
				content: t.content,
				category: {
					id: category?.id || 0,
					name: category?.name || 'Unknown',
					icon: category?.icon || 'help-circle',
					type: category?.type === 1 ? 'income' as const : 'expense' as const,
				},
				wallet: {
					id: wallet?.id || 0,
					name: wallet?.name || 'Unknown',
				}
			};
		});

		// Nhóm theo ngày và tính tổng
		const groupedByDate = new Map();
		transactionsWithDetails.forEach(transaction => {
			const dateKey = transaction.date;
			if (!groupedByDate.has(dateKey)) {
				groupedByDate.set(dateKey, []);
			}
			groupedByDate.get(dateKey).push(transaction);
		});

		// Tạo dữ liệu nhóm theo ngày với tổng
		const transactionGroups = Array.from(groupedByDate.entries())
			.map(([date, dayTransactions]) => {
				const total = dayTransactions.reduce((sum: number, t: any) => {
					return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
				}, 0);

				return {
					date,
					total,
					transactions: dayTransactions.sort((a: any, b: any) => b.id - a.id) // Sort by newest first
				};
			})
			.sort((a, b) => {
				// Sắp xếp theo ngày từ mới nhất đến cũ nhất
				const dateA = new Date(a.date);
				const dateB = new Date(b.date);
				return dateB.getTime() - dateA.getTime();
			});

		// Tính tổng kết
		const income = transactionsWithDetails
			.filter(t => t.type === 'income')
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		const expense = transactionsWithDetails
			.filter(t => t.type === 'expense')
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		
		const summary = {
			count: transactionsWithDetails.length,
			income,
			expense,
			total: income - expense
		};

		return {
			success: true,
			data: {
				budget,
				summary,
				transactionGroups
			}
		};
	},
	async getWalletDashboard(userId: number, walletId: number) {
		await delay(300);
		
		// Get wallet info
		const wallet = wallets.find(w => w.id === walletId && w.userId === userId);
		if (!wallet) return { success: false, message: 'Ví không tồn tại' };

		// Get recent transactions (last 10)
		const recentTransactions = transactions
			.filter(t => t.userId === userId && t.walletId === walletId)
			.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
			.slice(0, 10);

		// Get categories and map transactions
		const allCategories = await this.getUserCategories(userId);
		const transactionsWithDetails = recentTransactions.map(t => {
			const category = allCategories.find((c: any) => c.id === t.userCategoryId);
			return {
				id: t.id,
				amount: t.amount,
				type: t.type, // Keep as number (1 or 2) for compatibility
				typeLabel: t.type === 1 ? 'income' as const : 'expense' as const, // For display
				date: t.transactionDate,
				content: t.content,
				note: t.content, // Alias for content
				userCategoryId: t.userCategoryId,
				walletId: t.walletId,
				transactionDate: t.transactionDate, // Keep original format
				category: {
					id: category?.id || 0,
					name: category?.name || 'Unknown',
					icon: category?.icon || 'help-circle',
					type: category?.type === 1 ? 'income' as const : 'expense' as const,
				}
			};
		});

		// Group transactions by date (API calculates)
		const groupedByDate = new Map<string, typeof transactionsWithDetails>();
		transactionsWithDetails.forEach(transaction => {
			const dateKey = new Date(transaction.date).toLocaleDateString('vi-VN');
			if (!groupedByDate.has(dateKey)) {
				groupedByDate.set(dateKey, []);
			}
			groupedByDate.get(dateKey)!.push(transaction);
		});

		// Convert to array format for easy consumption
		const transactionGroups = Array.from(groupedByDate.entries())
			.map(([date, dayTransactions]) => ({
				date,
				transactions: dayTransactions.sort((a, b) => b.id - a.id) // Sort by newest first
			}))
			.sort((a, b) => {
				// Sort groups by date from newest to oldest
				const dateA = new Date(a.transactions[0].date);
				const dateB = new Date(b.transactions[0].date);
				return dateB.getTime() - dateA.getTime();
			});

		// Calculate quick stats for current month
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const monthlyTransactions = transactions.filter(t => {
			const transactionDate = new Date(t.transactionDate);
			return (
				t.userId === userId && 
				t.walletId === walletId &&
				transactionDate >= startOfMonth && 
				transactionDate <= endOfMonth
			);
		});

		const monthlyIncome = monthlyTransactions
			.filter(t => t.type === 1)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		
		const monthlyExpense = monthlyTransactions
			.filter(t => t.type === 2)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		return {
			success: true,
			data: {
				wallet: {
					id: wallet.id,
					name: wallet.name,
					balance: wallet.amount,
					currency: wallet.currency
				},
				recentTransactions: transactionsWithDetails, // Keep for backward compatibility
				transactionGroups: transactionGroups, // Grouped by date (API calculates)
				monthlyStats: {
					income: monthlyIncome,
					expense: monthlyExpense,
					net: monthlyIncome - monthlyExpense,
					transactionCount: monthlyTransactions.length
				}
			}
		};
	},
	async getTransactionStats(userId: number) {
		await delay(200);
		
		// Get user streak
		const streakData = await this.getUserStreak(userId);
		
		// Calculate weekly stats
		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
		
		const weeklyTransactions = transactions.filter(t => {
			const transactionDate = new Date(t.transactionDate);
			return (
				t.userId === userId && 
				transactionDate >= startOfWeek && 
				transactionDate <= now
			);
		});

		const weeklyIncome = weeklyTransactions
			.filter(t => t.type === 1)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		
		const weeklyExpense = weeklyTransactions
			.filter(t => t.type === 2)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		// Get top spending categories this month
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthlyExpenseTransactions = transactions.filter(t => {
			const transactionDate = new Date(t.transactionDate);
			return (
				t.userId === userId && 
				t.type === 2 &&
				transactionDate >= startOfMonth && 
				transactionDate <= now
			);
		});

		const categorySpending = new Map();
		monthlyExpenseTransactions.forEach(t => {
			const amount = Math.abs(t.amount);
			categorySpending.set(t.userCategoryId, (categorySpending.get(t.userCategoryId) || 0) + amount);
		});

		const allCategories = await this.getUserCategories(userId);
		const topCategories = Array.from(categorySpending.entries())
			.sort(([,a], [,b]) => b - a)
			.slice(0, 5)
			.map(([categoryId, amount]) => {
				const category = allCategories.find((c: any) => c.id === categoryId);
				return {
					category: {
						id: category?.id || 0,
						name: category?.name || 'Unknown',
						icon: category?.icon || 'help-circle'
					},
					amount
				};
			});

		return {
			success: true,
			data: {
				streak: streakData,
				weeklyStats: {
					income: weeklyIncome,
					expense: weeklyExpense,
					net: weeklyIncome - weeklyExpense,
					transactionCount: weeklyTransactions.length
				},
				topCategories
			}
		};
	},
	async getUserPreferences(userId: number) {
		await delay(150);
		
		const [currentWallet, user] = await Promise.all([
			this.getCurrentWalletId(userId),
			this.getUser(userId)
		]);

		return {
			success: true,
			data: {
				currentWalletId: (currentWallet as any)?.walletId,
				user: user.success ? user.user : null,
				settings: {
					// Add any user preferences here
					defaultTransactionType: 2, // expense
					currency: 'VND'
				}
			}
		};
	},
	async createBudget(userId: number, data: {userCategoryId: number, walletId: number, amount: number, startDate: string, endDate: string, isRepeat?: number}) {
		await delay(400);
		// Uniqueness guard: user+cat+wallet+range
		const exists = budgets.some(b => b.userId===userId && b.userCategoryId===data.userCategoryId && b.walletId===data.walletId && b.startDate===data.startDate && b.endDate===data.endDate);
		if (exists) return { success: false, message: 'Ngân sách đã tồn tại cho khoảng thời gian này' } as any;
		const id = Math.max(0, ...budgets.map(b => b.id)) + 1;
		const budget = { id, userId, userCategoryId: data.userCategoryId, walletId: data.walletId, amount: data.amount, startDate: data.startDate, endDate: data.endDate, isRepeat: data.isRepeat ?? 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
		budgets.push(budget);
		return { success: true, budget };
	},
	async updateBudget(userId: number, budgetId: number, data: {userCategoryId?: number, walletId?: number, amount?: number, startDate?: string, endDate?: string, isRepeat?: number}) {
		await delay(300);
		const budget = budgets.find(b => b.id === budgetId && b.userId === userId);
		if (!budget) return { success: false, message: 'Ngân sách không tồn tại' };
		if (data.userCategoryId !== undefined) budget.userCategoryId = data.userCategoryId;
		if (data.walletId !== undefined) budget.walletId = data.walletId;
		if (data.amount !== undefined) budget.amount = data.amount;
		if (data.startDate !== undefined) budget.startDate = data.startDate;
		if (data.endDate !== undefined) budget.endDate = data.endDate;
		if (data.isRepeat !== undefined) budget.isRepeat = data.isRepeat;
		budget.updatedAt = new Date().toISOString();
		return { success: true, budget };
	},
	async deleteBudget(userId: number, budgetId: number) {
		await delay(250);
		const idx = budgets.findIndex(b => b.id === budgetId && b.userId === userId);
		if (idx === -1) return { success: false, message: 'Ngân sách không tồn tại' };
		budgets.splice(idx, 1);
		return { success: true };
	},

	// Budget repeat worker - to be scheduled daily (e.g., 00:10)
	async runDailyBudgetWorker(nowOverride?: Date) {
		await delay(10);
		const now = nowOverride ? new Date(nowOverride) : new Date();
		// normalize now to date-only
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		for (const b of [...budgets]) {
			if (!b.isRepeat || b.isRepeat !== 1) continue;
			const end = new Date(b.endDate);
			const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
			// Skip if today has not passed end_date
			if (today.getTime() <= endDateOnly.getTime()) continue;
			// Only repeat for fixed periods
			const type = getPeriodType(b.startDate, b.endDate);
			if (type === 'custom') continue;
			const next = nextPeriod(b.startDate, b.endDate);
			if (!next) continue;
			// De-dup guard
			const duplicate = budgets.some(x => x.userId===b.userId && x.userCategoryId===b.userCategoryId && x.walletId===b.walletId && x.startDate===next.start && x.endDate===next.end);
			if (duplicate) {
				// Still flip current to non-repeat to keep only one head
				b.isRepeat = 0;
				b.updatedAt = new Date().toISOString();
				continue;
			}
			// Create next period budget
			const id = Math.max(0, ...budgets.map(bb => bb.id)) + 1;
			const newBudget = {
				id,
				userId: b.userId,
				userCategoryId: b.userCategoryId,
				walletId: b.walletId,
				amount: b.amount,
				startDate: next.start,
				endDate: next.end,
				isRepeat: 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			budgets.push(newBudget);
			// Flip previous to non-repeat
			b.isRepeat = 0;
			b.updatedAt = new Date().toISOString();
		}
		return { success: true };
	},


	// User streak (consecutive days with at least one transaction)
	async getUserStreak(userId: number) {
		await delay(150);
		let streak = 0;
		const hasTxOnDate = (d: Date) => {
			const dateStr = d.toISOString().split('T')[0];
			return transactions.some(t => t.userId === userId && t.transactionDate === dateStr);
		};
		// Start from today and count backwards until a gap is found
		const today = new Date();
		// Normalize to date-only by using local date parts
		const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		while (hasTxOnDate(cursor)) {
			streak += 1;
			cursor.setDate(cursor.getDate() - 1);
		}
		return { success: true, streak };
	},

	// Search and filter transactions
	async searchTransactions(userId: number, query: string, walletId?: number) {
		await delay(300);
		let filtered = transactions.filter(t => t.userId === userId);
		
		if (walletId) {
			filtered = filtered.filter(t => t.walletId === walletId);
		}
		
		if (query.trim()) {
			filtered = filtered.filter(t => 
				t.content.toLowerCase().includes(query.toLowerCase())
			);
		}
		
		return filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
	},

	// Export transactions
	async exportTransactions(userId: number, format: 'csv' | 'json' = 'json') {
		await delay(500);
		const userTransactions = transactions.filter(t => t.userId === userId);
		
		if (format === 'csv') {
			const csvHeader = 'ID,Date,Amount,Type,Content,Category\n';
			const csvRows = userTransactions.map(t => {
				const category = userCategories.find(c => c.id === t.userCategoryId);
				const categoryName = category ? category.name : 'Khác';
				return `${t.id},${t.transactionDate},${t.amount},${t.type === 1 ? 'Income' : 'Expense'},"${t.content}","${categoryName}"`;
			}).join('\n');
			
			return { success: true, data: csvHeader + csvRows, format: 'csv' };
		} else {
			return { success: true, data: userTransactions, format: 'json' };
		}
	},
};


