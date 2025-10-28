// services/fakeApi.ts - Simple standalone fake API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simple in-memory storage
let users: Array<{id: number, email: string, password: string, verified?: boolean}> = [];
let pendingOtps: Array<{email: string, otp: string, expires: number}> = [];
let wallets: Array<{id: number, userId: number, name: string, amount: number, currency: string}> = [];
let categories: Array<{id: number, name: string, type: number, icon: string}> = [];
let userCategories: Array<{id: number, userId: number, name: string, type: number, icon: string}> = [];
let userSettings: Array<{userId: number, currency: string}> = [];

// Default categories
const defaultCategories = [
	{ id: 1, name: 'Lương', type: 1, icon: 'briefcase-outline' },
	{ id: 2, name: 'Thưởng', type: 1, icon: 'gift-outline' },
	{ id: 3, name: 'Lãi ngân hàng', type: 1, icon: 'bank-outline' },
	{ id: 4, name: 'Ăn uống', type: 2, icon: 'silverware-fork-knife' },
	{ id: 5, name: 'Di chuyển', type: 2, icon: 'car-outline' },
	{ id: 6, name: 'Nhà cửa', type: 2, icon: 'home-outline' },
	{ id: 7, name: 'Mua sắm', type: 2, icon: 'shopping-outline' },
	{ id: 8, name: 'Giải trí', type: 2, icon: 'gamepad-variant-outline' },
	{ id: 9, name: 'Hóa đơn - dịch vụ', type: 2, icon: 'lightbulb-outline' },
	{ id: 10, name: 'Sức khỏe', type: 2, icon: 'hospital-box-outline' },
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
};


