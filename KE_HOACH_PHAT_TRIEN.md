# KẾ HOẠCH PHÁT TRIỂN ỨNG DỤNG QUẢN LÝ CHI TIÊU CÁ NHÂN

## TỔNG QUAN

Dự án hiện tại đã hoàn thành các tính năng cơ bản:
- Xác thực người dùng (đăng ký, đăng nhập, xác thực email)
- Quản lý giao dịch (thêm, sửa, xóa, lọc, sắp xếp)
- Quản lý ngân sách (tạo, theo dõi, cảnh báo)
- Streak gamification (theo dõi thói quen)
- Thông báo in-app
- Quản lý ví và danh mục
- Nhập liệu thông minh (AI, OCR, Voice - đang dùng fake API)

Theo đề cương đồ án, cần bổ sung các tính năng còn thiếu:
- Mục tiêu tiết kiệm
- Dự báo chi tiêu tái diễn
- Gợi ý tiết kiệm dựa trên dữ liệu lịch sử
- Chatbot tài chính
- Xuất báo cáo PDF/Excel

---

## CÁC TÍNH NĂNG CẦN BỔ SUNG

### 1. MỤC TIÊU TIẾT KIỆM (SAVINGS GOALS)

Hiện trạng: Không có

Vị trí đặt: GHÉP VÀO TAB "NGÂN SÁCH"
- Đổi tên tab "Ngân sách" thành "Kế hoạch" 
- Thêm SegmentedButtons trong BudgetsScreen với 2 tabs: [Ngân sách] [Mục tiêu]
- Tab "Ngân sách": Giữ nguyên giao diện hiện tại
- Tab "Mục tiêu": Hiển thị danh sách mục tiêu tiết kiệm

Lý do:
- Không tăng số lượng bottom tabs (vẫn giữ 5 tabs)
- Logic rõ ràng: Ngân sách = Kế hoạch CHI, Mục tiêu = Kế hoạch TIẾT KIỆM
- Dễ chuyển đổi giữa 2 tính năng liên quan
- Tương tự cách BudgetsScreen hiện tại đã có tabs theo thời gian

Cần làm:
- Refactor BudgetsScreen: Thêm SegmentedButtons cho 2 tabs chính
- SavingsGoalsScreen: Danh sách mục tiêu với progress bar (tương tự BudgetCard)
- SavingsGoalCreateScreen: Tạo/sửa mục tiêu (tên, số tiền, hạn cuối, icon, màu)
- SavingsGoalDetailScreen: Chi tiết tiến độ, lịch sử đóng góp, dự đoán hoàn thành
- Thêm tiền vào mục tiêu
- Thông báo khi đạt mục tiêu
- Empty state khi chưa có mục tiêu
- Card "Mục tiêu gần đạt" trong Dashboard (quick access)

Giao diện tham khảo:
```
BudgetsScreen (đổi tên Tab thành "Kế hoạch")
├─ Header: "Kế hoạch tài chính"
├─ SegmentedButtons: [Ngân sách] [Mục tiêu]
├─ Tab "Ngân sách":
│  └─ Giữ nguyên giao diện hiện tại
└─ Tab "Mục tiêu":
   ├─ Card mỗi mục tiêu:
   │  ├─ Icon & Tên (VD: 💻 Mua Laptop)
   │  ├─ Progress Bar (15tr/20tr - 75%)
   │  ├─ Còn thiếu: 5.000.000đ
   │  ├─ Dự kiến: 15/12/2025
   │  └─ Button "Thêm tiền"
   └─ FAB "+" Tạo mục tiêu mới
```

API cần bổ sung:
- getSavingsGoals(userId)
- createSavingsGoal(userId, data)
- updateSavingsGoal(userId, goalId, data)
- deleteSavingsGoal(userId, goalId)
- addContribution(userId, goalId, amount)
- getSavingsGoalDetail(userId, goalId)

### 2. DỰ BÁO CHI TIÊU TÁI DIỄN

Hiện trạng: Không có

