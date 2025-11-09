# SƠ ĐỒ UML - ỨNG DỤNG QUẢN LÝ CHI TIÊU CÁ NHÂN

## MỤC LỤC

1. Activity Diagram (Biểu đồ hoạt động)
2. Sequence Diagram (Sơ đồ tuần tự)

---

## PHẦN 1: ACTIVITY DIAGRAM (BIỂU ĐỒ HOẠT ĐỘNG)

### 1. Activity Diagram - Quản lý giao dịch (Thêm/Sửa/Xóa)

Mô tả: Luồng hoạt động chính của ứng dụng, cho phép người dùng thêm, sửa, xóa và xem chi tiết giao dịch.

Các bước:
- Bắt đầu: Người dùng mở màn hình giao dịch
- Chọn hành động: Thêm mới / Sửa / Xóa / Xem chi tiết
- Nếu Thêm mới:
  - Chọn ví
  - Chọn danh mục
  - Nhập số tiền
  - Nhập mô tả
  - Chọn ngày
  - Xác nhận và lưu
- Nếu Sửa:
  - Chọn giao dịch cần sửa
  - Cập nhật thông tin
  - Xác nhận và lưu
- Nếu Xóa:
  - Chọn giao dịch cần xóa
  - Xác nhận xóa
  - Xóa và cập nhật số dư
- Nếu Xem chi tiết:
  - Hiển thị thông tin đầy đủ
  - Có thể sửa hoặc xóa từ đây
- Kết thúc: Cập nhật danh sách và số dư

### 2. Activity Diagram - Đăng ký và xác thực tài khoản

Mô tả: Luồng đăng ký tài khoản mới và xác thực email bằng OTP.

Các bước:
- Bắt đầu: Người dùng chọn đăng ký
- Nhập thông tin: Email, mật khẩu, tên
- Kiểm tra email đã tồn tại chưa
- Nếu đã tồn tại: Hiển thị lỗi và yêu cầu đăng nhập
- Nếu chưa tồn tại: Tạo tài khoản tạm thời
- Gửi mã OTP qua email
- Người dùng nhập mã OTP
- Xác thực mã OTP
- Nếu đúng: Kích hoạt tài khoản và chuyển đến màn hình thiết lập
- Nếu sai: Yêu cầu nhập lại hoặc gửi lại mã
- Kết thúc: Tài khoản được kích hoạt

### 3. Activity Diagram - Quản lý mục tiêu tiết kiệm

Mô tả: Luồng tạo, quản lý và theo dõi mục tiêu tiết kiệm.

Các bước:
- Bắt đầu: Người dùng mở màn hình mục tiêu tiết kiệm
- Chọn hành động: Tạo mới / Xem danh sách / Xem chi tiết / Thêm tiền
- Nếu Tạo mới:
  - Nhập tên mục tiêu
  - Nhập số tiền mục tiêu
  - Chọn ngày deadline
  - Chọn icon và màu
  - Xác nhận và tạo
- Nếu Xem danh sách:
  - Hiển thị tất cả mục tiêu
  - Lọc theo trạng thái (đang tiến hành / đã đạt / đã hủy)
  - Sắp xếp theo tiêu chí
- Nếu Xem chi tiết:
  - Hiển thị tiến độ
  - Hiển thị lịch sử đóng góp
  - Dự đoán ngày hoàn thành
  - Có thể sửa hoặc xóa
- Nếu Thêm tiền:
  - Nhập số tiền
  - Nhập ghi chú
  - Xác nhận
  - Cập nhật tiến độ
  - Kiểm tra đạt mục tiêu chưa
  - Nếu đạt: Tạo thông báo chúc mừng
- Kết thúc: Cập nhật danh sách và thông báo

### 4. Activity Diagram - Quản lý chi tiêu định kỳ

Mô tả: Luồng phát hiện, tạo và quản lý chi tiêu định kỳ.

Các bước:
- Bắt đầu: Người dùng mở màn hình chi tiêu định kỳ
- Chọn hành động: Phát hiện tự động / Tạo thủ công / Xem danh sách / Cài đặt nhắc nhở
- Nếu Phát hiện tự động:
  - Phân tích lịch sử giao dịch
  - Phát hiện pattern lặp lại
  - Tính độ tin cậy
  - Hiển thị kết quả phát hiện
  - Người dùng xác nhận hoặc bỏ qua
- Nếu Tạo thủ công:
  - Nhập tên chi tiêu
  - Nhập số tiền
  - Chọn danh mục
  - Chọn tần suất (ngày/tuần/tháng/năm)
  - Chọn ngày đến hạn tiếp theo
  - Cài đặt nhắc nhở
  - Xác nhận và tạo
- Nếu Xem danh sách:
  - Hiển thị tất cả chi tiêu định kỳ
  - Lọc theo trạng thái (đang hoạt động / đã tạm dừng)
  - Sắp xếp theo ngày đến hạn
- Nếu Cài đặt nhắc nhở:
  - Chọn số ngày nhắc trước
  - Bật/tắt nhắc nhở
  - Lưu cài đặt
