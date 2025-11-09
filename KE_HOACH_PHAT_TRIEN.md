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

Các tính năng đã hoàn thành theo đề cương:
- Mục tiêu tiết kiệm (hoàn thành)
- Dự báo chi tiêu tái diễn (hoàn thành)
- Chatbot tài chính (hoàn thành)
- Xuất báo cáo CSV (hoàn thành)

Các tính năng còn thiếu:
- Gợi ý tiết kiệm dựa trên dữ liệu lịch sử

---

## CÁC TÍNH NĂNG CẦN BỔ SUNG

### 1. MỤC TIÊU TIẾT KIỆM (SAVINGS GOALS)

Hiện trạng: Đã hoàn thành

Đã triển khai:
- SavingsGoalsScreen: Danh sách mục tiêu với progress bar
- SavingsGoalCreateScreen: Tạo/sửa mục tiêu
- SavingsGoalDetailScreen: Chi tiết tiến độ, lịch sử đóng góp
- Thêm tiền vào mục tiêu
- Thông báo khi đạt mục tiêu
- Xử lý các trạng thái đặc biệt (completed, overdue, sắp đến hạn)
- ToolsScreen: Màn hình công cụ tổng hợp

### 2. DỰ BÁO CHI TIÊU TÁI DIỄN (RECURRING EXPENSES)

Hiện trạng: Đã hoàn thành

Đã triển khai:
- RecurringExpensesScreen: Danh sách chi tiêu định kỳ
- Thêm chi tiêu định kỳ thủ công
- Cài đặt nhắc nhở trước ngày đến hạn
- Tự động phát hiện các khoản chi lặp lại
- Dự báo chi tiêu tháng tới

### 3. GỢI Ý TIẾT KIỆM THÔNG MINH

Hiện trạng: Chưa có

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

Hiện trạng: Đã hoàn thành

Đã triển khai:
- ChatbotScreen: Giao diện chat với AI
- Hỏi về chi tiêu, ngân sách, mục tiêu
- Gợi ý lập kế hoạch tài chính
- Câu hỏi thường gặp (FAQ)

### 5. XUẤT BÁO CÁO CSV

Hiện trạng: Đã hoàn thành

Đã triển khai:
- ReportExportScreen: Chọn loại báo cáo và khoảng thời gian
- Xuất CSV với dữ liệu chi tiết
- Chia sẻ báo cáo qua email/app khác


---

## PHÂN CHIA SESSIONS THỰC HIỆN

Lưu ý: Database schema đã có sẵn (users, wallets, transactions, budgets, streaks, notifications...)
Tuy nhiên FE đang dùng fakeApi.ts nên chưa cần chạy migration, chỉ cần mock data.

---

## FEATURE 3: GỢI Ý TIẾT KIỆM THÔNG MINH

### SESSION 3: GỢI Ý TIẾT KIỆM VÀ INSIGHTS

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

Dự kiến tổng thời gian còn lại: 3-5 ngày làm việc

Phân bổ:
- Session 3 (Gợi ý tiết kiệm): 1-2 ngày
- Session 6 (Testing): 2-3 ngày - BẮT BUỘC
- Session 7 (Hoàn thiện & Báo cáo): 3-4 ngày - BẮT BUỘC

---

## ƯU TIÊN THỰC HIỆN

1. SESSION 3: Gợi ý tiết kiệm
   Lý do: Tính năng nâng cao, ứng dụng AI theo đề cương

2. SESSION 6: Testing
   Lý do: Bắt buộc để đảm bảo chất lượng

3. SESSION 7: Hoàn thiện và Báo cáo
   Lý do: Bắt buộc để hoàn tất đồ án

---

## GHI CHÚ

- Báo cáo và biểu đồ không cần làm thêm vì Dashboard đã có đủ (BarChart, PieChart, Top Categories, So sánh)
- Đã hoàn thành 4/5 tính năng theo đề cương: Mục tiêu tiết kiệm, Dự báo chi tiêu tái diễn, Chatbot tài chính, Xuất báo cáo CSV
- Còn thiếu: Gợi ý tiết kiệm thông minh
- AI và OCR giữ nguyên dạng simulate vì đã đáp ứng yêu cầu thử nghiệm
- Session 3 là tính năng cuối cùng cần triển khai
- Session 6-7 là giai đoạn hoàn thiện và báo cáo

