// services/fakeApi.ts - Simple standalone fake API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simple in-memory storage
let users: Array<{id: number, email: string, password: string, verified?: boolean, name?: string}> = [];
let pendingOtps: Array<{email: string, otp: string, expires: number}> = [];
let wallets: Array<{id: number, userId: number, name: string, amount: number, currency: string, color?: string}> = [];
let categories: Array<{id: number, name: string, type: number, icon: string, color?: string}> = [];
let userCategories: Array<{id: number, userId: number, name: string, type: number, icon: string, color?: string}> = [];
let userSettings: Array<{userId: number, currency: string}> = [];
let transactions: Array<{id: number, userId: number, walletId: number, userCategoryId: number, amount: number, transactionDate: string, content: string, type: number}> = [];

// Initialize mock data
const mockUserId = 1;

// Add default user
users = [
	{ id: mockUserId, email: 'user@example.com', password: '123456', verified: true, name: 'Người dùng' }
];

// Add colors to wallets - balances will be calculated from transactions
wallets = [
	{ id: 1, userId: mockUserId, name: 'Ví chính', amount: 0, currency: 'VND', color: '#3B82F6' },
	{ id: 2, userId: mockUserId, name: 'Ví tiết kiệm', amount: 0, currency: 'VND', color: '#10B981' }
];

// Add colors to user categories
userCategories = [
	{ id: 1, userId: mockUserId, name: 'Ăn uống', type: 2, icon: 'silverware-fork-knife', color: '#F59E0B' },
	{ id: 2, userId: mockUserId, name: 'Giải trí', type: 2, icon: 'gamepad-variant-outline', color: '#8B5CF6' },
	{ id: 3, userId: mockUserId, name: 'Di chuyển', type: 2, icon: 'car-outline', color: '#06B6D4' },
	{ id: 4, userId: mockUserId, name: 'Lương', type: 1, icon: 'briefcase-outline', color: '#10B981' },
	{ id: 5, userId: mockUserId, name: 'Thưởng', type: 1, icon: 'gift-outline', color: '#F97316' },
];

// Generate more realistic transaction data
const generateMockTransactions = () => {
	const today = new Date();
	const transactions = [];
	let id = 1;

	// Generate transactions for the last 30 days
	for (let i = 0; i < 30; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split('T')[0];

		// Random number of transactions per day (0-4)
		const transactionsPerDay = Math.floor(Math.random() * 5);
		
		for (let j = 0; j < transactionsPerDay; j++) {
			const isIncome = Math.random() < 0.2; // 20% chance of income
			const categoryId = isIncome ? 
				(Math.random() < 0.5 ? 4 : 5) : // Lương or Thưởng
				(Math.floor(Math.random() * 3) + 1); // Ăn uống, Giải trí, or Di chuyển
			
			const amounts = isIncome ? 
				[500000, 1000000, 2000000, 5000000] : // Income amounts
				[15000, 25000, 50000, 100000, 150000, 200000]; // Expense amounts
			
			const descriptions = isIncome ?
				['Lương tháng', 'Thưởng cuối năm', 'Tiền thưởng', 'Lãi ngân hàng'] :
				['Ăn trưa', 'Cà phê', 'Xem phim', 'Mua sắm', 'Xăng xe', 'Đi chơi', 'Ăn tối', 'Mua đồ'];

			const amount = amounts[Math.floor(Math.random() * amounts.length)];
			const description = descriptions[Math.floor(Math.random() * descriptions.length)];

			transactions.push({
				id: id++,
				userId: mockUserId,
				walletId: Math.random() < 0.8 ? 1 : 2, // 80% main wallet, 20% savings
				userCategoryId: categoryId,
				amount: isIncome ? amount : -amount,
				transactionDate: dateStr,
				content: description,
				type: isIncome ? 1 : 2
			});
		}
	}

	return transactions;
};

transactions = generateMockTransactions();

// Calculate wallet balances from transactions
const calculateWalletBalances = () => {
	wallets.forEach(wallet => {
		const walletTransactions = transactions.filter(t => t.walletId === wallet.id && t.userId === wallet.userId);
		wallet.amount = walletTransactions.reduce((sum, t) => sum + t.amount, 0);
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

// Initialize default categories
categories = [...defaultCategories];

// Helper to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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

	// Setup
	async getSetupStatus(userId: number) {
		await delay(250);
		return {
			hasWallet: wallets.some(w => w.userId === userId),
			hasCurrency: userSettings.some(s => s.userId === userId),
			hasCategories: userCategories.some(c => c.userId === userId),
		};
	},

	async getCategories() {
		await delay(200);
		return categories;
	},

	async createWallet(userId: number, name: string, amount: number, currency: string) {
		await delay(300);
		const wallet = { id: wallets.length + 1, userId, name, amount, currency };
		wallets.push(wallet);
		return { success: true, wallet };
	},

	async setCurrency(userId: number, currency: string) {
		await delay(200);
		const existing = userSettings.find(s => s.userId === userId);
		if (existing) {
			existing.currency = currency;
		} else {
			userSettings.push({ userId, currency });
		}
		return { success: true };
	},

	async addCategory(userId: number, name: string, type: number, icon?: string) {
		await delay(300);
		const category = { id: userCategories.length + 1, userId, name, type, icon: icon || 'tag-outline' };
		userCategories.push(category);
		return { success: true, category };
	},

	// Transactions
	async getWallets(userId: number) {
		await delay(200);
		return wallets.filter(w => w.userId === userId);
	},

	async getTransactions(userId: number, walletId?: number) {
		await delay(300);
		let filtered = transactions.filter(t => t.userId === userId);
		if (walletId) {
			filtered = filtered.filter(t => t.walletId === walletId);
		}
		return filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
	},

	async addTransaction(userId: number, walletId: number, userCategoryId: number, amount: number, content: string, type: number) {
		await delay(400);
		const transaction = { 
			id: transactions.length + 1, 
			userId, 
			walletId, 
			userCategoryId, 
			amount, 
			transactionDate: new Date().toISOString().split('T')[0], 
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

	// Statistics and analytics
	async getTransactionStats(userId: number, walletId?: number, startDate?: string, endDate?: string) {
		await delay(300);
		let filtered = transactions.filter(t => t.userId === userId);
		
		if (walletId) {
			filtered = filtered.filter(t => t.walletId === walletId);
		}
		
		if (startDate && endDate) {
			filtered = filtered.filter(t => {
				const txDate = new Date(t.transactionDate);
				const start = new Date(startDate);
				const end = new Date(endDate);
				return txDate >= start && txDate <= end;
			});
		}

		const income = filtered.filter(t => t.type === 1).reduce((sum, t) => sum + t.amount, 0);
		const expense = filtered.filter(t => t.type === 2).reduce((sum, t) => sum + t.amount, 0);
		
		// Group by category
		const categoryStats = filtered.reduce((acc, t) => {
			const category = userCategories.find(c => c.id === t.userCategoryId);
			const categoryName = category ? category.name : 'Khác';
			
			if (!acc[categoryName]) {
				acc[categoryName] = { income: 0, expense: 0, count: 0 };
			}
			
			if (t.type === 1) {
				acc[categoryName].income += t.amount;
			} else {
				acc[categoryName].expense += t.amount;
			}
			acc[categoryName].count += 1;
			
			return acc;
		}, {} as Record<string, { income: number, expense: number, count: number }>);

		return {
			success: true,
			stats: {
				totalIncome: income,
				totalExpense: expense,
				netAmount: income - expense,
				transactionCount: filtered.length,
				categoryStats
			}
		};
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