- Kiểm tra nhắc nhở định kỳ:
  - Tính ngày đến hạn
  - Tạo thông báo nếu trong khoảng nhắc nhở
- Kết thúc: Cập nhật danh sách và thông báo

### 5. Activity Diagram - Quản lý ngân sách

Mô tả: Luồng tạo, theo dõi và quản lý ngân sách chi tiêu.

Các bước:
- Bắt đầu: Người dùng mở màn hình ngân sách
- Chọn hành động: Tạo mới / Xem danh sách / Xem chi tiết / Cài đặt cảnh báo
- Nếu Tạo mới:
  - Chọn danh mục
  - Chọn ví
  - Nhập số tiền ngân sách
  - Chọn khoảng thời gian
  - Chọn lặp lại hay không
  - Xác nhận và tạo
- Nếu Xem danh sách:
  - Hiển thị tất cả ngân sách
  - Lọc theo thời gian (tháng này / tuần này / tất cả)
  - Hiển thị tiến độ
- Nếu Xem chi tiết:
  - Hiển thị số tiền đã chi
  - Hiển thị số tiền còn lại
  - Hiển thị phần trăm sử dụng
  - Hiển thị danh sách giao dịch liên quan
  - Có thể sửa hoặc xóa
- Nếu Cài đặt cảnh báo:
  - Chọn mức cảnh báo (50%, 80%, 100%)
  - Bật/tắt cảnh báo
  - Lưu cài đặt
- Kiểm tra vượt ngân sách:
  - Tính số tiền đã chi
  - So sánh với ngân sách
  - Tạo thông báo nếu vượt
- Kết thúc: Cập nhật danh sách và thông báo

### 6. Activity Diagram - Dashboard tổng quan

Mô tả: Luồng hiển thị thống kê và thông tin tổng quan về tài chính.

Các bước:
- Bắt đầu: Người dùng mở màn hình Dashboard
- Load dữ liệu:
  - Lấy tổng thu chi tháng này
  - Lấy số dư hiện tại
  - Lấy top danh mục chi tiêu
  - Lấy biểu đồ chi tiêu theo ngày
  - Lấy so sánh với tháng trước
  - Lấy mục tiêu tiết kiệm gần đạt
  - Lấy chi tiêu định kỳ sắp tới
- Hiển thị thống kê:
  - Card tổng thu chi
  - Card số dư
  - Biểu đồ cột (Bar Chart)
  - Biểu đồ tròn (Pie Chart)
  - Danh sách top danh mục
  - Card so sánh tháng
- Quick actions:
  - Thêm giao dịch nhanh
  - Xem chi tiết ngân sách
  - Xem chi tiết mục tiêu
- Refresh dữ liệu:
  - Kéo xuống để làm mới
  - Tải lại tất cả dữ liệu
- Kết thúc: Hiển thị đầy đủ thông tin

### 7. Activity Diagram - Xuất báo cáo CSV

Mô tả: Luồng xuất báo cáo giao dịch ra file CSV và chia sẻ.

Các bước:
- Bắt đầu: Người dùng mở màn hình xuất báo cáo
- Chọn bộ lọc:
  - Chọn ví (tất cả hoặc ví cụ thể)
  - Chọn loại (tất cả / thu / chi)
  - Chọn khoảng thời gian
- Xem preview:
  - Hiển thị số lượng giao dịch
  - Hiển thị tổng số tiền
  - Hiển thị danh sách mẫu
- Xác nhận xuất:
  - Bấm nút xuất CSV
  - Xử lý dữ liệu
  - Tạo file CSV
  - Lưu file vào thiết bị
- Chia sẻ báo cáo:
  - Chọn phương thức chia sẻ (email / ứng dụng khác)
  - Gửi file
- Kết thúc: Hoàn tất xuất và chia sẻ

### 8. Activity Diagram - Chatbot tài chính

Mô tả: Luồng tương tác với chatbot AI để hỏi đáp về tài chính.

Các bước:
- Bắt đầu: Người dùng mở màn hình chatbot
- Gửi câu hỏi:
  - Nhập câu hỏi vào ô input
  - Bấm gửi hoặc Enter
- Xử lý câu hỏi:
  - Phân tích intent
  - Tìm trong FAQ trước
  - Nếu có trong FAQ: Trả lời ngay
  - Nếu không có: Gọi AI service
- AI xử lý:
  - Phân tích ngữ cảnh
  - Lấy dữ liệu user nếu cần
  - Tạo câu trả lời
- Hiển thị câu trả lời:
  - Hiển thị trong bubble chat
  - Có thể kèm biểu đồ hoặc số liệu
  - Có action buttons nếu cần
- Lưu lịch sử:
  - Lưu câu hỏi và câu trả lời
  - Hiển thị trong lịch sử chat
- Xem FAQ:
  - Xem danh sách câu hỏi thường gặp
  - Chọn câu hỏi để xem câu trả lời
