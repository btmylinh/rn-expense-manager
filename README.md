# React Native Expense Manager - Frontend
cd rn-expense-manager 
npm run start

cd rn-expense-manager 
npm run android
npx expo start --android
Ứng dụng quản lý chi tiêu di động được xây dựng với React Native, Expo, TypeScript.

## 📁 Cấu trúc thư mục

```
rn-expense-manager/
├── src/                           # toàn bộ source code chính
│   ├── App.tsx                    # Component gốc của app - khởi tạo và cấu hình app
│   ├── api/                       # các API clients để gọi backend
│   ├── screens/                   # tất cả các màn hình của app
│   ├── components/                # các component có thể tái sử dụng
│   ├── navigators/                # Thư mục cấu hình navigation (điều hướng giữa các màn hình)
│   ├── contexts/                  # React Contexts để quản lý state toàn cục
│   ├── hooks/                     # các custom React Hooks
│   ├── utils/                     # các hàm tiện ích (utility functions)
│   ├── theme/                     # Thư mục cấu hình theme (màu sắc, typography, spacing)
│   ├── common/                    # các cấu hình chung
│       └── config.ts             # File cấu hình API base URL, storage keys, constants
│
├── assets/                        # assets của app (icon, splash screen)
├── App.js                         # File entry point của Expo - khởi chạy app
├── index.js                       # File entry point của React Native - điểm bắt đầu
├── app.json                       # File cấu hình Expo (tên app, icon, splash, permissions...)
├── package.json                   # File định nghĩa dependencies và scripts của project
├── tsconfig.json                  # File cấu hình TypeScript (compiler options, paths...)
└── README.md                      # File hướng dẫn này

```

## 🏗️ Kiến trúc

### Flow xử lý

```
User Action → Screen → Component → API Call → Backend
                                              ↓
UI Update ← Screen ← Component ← API Response
```

### Các layer chính

1. **Screens** (`src/screens/`)
   - Các màn hình chính của app
   - Quản lý state và logic UI
   - Gọi APIs thông qua API clients

2. **Components** (`src/components/`)
   - Components tái sử dụng
   - UI components độc lập
   - Widgets cho dashboard

3. **API Clients** (`src/api/`)
   - Axios clients cho từng module
   - Xử lý authentication headers
   - Error handling và interceptors

4. **Contexts** (`src/contexts/`)
   - Global state management
   - Auth state, notifications, metadata

5. **Navigators** (`src/navigators/`)
   - React Navigation setup
   - Route definitions
   - Navigation flow

6. **Utils** (`src/utils/`)
   - Helper functions
   - Formatting utilities
   - Storage helpers

## 🔧 Cấu hình

### API Configuration

File `src/common/config.ts` chứa cấu hình API:

```typescript
// Tự động phát hiện IP cho emulator/device
// - Android emulator: 10.0.2.2
// - iOS simulator: localhost
// - Physical device: IP máy tính (cần cùng mạng WiFi)
const API_BASE_URL = `http://${API_HOST}:5000/api`;
```

**Lưu ý**: 
- React Native không thể dùng `localhost` trên physical device
- Cần đảm bảo device và máy tính cùng mạng WiFi
- IP máy tính có thể thay đổi, cần cập nhật trong config nếu cần

### Environment Variables

Tạo file `.env` (nếu cần) hoặc cấu hình trực tiếp trong `src/common/config.ts`:

```typescript
const MANUAL_IP = ''; // Hardcode IP nếu cần
const DEFAULT_COMPUTER_IP = '192.168.100.243'; // IP mặc định
```

## 🚀 Chạy ứng dụng

### Prerequisites

- Node.js (v18+)
- npm hoặc yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (cho Android) hoặc Xcode (cho iOS)

### Development

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm start
# hoặc
expo start

# Chạy trên Android
npm run android
# hoặc
expo start --android

# Chạy trên iOS
npm run ios
# hoặc
expo start --ios

# Chạy trên web (development)
npm run web
```

### Build

```bash
# Build APK cho Android
expo build:android

# Build IPA cho iOS
expo build:ios
```

