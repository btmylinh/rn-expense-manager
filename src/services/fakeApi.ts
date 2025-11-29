// services/fakeApi.ts - Simple standalone fake API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simple in-memory storage
let users: Array<{id: number, email: string, password: string, verified?: boolean, name?: string, is_2fa?: number}> = [];
let pendingOtps: Array<{email: string, otp: string, expires: number}> = [];
let pending2FA: Array<{email: string, code: string, expires: number}> = [];
let wallets: Array<{id: number, userId: number, name: string, amount: number, currency: string, color?: string, is_default?: boolean | number}> = [];
let currentWalletByUser: Record<number, number | undefined> = {};
let categories: Array<{id: number, name: string, type: number, icon: string, color?: string}> = [];
let userCategories: Array<{id: number, userId: number, name: string, type: number, icon: string, color?: string}> = [];
let transactions: Array<{id: number, userId: number, walletId: number, userCategoryId: number, amount: number, transactionDate: string, content: string, type: number, note?: string}> = [];
let budgets: Array<{id: number, userId: number, userCategoryId: number, walletId: number, amount: number, startDate: string, endDate: string, isRepeat?: number, createdAt?: string, updatedAt?: string}> = [];
let notifications: Array<{id: number, userId: number, type: string, title: string, message: string, data?: any, isRead: boolean, createdAt: string, scheduledFor?: string}> = [];
let notificationSettings: Array<{userId: number, budgetAlerts: boolean, transactionReminders: boolean, weeklyReports: boolean, securityAlerts: boolean, pushEnabled: boolean, quietHoursEnabled: boolean, quietHoursStart: string, quietHoursEnd: string, updatedAt: string}> = [];
let streaks: Array<{id: number, userId: number, streakDays?: number, streak_days?: number, lastTransactionDate?: string, last_transaction_date?: string, createdAt?: string, created_at?: string, updatedAt?: string, updated_at?: string}> = [];
let streakHistory: Array<{id: number, userId: number, date: string, hasActivity: boolean, activityType: string, createdAt: string}> = [];
let streakSettings: Array<{id: number, userId: number, dailyReminderEnabled?: boolean, daily_reminder_enabled?: boolean, reminderTime?: string, reminder_time?: string, weekendMode?: boolean, weekend_mode?: boolean, bestStreak?: number, best_streak?: number, totalActiveDays?: number, total_active_days?: number, createdAt?: string, created_at?: string, updatedAt?: string, updated_at?: string}> = [];
let savingsGoals: Array<{id: number, userId: number, name: string, targetAmount: number, currentAmount: number, deadline: string, icon: string, color: string, currency: string, status: string, createdAt: string, updatedAt: string}> = [];
let savingsGoalContributions: Array<{id: number, goalId: number, amount: number, note: string, createdAt: string}> = [];

// Recurring Expenses
type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
type RecurringPattern = {
	id: number;
	userId: number;
	name: string;
	amount: number;
	categoryId: number;
	categoryName?: string;
	frequency: RecurringFrequency;
	nextDueDate: string;
	isActive: boolean;
	isAutoDetected: boolean;
	confidence: number; // 0-100, độ tin cậy của pattern (cho auto-detected)
	reminderDaysBefore: number;
	note?: string;
	createdAt: string;
	updatedAt: string;
};

// Recurring Expenses - Loaded from mockData.json
let recurringExpenses: Array<RecurringPattern> = [];
let recurringExpenseDetectedPatterns: Array<any> = []; // Patterns phát hiện tự động từ mockData
let recurringExpensePredictions: any = null; // Dự báo đã tính sẵn từ mockData
let recurringExpenseReminders: Array<{id: number, recurringExpenseId: number, userId: number, scheduledDate: string, isNotified: boolean, createdAt: string}> = [];
type ChatRole = 'user' | 'assistant' | 'system';
type FakeChatMessage = {
	id: string;
	userId: number;
	role: ChatRole;
	content: string;
	createdAt: string;
	metadata?: Record<string, unknown>;
};
type FakeChatFaq = {
	id: string;
	question: string;
	answer: string;
	tags: string[];
};
let chatMessages: FakeChatMessage[] = [];
let chatFaqs: FakeChatFaq[] = [
	{
		id: 'faq-1',
		question: 'Làm sao để theo dõi chi tiêu hàng tháng?',
		answer: 'Bạn có thể tạo ngân sách cho từng danh mục và xem báo cáo trong mục Thống kê.',
		tags: ['budget', 'tracking'],
	},
	{
		id: 'faq-2',
		question: 'Tôi nên tiết kiệm bao nhiêu mỗi tháng?',
		answer: 'Hãy đặt mục tiêu tiết kiệm 10-20% thu nhập và dùng tính năng Mục tiêu tiết kiệm để theo dõi.',
		tags: ['saving', 'goal'],
	},
	{
		id: 'faq-3',
		question: 'Ứng dụng có nhắc nhở giao dịch không?',
		answer: 'Bạn có thể bật nhắc nhở trong phần Cài đặt thông báo để không bỏ lỡ giao dịch quan trọng.',
		tags: ['notification'],
	},
];
let currentUserId: number | null = null;