- Kết thúc: Hoàn tất tương tác

### 9. Activity Diagram - Streak (Chuỗi ngày)

Mô tả: Luồng theo dõi và quản lý chuỗi ngày ghi chép giao dịch liên tiếp.

Các bước:
- Bắt đầu: Người dùng có giao dịch mới
- Kiểm tra streak:
  - Lấy ngày giao dịch cuối cùng
  - So sánh với ngày hôm nay
  - Nếu là ngày hôm nay: Giữ nguyên streak
  - Nếu là ngày hôm qua: Tăng streak lên 1
  - Nếu cách hơn 1 ngày: Reset streak về 0
- Cập nhật streak:
  - Cập nhật số ngày streak
  - Cập nhật ngày giao dịch cuối
  - Lưu vào database
- Xử lý đặc biệt:
  - Nếu có freeze available: Cho phép bỏ qua 1 ngày
  - Nếu có weekend mode: Không tính thứ 7, chủ nhật
- Hiển thị streak:
  - Hiển thị số ngày hiện tại
  - Hiển thị kỷ lục
  - Hiển thị lịch sử
- Cài đặt streak:
  - Bật/tắt nhắc nhở hàng ngày
  - Chọn giờ nhắc nhở
  - Cài đặt weekend mode
  - Quản lý freeze
- Kết thúc: Cập nhật streak và thông báo

### 10. Activity Diagram - Lọc và tìm kiếm giao dịch

Mô tả: Luồng lọc và tìm kiếm giao dịch theo nhiều tiêu chí.

Các bước:
- Bắt đầu: Người dùng mở màn hình giao dịch
- Chọn chế độ: Lọc / Tìm kiếm
- Nếu Lọc:
  - Chọn ví
  - Chọn danh mục
  - Chọn loại (thu / chi)
  - Chọn khoảng thời gian
  - Chọn khoảng số tiền
  - Áp dụng bộ lọc
- Nếu Tìm kiếm:
  - Nhập từ khóa
  - Tìm trong mô tả, ghi chú
  - Hiển thị kết quả
- Sắp xếp:
  - Chọn tiêu chí sắp xếp (ngày / số tiền / danh mục)
  - Chọn thứ tự (tăng dần / giảm dần)
- Xem kết quả:
  - Hiển thị danh sách đã lọc
  - Hiển thị số lượng kết quả
  - Có thể xem chi tiết từng giao dịch
- Reset bộ lọc:
  - Xóa tất cả bộ lọc
  - Hiển thị tất cả giao dịch
- Kết thúc: Hiển thị kết quả

### 11. Activity Diagram - Quản lý thông báo

Mô tả: Luồng xem, quản lý và xử lý thông báo trong ứng dụng.

Các bước:
- Bắt đầu: Người dùng mở màn hình thông báo
- Load thông báo:
  - Lấy tất cả thông báo
  - Phân loại (chưa đọc / đã đọc)
  - Sắp xếp theo thời gian
- Xem thông báo:
  - Hiển thị danh sách
  - Đánh dấu đã đọc khi xem
  - Xem chi tiết thông báo
- Xử lý thông báo:
  - Nếu là thông báo ngân sách: Chuyển đến màn hình ngân sách
  - Nếu là thông báo mục tiêu: Chuyển đến màn hình mục tiêu
  - Nếu là thông báo chi tiêu định kỳ: Chuyển đến màn hình chi tiêu định kỳ
  - Nếu là thông báo streak: Chuyển đến màn hình streak
- Đánh dấu tất cả đã đọc:
  - Cập nhật trạng thái tất cả
  - Lưu vào database
- Xóa thông báo:
  - Chọn thông báo cần xóa
  - Xác nhận xóa
  - Xóa khỏi danh sách
- Kết thúc: Cập nhật danh sách

### 12. Activity Diagram - Quản lý ví

Mô tả: Luồng tạo, quản lý và chuyển đổi giữa các ví.

Các bước:
- Bắt đầu: Người dùng mở màn hình quản lý ví
- Chọn hành động: Tạo mới / Xem danh sách / Sửa / Xóa / Chọn mặc định
- Nếu Tạo mới:
  - Nhập tên ví
  - Nhập số tiền ban đầu
  - Chọn loại tiền tệ
  - Chọn màu
  - Chọn làm ví mặc định hay không
  - Xác nhận và tạo
- Nếu Xem danh sách:
  - Hiển thị tất cả ví
  - Hiển thị số dư từng ví
  - Hiển thị ví mặc định
- Nếu Sửa:
  - Chọn ví cần sửa
  - Cập nhật thông tin
  - Xác nhận và lưu
- Nếu Xóa:
  - Chọn ví cần xóa
  - Kiểm tra có giao dịch không
  - Nếu có: Cảnh báo và yêu cầu chuyển giao dịch
  - Nếu không: Xác nhận và xóa
- Nếu Chọn mặc định:
  - Chọn ví làm mặc định
  - Cập nhật trạng thái
  - Lưu vào database