Cần làm:
- RecurringExpensesScreen: Danh sách chi tiêu định kỳ đã phát hiện
- Thêm chi tiêu định kỳ thủ công
- Cài đặt nhắc nhở trước ngày đến hạn
- Tự động phát hiện các khoản chi lặp lại (theo pattern)
- Dự báo chi tiêu tháng tới

API cần bổ sung:
- detectRecurringExpenses(userId)
- getRecurringExpenses(userId)
- createRecurringExpense(userId, data)
- updateRecurringExpense(userId, expenseId, data)
- deleteRecurringExpense(userId, expenseId)
- predictNextMonthExpenses(userId)

### 3. GỢI Ý TIẾT KIỆM THÔNG MINH

Hiện trạng: Không có

Cần làm:
- RecommendationsScreen: Hiển thị gợi ý tiết kiệm
- Phân tích thói quen chi tiêu
- So sánh với mức trung bình
- Gợi ý cắt giảm chi tiêu cho từng danh mục
- Tips tiết kiệm dựa trên dữ liệu lịch sử

API cần bổ sung:
- getSavingsRecommendations(userId)
- getSpendingInsights(userId)
- getBenchmarkComparison(userId)
- analyzeSpendingHabits(userId)

### 4. CHATBOT TÀI CHÍNH

Hiện trạng: Không có

Cần làm:
- ChatbotScreen: Giao diện chat với AI
- Hỏi về chi tiêu, ngân sách, mục tiêu
- Gợi ý lập kế hoạch tài chính
- Câu hỏi thường gặp (FAQ)
- Tích hợp OpenAI API hoặc tương tự

API cần bổ sung:
- sendChatMessage(userId, message)
- getChatHistory(userId)
- getFAQs()

### 5. XUẤT BÁO CÁO PDF/EXCEL

Hiện trạng: Không có

Cần làm:
- ReportExportScreen: Chọn loại báo cáo và khoảng thời gian
- Xuất PDF với biểu đồ và bảng số liệu
- Xuất Excel với dữ liệu chi tiết
- Chia sẻ báo cáo qua email/app khác

API cần bổ sung:
- exportReportPDF(userId, reportType, timeRange)
- exportReportExcel(userId, reportType, timeRange)

Thư viện cần cài:
- react-native-html-to-pdf
- xlsx
- react-native-fs
- react-native-share


---

## PHÂN CHIA SESSIONS THỰC HIỆN

Lưu ý: Database schema đã có sẵn (users, wallets, transactions, budgets, streaks, notifications...)
Tuy nhiên FE đang dùng fakeApi.ts nên chưa cần chạy migration, chỉ cần mock data.

---

## FEATURE 1: MỤC TIÊU TIẾT KIỆM (SAVINGS GOALS)

### SESSION 1A: Mock Data và API cho Mục tiêu tiết kiệm

Thời gian: 0.5 ngày

Trước session này: Chưa có gì về Savings Goals

Session này làm gì:
1. Thêm mock data vào fakeApi.ts
   - Tạo array `savings_goals` với cấu trúc:
     ```typescript
     {
       id: number,
       user_id: number,
       name: string,              // "Mua Laptop"
       target_amount: number,      // 20000000
       current_amount: number,     // 15000000
       deadline: string,          // "2025-12-31"
       icon: string,              // "laptop"
       color: string,             // "#FF8A00"
       status: string,            // "active" | "completed" | "cancelled"
       created_at: string,
       updated_at: string
     }
     ```
   - Tạo array `savings_goal_contributions` (lịch sử đóng góp):
     ```typescript
     {
       id: number,
       goalId: number,
       amount: number,
       note: string,
       createdAt: string
     }
     ```
   - Mock data mẫu cho userId = 1 (3-4 mục tiêu)