## 📱 Các tính năng chính

### Authentication & Security
- ✅ Đăng nhập / Đăng ký
- ✅ Xác thực email
- ✅ Quên mật khẩu
- ✅ Two-factor authentication (2FA)
- ✅ JWT token management

### Quản lý tài chính
- ✅ Quản lý ví (wallets)
- ✅ Giao dịch thu/chi
- ✅ Danh mục tùy chỉnh
- ✅ Ngân sách theo danh mục
- ✅ Mục tiêu tiết kiệm
- ✅ Chi tiêu định kỳ (Recurring Expenses)
  - CRUD chi tiêu định kỳ (thêm, sửa, xóa, bật/tắt)
  - AI phát hiện pattern từ lịch sử giao dịch
  - Dự báo chi tiêu tháng sau
  - Nhắc nhở chi tiêu sắp đến hạn/quá hạn
  - Widget hiển thị trên Dashboard

### Thống kê & Báo cáo
- ✅ Dashboard tổng quan
- ✅ Biểu đồ thu/chi
- ✅ Phân tích theo danh mục
- ✅ Export báo cáo Excel
- ✅ Lịch sử giao dịch

### Streak & Gamification
- ✅ Streak tracking (chuỗi ngày liên tiếp)
- ✅ Thống kê streak
- ✅ Lịch sử hoạt động
- ✅ Milestone achievements

### AI & Smart Features
- ✅ OCR - Nhận dạng văn bản từ ảnh hóa đơn
- ✅ AI Parse - Tự động phân tích giao dịch
- ✅ Voice input - Nhập bằng giọng nói
- ✅ Chatbot AI - Hỗ trợ tư vấn tài chính

### Notifications
- ✅ Thông báo ngân sách
- ✅ Nhắc nhở chi tiêu định kỳ (sắp đến hạn/quá hạn)
- ✅ Thông báo streak
- ✅ Cảnh báo tài chính
- ✅ Badge cảnh báo trên Dashboard cho chi tiêu định kỳ

## 🛠️ Công nghệ sử dụng

### Core
- **Framework**: React Native
- **Platform**: Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React Context API

### UI Libraries
- **Material Design**: React Native Paper
- **Charts**: React Native Gifted Charts
- **Calendar**: React Native Calendars
- **Icons**: Expo Vector Icons

### API & Networking
- **HTTP Client**: Axios
- **Storage**: AsyncStorage, Expo SecureStore

### Features
- **Image Picker**: Expo Image Picker
- **Audio Recording**: Expo Audio
- **File System**: Expo File System
- **Haptics**: Expo Haptics
- **Share**: React Native Share

### Utilities
- **Date Picker**: React Native Community DateTimePicker
- **Excel Export**: XLSX
- **Validation**: Zod

## 📂 Cấu trúc Navigation

```
RootNavigator
├── AuthNavigator (khi chưa đăng nhập)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ...
│
└── Tabs (khi đã đăng nhập)
    ├── Dashboard Tab
    ├── Transactions Tab
    ├── Budgets Tab
    ├── Reports Tab
    └── Profile Tab
```

## 🔐 Security

- JWT tokens được lưu trong Expo SecureStore
- API calls tự động attach Authorization header
- Token refresh mechanism
- Secure storage cho sensitive data

## 📝 Ghi chú

- App sử dụng Expo managed workflow
- TypeScript được sử dụng cho type safety
- API base URL tự động phát hiện theo platform
- Mock API có sẵn trong `src/services/fakeApi.ts` cho development
- Theme có thể tùy chỉnh trong `src/theme/index.ts`

## 🐛 Troubleshooting

### Lỗi kết nối API
- Kiểm tra IP trong `src/common/config.ts`
- Đảm bảo backend đang chạy
- Kiểm tra firewall/antivirus
- Đảm bảo device và máy tính cùng mạng WiFi

### Lỗi build
- Xóa `node_modules` và `package-lock.json`, chạy lại `npm install`
- Clear Expo cache: `expo start -c`
- Kiểm tra version Node.js và Expo