- Chuyển đổi ví:
  - Chọn ví khác để xem
  - Load giao dịch của ví đó
  - Hiển thị số dư
- Kết thúc: Cập nhật danh sách

### 13. Activity Diagram - Quản lý danh mục

Mô tả: Luồng tạo, sửa và quản lý danh mục chi tiêu.

Các bước:
- Bắt đầu: Người dùng mở màn hình quản lý danh mục
- Chọn hành động: Tạo mới / Sửa / Xóa / Xem danh sách
- Nếu Tạo mới:
  - Nhập tên danh mục
  - Chọn loại (thu / chi)
  - Chọn icon
  - Chọn màu
  - Xác nhận và tạo
- Nếu Xem danh sách:
  - Hiển thị tất cả danh mục
  - Phân loại theo thu/chi
  - Hiển thị số giao dịch mỗi danh mục
- Nếu Sửa:
  - Chọn danh mục cần sửa
  - Cập nhật thông tin
  - Xác nhận và lưu
- Nếu Xóa:
  - Chọn danh mục cần xóa
  - Kiểm tra có giao dịch không
  - Nếu có: Cảnh báo và yêu cầu chuyển giao dịch
  - Nếu không: Xác nhận và xóa
- Kết thúc: Cập nhật danh sách

### 14. Activity Diagram - Thiết lập ban đầu sau đăng ký

Mô tả: Luồng hướng dẫn người dùng mới thiết lập tài khoản lần đầu.

Các bước:
- Bắt đầu: Người dùng vừa xác thực email thành công
- Hiển thị màn hình chào mừng
- Hướng dẫn tạo ví đầu tiên:
  - Nhập tên ví
  - Nhập số tiền ban đầu
  - Chọn loại tiền tệ
  - Tạo ví
- Hướng dẫn tạo danh mục:
  - Hiển thị danh sách danh mục mặc định
  - Cho phép chọn danh mục muốn dùng
  - Tạo các danh mục đã chọn
- Hướng dẫn thêm giao dịch đầu tiên:
  - Hiển thị hướng dẫn
  - Cho phép bỏ qua hoặc thử ngay
- Hoàn tất thiết lập:
  - Chuyển đến màn hình chính
  - Hiển thị thông báo chào mừng
- Kết thúc: Người dùng sẵn sàng sử dụng

### 15. Activity Diagram - Cài đặt thông báo

Mô tả: Luồng cài đặt các loại thông báo và tùy chọn nhắc nhở.

Các bước:
- Bắt đầu: Người dùng mở màn hình cài đặt thông báo
- Chọn loại thông báo:
  - Cảnh báo ngân sách
  - Nhắc nhở giao dịch
  - Báo cáo hàng tuần
  - Cảnh báo bảo mật
  - Thông báo mục tiêu
  - Thông báo chi tiêu định kỳ
- Bật/tắt từng loại:
  - Chọn loại cần cài đặt
  - Bật hoặc tắt
  - Lưu cài đặt
- Cài đặt giờ yên lặng:
  - Bật/tắt chế độ yên lặng
  - Chọn giờ bắt đầu
  - Chọn giờ kết thúc
  - Lưu cài đặt
- Cài đặt push notification:
  - Bật/tắt push notification
  - Cho phép quyền thông báo
  - Lưu cài đặt
- Kết thúc: Lưu tất cả cài đặt

---

## PHẦN 2: SEQUENCE DIAGRAM (SƠ ĐỒ TUẦN TỰ)

### 1. Sequence Diagram - Nhập liệu bằng Text thông minh (AI Text Parsing)

Mô tả: Luồng xử lý nhập liệu giao dịch bằng text tự nhiên với AI phân tích.

Các đối tượng: User, AddTransactionScreen, fakeApi, AIParserService, TransactionService

Luồng:
1. User nhập text vào ô quick input
2. AddTransactionScreen gửi text đến fakeApi.parseTextToTransactions()
3. fakeApi gọi AIParserService để phân tích
4. AIParserService phân tích text, trích xuất:
   - Số tiền
   - Mô tả
   - Ngày (nếu có)
   - Danh mục (dựa trên từ khóa)
5. AIParserService trả về danh sách giao dịch đã phân tích
6. fakeApi trả về kết quả cho AddTransactionScreen
7. AddTransactionScreen hiển thị modal với danh sách giao dịch đã phát hiện
8. User xem và chỉnh sửa nếu cần
9. User xác nhận lưu
10. AddTransactionScreen gọi TransactionService để lưu từng giao dịch
11. TransactionService lưu vào database
12. TransactionService cập nhật số dư ví
13. TransactionService cập nhật streak
14. Trả về kết quả thành công
15. AddTransactionScreen cập nhật UI và hiển thị thông báo

### 2. Sequence Diagram - Nhập liệu bằng giọng nói (Voice Input)

Mô tả: Luồng xử lý nhập liệu giao dịch bằng giọng nói với speech-to-text và AI.

Các đối tượng: User, AddTransactionScreen, VoiceRecordingModal, SpeechToTextService, fakeApi, AIParserService, TransactionService