2. Tạo các API functions trong fakeApi.ts:
   ```typescript
   async getSavingsGoals(userId: number)
   // Trả về danh sách mục tiêu của user
   
   async getSavingsGoalDetail(userId: number, goalId: number)
   // Trả về chi tiết 1 mục tiêu + lịch sử đóng góp
   
   async createSavingsGoal(userId: number, data: {...})
   // Tạo mục tiêu mới, trả về goal đã tạo
   
   async updateSavingsGoal(userId: number, goalId: number, data: {...})
   // Cập nhật thông tin mục tiêu
   
   async deleteSavingsGoal(userId: number, goalId: number)
   // Xóa mục tiêu (soft delete: status = 'cancelled')
   
   async addContribution(userId: number, goalId: number, amount: number, note?: string)
   // Thêm tiền vào mục tiêu, tạo contribution record
   // Cập nhật currentAmount của goal
   // Nếu đạt 100% → tạo notification
   ```

Sau session này: Có đầy đủ mock data và API functions, chưa có UI

---

### SESSION 1B: Refactor BudgetsScreen và tạo danh sách Mục tiêu

Thời gian: 0.5 ngày

Trước session này: Có API và mock data (Session 1A)

Session này làm gì:
1. Refactor file `src/screens/budgets/BudgetsScreen.tsx`:
   - Thêm state: `const [mainTab, setMainTab] = useState<'budgets' | 'goals'>('budgets')`
   - Thêm SegmentedButtons ở đầu màn hình (sau AppBar):
     ```tsx
     <SegmentedButtons
       value={mainTab}
       onValueChange={setMainTab}
       buttons={[
         { value: 'budgets', label: 'Ngân sách' },
         { value: 'goals', label: 'Mục tiêu' }
       ]}
     />
     ```
   - Render conditional: `{mainTab === 'budgets' ? <BudgetContent ...> : <SavingsGoalsContent />}`

2. Đổi tên bottom tab trong `src/navigators/Tabs.tsx`:
   - "Ngân sách" → "Kế hoạch"
   - Icon: `cash-multiple` → `target` (hoặc giữ nguyên)

3. Tạo component `src/components/SavingsGoalCard.tsx`:
   - Props: `goal`, `onPress`
   - Hiển thị:
     * Icon và tên mục tiêu (VD: 💻 Mua Laptop)
     * Progress Bar với % (VD: 15tr/20tr - 75%)
     * Số tiền còn thiếu: format số
     * Deadline và số ngày còn lại
     * Button "Thêm tiền" (mở modal)
   - Style tương tự BudgetCard hiện tại

4. Tạo component `src/screens/budgets/SavingsGoalsContent.tsx`:
   - Load data: `const goals = await fakeApi.getSavingsGoals(userId)`
   - State: loading, goals, refreshing
   - Hiển thị danh sách goals bằng ScrollView
   - Mỗi goal render SavingsGoalCard
   - Empty state nếu chưa có mục tiêu:
     * Icon lớn
     * Text: "Chưa có mục tiêu tiết kiệm"
     * Button "Tạo mục tiêu đầu tiên"
   - FAB (+) ở góc phải dưới để tạo mục tiêu mới
   - onPress card → navigate('SavingsGoalDetail', { goalId })

Sau session này: Có UI hiển thị danh sách mục tiêu, chưa có màn hình tạo/sửa/chi tiết

---

### SESSION 1C: Màn hình tạo/sửa Mục tiêu

Thời gian: 0.5 ngày

Trước session này: Có danh sách mục tiêu (Session 1B)

Session này làm gì:
1. Tạo file `src/screens/savings/SavingsGoalCreateScreen.tsx`:
   - Route params: `{ goalId?: number, editMode?: boolean }`
   - State: name, targetAmount, currentAmount, deadline, icon, color, loading
   - Form fields:
     * TextInput: Tên mục tiêu (required)
     * TextInput: Số tiền mục tiêu (number, required)
     * TextInput: Số tiền hiện có (number, default 0)
     * DatePicker: Ngày muốn đạt được (required)
     * Icon picker: Chọn icon (grid icons)
     * Color picker: Chọn màu (danh sách màu preset)
   - Hiển thị tính toán tự động:
     * Số tiền cần tiết kiệm mỗi tháng
     * VD: "(Cần tiết kiệm ~833.000đ/tháng để đạt mục tiêu)"
   - Button "Tạo mục tiêu" / "Cập nhật"
   - Validation:
     * Tên không rỗng
     * Số tiền mục tiêu > 0
     * Deadline phải sau hôm nay
     * currentAmount <= targetAmount
   - onSubmit:
     * Gọi `fakeApi.createSavingsGoal()` hoặc `updateSavingsGoal()`
     * Hiển thị toast thành công
     * Navigate back