// Initialize mock data deterministically from JSON (map snake_case -> camelCase)
const mockUserId = 1;
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const seed = require('./mockData.json');
		if (seed.users) {
			// Map users và đảm bảo is_2fa được map đúng
			users = seed.users.map((u: any) => ({
				id: u.id,
				email: u.email,
				password: u.password,
				verified: u.verified,
				name: u.name,
				is_2fa: u.is_2fa !== undefined ? u.is_2fa : (u.is2fa !== undefined ? u.is2fa : 0)
			}));
		}
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
	if (seed.notifications) {
		notifications = seed.notifications.map((n: any) => ({
			id: n.id,
			userId: n.user_id,
			type: n.type,
			title: n.title,
			message: n.message,
			data: n.data,
			isRead: n.is_read,
			createdAt: n.created_at,
			scheduledFor: n.scheduled_for
		}));
	}
	if (seed.notification_settings) {
		notificationSettings = seed.notification_settings.map((s: any) => ({
			userId: s.user_id,
			budgetAlerts: s.budget_alerts,
			transactionReminders: s.transaction_reminders,
			weeklyReports: s.weekly_reports,
			securityAlerts: s.security_alerts,
			pushEnabled: s.push_enabled,
			quietHoursEnabled: s.quiet_hours_enabled,
			quietHoursStart: s.quiet_hours_start,
			quietHoursEnd: s.quiet_hours_end,
			updatedAt: s.updated_at
		}));
	}
	if (seed.streaks) {
		streaks = seed.streaks.map((s: any) => ({
			id: s.id,
			userId: s.user_id,
			streakDays: s.streak_days,
			lastTransactionDate: s.last_transaction_date,
			createdAt: s.created_at,
			updatedAt: s.updated_at
		}));
	}
	if (seed.streak_history) {
		streakHistory = seed.streak_history.map((h: any) => ({
			id: h.id,
			userId: h.user_id,
			date: h.date,
			hasActivity: h.has_activity,
			activityType: h.activity_type,
			createdAt: h.created_at
		}));
	}
	if (seed.streak_settings) {
		streakSettings = seed.streak_settings.map((s: any) => ({
			id: s.id,
			userId: s.user_id,
			dailyReminderEnabled: s.daily_reminder_enabled,
			reminderTime: s.reminder_time,
			weekendMode: s.weekend_mode,
			bestStreak: s.best_streak,
			totalActiveDays: s.total_active_days,
			createdAt: s.created_at,
			updatedAt: s.updated_at
		}));
	}
	if (seed.savings_goals) {
		savingsGoals = seed.savings_goals.map((g: any) => ({
			id: g.id,
			userId: g.user_id,
			name: g.name,
			targetAmount: g.target_amount,
			currentAmount: g.current_amount,
			deadline: g.deadline,
			icon: g.icon,
			color: g.color,
			currency: g.currency || 'VND',
			status: g.status,
			createdAt: g.created_at,
			updatedAt: g.updated_at
		}));
	}
	if (seed.savings_goal_contributions) {
		savingsGoalContributions = seed.savings_goal_contributions.map((c: any) => ({
			id: c.id,
			goalId: c.goal_id,
			amount: c.amount,
			note: c.note,
			createdAt: c.created_at
		}));
	}
	if (seed.chat_messages) {
		chatMessages = seed.chat_messages.map((m: any) => ({
			id: String(m.id ?? `msg-${m.created_at ?? Date.now()}`),
			userId: m.user_id ?? mockUserId,
			role: (m.role as ChatRole) ?? 'assistant',
			content: m.content ?? '',
			createdAt: m.created_at ?? new Date().toISOString(),
			metadata: m.metadata,
		}));
	}
	if (seed.chat_faqs) {
		chatFaqs = seed.chat_faqs.map((f: any) => ({
			id: String(f.id ?? `faq-${f.question}`),
			question: f.question ?? '',
			answer: f.answer ?? '',
			tags: Array.isArray(f.tags) ? f.tags : [],
		}));
	}
	
	// Load recurring expenses from mockData - Dữ liệu đã được mock sẵn
	if (seed.recurring_expenses) {
		recurringExpenses = seed.recurring_expenses.map((e: any) => ({
			id: e.id,
			userId: e.user_id,
			name: e.name,
			amount: e.amount,
			categoryId: e.category_id,
			frequency: e.frequency as RecurringFrequency,
			nextDueDate: e.next_due_date,
			isActive: e.is_active,
			isAutoDetected: e.is_auto_detected,
			confidence: e.confidence,
			reminderDaysBefore: e.reminder_days_before,
			note: e.note,
			createdAt: e.created_at,
			updatedAt: e.updated_at
		}));
	}
	
	// Load detected patterns from mockData - Patterns đã được phát hiện và mock sẵn
	if (seed.recurring_expense_detected_patterns) {
		recurringExpenseDetectedPatterns = seed.recurring_expense_detected_patterns;
	}
	
	// Load predictions from mockData - Dự báo đã được tính toán và mock sẵn
	if (seed.recurring_expense_predictions) {
		recurringExpensePredictions = seed.recurring_expense_predictions;
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

// Recurring expenses đã được load từ mockData.json
// Không cần initialize nữa vì dữ liệu đã có sẵn trong mockData

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
	// ============ AUTH ENDPOINTS ============
	
	async login(email: string, password: string) {
		await delay(500);
		
		const user = users.find(u => u.email === email && u.password === password);
		
		if (user) {
			// Kiểm tra nếu tài khoản có bật 2FA (kiểm tra cả 1 và true)
			const has2FA = user.is_2fa === 1 || (typeof user.is_2fa === 'number' && user.is_2fa > 0) || user.is_2fa === true;
			
			if (has2FA) {
				// Gửi mã xác thực qua email
				const code = generateOTP();
				pending2FA.push({ email, code, expires: Date.now() + 600000 }); // 10 phút
				
				// Log mã 2FA cho development
				if (__DEV__) {
					console.log('🔐 2FA Code for', email, ':', code);
				}
				
				return {
					success: true,
					requires2FA: true,
					email: user.email,
					message: 'Mã xác thực đã được gửi đến email của bạn'
				};
			}
			
			return {
				success: true,
				requires2FA: false,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					verified: user.verified
				},
				token: `fake-token-${user.id}`,
				email: user.email
			};
		} else {
			return {
				success: false,
				message: 'Email hoặc mật khẩu không đúng'
			};
		}
	},

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
		
		// Log OTP for testing in development
		if (__DEV__) {
			console.log('📧 OTP for', email, ':', otp);
		}
		return { success: true, message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.', otp };
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

	async resendOTP(email: string) {
		await delay(400);
		const user = users.find(u => u.email === email);
		if (!user) {
			return { success: false, message: 'Email không tồn tại' };
		}
		
		// Xóa mã cũ
		pendingOtps = pendingOtps.filter(p => p.email !== email);
		
		// Tạo mã mới
		const otp = generateOTP();
		pendingOtps.push({ email, otp, expires: Date.now() + 600000 }); // 10 phút
		
		// Log OTP cho development
		if (__DEV__) {
			console.log('📧 OTP (resend) for', email, ':', otp);
		}
		
		return { success: true, message: 'Đã gửi lại mã OTP đến email của bạn', otp };
	},

	async resetPassword(email: string) {
		await delay(400);
		const user = users.find(u => u.email === email);
		if (!user) {
			return { success: false, message: 'Email không tồn tại' };
		}
		return { success: true, message: 'Đã gửi email đặt lại mật khẩu' };
	},

	// 2FA Endpoints
	async verify2FA(email: string, code: string) {
		await delay(500);
		const pending = pending2FA.find(p => p.email === email && p.code === code && p.expires > Date.now());
		if (!pending) {
			return { success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' };
		}
		
		const user = users.find(u => u.email === email);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		
		// Xóa mã 2FA đã sử dụng
		pending2FA = pending2FA.filter(p => p.email !== email);
		
		return {
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				verified: user.verified
			},
			token: `fake-token-${user.id}`
		};
	},

	async resend2FACode(email: string) {
		await delay(400);
		const user = users.find(u => u.email === email);
		if (!user) {
			return { success: false, message: 'Email không tồn tại' };
		}
		
		if (user.is_2fa !== 1) {
			return { success: false, message: 'Tài khoản chưa bật xác thực 2 bước' };
		}
		
		// Xóa mã cũ
		pending2FA = pending2FA.filter(p => p.email !== email);
		
		// Tạo mã mới
		const code = generateOTP();
		pending2FA.push({ email, code, expires: Date.now() + 600000 }); // 10 phút
		
		// Log mã 2FA cho development
		if (__DEV__) {
			console.log('🔐 2FA Code (resend) for', email, ':', code);
		}
		
		return { success: true, message: 'Đã gửi lại mã xác thực đến email của bạn' };
	},

	async toggle2FA(userId: number, enable: boolean) {
		await delay(300);
		const user = users.find(u => u.id === userId);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		
		user.is_2fa = enable ? 1 : 0;
		return { 
			success: true, 
			message: enable ? 'Đã bật xác thực 2 bước' : 'Đã tắt xác thực 2 bước',
			is_2fa: user.is_2fa
		};
	},

	async getUser2FAStatus(userId: number) {
		await delay(200);
		const user = users.find(u => u.id === userId);
		if (!user) {
			return { success: false, message: 'Người dùng không tồn tại' };
		}
		
		return { 
			success: true, 
			is_2fa: user.is_2fa === 1 
		};
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

	const oldDate = (transaction.transactionDate || '').split('T')[0];
	const newDate = data.transactionDate?.split('T')[0];
	const dateChanged = newDate && newDate !== oldDate;

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

	// If date changed, update streak history
	if (dateChanged && oldDate && newDate) {
		// Check if old date had other transactions
		const hasOtherOnOldDate = transactions.some(
			t => t.id !== transactionId &&
			     t.userId === userId && 
			     t.transactionDate.split('T')[0] === oldDate
		);
		
		// If no other transactions on old date, mark as inactive
		if (!hasOtherOnOldDate) {
			const oldHistory = streakHistory.find(
				h => h.userId === userId && h.date === oldDate
			);
		if (oldHistory && oldHistory.activityType === 'transaction') {
			oldHistory.hasActivity = false;
		}
		}
		
		// Add/update history for new date
		let newHistory = streakHistory.find(
			h => h.userId === userId && h.date === newDate
		);
		
		if (!newHistory) {
			newHistory = {
				id: Math.max(...streakHistory.map(h => h.id), 0) + 1,
				userId,
				date: newDate,
				hasActivity: true,
				activityType: 'transaction',
				createdAt: new Date().toISOString()
			};
			streakHistory.push(newHistory);
		} else {
			newHistory.hasActivity = true;
		}
		
		// Recalculate entire streak
		await this.recalculateStreak(userId);
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
	const transactionDate = transaction.transactionDate.split('T')[0];
		
		// Update wallet balance (reverse the transaction)
		const wallet = wallets.find(w => w.id === transaction.walletId && w.userId === userId);
		if (wallet) {
			wallet.amount -= (transaction.type === 1 ? transaction.amount : -transaction.amount);
		}

		// Remove transaction
		transactions.splice(transactionIndex, 1);
		
	// Check if there are other transactions on same day
	const hasOtherTransactions = transactions.some(
		t => t.userId === userId && 
		     t.transactionDate.split('T')[0] === transactionDate
	);
	
	// If no other transactions on that day, update streak history
	if (!hasOtherTransactions && transactionDate) {
		const historyIndex = streakHistory.findIndex(
			h => h.userId === userId && h.date === transactionDate
		);
		
		if (historyIndex >= 0) {
			const activityType = streakHistory[historyIndex].activityType;
			
			// Only mark as inactive if it was a transaction entry
			if (activityType === 'transaction') {
				streakHistory[historyIndex].hasActivity = false;
			}
		}
		
		// Recalculate streak from scratch
		await this.recalculateStreak(userId);
	}
	
	return { success: true, message: 'Xóa giao dịch thành công và cập nhật streak' };
},

// Bulk delete transactions
async bulkDeleteTransactions(userId: number, transactionIds: number[]) {
	await delay(500);
	
	if (!transactionIds || transactionIds.length === 0) {
		return { success: false, message: 'Không có giao dịch nào được chọn' };
	}
	
	const deletedDates: Set<string> = new Set();
	let deletedCount = 0;
	
	// Delete each transaction and track dates
	for (const transactionId of transactionIds) {
		const transactionIndex = transactions.findIndex(
			t => t.id === transactionId && t.userId === userId
		);
		
		if (transactionIndex >= 0) {
			const transaction = transactions[transactionIndex];
			const transactionDate = transaction.transactionDate.split('T')[0];
			
			// Update wallet balance (reverse the transaction)
			const wallet = wallets.find(w => w.id === transaction.walletId && w.userId === userId);
			if (wallet) {
				wallet.amount -= (transaction.type === 1 ? transaction.amount : -transaction.amount);
			}
			
			// Remove transaction
			transactions.splice(transactionIndex, 1);
			deletedCount++;
			
			if (transactionDate) {
				deletedDates.add(transactionDate);
			}
		}
	}
	
	// Update streak history for affected dates
	for (const date of deletedDates) {
		const hasOtherTransactions = transactions.some(
			t => t.userId === userId && 
			     t.transactionDate.split('T')[0] === date
		);
		
		if (!hasOtherTransactions) {
			const historyIndex = streakHistory.findIndex(
				h => h.userId === userId && h.date === date
			);
			
			if (historyIndex >= 0) {
				const activityType = streakHistory[historyIndex].activityType;
				
				// Only mark as inactive if it was a transaction entry
				if (activityType === 'transaction') {
					streakHistory[historyIndex].hasActivity = false;
				}
			}
		}
	}
	
	// Recalculate streak once after all deletions
	if (deletedDates.size > 0) {
		await this.recalculateStreak(userId);
	}
	
	return { 
		success: true, 
		message: `Đã xóa ${deletedCount} giao dịch và cập nhật streak`,
		deletedCount 
	};
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
	
	// Update streak activity
	const transactionDate = transaction.transactionDate.split('T')[0];
	const today = new Date().toISOString().split('T')[0];
	
	// Only record streak if transaction is for today (or past dates shouldn't affect today's streak)
	if (transactionDate === today) {
		await this.recordStreakActivity(userId, 'transaction');
	} else {
		// For past/future dates, just update history without affecting current streak
		let history = streakHistory.find(h => h.userId === userId && h.date === transactionDate);
		if (!history) {
			history = {
				id: Math.max(...streakHistory.map(h => h.id), 0) + 1,
				userId,
				date: transactionDate,
				hasActivity: true,
				activityType: 'transaction',
				createdAt: new Date().toISOString()
			};
			streakHistory.push(history);
		} else {
			history.hasActivity = true;
			history.activityType = 'transaction';
		}
		
		// Recalculate streak to update based on new historical data
		await this.recalculateStreak(userId);
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

	async updateWallet(userId: number, walletId: number, updates: {name?: string, currency?: string, color?: string}) {
		await delay(300);
		const wallet = wallets.find(w => w.id === walletId && w.userId === userId);
		if (!wallet) {
			return { success: false, message: 'Ví không tồn tại' };
		}
		
		// Check if new name already exists for another wallet
		if (updates.name && updates.name.trim() !== wallet.name) {
			const nameExists = wallets.some(w => 
				w.userId === userId && 
				w.id !== walletId && 
				w.name.trim().toLowerCase() === updates.name!.trim().toLowerCase()
			);
			if (nameExists) {
				return { success: false, message: 'Tên ví đã tồn tại' };
			}
		}

		if (updates.name !== undefined) {
			wallet.name = updates.name.trim();
		}
		if (updates.currency !== undefined) {
			wallet.currency = updates.currency;
		}
		if (updates.color !== undefined) {
			wallet.color = updates.color;
		}
		
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

	async transferBetweenWallets(userId: number, fromWalletId: number, toWalletId: number, amount: number, note?: string) {
		await delay(400);
		
		const fromWallet = wallets.find(w => w.id === fromWalletId && w.userId === userId);
		const toWallet = wallets.find(w => w.id === toWalletId && w.userId === userId);

		if (!fromWallet) {
			return { success: false, message: 'Ví nguồn không tồn tại' };
		}
		if (!toWallet) {
			return { success: false, message: 'Ví đích không tồn tại' };
		}
		if (fromWalletId === toWalletId) {
			return { success: false, message: 'Không thể chuyển tiền cho cùng một ví' };
		}
		if (fromWallet.currency !== toWallet.currency) {
			return { success: false, message: `Không thể chuyển tiền giữa các ví khác đơn vị tiền tệ (${fromWallet.currency} → ${toWallet.currency})` };
		}
		if (amount <= 0) {
			return { success: false, message: 'Số tiền phải lớn hơn 0' };
		}
		if (fromWallet.amount < amount) {
			return { success: false, message: 'Số dư ví nguồn không đủ' };
		}

		// Update wallet balances
		fromWallet.amount -= amount;
		toWallet.amount += amount;

		// Create transfer record (optional - could be tracked in transactions)
		const transferNote = note || `Chuyển tiền từ ${fromWallet.name} sang ${toWallet.name}`;

		return { 
			success: true, 
			message: 'Chuyển tiền thành công',
			fromWallet,
			toWallet,
			transferNote
		};
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

		// Get recent transactions (last 10) - sorted oldest to newest
		const recentTransactions = transactions
			.filter(t => t.userId === userId && t.walletId === walletId)
			.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
			.slice(-10); // Take last 10 (most recent) but keep oldest→newest order

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
				// Sort transactions within same day by ID (oldest first, assuming ID increments with time)
				transactions: dayTransactions.sort((a, b) => a.id - b.id)
			}))
			.sort((a, b) => {
				// Sort groups by date from oldest to newest
				const dateA = new Date(a.transactions[0].date);
				const dateB = new Date(b.transactions[0].date);
				return dateA.getTime() - dateB.getTime();
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

	// Dashboard APIs - Separate APIs for each data type
	async getDashboardSummary(userId: number, timeRange: 'week' | 'month') {
		await delay(500);
		
		const userTxs = transactions.filter(t => t.userId === userId);
		const now = new Date();
		let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

		if (timeRange === 'week') {
			const dayOfWeek = now.getDay();
			// Tính từ thứ 2 (Monday = 1) đến Chủ nhật (Sunday = 0)
			const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
			currentStart = new Date(now);
			currentStart.setDate(now.getDate() - daysFromMonday);
			currentStart.setHours(0, 0, 0, 0);
			currentEnd = new Date(now);

			// Tuần trước: từ thứ 2 tuần trước đến chủ nhật tuần trước
			previousEnd = new Date(currentStart);
			previousEnd.setDate(previousEnd.getDate() - 1); // Chủ nhật tuần trước
			previousStart = new Date(previousEnd);
			previousStart.setDate(previousStart.getDate() - 6); // Thứ 2 tuần trước
		} else {
			currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
			currentEnd = new Date(now);

			previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
			previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		}

		const currentPeriodTxs = userTxs.filter(t => {
			const txDate = new Date(t.transactionDate);
			return txDate >= currentStart && txDate <= currentEnd;
		});

		const previousPeriodTxs = userTxs.filter(t => {
			const txDate = new Date(t.transactionDate);
			return txDate >= previousStart && txDate <= previousEnd;
		});

		const currentIncome = currentPeriodTxs
			.filter(t => t.type === 1)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		const currentExpense = currentPeriodTxs
			.filter(t => t.type === 2)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		const previousIncome = previousPeriodTxs
			.filter(t => t.type === 1)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		const previousExpense = previousPeriodTxs
			.filter(t => t.type === 2)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		const incomeChange = previousIncome > 0 
			? ((currentIncome - previousIncome) / previousIncome) * 100 
			: 0;

		const expenseChange = previousExpense > 0 
			? ((currentExpense - previousExpense) / previousExpense) * 100 
			: 0;

		return {
			success: true,
			data: {
				current: {
					income: currentIncome,
					expense: currentExpense,
					net: currentIncome - currentExpense,
				},
				previous: {
					income: previousIncome,
					expense: previousExpense,
					net: previousIncome - previousExpense,
				},
				changes: {
					income: incomeChange,
					expense: expenseChange,
				},
				period: {
					current: timeRange === 'week' 
						? `Tuần này (${currentStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${new Date(currentStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`
						: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
					previous: timeRange === 'week' ? 'tuần trước' : 'tháng trước',
				}
			}
		};
	},

	async getDashboardBarChartData(userId: number, timeRange: 'week' | 'month') {
		await delay(300);
		
		const summary = await this.getDashboardSummary(userId, timeRange);
		if (!summary.success) return { success: false, data: [] };

		const { current, previous } = summary.data;

		return {
			success: true,
			data: [
				{
					value: current.expense,
					label: timeRange === 'week' ? 'Tuần này' : 'Tháng này',
					color: '#EF4444', // error color
					type: 'current'
				},
				{
					value: previous.expense,
					label: timeRange === 'week' ? 'Tuần trước' : 'Tháng trước',
					color: '#6B7280', // onSurfaceVariant color
					type: 'previous'
				}
			]
		};
	},

	async getDashboardTopCategories(userId: number, timeRange: 'week' | 'month', limit: number = 3) {
		await delay(400);
		
		const userTxs = transactions.filter(t => t.userId === userId);
		const userCats = userCategories.filter(c => c.userId === userId);
		const now = new Date();
		let currentStart: Date, currentEnd: Date;

		if (timeRange === 'week') {
			const dayOfWeek = now.getDay();
			// Tính từ thứ 2 (Monday = 1) đến Chủ nhật (Sunday = 0)
			const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
			currentStart = new Date(now);
			currentStart.setDate(now.getDate() - daysFromMonday);
			currentStart.setHours(0, 0, 0, 0);
			currentEnd = new Date(now);
		} else {
			currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
			currentEnd = new Date(now);
		}

		const currentPeriodTxs = userTxs.filter(t => {
			const txDate = new Date(t.transactionDate);
			return txDate >= currentStart && txDate <= currentEnd && t.type === 2; // Only expenses
		});

		const categorySpending = new Map<number, number>();
		currentPeriodTxs.forEach(t => {
			const amount = Math.abs(t.amount);
			categorySpending.set(
				t.userCategoryId,
				(categorySpending.get(t.userCategoryId) || 0) + amount
			);
		});

		const totalExpense = Array.from(categorySpending.values()).reduce((sum, amount) => sum + amount, 0);

		const topCategories = Array.from(categorySpending.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([categoryId, amount], index) => {
				const category = userCats.find(c => c.id === categoryId);
				const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
				
				return {
					id: category?.id || 0,
					name: category?.name || 'Unknown',
					icon: category?.icon || 'help-circle',
					amount: amount,
					percentage: percentage,
					rank: index + 1,
				};
			});

		return {
			success: true,
			data: topCategories,
			totalExpense: totalExpense
		};
	},

	async getDashboardPieChartData(userId: number, timeRange: 'week' | 'month') {
		await delay(350);
		
		const topCategories = await this.getDashboardTopCategories(userId, timeRange, 5);
		if (!topCategories.success) return { success: false, data: [] };

		const colors = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6'];

		const pieData = topCategories.data.map((cat, index) => ({
			value: cat.percentage,
			color: colors[index % colors.length],
			gradientCenterColor: colors[index % colors.length] + '80',
			focused: index === 0,
			text: `${cat.percentage.toFixed(1)}%`,
			category: {
				id: cat.id,
				name: cat.name,
				icon: cat.icon,
				amount: cat.amount,
			}
		}));

		return {
			success: true,
			data: pieData,
			totalAmount: topCategories.totalExpense,
			centerLabel: {
				amount: topCategories.totalExpense,
				text: 'Tổng chi'
			}
		};
	},

	async getDashboardRecentTransactions(userId: number, limit: number = 3) {
		await delay(300);
		
		const userTxs = transactions.filter(t => t.userId === userId);
		const userCats = userCategories.filter(c => c.userId === userId);

		const recentTxs = userTxs
			.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
			.slice(0, limit)
			.map(tx => {
				const category = userCats.find(c => c.id === tx.userCategoryId);
				return {
					id: tx.id,
					title: tx.content || 'Giao dịch',
					amount: tx.amount,
					type: tx.type, // 1: income, 2: expense
					date: tx.transactionDate,
					category: {
						id: category?.id || 0,
						name: category?.name || 'Chưa phân loại',
						icon: category?.icon || 'tag-outline',
					},
					formattedDate: new Date(tx.transactionDate).toLocaleDateString('vi-VN', { 
						day: '2-digit', 
						month: '2-digit', 
						year: 'numeric' 
					}),
					isIncome: tx.type === 1,
					displayAmount: Math.abs(tx.amount),
				};
			});

		return {
			success: true,
			data: recentTxs
		};
	},

	// Transaction List APIs
	async getTransactionsList(userId: number, options: {
		page?: number;
		limit?: number;
		search?: string;
		categoryId?: number;
		walletId?: number;
		type?: number; // 1: income, 2: expense
		dateFrom?: string;
		dateTo?: string;
		sortBy?: 'date' | 'amount' | 'category';
		sortOrder?: 'asc' | 'desc';
	} = {}) {
		await delay(400);
		
		const {
			page = 1,
			limit = 20,
			search = '',
			categoryId,
			walletId,
			type,
			dateFrom,
			dateTo,
			sortBy = 'date',
			sortOrder = 'desc'
		} = options;

		let userTxs = transactions.filter(t => t.userId === userId);
		const userCats = userCategories.filter(c => c.userId === userId);

		// Apply filters
		if (search) {
			userTxs = userTxs.filter(t => 
				(t.content || '').toLowerCase().includes(search.toLowerCase())
			);
		}

		if (categoryId) {
			userTxs = userTxs.filter(t => t.userCategoryId === categoryId);
		}

		if (walletId) {
			userTxs = userTxs.filter(t => t.walletId === walletId);
		}

		if (type) {
			userTxs = userTxs.filter(t => t.type === type);
		}

		if (dateFrom) {
			userTxs = userTxs.filter(t => new Date(t.transactionDate) >= new Date(dateFrom));
		}

		if (dateTo) {
			userTxs = userTxs.filter(t => new Date(t.transactionDate) <= new Date(dateTo));
		}

		// Apply sorting
		userTxs.sort((a, b) => {
			let aValue: any, bValue: any;
			
			switch (sortBy) {
				case 'amount':
					aValue = Math.abs(a.amount);
					bValue = Math.abs(b.amount);
					break;
				case 'category':
					const aCat = userCats.find(c => c.id === a.userCategoryId);
					const bCat = userCats.find(c => c.id === b.userCategoryId);
					aValue = aCat?.name || '';
					bValue = bCat?.name || '';
					break;
				case 'date':
				default:
					aValue = new Date(a.transactionDate).getTime();
					bValue = new Date(b.transactionDate).getTime();
					break;
			}

			if (sortOrder === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

		// Apply pagination
		const total = userTxs.length;
		const totalPages = Math.ceil(total / limit);
		const startIndex = (page - 1) * limit;
		const paginatedTxs = userTxs.slice(startIndex, startIndex + limit);

		// Format transactions
		const formattedTxs = paginatedTxs.map(tx => {
			const category = userCats.find(c => c.id === tx.userCategoryId);
			const wallet = wallets.find(w => w.id === tx.walletId);
			
			return {
				id: tx.id,
				title: tx.content || 'Giao dịch',
				amount: tx.amount,
				displayAmount: Math.abs(tx.amount),
				type: tx.type,
				isIncome: tx.type === 1,
				date: tx.transactionDate,
				formattedDate: new Date(tx.transactionDate).toLocaleDateString('vi-VN', { 
					day: '2-digit', 
					month: '2-digit', 
					year: 'numeric' 
				}),
				formattedTime: new Date(tx.transactionDate).toLocaleTimeString('vi-VN', {
					hour: '2-digit',
					minute: '2-digit'
				}),
				category: {
					id: category?.id || 0,
					name: category?.name || 'Chưa phân loại',
					icon: category?.icon || 'tag-outline',
				},
				wallet: {
					id: wallet?.id || 0,
					name: wallet?.name || 'Ví mặc định',
				},
				note: tx.note || '',
			};
		});

		return {
			success: true,
			data: formattedTxs,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
			filters: {
				search,
				categoryId,
				walletId,
				type,
				dateFrom,
				dateTo,
				sortBy,
				sortOrder,
			}
		};
	},

	async getTransactionsStatistics(userId: number, options: {
		dateFrom?: string;
		dateTo?: string;
		categoryId?: number;
		walletId?: number;
	} = {}) {
		await delay(300);
		
		const { dateFrom, dateTo, categoryId, walletId } = options;
		let userTxs = transactions.filter(t => t.userId === userId);

		// Apply filters
		if (categoryId) {
			userTxs = userTxs.filter(t => t.userCategoryId === categoryId);
		}

		if (walletId) {
			userTxs = userTxs.filter(t => t.walletId === walletId);
		}

		if (dateFrom) {
			userTxs = userTxs.filter(t => new Date(t.transactionDate) >= new Date(dateFrom));
		}

		if (dateTo) {
			userTxs = userTxs.filter(t => new Date(t.transactionDate) <= new Date(dateTo));
		}

		const totalIncome = userTxs
			.filter(t => t.type === 1)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		const totalExpense = userTxs
			.filter(t => t.type === 2)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0);

		const transactionCount = userTxs.length;
		const incomeCount = userTxs.filter(t => t.type === 1).length;
		const expenseCount = userTxs.filter(t => t.type === 2).length;

		return {
			success: true,
			data: {
				totalIncome,
				totalExpense,
				netAmount: totalIncome - totalExpense,
				transactionCount,
				incomeCount,
				expenseCount,
				averageIncome: incomeCount > 0 ? totalIncome / incomeCount : 0,
				averageExpense: expenseCount > 0 ? totalExpense / expenseCount : 0,
			}
		};
	},

	// ============ NOTIFICATION ENDPOINTS ============

	// Get notifications for user
	async getNotifications(userId: number, page: number = 1, limit: number = 20) {
		await delay(300);
		
		const userNotifications = notifications
			.filter(n => n.userId === userId)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedNotifications = userNotifications.slice(startIndex, endIndex);
		
		return {
			success: true,
			data: {
				notifications: paginatedNotifications,
				total: userNotifications.length,
				unreadCount: userNotifications.filter(n => !n.isRead).length,
				page,
				limit,
				hasMore: endIndex < userNotifications.length
			}
		};
	},

	// Mark notification as read
	async markNotificationAsRead(userId: number, notificationId: number) {
		await delay(200);
		
		const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
		if (!notification) {
			return { success: false, error: 'Notification not found' };
		}
		
		notification.isRead = true;
		return { success: true, data: notification };
	},

	// Mark all notifications as read
	async markAllNotificationsAsRead(userId: number) {
		await delay(300);
		
		const userNotifications = notifications.filter(n => n.userId === userId && !n.isRead);
		userNotifications.forEach(n => n.isRead = true);
		
		return { 
			success: true, 
			data: { 
				markedCount: userNotifications.length 
			} 
		};
	},

	// Delete notification
	async deleteNotification(userId: number, notificationId: number) {
		await delay(200);
		
		const index = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
		if (index === -1) {
			return { success: false, error: 'Notification not found' };
		}
		
		const deletedNotification = notifications.splice(index, 1)[0];
		return { success: true, data: deletedNotification };
	},

	// Create notification
	async createNotification(userId: number, type: string, title: string, message: string, data?: any, scheduledFor?: string) {
		await delay(200);
		
		const newNotification = {
			id: Math.max(...notifications.map(n => n.id), 0) + 1,
			userId,
			type,
			title,
			message,
			data: data || undefined,
			isRead: false,
			createdAt: new Date().toISOString(),
			scheduledFor: scheduledFor || undefined
		};
		
		notifications.unshift(newNotification);
		return { success: true, data: newNotification };
	},

	// Get notification settings
	async getNotificationSettings(userId: number) {
		await delay(200);
		
		let settings = notificationSettings.find(s => s.userId === userId);
		if (!settings) {
			// Create default settings
			settings = {
				userId,
				budgetAlerts: true,
				transactionReminders: true,
				weeklyReports: true,
				securityAlerts: true,
				pushEnabled: true,
				quietHoursEnabled: false,
				quietHoursStart: '22:00',
				quietHoursEnd: '08:00',
				updatedAt: new Date().toISOString()
			};
			notificationSettings.push(settings);
		}
		
		return { success: true, data: settings };
	},

	// Update notification settings
	async updateNotificationSettings(userId: number, newSettings: Partial<{
		budgetAlerts: boolean;
		transactionReminders: boolean;
		weeklyReports: boolean;
		securityAlerts: boolean;
		pushEnabled: boolean;
		quietHoursEnabled: boolean;
		quietHoursStart: string;
		quietHoursEnd: string;
	}>) {
		await delay(300);
		
		let settings = notificationSettings.find(s => s.userId === userId);
		if (!settings) {
			settings = {
				userId,
				budgetAlerts: true,
				transactionReminders: true,
				weeklyReports: true,
				securityAlerts: true,
				pushEnabled: true,
				quietHoursEnabled: false,
				quietHoursStart: '22:00',
				quietHoursEnd: '08:00',
				updatedAt: new Date().toISOString()
			};
			notificationSettings.push(settings);
		}
		
		Object.assign(settings, newSettings, { updatedAt: new Date().toISOString() });
		return { success: true, data: settings };
	},

	// Check and create budget alerts
	async checkBudgetAlerts(userId: number) {
		await delay(400);
		
		const userBudgets = budgets.filter(b => b.userId === userId);
		const alerts = [];
		
		for (const budget of userBudgets) {
			const budgetTransactions = transactions.filter(t => 
				t.userId === userId && 
				t.userCategoryId === budget.userCategoryId &&
				t.walletId === budget.walletId &&
				t.transactionDate >= budget.startDate &&
				t.transactionDate <= budget.endDate &&
				t.type === 2 // expenses only
			);
			
			const spent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
			const percentage = (spent / budget.amount) * 100;
			
			// Budget exceeded
			if (spent > budget.amount) {
				const exceeded = spent - budget.amount;
				const category = userCategories.find(c => c.id === budget.userCategoryId);
				
				alerts.push({
					type: 'budget_exceeded',
					title: '🚨 Vượt ngân sách!',
					message: `Bạn đã chi ${spent.toLocaleString('vi-VN')}₫ vượt quá ngân sách ${category?.name || 'Khác'} (${budget.amount.toLocaleString('vi-VN')}₫)`,
					data: {
						budgetId: budget.id,
						budgetName: category?.name || 'Khác',
						currentSpent: spent,
						budgetAmount: budget.amount,
						exceeded
					}
				});
			}
			// Budget warning (80% threshold)
			else if (percentage >= 80) {
				const remaining = budget.amount - spent;
				const category = userCategories.find(c => c.id === budget.userCategoryId);
				
				alerts.push({
					type: 'budget_warning',
					title: '⚡ Sắp hết ngân sách',
					message: `Bạn đã sử dụng ${Math.round(percentage)}% ngân sách ${category?.name || 'Khác'}. Còn lại ${remaining.toLocaleString('vi-VN')}₫`,
					data: {
						budgetId: budget.id,
						budgetName: category?.name || 'Khác',
						percentage: Math.round(percentage),
						remaining,
						budgetAmount: budget.amount
					}
				});
			}
		}
		
		// Create notifications for alerts
		for (const alert of alerts) {
			// Check if similar notification already exists (within last 24 hours)
			const existingNotification = notifications.find(n => 
				n.userId === userId &&
				n.type === alert.type &&
				n.data?.budgetId === alert.data.budgetId &&
				new Date(n.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
			);
			
			if (!existingNotification) {
				await this.createNotification(userId, alert.type, alert.title, alert.message, alert.data);
			}
		}
		
		return { success: true, data: { alertsCreated: alerts.length } };
	},

	// Check for large transactions and create notifications
	async checkLargeTransactionAlerts(userId: number) {
		await delay(300);
		
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		
		const recentTransactions = transactions.filter(t => 
			t.userId === userId &&
			new Date(t.transactionDate) >= oneWeekAgo &&
			t.type === 2 // expenses only
		);
		
		if (recentTransactions.length === 0) return { success: true, data: { alertsCreated: 0 } };
		
		// Find the largest transaction this week
		const largestTransaction = recentTransactions.reduce((max, current) => 
			Math.abs(current.amount) > Math.abs(max.amount) ? current : max
		);
		
		const category = userCategories.find(c => c.id === largestTransaction.userCategoryId);
		const amount = Math.abs(largestTransaction.amount);
		
		// Only create alert if transaction is > 200,000 VND
		if (amount > 200000) {
			// Check if notification for this transaction already exists
			const existingNotification = notifications.find(n => 
				n.userId === userId &&
				n.type === 'large_transaction' &&
				n.data?.transactionId === largestTransaction.id
			);
			
			if (!existingNotification) {
				await this.createNotification(
					userId,
					'large_transaction',
					'💸 Giao dịch lớn',
					`Bạn vừa chi ${amount.toLocaleString('vi-VN')}₫ cho ${category?.name || 'Khác'}. Đây là giao dịch lớn nhất tuần này.`,
					{
						transactionId: largestTransaction.id,
						amount,
						category: category?.name || 'Khác'
					}
				);
				
				return { success: true, data: { alertsCreated: 1 } };
			}
		}
		
		return { success: true, data: { alertsCreated: 0 } };
	},

	// Generate weekly report notification
	async generateWeeklyReport(userId: number) {
		await delay(500);
		
		const now = new Date();
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		const twoWeeksAgo = new Date();
		twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
		
		// Current week transactions
		const currentWeekTx = transactions.filter(t => 
			t.userId === userId &&
			new Date(t.transactionDate) >= oneWeekAgo &&
			new Date(t.transactionDate) <= now &&
			t.type === 2
		);
		
		// Previous week transactions
		const previousWeekTx = transactions.filter(t => 
			t.userId === userId &&
			new Date(t.transactionDate) >= twoWeeksAgo &&
			new Date(t.transactionDate) < oneWeekAgo &&
			t.type === 2
		);
		
		const currentWeekSpent = currentWeekTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		const previousWeekSpent = previousWeekTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		const saved = previousWeekSpent - currentWeekSpent;
		
		let title, message;
		if (saved > 0) {
			title = '📊 Báo cáo tuần - Tuyệt vời!';
			message = `Tuần này bạn đã tiết kiệm được ${saved.toLocaleString('vi-VN')}₫ so với tuần trước. Tuyệt vời! `;
		} else if (saved < 0) {
			title = '📊 Báo cáo tuần - Cần cải thiện';
			message = `Tuần này bạn đã chi nhiều hơn ${Math.abs(saved).toLocaleString('vi-VN')}₫ so với tuần trước. Hãy cẩn thận hơn! 💪`;
		} else {
			title = '📊 Báo cáo tuần';
			message = `Tuần này bạn đã chi tiêu tương tự tuần trước: ${currentWeekSpent.toLocaleString('vi-VN')}₫`;
		}
		
		// Check if weekly report already exists for this week
		const weekStart = new Date(oneWeekAgo);
		weekStart.setHours(0, 0, 0, 0);
		const existingReport = notifications.find(n => 
			n.userId === userId &&
			n.type === 'weekly_report' &&
			new Date(n.createdAt) >= weekStart
		);
		
		if (!existingReport) {
			await this.createNotification(
				userId,
				'weekly_report',
				title,
				message,
				{
					weeklySpent: currentWeekSpent,
					previousWeek: previousWeekSpent,
					saved,
					period: `Tuần ${Math.ceil(now.getDate() / 7)}/${now.getFullYear()}`
				}
			);
			
			return { success: true, data: { reportCreated: true } };
		}
		
		return { success: true, data: { reportCreated: false } };
	},

	// ============ STREAK ENDPOINTS ============

	// Get user streak data
	async getStreakData(userId: number) {
		await delay(200);
		
		let userStreak = streaks.find(s => s.userId === userId);
		let userSettings = streakSettings.find(s => s.userId === userId);
		
		if (!userStreak) {
			// Initialize streak for new user
			userStreak = {
				id: Math.max(...streaks.map(s => s.id), 0) + 1,
				userId,
				streakDays: 0,
				lastTransactionDate: new Date().toISOString(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			streaks.push(userStreak);
		}
		
		if (!userSettings) {
			// Initialize settings for new user
			userSettings = {
				id: Math.max(...streakSettings.map(s => s.id), 0) + 1,
				userId,
				dailyReminderEnabled: true,
				reminderTime: '20:00',
				weekendMode: false,
				bestStreak: 0,
				totalActiveDays: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			streakSettings.push(userSettings);
		}
		
		// Get recent history (last 7 days)
		const today = new Date();
		const last7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];
			
			const dayHistory = streakHistory.find(h => h.userId === userId && h.date === dateStr);
			last7Days.push({
				date: dateStr,
				hasActivity: dayHistory?.hasActivity || false,
				activityType: dayHistory?.activityType || null,
				isToday: i === 0
			});
		}
		
		return {
			success: true,
			data: {
				streak: userStreak,
				settings: userSettings,
				last7Days,
				todayCompleted: last7Days[6]?.hasActivity || false
			}
		};
	},

	// Record streak activity
	async recordStreakActivity(userId: number, activityType: string) {
		await delay(200);
		
		const today = new Date().toISOString().split('T')[0];
		const now = new Date().toISOString();
		
		// Check if already recorded today
		let todayHistory = streakHistory.find(h => h.userId === userId && h.date === today);
		
		if (!todayHistory) {
			// First activity of the day
			todayHistory = {
				id: Math.max(...streakHistory.map(h => h.id), 0) + 1,
				userId,
				date: today,
				hasActivity: true,
				activityType,
				createdAt: now
			};
			streakHistory.push(todayHistory);
			
			// Update streak
			let userStreak = streaks.find(s => s.userId === userId);
			let userSettings = streakSettings.find(s => s.userId === userId);
			
		if (userStreak && userSettings) {
			const lastDate = (userStreak.last_transaction_date || userStreak.lastTransactionDate || '').split('T')[0];
			const daysDiff = this.getDaysDifference(lastDate, today);
				
				// Get current streak value (support both cases)
				const currentStreak = userStreak.streak_days || userStreak.streakDays || 0;
				const currentBest = userSettings.best_streak || userSettings.bestStreak || 0;
				const weekendMode = userSettings.weekend_mode || userSettings.weekendMode || false;
				
				let previousStreak = currentStreak;
				let streakIncreased = false;
				
			if (daysDiff === 1) {
				// Consecutive day
				userStreak.streak_days = currentStreak + 1;
				streakIncreased = true;
			} else if (daysDiff === 2) {
				// 1 day gap - allow grace period depending on weekend mode
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);
				const yesterdayStr = yesterday.toISOString().split('T')[0];
				
				const yesterdayHistory = streakHistory.find(
					h => h.userId === userId && h.date === yesterdayStr
				);
				
			const hadActivity = yesterdayHistory?.hasActivity;
				
				if (hadActivity) {
					// Có hoạt động hôm qua - tiếp tục streak
					userStreak.streak_days = currentStreak + 1;
					streakIncreased = true;
				} else if (!weekendMode) {
					// Grace period (1 day off allowed)
					userStreak.streak_days = currentStreak + 1;
					streakIncreased = true;
				} else {
					// Weekend mode + no activity - reset
					if (currentStreak > currentBest) {
						userSettings.best_streak = currentStreak;
					}
					this.createStreakNotification(userId, 'streak_lost', currentStreak);
					userStreak.streak_days = 1;
				}
			} else if (daysDiff === 3) {
				// 2 day gap - streak broken
					if (currentStreak > currentBest) {
						userSettings.best_streak = currentStreak;
					}
					this.createStreakNotification(userId, 'streak_lost', currentStreak);
					userStreak.streak_days = 1;
			} else if (daysDiff > 3) {
				// Streak broken - save best streak and restart
				if (currentStreak > currentBest) {
					userSettings.best_streak = currentStreak;
				}
				// Generate lost notification
				this.createStreakNotification(userId, 'streak_lost', currentStreak);
				userStreak.streak_days = 1;
				} else if (daysDiff === 0) {
					// Same day - no change to streak
				} else {
					// First day or restart
					userStreak.streak_days = 1;
				}
				
				// Check for milestone
				const newStreak = userStreak.streak_days || 0;
				const milestones = [7, 14, 30, 60, 100, 365];
				if (streakIncreased && milestones.includes(newStreak)) {
					// Generate milestone notification
					this.createStreakNotification(userId, 'streak_milestone', newStreak);
				}
				
				userStreak.last_transaction_date = now;
				userStreak.updated_at = now;
				const totalActive = userSettings.total_active_days || userSettings.totalActiveDays || 0;
				userSettings.total_active_days = totalActive + 1;
				userSettings.updated_at = now;
				
			}
		}
		
		return { success: true, data: { activityRecorded: true, todayHistory } };
},

// Recalculate streak from scratch based on history
async recalculateStreak(userId: number) {
	await delay(200);
	
	// Get all history sorted by date
	const userHistory = streakHistory
		.filter(h => h.userId === userId)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	
	let currentStreak = 0;
	let bestStreak = 0;
	let lastDate: string | null = null;
	let totalActiveDays = 0;
	
	for (const h of userHistory) {
		const hasActivity = h.hasActivity;
		
		if (hasActivity) {
			totalActiveDays++;
			
			if (!lastDate) {
				// First activity
				currentStreak = 1;
			} else {
				const daysDiff = this.getDaysDifference(lastDate, h.date);
				
				if (daysDiff === 1) {
					// Consecutive day
					currentStreak++;
				} else if (daysDiff === 2) {
					// 1 day gap - allow single-day grace
						currentStreak++;
				} else if (daysDiff === 3) {
						// Gap too large - reset
						bestStreak = Math.max(bestStreak, currentStreak);
						currentStreak = 1;
				} else {
					// More than 2 day gap - reset
					bestStreak = Math.max(bestStreak, currentStreak);
					currentStreak = 1;
				}
			}
			
			lastDate = h.date;
		}
	}
	
	bestStreak = Math.max(bestStreak, currentStreak);
	
	// Update streak data
	const userStreak = streaks.find(s => s.userId === userId);
	const userSettings = streakSettings.find(s => s.userId === userId);
	
	if (userStreak && userSettings) {
		userStreak.streak_days = currentStreak;
		userStreak.streakDays = currentStreak; // Support both
		userStreak.updated_at = new Date().toISOString();
		userStreak.updatedAt = new Date().toISOString();
		
		const currentBest = userSettings.best_streak || userSettings.bestStreak || 0;
		userSettings.best_streak = Math.max(currentBest, bestStreak);
		userSettings.bestStreak = Math.max(currentBest, bestStreak);
		userSettings.total_active_days = totalActiveDays;
		userSettings.totalActiveDays = totalActiveDays;
		userSettings.updated_at = new Date().toISOString();
		userSettings.updatedAt = new Date().toISOString();
	}
	
	return { 
		success: true, 
		data: { 
			currentStreak, 
			bestStreak, 
			totalActiveDays 
		} 
	};
},

// Get streak statistics
	async getStreakStats(userId: number) {
		await delay(200);
		
		let userStreak = streaks.find(s => s.userId === userId);
		let userSettings = streakSettings.find(s => s.userId === userId);
		let userHistory = streakHistory.filter(h => h.userId === userId);
		
		
		if (!userStreak || !userSettings) {
			return { success: false, error: 'Streak data not found' };
		}
		
	// Calculate completion rate (support both snake_case and camelCase)
	const totalDays = userHistory.length;
	const activeDays = userHistory.filter((h: any) => h.has_activity || h.hasActivity).length;
	const completionRate = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
	
	// Activity type breakdown
	const activityBreakdown = userHistory.reduce((acc: any, h: any) => {
		const hasActivity = h.has_activity || h.hasActivity;
		const activityType = h.activity_type || h.activityType;
		if (hasActivity && activityType) {
			acc[activityType] = (acc[activityType] || 0) + 1;
		}
		return acc;
	}, {} as Record<string, number>);
		
	return {
		success: true,
		data: {
			currentStreak: userStreak.streak_days || userStreak.streakDays || 0,
			bestStreak: userSettings.best_streak || userSettings.bestStreak || 0,
			totalActiveDays: userSettings.total_active_days || userSettings.totalActiveDays || 0,
			completionRate,
			activityBreakdown,
			streakStartDate: userStreak.created_at || userStreak.createdAt
		}
	};
	},

	// Get full streak history (all days since registration)
	async getFullStreakHistory(userId: number) {
		await delay(200);
		
		let userHistory = streakHistory.filter(h => h.userId === userId);
		
		// Sort by date descending
		const sortedHistory = userHistory.sort((a: any, b: any) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return dateB - dateA;
		});
		
		// Format for calendar
		const formattedHistory = sortedHistory.map((h: any) => ({
			date: h.date,
			hasActivity: h.has_activity || h.hasActivity || false,
			activityType: h.activity_type || h.activityType || null
		}));
		
		return {
			success: true,
			data: formattedHistory
		};
	},

	// Update streak settings
	async updateStreakSettings(userId: number, newSettings: Partial<{
		dailyReminderEnabled: boolean;
		reminderTime: string;
		weekendMode: boolean;
	}>) {
		await delay(200);
		
		let userSettings = streakSettings.find(s => s.userId === userId);
		if (!userSettings) {
			return { success: false, error: 'Settings not found' };
		}
		
	Object.assign(userSettings, newSettings, { updatedAt: new Date().toISOString() });
	return { success: true, data: userSettings };
},

// Reset streak manually
async resetStreak(userId: number) {
	await delay(200);
	
	const userStreak = streaks.find(s => s.userId === userId);
	const userSettings = streakSettings.find(s => s.userId === userId);
	
	if (!userStreak || !userSettings) {
		return { success: false, error: 'User not found' };
	}
	
	// Save best streak if current is better
	const currentStreak = userStreak.streak_days || userStreak.streakDays || 0;
	const currentBest = userSettings.best_streak || userSettings.bestStreak || 0;
	
	if (currentStreak > currentBest) {
		userSettings.best_streak = currentStreak;
		userSettings.bestStreak = currentStreak;
	}
	
	// Reset streak to 0
	userStreak.streak_days = 0;
	userStreak.streakDays = 0;
	userStreak.updated_at = new Date().toISOString();
	userStreak.updatedAt = new Date().toISOString();
	
	userSettings.updated_at = new Date().toISOString();
	userSettings.updatedAt = new Date().toISOString();
	
	// Create notification
	this.createStreakNotification(userId, 'streak_lost', currentStreak);
	
	return { 
		success: true, 
		message: 'Streak đã được reset về 0. Best streak đã được lưu.',
		data: {
			previousStreak: currentStreak,
			bestStreak: Math.max(currentStreak, currentBest)
		}
	};
},

// Helper method for date difference calculation
	getDaysDifference(date1: string, date2: string): number {
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		const diffTime = d2.getTime() - d1.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	},

	// Create streak notification helper
	createStreakNotification(
		userId: number, 
		type: 'streak_warning' | 'streak_lost' | 'streak_milestone' | 'streak_reminder',
		streakValue: number
	) {
		try {
			const notificationMap = {
				streak_warning: {
					title: 'Cảnh báo Streak!',
					message: `Chuỗi ${streakValue} ngày của bạn sắp bị mất! Hãy ghi giao dịch hoặc check-in hôm nay.`,
				},
				streak_lost: {
					title: 'Streak đã kết thúc',
					message: `Chuỗi ${streakValue} ngày của bạn đã kết thúc. Đừng lo, bạn có thể bắt đầu lại ngay hôm nay!`,
				},
				streak_milestone: {
					title: `Chúc mừng! ${streakValue} ngày liên tục!`,
					message: `Bạn đã đạt mốc ${streakValue} ngày! Thành tựu mới đã được mở khóa.`,
				},
				streak_reminder: {
					title: 'Nhắc nhở Streak',
					message: `Đã ghi lại chi tiêu hôm nay chưa? Streak hiện tại: ${streakValue} ngày`,
				}
			};

			const notification = notificationMap[type];
			if (!notification) return;

			this.createNotification(
				userId,
				type,
				notification.title,
				notification.message,
				{ streakValue, action: 'open_streak' }
			);
		} catch (error) {
			// Silently fail notification creation
		}
	},

	// Check and send daily reminder (called by scheduler or manually)
	async checkDailyReminders() {
		await delay(200);
		
		try {
			const now = new Date();
			const currentHour = now.getHours();
			const currentMinute = now.getMinutes();

			for (const settings of streakSettings) {
				const userId = settings.userId;
				const reminderEnabled = settings.daily_reminder_enabled || settings.dailyReminderEnabled;
				const reminderTime = settings.reminder_time || settings.reminderTime || '20:00';

				if (!reminderEnabled) continue;

				const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);

				// Check if within 5 minutes of reminder time
				if (Math.abs(currentHour - reminderHour) === 0 && 
					Math.abs(currentMinute - reminderMinute) <= 5) {
					
					// Check if user already completed today
					const today = new Date().toISOString().split('T')[0];
					const todayHistory = streakHistory.find(h => 
						(h.userId === userId) && h.date === today && h.hasActivity
					);

					if (!todayHistory) {
						// Send reminder
						const userStreak = streaks.find(s => s.userId === userId);
						const currentStreak = userStreak?.streak_days || userStreak?.streakDays || 0;
						this.createStreakNotification(userId, 'streak_reminder', currentStreak);
					}
				}
			}

			return { success: true, data: { remindersChecked: true } };
		} catch (error) {
			console.error('Error checking daily reminders:', error);
			return { success: false, error: 'Failed to check reminders' };
		}
	},

	// Check for warning state and send notifications
	async checkStreakWarnings() {
		await delay(200);

		try {
			const today = new Date().toISOString().split('T')[0];
			const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

			for (const userStreak of streaks) {
				const userId = userStreak.userId;
				const lastDate = (userStreak.last_transaction_date || userStreak.lastTransactionDate || '').split('T')[0];
				const currentStreak = userStreak.streak_days || userStreak.streakDays || 0;

				// Check if last activity was yesterday
				if (lastDate === yesterday && currentStreak > 0) {
					// Check if already completed today
					const todayHistory = streakHistory.find(h => 
						(h.userId === userId) && h.date === today && h.hasActivity
					);

					if (!todayHistory) {
						// User is in warning state - send notification
						this.createStreakNotification(userId, 'streak_warning', currentStreak);
					}
				}
			}

			return { success: true, data: { warningsChecked: true } };
		} catch (error) {
			return { success: false, error: 'Failed to check warnings' };
		}
	},

	// ============ SAVINGS GOALS ENDPOINTS ============
	
	async getSavingsGoals(userId: number) {
		await delay(300);
		const userGoals = savingsGoals.filter(g => g.userId === userId);
		return {
			success: true,
			data: userGoals.map(goal => ({
				...goal,
				progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
			}))
		};
	},

	async getSavingsGoalDetail(userId: number, goalId: number) {
		await delay(300);
		const goal = savingsGoals.find(g => g.id === goalId && g.userId === userId);
		if (!goal) {
			return { success: false, message: 'Mục tiêu không tồn tại' };
		}

		const contributions = savingsGoalContributions
			.filter(c => c.goalId === goalId)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return {
			success: true,
			data: {
				...goal,
				progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
				contributions
			}
		};
	},

	async createSavingsGoal(userId: number, data: {
		name: string;
		targetAmount: number;
		deadline: string;
		icon: string;
		color: string;
		currency?: string;
	}) {
		await delay(400);
		
		const newGoal = {
			id: Math.max(...savingsGoals.map(g => g.id), 0) + 1,
			userId,
			name: data.name,
			targetAmount: data.targetAmount,
			currentAmount: 0,
			deadline: data.deadline,
			icon: data.icon,
			color: data.color,
			currency: data.currency || 'VND',
			status: 'active',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		savingsGoals.push(newGoal);
		
		return {
			success: true,
			data: {
				...newGoal,
				progress: 0
			}
		};
	},

	async updateSavingsGoal(userId: number, goalId: number, data: {
		name?: string;
		targetAmount?: number;
		deadline?: string;
		icon?: string;
		color?: string;
		currency?: string;
		status?: string;
	}) {
		await delay(400);
		
		const goalIndex = savingsGoals.findIndex(g => g.id === goalId && g.userId === userId);
		if (goalIndex === -1) {
			return { success: false, message: 'Mục tiêu không tồn tại' };
		}

		const goal = savingsGoals[goalIndex];
		savingsGoals[goalIndex] = {
			...goal,
			...data,
			updatedAt: new Date().toISOString()
		};

		return {
			success: true,
			data: {
				...savingsGoals[goalIndex],
				progress: savingsGoals[goalIndex].targetAmount > 0 
					? (savingsGoals[goalIndex].currentAmount / savingsGoals[goalIndex].targetAmount) * 100 
					: 0
			}
		};
	},

	async deleteSavingsGoal(userId: number, goalId: number) {
		await delay(300);
		
		const goalIndex = savingsGoals.findIndex(g => g.id === goalId && g.userId === userId);
		if (goalIndex === -1) {
			return { success: false, message: 'Mục tiêu không tồn tại' };
		}

		// Soft delete: change status to cancelled
		savingsGoals[goalIndex] = {
			...savingsGoals[goalIndex],
			status: 'cancelled',
			updatedAt: new Date().toISOString()
		};

		return { success: true, message: 'Đã hủy mục tiêu tiết kiệm' };
	},

	async addContribution(userId: number, goalId: number, amount: number, note?: string) {
		await delay(400);
		
		const goalIndex = savingsGoals.findIndex(g => g.id === goalId && g.userId === userId);
		if (goalIndex === -1) {
			return { success: false, message: 'Mục tiêu không tồn tại' };
		}

		const goal = savingsGoals[goalIndex];
		if (goal.status !== 'active') {
			return { success: false, message: 'Không thể đóng góp vào mục tiêu đã hoàn thành hoặc bị hủy' };
		}

		// Create contribution record
		const newContribution = {
			id: Math.max(...savingsGoalContributions.map(c => c.id), 0) + 1,
			goalId,
			amount,
			note: note || '',
			createdAt: new Date().toISOString()
		};
		savingsGoalContributions.push(newContribution);

		// Update goal's current amount
		const newCurrentAmount = goal.currentAmount + amount;
		savingsGoals[goalIndex] = {
			...goal,
			currentAmount: newCurrentAmount,
			updatedAt: new Date().toISOString()
		};

		// Check if goal is completed (100% or more)
		const progress = (newCurrentAmount / goal.targetAmount) * 100;
		if (progress >= 100 && goal.status === 'active') {
			savingsGoals[goalIndex].status = 'completed';
			
			// Create completion notification
			const completionNotification = {
				id: Math.max(...notifications.map(n => n.id), 0) + 1,
				userId,
				type: 'savings_goal_completed',
				title: ' Chúc mừng!',
				message: `Bạn đã hoàn thành mục tiêu "${goal.name}"!`,
				data: { goalId, goalName: goal.name, targetAmount: goal.targetAmount },
				isRead: false,
				createdAt: new Date().toISOString()
			};
			notifications.push(completionNotification);
		}

		return {
			success: true,
			data: {
				contribution: newContribution,
				goal: {
					...savingsGoals[goalIndex],
					progress: (savingsGoals[goalIndex].currentAmount / savingsGoals[goalIndex].targetAmount) * 100
				}
			}
		};
	},

	// ============ CHATBOT ENDPOINTS ============

	async getChatHistory(userId: number) {
		await delay(200);
		const history = chatMessages
			.filter(message => message.userId === userId)
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		return { success: true, data: history };
	},

	async getFAQs() {
		await delay(150);
		return { success: true, data: chatFaqs };
	},

	async sendChatMessage(userId: number, content: string) {
		await delay(400);
		const trimmed = content.trim();
		if (!trimmed) {
			return { success: false, message: 'Tin nhắn trống' };
		}

		const now = new Date().toISOString();
		const userMessage: FakeChatMessage = {
			id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			userId,
			role: 'user',
			content: trimmed,
			createdAt: now,
		};
		chatMessages.push(userMessage);

		const normalized = trimmed.toLowerCase();
		const matchedFaq = chatFaqs.find(faq =>
			faq.question.toLowerCase().includes(normalized) || normalized.includes(faq.question.toLowerCase())
		);
		const assistantResponse = matchedFaq?.answer
			|| 'Mình đã ghi nhận câu hỏi của bạn. Hãy kiểm tra báo cáo chi tiêu hoặc mục tiêu tiết kiệm để có thêm thông tin nhé!';
		const assistantMessage: FakeChatMessage = {
			id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			userId,
			role: 'assistant',
			content: assistantResponse,
			createdAt: new Date().toISOString(),
			metadata: matchedFaq ? { source: 'faq', faqId: matchedFaq.id } : undefined,
		};
		chatMessages.push(assistantMessage);

		const suggestions = chatFaqs.slice(0, 4).map(faq => faq.question);

		return {
			success: true,
			data: {
				userMessage,
				assistantMessage,
				suggestions,
				context: matchedFaq ? { matchedFaqId: matchedFaq.id } : undefined,
			}
		};
	},

	// ============ RECURRING EXPENSES ENDPOINTS ============
	// Tất cả dữ liệu đều được mock sẵn trong mockData.json
	// API chỉ lấy và trả về dữ liệu, không tính toán

	/**
	 * Phát hiện chi tiêu định kỳ - Dữ liệu đã được mock sẵn trong mockData.json
	 * Mock data bao gồm: patterns đã được phát hiện với thuật toán phân tích giao dịch
	 * - Nhóm giao dịch theo tên và danh mục
	 * - Tính khoảng cách giữa các giao dịch
	 * - Tính độ tin cậy (confidence) dựa trên tính nhất quán
	 * - Phân loại: daily, weekly, monthly, yearly
	 */
	async detectRecurringExpenses(userId: number) {
		await delay(800);
		
		// Lấy patterns đã được phát hiện và mock sẵn từ mockData
		const userPatterns = recurringExpenseDetectedPatterns
			.filter((p: any) => p.user_id === userId)
			.map((p: any) => {
				// Get category name
				const category = userCategories.find(c => c.id === p.category_id) 
					|| categories.find(c => c.id === p.category_id);
				
				return {
					name: p.name,
					amount: p.amount,
					categoryId: p.category_id,
					categoryName: category?.name || 'Khác',
					frequency: p.frequency as RecurringFrequency,
					confidence: p.confidence,
					occurrences: p.occurrences,
					nextDueDate: p.next_due_date,
					transactions: p.transaction_ids.map((id: number) => {
						const tx = transactions.find(t => t.id === id);
						return tx ? {
							id: tx.id,
							date: tx.transactionDate,
							amount: tx.amount
						} : null;
					}).filter((t: any) => t !== null)
				};
			});
		
		// Sort by confidence (highest first)
		userPatterns.sort((a, b) => b.confidence - a.confidence);
		
		return { success: true, data: userPatterns };
	},

	/**
	 * Lấy danh sách chi tiêu định kỳ - Dữ liệu từ mockData.json
	 * Mock data bao gồm: chi tiêu định kỳ đã được tạo (cả tự động và thủ công)
	 */
	async getRecurringExpenses(userId: number) {
		await delay(300);
		
		// Lấy chi tiêu định kỳ từ mockData đã load sẵn
		const userExpenses = recurringExpenses.filter(e => e.userId === userId);
		
		// Enrich with category names từ user_categories trong mockData
		const enrichedExpenses = userExpenses.map(expense => {
			const category = userCategories.find(c => c.id === expense.categoryId) 
				|| categories.find(c => c.id === expense.categoryId);
			
			return {
				...expense,
				categoryName: category?.name || 'Khác',
				categoryIcon: category?.icon || 'help-circle-outline',
				categoryColor: category?.color || '#6B7280'
			};
		});
		
		return { success: true, data: enrichedExpenses };
	},

	/**
	 * Tạo chi tiêu định kỳ mới - Thêm vào runtime (không lưu vào mockData)
	 * Note: Dữ liệu chỉ tồn tại trong session, reload app sẽ mất
	 */
	async createRecurringExpense(userId: number, data: {
		name: string;
		amount: number;
		categoryId: number;
		frequency: RecurringFrequency;
		nextDueDate: string;
		reminderDaysBefore?: number;
		note?: string;
	}) {
		await delay(400);
		
		// Tạo ID mới dựa trên ID lớn nhất hiện có
		const newExpense: RecurringPattern = {
			id: recurringExpenses.length > 0 ? Math.max(...recurringExpenses.map(e => e.id)) + 1 : 1,
			userId,
			name: data.name,
			amount: data.amount,
			categoryId: data.categoryId,
			frequency: data.frequency,
			nextDueDate: data.nextDueDate,
			isActive: true,
			isAutoDetected: false, // Thêm thủ công
			confidence: 100, // Manual entries có 100% confidence
			reminderDaysBefore: data.reminderDaysBefore || 1,
			note: data.note,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		// Thêm vào array runtime (không lưu vào mockData.json)
		recurringExpenses.push(newExpense);
		
		// Tạo notification
		notifications.push({
			id: notifications.length + 1,
			userId,
			type: 'recurring_expense_created',
			title: 'Chi tiêu định kỳ mới',
			message: `Đã thêm chi tiêu định kỳ: ${data.name}`,
			data: { recurringExpenseId: newExpense.id },
			isRead: false,
			createdAt: new Date().toISOString()
		});
		
		return { success: true, data: newExpense };
	},

	/**
	 * Cập nhật chi tiêu định kỳ - Cập nhật trong runtime
	 * Note: Thay đổi chỉ tồn tại trong session
	 */
	async updateRecurringExpense(userId: number, expenseId: number, data: {
		name?: string;
		amount?: number;
		categoryId?: number;
		frequency?: RecurringFrequency;
		nextDueDate?: string;
		isActive?: boolean;
		reminderDaysBefore?: number;
		note?: string;
	}) {
		await delay(400);
		
		const expenseIndex = recurringExpenses.findIndex(e => e.id === expenseId && e.userId === userId);
		if (expenseIndex === -1) {
			return { success: false, message: 'Không tìm thấy chi tiêu định kỳ' };
		}
		
		// Cập nhật trong runtime array
		const updatedExpense: RecurringPattern = {
			...recurringExpenses[expenseIndex],
			...data,
			updatedAt: new Date().toISOString()
		};
		
		recurringExpenses[expenseIndex] = updatedExpense;
		
		return { success: true, data: updatedExpense };
	},

	/**
	 * Xóa chi tiêu định kỳ - Xóa khỏi runtime
	 * Note: Reload app sẽ khôi phục dữ liệu từ mockData
	 */
	async deleteRecurringExpense(userId: number, expenseId: number) {
		await delay(300);
		
		const expenseIndex = recurringExpenses.findIndex(e => e.id === expenseId && e.userId === userId);
		if (expenseIndex === -1) {
			return { success: false, message: 'Không tìm thấy chi tiêu định kỳ' };
		}
		
		// Xóa khỏi runtime array
		recurringExpenses.splice(expenseIndex, 1);
		
		return { success: true, message: 'Đã xóa chi tiêu định kỳ' };
	},

	/**
	 * Dự báo chi tiêu tháng tới - Dữ liệu đã được tính toán và mock sẵn trong mockData.json
	 * Mock data bao gồm:
	 * - Danh sách các khoản chi dự kiến trong tháng
	 * - Tổng số tiền và số lượng khoản chi
	 * - Phân loại theo danh mục
	 * - Ngày đến hạn cụ thể cho mỗi khoản
	 */
	async predictNextMonthExpenses(userId: number) {
		await delay(500);
		
		// Lấy dự báo đã được tính toán và mock sẵn từ mockData
		if (!recurringExpensePredictions || recurringExpensePredictions.user_id !== userId) {
			return {
				success: true,
				data: {
					predictions: [],
					summary: {
						totalAmount: 0,
						totalCount: 0,
						byCategory: {},
						month: new Date().toISOString().substring(0, 7)
					}
				}
			};
		}
		
		// Trả về dữ liệu dự báo đã được mock sẵn
		return {
			success: true,
			data: {
				predictions: recurringExpensePredictions.predictions,
				summary: {
					totalAmount: recurringExpensePredictions.total_amount,
					totalCount: recurringExpensePredictions.total_count,
					byCategory: recurringExpensePredictions.by_category,
					month: recurringExpensePredictions.month
				}
			}
		};
	},

	/**
	 * Kiểm tra nhắc nhở chi tiêu định kỳ - Tính toán runtime dựa trên mockData
	 * Tự động tạo notification cho chi tiêu sắp đến hạn
	 * Logic:
	 * - Lấy chi tiêu định kỳ active từ mockData
	 * - Tính số ngày còn lại đến hạn
	 * - Tạo notification nếu trong khoảng reminderDaysBefore
	 */
	async checkRecurringExpenseReminders(userId: number) {
		await delay(200);
		
		const now = new Date();
		// Lấy chi tiêu active từ mockData đã load
		const activeExpenses = recurringExpenses.filter(e => e.userId === userId && e.isActive);
		
		const upcomingReminders: Array<{
			expense: RecurringPattern;
			daysUntilDue: number;
		}> = [];
		
		activeExpenses.forEach(expense => {
			const dueDate = new Date(expense.nextDueDate);
			const diffTime = dueDate.getTime() - now.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			
			// Kiểm tra nếu trong khoảng nhắc nhở
			if (diffDays >= 0 && diffDays <= expense.reminderDaysBefore) {
				upcomingReminders.push({
					expense,
					daysUntilDue: diffDays
				});
				
				// Kiểm tra đã tạo notification chưa (tránh trùng lặp)
				const existingNotification = notifications.find(n => 
					n.userId === userId && 
					n.type === 'recurring_expense_reminder' &&
					n.data?.recurringExpenseId === expense.id &&
					n.data?.dueDate === expense.nextDueDate
				);
				
				if (!existingNotification) {
					// Tạo notification nhắc nhở
					notifications.push({
						id: notifications.length + 1,
						userId,
						type: 'recurring_expense_reminder',
						title: 'Nhắc nhở chi tiêu định kỳ',
						message: diffDays === 0 
							? `Hôm nay đến hạn thanh toán: ${expense.name} (${expense.amount.toLocaleString('vi-VN')} đ)`
							: `Còn ${diffDays} ngày đến hạn thanh toán: ${expense.name} (${expense.amount.toLocaleString('vi-VN')} đ)`,
						data: { 
							recurringExpenseId: expense.id,
							dueDate: expense.nextDueDate
						},
						isRead: false,
						createdAt: new Date().toISOString(),
						scheduledFor: new Date().toISOString()
					});
				}
			}
		});
		
		return { success: true, data: upcomingReminders };
	},

	// ============ REPORT EXPORT ENDPOINTS ============
	
	async exportReportExcel(userId: number, filters: {
		walletId?: number;
		type?: number; // 1: income, 2: expense, undefined: all
		startDate?: string;
		endDate?: string;
	}) {
		await delay(500);
		
		// Get filtered transactions
		let filtered = transactions.filter(t => t.userId === userId);
		
		if (filters.walletId) {
			filtered = filtered.filter(t => t.walletId === filters.walletId);
		}
		
		if (filters.type) {
			filtered = filtered.filter(t => t.type === filters.type);
		}
		
		if (filters.startDate) {
			filtered = filtered.filter(t => {
				const txDate = new Date(t.transactionDate);
				txDate.setHours(0, 0, 0, 0);
				const startDate = new Date(filters.startDate!);
				startDate.setHours(0, 0, 0, 0);
				return txDate >= startDate;
			});
		}
		
		if (filters.endDate) {
			filtered = filtered.filter(t => {
				const txDate = new Date(t.transactionDate);
				txDate.setHours(23, 59, 59, 999);
				const endDate = new Date(filters.endDate!);
				endDate.setHours(23, 59, 59, 999);
				return txDate <= endDate;
			});
		}
		
		// Sort by date descending
		filtered = filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
		
		// Enrich with category and wallet data
		const enriched = filtered.map(tx => {
			const category = userCategories.find(c => c.id === tx.userCategoryId);
			const wallet = wallets.find(w => w.id === tx.walletId);
			return {
				...tx,
				categoryName: category?.name || 'Chưa phân loại',
				categoryIcon: category?.icon || '',
				walletName: wallet?.name || 'Chưa xác định',
				typeName: tx.type === 1 ? 'Thu nhập' : 'Chi tiêu',
			};
		});
		
		return {
			success: true,
			data: enriched,
			summary: {
				total: enriched.length,
				income: enriched.filter(t => t.type === 1).reduce((sum, t) => sum + t.amount, 0),
				expense: enriched.filter(t => t.type === 2).reduce((sum, t) => sum + t.amount, 0),
			}
		};
	}
};