Luồng:
1. User bấm nút Voice
2. AddTransactionScreen hiển thị VoiceGuideModal
3. User bấm bắt đầu ghi âm
4. VoiceRecordingModal bắt đầu ghi âm
5. User nói các giao dịch
6. User bấm dừng ghi âm
7. VoiceRecordingModal lấy file audio
8. VoiceRecordingModal gửi audio đến SpeechToTextService
9. SpeechToTextService chuyển đổi giọng nói thành text
10. SpeechToTextService trả về transcript
11. VoiceRecordingModal gửi transcript đến fakeApi.parseVoiceToTransactions()
12. fakeApi gọi AIParserService để phân tích transcript
13. AIParserService phân tích và trích xuất giao dịch
14. AIParserService trả về danh sách giao dịch
15. fakeApi trả về kết quả cho AddTransactionScreen
16. AddTransactionScreen hiển thị modal với danh sách giao dịch
17. User xem và chỉnh sửa
18. User xác nhận lưu
19. AddTransactionScreen gọi TransactionService để lưu
20. TransactionService lưu vào database và cập nhật số dư
21. Trả về kết quả thành công

### 3. Sequence Diagram - Nhập liệu bằng OCR (Quét hóa đơn)

Mô tả: Luồng xử lý nhập liệu giao dịch bằng cách quét hóa đơn với OCR và AI.

Các đối tượng: User, AddTransactionScreen, OCRGuideModal, CameraService, OCRService, fakeApi, AIParserService, TransactionService

Luồng:
1. User bấm nút OCR
2. AddTransactionScreen hiển thị OCRGuideModal
3. User bấm mở camera
4. OCRGuideModal yêu cầu quyền camera
5. CameraService mở camera
6. User chụp ảnh hóa đơn
7. CameraService trả về ảnh
8. OCRGuideModal gửi ảnh đến OCRService
9. OCRService nhận dạng text từ ảnh
10. OCRService trả về text đã nhận dạng
11. OCRGuideModal gửi text đến fakeApi.parseImageToTransactions()
12. fakeApi gọi AIParserService để phân tích text từ hóa đơn
13. AIParserService phân tích và trích xuất:
   - Tên cửa hàng
   - Danh sách sản phẩm/dịch vụ
   - Tổng tiền
   - Ngày
   - Danh mục phù hợp
14. AIParserService trả về danh sách giao dịch
15. fakeApi trả về kết quả cho AddTransactionScreen
16. AddTransactionScreen hiển thị modal với danh sách giao dịch
17. User xem và chỉnh sửa
18. User xác nhận lưu
19. AddTransactionScreen gọi TransactionService để lưu
20. TransactionService lưu vào database và cập nhật số dư
21. Trả về kết quả thành công

### 4. Sequence Diagram - Xử lý nhiều giao dịch cùng lúc (Batch Processing)

Mô tả: Luồng xử lý và lưu nhiều giao dịch được phát hiện cùng lúc.

Các đối tượng: User, DetectedTransactionsModal, fakeApi, TransactionService, WalletService, StreakService

Luồng:
1. AI phát hiện nhiều giao dịch từ text/voice/image
2. fakeApi trả về danh sách giao dịch
3. AddTransactionScreen hiển thị DetectedTransactionsModal
4. DetectedTransactionsModal hiển thị danh sách giao dịch
5. User xem từng giao dịch
6. User có thể chỉnh sửa hoặc xóa giao dịch
7. User chọn giao dịch muốn lưu
8. User bấm xác nhận lưu tất cả
9. DetectedTransactionsModal gửi danh sách đến TransactionService
10. TransactionService lặp qua từng giao dịch:
    - Validate dữ liệu
    - Lưu vào database
    - Cập nhật số dư ví
11. Sau khi lưu tất cả, TransactionService gọi StreakService
12. StreakService cập nhật streak một lần
13. TransactionService trả về kết quả
14. DetectedTransactionsModal hiển thị thông báo thành công
15. AddTransactionScreen cập nhật UI và đóng modal

### 5. Sequence Diagram - Chatbot trả lời câu hỏi tài chính

Mô tả: Luồng xử lý câu hỏi của user và trả lời bằng AI chatbot.

Các đối tượng: User, ChatbotScreen, fakeApi, FAQService, AIService, ChatHistoryService

Luồng:
1. User nhập câu hỏi vào ChatbotScreen
2. ChatbotScreen gửi câu hỏi đến fakeApi.sendChatMessage()
3. fakeApi lưu câu hỏi vào lịch sử chat
4. fakeApi gọi FAQService để tìm trong FAQ
5. FAQService tìm kiếm câu hỏi tương tự
6. Nếu tìm thấy trong FAQ:
   - FAQService trả về câu trả lời
   - fakeApi trả về câu trả lời ngay
7. Nếu không tìm thấy:
   - fakeApi gọi AIService
   - AIService phân tích intent
   - AIService lấy dữ liệu user nếu cần
   - AIService tạo câu trả lời
   - AIService trả về câu trả lời