2. Thêm navigation:
   - Update `src/navigators/RootNavigator.tsx`:
     ```tsx
     export type RootStackParamList = {
       ...
       SavingsGoalCreate: { goalId?: number };
       SavingsGoalDetail: { goalId: number };
     };
     
     <Stack.Screen name="SavingsGoalCreate" component={SavingsGoalCreateScreen} />
     <Stack.Screen name="SavingsGoalDetail" component={SavingsGoalDetailScreen} />
     ```

Sau session này: Có thể tạo mục tiêu mới, chưa có màn hình chi tiết

---

### SESSION 1D: Màn hình chi tiết Mục tiêu

Thời gian: 0.5 ngày

Trước session này: Có thể tạo/sửa mục tiêu (Session 1C)

Session này làm gì:
1. Tạo file `src/screens/savings/SavingsGoalDetailScreen.tsx`:
   - Route params: `{ goalId: number }`
   - Load data: `fakeApi.getSavingsGoalDetail(userId, goalId)`
   - Trả về: goal info + contributions history
   
   Giao diện chi tiết:
   - Header section:
     * Icon lớn và tên mục tiêu
     * Progress circle lớn với %
     * Đã tiết kiệm / Mục tiêu (format số)
   
   - Stats cards (3 cards ngang):
     * Card 1: Còn thiếu + số tiền
     * Card 2: Tiến độ + %
     * Card 3: Deadline + số ngày còn lại
   
   - Dự đoán:
     * "Với tiến độ hiện tại, bạn sẽ đạt mục tiêu vào DD/MM/YYYY"
     * Nếu chậm: "Cần tăng tốc! Hiện tại chậm hơn kế hoạch X ngày"
   
   - Lịch sử đóng góp:
     * List các contribution
     * Mỗi item: Ngày + Số tiền + Note
     * Sort theo thời gian mới nhất
   
   - Action buttons:
     * Button "Thêm tiền" (primary, lớn)
     * Button "Sửa mục tiêu" (outline)
     * Button "Xóa mục tiêu" (text, màu đỏ)

2. Modal thêm tiền:
   - TextInput: Số tiền thêm vào
   - TextInput: Ghi chú (optional)
   - Button "Thêm"
   - onSubmit:
     * Gọi `fakeApi.addContribution()`
     * Reload detail
     * Nếu đạt 100%: Hiển thị celebration modal

Sau session này: Feature Mục tiêu tiết kiệm hoàn chỉnh cơ bản

---

## FEATURE 2: DỰ BÁO CHI TIÊU TÁI DIỄN (RECURRING EXPENSES)

### SESSION 2A: Mock Data và API phát hiện chi tiêu định kỳ

Thời gian dự kiến: 2 ngày

Nội dung:
1. Bổ sung API vào fakeApi.ts
   - detectRecurringExpenses: Thuật toán phát hiện pattern
   - getRecurringExpenses
   - createRecurringExpense
   - updateRecurringExpense
   - deleteRecurringExpense
   - predictNextMonthExpenses

2. Thuật toán phát hiện chi tiêu lặp lại
   - Phân tích giao dịch theo tên, số tiền, danh mục
   - Phát hiện pattern: hàng ngày, hàng tuần, hàng tháng
   - Tính độ tin cậy của dự đoán

3. Tạo màn hình
   - RecurringExpensesScreen.tsx: Danh sách chi tiêu định kỳ
   - Form thêm chi tiêu định kỳ thủ công
   - Cài đặt nhắc nhở

