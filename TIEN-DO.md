# Nhật ký triển khai
## Kế hoạch và quyết định
1. Kiểm kê 12 slide và 44 tệp trong hai thư mục đề. Ghi SHA-256, phân biệt trang ảnh và trang có lớp chữ. Cache mỗi trang để tiếp tục sau gián đoạn.
2. Biên tập theo tài liệu, đối chiếu câu trắc nghiệm và tự luận, lưu bằng chứng và các trang chờ duyệt. ID tài liệu dựa trên nội dung, ID câu biên tập ổn định.
3. Xây ứng dụng React + TypeScript + Vite. Toàn bộ tài nguyên ở máy người học. Máy chủ Node chỉ phục vụ bản build. Dùng các bản ghi IndexedDB cho lịch sử, phiên, nháp và hiệu đính.
4. Kiểm thử bộ lọc, tự lưu, kết thúc thi, sao lưu và ZIP từ đường dẫn Unicode. Ghi kết quả và giới hạn vào đây.

## Thiết kế
Sidebar là mục lục cuốn bài giảng. Vùng học dùng chữ đậm cho đề mục, khoảng trống cho phần đọc, một bảng mã Java cạnh chương đang học. Nền #f7f8f4, chữ #19382f, xanh #18573f, đường kẻ #d3ddd4, giấy #ffffff, vàng #e8d48b. Dùng font sans hỗ trợ đầy đủ tiếng Việt cùng monospace cho mã. Trên điện thoại mục lục thu vào menu. Ưu tiên danh sách chương dạng hàng để đọc được thứ tự, thời lượng và tiến độ thực, không dùng số liệu trang trí.

## Bàn giao 1.0.0
- 56 tệp và 2.086 trang hoặc ảnh đã qua pipeline. Xem BAO-PHU.md để biết tệp còn chờ biên tập và số câu theo chương. Việc hiệu đính các bộ 117 trang và phần lớn đề scan còn mở. Đã phát hiện bản sao hình render 2024.1.
- Ứng dụng dùng dạng một/nhiều đáp án và tự luận, đề ghép và hai bộ đủ điều kiện làm nguyên đề, lịch sử, hiệu đính cá nhân và sao lưu gộp. Đề ghép dùng thang luyện tập. Chưa xác nhận phiên bản Java chính thức. Chưa mã hóa barem gốc thành điểm tự luận.
- Đã chạy Chrome trên macOS arm64 với Node 24 từ ZIP giải nén vào đường dẫn Unicode có dấu cách. Các luồng chính có kiểm thử Playwright, chặn HTTP(S) ngoài loopback. Windows và Linux có launcher, còn chờ chạy trực tiếp.
- Đầu vào biên tập nằm trong data/. Nguồn minh chứng biên dịch Java nằm ở verification/hust-java.json và data/mcq-java.json. Checkpoint của 2.086 trang nằm ở .cache/pages-v2; xem lại trang lỗi/ít chữ và đối chiếu scan từ thư viện.
- Tiếp tục theo BAO-PHU.md. Ưu tiên đối chiếu câu HUST cuối kỳ còn thiếu, sau đó mở rộng các chương ít câu. Mỗi câu có trạng thái bản chép và đáp án riêng.