8. fakeApi lưu câu trả lời vào lịch sử chat
9. fakeApi trả về câu trả lời cho ChatbotScreen
10. ChatbotScreen hiển thị câu trả lời trong bubble chat
11. ChatHistoryService lưu toàn bộ cuộc hội thoại

### 6. Sequence Diagram - Chatbot phân tích dữ liệu tài chính

Mô tả: Luồng chatbot phân tích và trả lời câu hỏi về dữ liệu tài chính của user.

Các đối tượng: User, ChatbotScreen, fakeApi, AIService, DataAnalysisService, TransactionService

Luồng:
1. User hỏi về dữ liệu tài chính (ví dụ: "Tôi đã chi bao nhiêu tháng này?")
2. ChatbotScreen gửi câu hỏi đến fakeApi.sendChatMessage()
3. fakeApi gọi AIService để phân tích intent
4. AIService nhận diện câu hỏi về dữ liệu
5. AIService gọi DataAnalysisService
6. DataAnalysisService yêu cầu TransactionService lấy dữ liệu
7. TransactionService lấy giao dịch theo yêu cầu
8. TransactionService trả về dữ liệu
9. DataAnalysisService phân tích dữ liệu:
   - Tính tổng thu chi
   - Phân loại theo danh mục
   - So sánh với kỳ trước
   - Tạo insight
10. DataAnalysisService trả về kết quả phân tích
11. AIService tạo câu trả lời từ kết quả phân tích
12. AIService có thể tạo biểu đồ hoặc số liệu
13. AIService trả về câu trả lời
14. fakeApi lưu vào lịch sử chat
15. fakeApi trả về cho ChatbotScreen
16. ChatbotScreen hiển thị câu trả lời kèm biểu đồ/số liệu

### 7. Sequence Diagram - Chatbot gợi ý kế hoạch tài chính

Mô tả: Luồng chatbot phân tích và đưa ra gợi ý kế hoạch tài chính.

Các đối tượng: User, ChatbotScreen, fakeApi, AIService, RecommendationEngine, BudgetService, SavingsGoalService

Luồng:
1. User yêu cầu gợi ý kế hoạch tài chính
2. ChatbotScreen gửi yêu cầu đến fakeApi.sendChatMessage()
3. fakeApi gọi AIService
4. AIService gọi RecommendationEngine
5. RecommendationEngine yêu cầu dữ liệu:
   - Lịch sử chi tiêu
   - Ngân sách hiện tại
   - Mục tiêu tiết kiệm
   - Thu nhập
6. RecommendationEngine phân tích:
   - Thói quen chi tiêu
   - So sánh với chuẩn
   - Phát hiện điểm cần cải thiện
7. RecommendationEngine tạo gợi ý:
   - Gợi ý ngân sách
   - Gợi ý mục tiêu tiết kiệm
   - Gợi ý cắt giảm chi tiêu
8. RecommendationEngine trả về gợi ý
9. AIService tạo câu trả lời với gợi ý
10. AIService thêm action buttons (tạo ngân sách, tạo mục tiêu)
11. AIService trả về câu trả lời
12. fakeApi lưu vào lịch sử chat
13. fakeApi trả về cho ChatbotScreen
14. ChatbotScreen hiển thị gợi ý với action buttons
15. Nếu user bấm action button, chuyển đến màn hình tương ứng

### 8. Sequence Diagram - Phát hiện chi tiêu định kỳ tự động (AI Pattern Detection)

Mô tả: Luồng AI phân tích và phát hiện pattern chi tiêu định kỳ từ lịch sử giao dịch.

Các đối tượng: User, RecurringExpensesScreen, fakeApi, TransactionAnalyzer, AIPatternService, TransactionService

Luồng:
1. User bấm phát hiện chi tiêu định kỳ
2. RecurringExpensesScreen gọi fakeApi.detectRecurringExpenses()
3. fakeApi gọi TransactionAnalyzer
4. TransactionAnalyzer yêu cầu TransactionService lấy lịch sử giao dịch
5. TransactionService trả về tất cả giao dịch
6. TransactionAnalyzer nhóm giao dịch theo:
   - Tên tương tự
   - Số tiền tương tự
   - Danh mục
7. TransactionAnalyzer gọi AIPatternService để phân tích pattern
8. AIPatternService phân tích:
   - Khoảng cách giữa các giao dịch
   - Tính nhất quán của số tiền
   - Tính nhất quán của danh mục
   - Tính nhất quán của ngày
9. AIPatternService xác định pattern:
   - Daily (hàng ngày)
   - Weekly (hàng tuần)
   - Monthly (hàng tháng)
   - Yearly (hàng năm)
10. AIPatternService tính độ tin cậy (confidence)
11. AIPatternService trả về danh sách pattern đã phát hiện
12. TransactionAnalyzer trả về kết quả cho fakeApi
13. fakeApi trả về cho RecurringExpensesScreen
14. RecurringExpensesScreen hiển thị danh sách pattern
15. User xem và xác nhận tạo chi tiêu định kỳ