4. Tích hợp thông báo
   - Nhắc nhở trước khi đến hạn thanh toán
   - Nhắc nhở khi phát hiện pattern mới

Kết quả mong đợi:
- Tự động phát hiện các khoản chi định kỳ
- Dự báo chi tiêu tháng tới
- Nhắc nhở người dùng kịp thời

---

### SESSION 3: GỢI Ý TIẾT KIỆM VÀ INSIGHTS (Ưu tiên trung bình)

Thời gian dự kiến: 1-2 ngày

Nội dung:
1. Bổ sung API vào fakeApi.ts
   - getSavingsRecommendations
   - getSpendingInsights
   - getBenchmarkComparison
   - analyzeSpendingHabits

2. Logic phân tích
   - Tính mức chi trung bình cho mỗi danh mục
   - So sánh với tháng trước
   - Phát hiện danh mục chi quá nhiều
   - Tạo gợi ý cắt giảm cụ thể

3. Tạo màn hình
   - RecommendationsScreen.tsx: Hiển thị gợi ý
   - Card insights trên Dashboard

4. UI/UX
   - Hiển thị gợi ý dễ hiểu
   - Action button để áp dụng gợi ý (vd: tạo ngân sách)

Kết quả mong đợi:
- Người dùng nhận được gợi ý tiết kiệm thông minh
- Phát hiện thói quen chi tiêu bất hợp lý

---

### SESSION 4: CHATBOT TÀI CHÍNH (Ưu tiên trung bình)

Thời gian dự kiến: 2-3 ngày

Nội dung:
1. Bổ sung API vào fakeApi.ts
   - sendChatMessage (simulate hoặc tích hợp OpenAI)
   - getChatHistory
   - getFAQs

2. Tạo màn hình ChatbotScreen.tsx
   - Giao diện chat (bubble messages)
   - Input box để gửi tin nhắn
   - Hiển thị typing indicator
   - Lịch sử chat

3. Tích hợp AI (nếu có thời gian)
   - Kết nối OpenAI API
   - Context về dữ liệu tài chính của user
   - Xử lý các câu hỏi phổ biến

4. Fallback với FAQ
   - Danh sách câu hỏi thường gặp
   - Câu trả lời có sẵn

Kết quả mong đợi:
- Chatbot có thể trả lời câu hỏi về chi tiêu
- Gợi ý lập kế hoạch tài chính

---

### SESSION 5: XUẤT BÁO CÁO PDF/EXCEL (Ưu tiên trung bình)

Thời gian dự kiến: 2 ngày

Nội dung:
1. Cài đặt thư viện
   - react-native-html-to-pdf
   - xlsx
   - react-native-fs
   - react-native-share

2. Bổ sung API vào fakeApi.ts
   - exportReportPDF
   - exportReportExcel
   - generateHTMLReport (template)

3. Tạo màn hình ReportExportScreen.tsx
   - Chọn loại báo cáo
   - Chọn khoảng thời gian
   - Preview trước khi xuất
   - Nút xuất và chia sẻ

4. Logic xuất file
   - Tạo HTML template cho PDF
   - Tạo Excel với số liệu chi tiết
   - Lưu vào thư mục Downloads
   - Chia sẻ qua email/app khác

Kết quả mong đợi:
- Xuất được báo cáo PDF với biểu đồ
- Xuất được Excel với dữ liệu chi tiết
- Chia sẻ báo cáo dễ dàng

---

### SESSION 6: TESTING VÀ BUG FIX (Bắt buộc)

Thời gian dự kiến: 2-3 ngày

Nội dung:
1. Kiểm thử chức năng
   - Test từng màn hình mới
   - Test flow người dùng end-to-end
   - Test trên cả iOS và Android

2. Kiểm thử hiệu năng
   - Test với lượng dữ liệu lớn
   - Test scroll performance
   - Test memory leaks

3. Kiểm thử bảo mật
   - Test 2FA flow
   - Test xác thực API
   - Test data isolation giữa users