### 9. Sequence Diagram - Phân loại giao dịch tự động (AI Auto Categorization)

Mô tả: Luồng AI tự động phân loại giao dịch vào danh mục phù hợp.

Các đối tượng: User, AddTransactionScreen, TransactionService, AICategoryService, CategoryMatcher, fakeApi

Luồng:
1. User tạo giao dịch mới
2. AddTransactionScreen gửi dữ liệu đến TransactionService
3. TransactionService gọi AICategoryService để phân loại
4. AICategoryService phân tích:
   - Mô tả giao dịch
   - Số tiền
   - Ngữ cảnh
5. AICategoryService gọi CategoryMatcher
6. CategoryMatcher so khớp với danh mục:
   - Tìm từ khóa trong mô tả
   - So sánh với pattern đã học
   - Tính điểm khớp
7. CategoryMatcher trả về danh mục gợi ý với độ tin cậy
8. AICategoryService trả về danh mục cho TransactionService
9. Nếu độ tin cậy cao:
   - TransactionService tự động gán danh mục
10. Nếu độ tin cậy thấp:
    - TransactionService hiển thị gợi ý cho user
    - User xác nhận hoặc chọn danh mục khác
11. TransactionService lưu giao dịch với danh mục
12. AICategoryService học từ lựa chọn của user để cải thiện

### 10. Sequence Diagram - Dự báo chi tiêu tháng tới (AI Prediction)

Mô tả: Luồng AI dự báo chi tiêu tháng tới dựa trên lịch sử và pattern.

Các đối tượng: User, RecurringExpensesScreen, fakeApi, AIPredictionService, TransactionHistory, RecurringExpenseService

Luồng:
1. User yêu cầu dự báo chi tiêu tháng tới
2. RecurringExpensesScreen gọi fakeApi.predictNextMonthExpenses()
3. fakeApi gọi AIPredictionService
4. AIPredictionService yêu cầu dữ liệu:
   - Lịch sử giao dịch từ TransactionHistory
   - Chi tiêu định kỳ từ RecurringExpenseService
5. AIPredictionService phân tích:
   - Pattern chi tiêu trong quá khứ
   - Chi tiêu định kỳ đã biết
   - Xu hướng chi tiêu
   - Mùa vụ (nếu có)
6. AIPredictionService tính toán dự báo:
   - Dự báo từng khoản chi định kỳ
   - Dự báo chi tiêu không định kỳ
   - Tổng hợp theo danh mục
7. AIPredictionService trả về:
   - Danh sách khoản chi dự kiến
   - Tổng số tiền
   - Phân loại theo danh mục
   - Ngày đến hạn
8. fakeApi trả về kết quả cho RecurringExpensesScreen
9. RecurringExpensesScreen hiển thị:
   - Danh sách dự báo
   - Biểu đồ phân loại
   - Tổng số tiền
10. User xem và có thể điều chỉnh

### 11. Sequence Diagram - Xử lý lỗi và đề xuất sửa (AI Error Handling)

Mô tả: Luồng AI phát hiện lỗi trong dữ liệu nhập và đề xuất cách sửa.

Các đối tượng: User, AddTransactionScreen, AIValidationService, fakeApi, TransactionService

Luồng:
1. User nhập dữ liệu giao dịch
2. AddTransactionScreen gửi dữ liệu đến AIValidationService để validate
3. AIValidationService kiểm tra:
   - Định dạng số tiền
   - Độ dài mô tả
   - Ngày hợp lệ
   - Danh mục tồn tại
4. Nếu phát hiện lỗi:
   - AIValidationService phân tích lỗi
   - AIValidationService đề xuất cách sửa
   - AIValidationService trả về lỗi và đề xuất
5. AddTransactionScreen hiển thị:
   - Thông báo lỗi
   - Đề xuất sửa
   - Button tự động sửa
6. Nếu user chọn tự động sửa:
   - AddTransactionScreen áp dụng đề xuất
   - Validate lại
7. Nếu user sửa thủ công:
   - User chỉnh sửa
   - Validate lại
8. Khi không còn lỗi:
   - AddTransactionScreen gọi TransactionService để lưu
   - TransactionService lưu vào database
9. Trả về kết quả thành công

### 12. Sequence Diagram - Tối ưu hóa nhập liệu (AI Input Optimization)

Mô tả: Luồng AI học từ hành vi user để tối ưu hóa nhập liệu.

Các đối tượng: User, AddTransactionScreen, AILearningService, fakeApi, TransactionService

Luồng:
1. User nhập liệu nhiều lần
2. AddTransactionScreen gửi dữ liệu đến AILearningService
3. AILearningService phân tích pattern:
   - Danh mục thường dùng
   - Số tiền thường dùng
   - Thời gian thường nhập
   - Từ khóa thường dùng
4. AILearningService lưu pattern vào profile user
5. Lần nhập tiếp theo:
   - AILearningService gợi ý danh mục
   - AILearningService gợi ý số tiền
   - AILearningService tự động điền một số trường
6. AddTransactionScreen hiển thị gợi ý
7. User xác nhận hoặc chỉnh sửa
8. AILearningService cập nhật pattern từ lựa chọn của user
9. Quá trình lặp lại, AI ngày càng chính xác hơn

### 13. Sequence Diagram - Phân tích thói quen chi tiêu (AI Spending Habits Analysis)

Mô tả: Luồng AI phân tích sâu thói quen chi tiêu của user.

Các đối tượng: User, DashboardScreen, fakeApi, AIAnalyticsService, TransactionService, CategoryService

Luồng:
1. User yêu cầu phân tích thói quen chi tiêu
2. DashboardScreen gọi fakeApi.analyzeSpendingHabits()
3. fakeApi gọi AIAnalyticsService
4. AIAnalyticsService yêu cầu dữ liệu:
   - Tất cả giao dịch từ TransactionService
   - Danh mục từ CategoryService
   - Ngân sách
   - Mục tiêu tiết kiệm
5. AIAnalyticsService phân tích:
   - Chi tiêu theo ngày trong tuần
   - Chi tiêu theo thời gian trong ngày
   - Chi tiêu theo danh mục
   - Xu hướng theo thời gian
   - So sánh với chuẩn
6. AIAnalyticsService phát hiện:
   - Thói quen tốt
   - Thói quen xấu
   - Điểm bất thường
   - Cơ hội tiết kiệm
7. AIAnalyticsService tạo insight và khuyến nghị
8. AIAnalyticsService trả về báo cáo phân tích
9. fakeApi trả về cho DashboardScreen
10. DashboardScreen hiển thị:
    - Biểu đồ phân tích
    - Insight
    - Khuyến nghị
    - Action buttons

### 14. Sequence Diagram - Xử lý đa phương thức (Multi-modal AI Processing)

Mô tả: Luồng AI xử lý nhiều loại input cùng lúc (text, voice, image).

Các đối tượng: User, AddTransactionScreen, MultiModalAIService, TextParser, SpeechToTextService, OCRService, fakeApi

Luồng:
1. User có thể nhập bằng nhiều cách: text, voice, hoặc image
2. AddTransactionScreen gửi tất cả input đến MultiModalAIService
3. MultiModalAIService phân loại input:
   - Text: Gửi đến TextParser
   - Voice: Gửi đến SpeechToTextService rồi TextParser
   - Image: Gửi đến OCRService rồi TextParser
4. Các service xử lý song song:
   - TextParser phân tích text
   - SpeechToTextService chuyển voice thành text
   - OCRService nhận dạng text từ image
5. Tất cả text được gửi đến TextParser
6. TextParser phân tích và trích xuất giao dịch
7. TextParser tổng hợp kết quả từ tất cả nguồn
8. TextParser loại bỏ trùng lặp
9. TextParser trả về danh sách giao dịch đã tổng hợp
10. MultiModalAIService trả về cho fakeApi
11. fakeApi trả về cho AddTransactionScreen
12. AddTransactionScreen hiển thị kết quả tổng hợp

### 15. Sequence Diagram - AI Contextual Understanding

Mô tả: Luồng AI hiểu ngữ cảnh và đưa ra câu trả lời phù hợp với user.

Các đối tượng: User, ChatbotScreen, fakeApi, AIContextService, UserProfileService, TransactionService

Luồng:
1. User gửi câu hỏi đến ChatbotScreen
2. ChatbotScreen gửi câu hỏi đến fakeApi.sendChatMessage()
3. fakeApi gọi AIContextService
4. AIContextService lấy context:
   - Thông tin user từ UserProfileService
   - Lịch sử chat
   - Dữ liệu tài chính từ TransactionService
   - Tình trạng hiện tại (ngân sách, mục tiêu)
5. AIContextService phân tích ngữ cảnh:
   - Hiểu intent của câu hỏi
   - Xác định thông tin cần thiết
   - Xác định mức độ chi tiết
6. AIContextService tạo câu trả lời phù hợp:
   - Sử dụng thông tin user
   - Tham chiếu đến dữ liệu cụ thể
   - Cá nhân hóa câu trả lời
7. AIContextService trả về câu trả lời
8. fakeApi lưu vào lịch sử chat
9. fakeApi trả về cho ChatbotScreen
10. ChatbotScreen hiển thị câu trả lời có ngữ cảnh

---

## TỔNG KẾT

Tổng số sơ đồ: 30 sơ đồ

Activity Diagram: 15 sơ đồ
- Từ sơ đồ 1 đến sơ đồ 15

Sequence Diagram: 15 sơ đồ
- Từ sơ đồ 1 đến sơ đồ 15 (tập trung vào AI và nhập liệu thông minh)

Các sơ đồ này mô tả đầy đủ các luồng hoạt động và tương tác trong ứng dụng quản lý chi tiêu cá nhân, đặc biệt là các tính năng AI và nhập liệu thông minh.