4. Fix bugs
   - Sửa lỗi phát hiện được
   - Tối ưu performance
   - Cải thiện UX

5. Thu thập feedback
   - Cho người dùng thử nghiệm
   - Ghi nhận ý kiến
   - Điều chỉnh theo feedback

Kết quả mong đợi:
- App ổn định, ít lỗi
- Hiệu năng tốt
- UX mượt mà

---

### SESSION 7: HOÀN THIỆN VÀ VIẾT BÁO CÁO (Bắt buộc)

Thời gian dự kiến: 3-4 ngày

Nội dung:
1. Hoàn thiện UI/UX
   - Đảm bảo tất cả màn hình nhất quán
   - Polish animations
   - Cải thiện empty states
   - Cải thiện loading states

2. Viết documentation
   - README.md
   - Hướng dẫn cài đặt
   - Hướng dẫn sử dụng các tính năng
   - API documentation

3. Viết báo cáo đồ án
   - Chương 1: Tổng quan tài liệu
   - Chương 2: Phương pháp thực hiện
   - Chương 3: Cài đặt thực nghiệm
   - Kết luận và hướng phát triển

4. Chuẩn bị demo
   - Tạo tài khoản demo với dữ liệu mẫu
   - Chuẩn bị slides thuyết trình
   - Video demo (nếu cần)

Kết quả mong đợi:
- Báo cáo đồ án hoàn chỉnh
- App sẵn sàng demo và bảo vệ

---

## TỔNG KẾT THỜI GIAN

Dự kiến tổng thời gian: 14-20 ngày làm việc (3-4 tuần)

Phân bổ:
- Session 1-2 (Mục tiêu, Dự báo): 4 ngày - CORE FEATURES từ đề cương
- Session 3-5 (Gợi ý, Chatbot, Export): 6-7 ngày - TÍNH NĂNG ĐẶC BIỆT từ đề cương
- Session 6 (Testing): 2-3 ngày - BẮT BUỘC
- Session 7 (Hoàn thiện & Báo cáo): 3-4 ngày - BẮT BUỘC

---

## ƯU TIÊN THỰC HIỆN

Theo đúng yêu cầu đề cương (đã loại bỏ Báo cáo vì Dashboard đã đủ):

1. SESSION 1: Mục tiêu tiết kiệm
   Lý do: Tính năng đặc biệt theo phạm vi nghiên cứu, liên quan mật thiết với Ngân sách

2. SESSION 2: Dự báo chi tiêu tái diễn
   Lý do: Tính năng đặc biệt, điểm khác biệt so với app hiện có

3. SESSION 3: Gợi ý tiết kiệm
   Lý do: Tính năng nâng cao, ứng dụng AI theo đề cương

4. SESSION 4: Chatbot tài chính
   Lý do: Tính năng nâng cao, điểm mạnh đáng chú ý theo đề cương

5. SESSION 5: Xuất báo cáo PDF/Excel
   Lý do: Tính năng bổ trợ, nằm trong kết quả dự kiến

6. SESSION 6: Testing
   Lý do: Bắt buộc để đảm bảo chất lượng

7. SESSION 7: Hoàn thiện và Báo cáo
   Lý do: Bắt buộc để hoàn tất đồ án

---

## GHI CHÚ

- Báo cáo và biểu đồ KHÔNG cần làm thêm vì Dashboard đã có đủ (BarChart, PieChart, Top Categories, So sánh)
- Tập trung 100% vào 5 tính năng còn thiếu theo đề cương
- AI và OCR giữ nguyên dạng simulate vì đã đáp ứng yêu cầu thử nghiệm
- Mỗi session bám sát mục tiêu trong phần "Kết quả dự kiến đạt được" của đề cương
- Session 1-5 là các tính năng chính cần triển khai
- Session 6-7 là giai đoạn hoàn thiện và báo cáo
- Tiết kiệm được 2-3 ngày nhờ không phải làm lại màn hình Báo cáo

