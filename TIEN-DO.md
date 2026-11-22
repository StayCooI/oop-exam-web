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

## Bàn giao giao diện 1.1.0
- Làm mới giao diện với nền sáng trung tính, nhấn indigo, sidebar 250px, dashboard gọn và vùng đọc câu hỏi tối đa 1.000px; điện thoại thu gọn menu. Phiên học có nút chế độ tập trung và bộ điều chỉnh cỡ chữ 17–20px, lưu riêng trong localStorage.
- Đóng gói Be Vietnam Pro 400/500/600/700 đủ tập ký tự tiếng Việt và JetBrains Mono local; đã thay IBM Plex Mono. Câu văn dùng Be Vietnam Pro 18px/400/1.7, đoạn có cú pháp Java rõ được trình bày JetBrains Mono; vùng code tự luận 16px/1.6, giữ khoảng trắng và cuộn ngang.
- Không sửa ngân hàng câu hỏi, đáp án, ID, nguồn, cơ chế chấm điểm hoặc schema IndexedDB. Giữ cùng origin `http://127.0.0.1:47831`. Thiết lập cỡ chữ dùng localStorage riêng.
- Đã chạy `npm test` (3/3), `npm run build`, đóng gói và giải nén ZIP 1.1.0, kiểm tra hash nguồn và tính toàn vẹn ZIP. Playwright trên Chrome macOS: computed style câu hỏi Be Vietnam Pro 18px/400/30.6px, font face tải local, không tràn ngang 1366px và 390px; trắc nghiệm chấm đúng sau submit và reload; nháp tự luận được khôi phục sau reload; menu chế độ tập trung hoạt động. Đã lưu ảnh ở `output/playwright/`.
- Chỉ xác minh trình duyệt Chrome trên macOS; Windows và Linux chưa chạy trực tiếp. Các warning build `use client` của lucide-react đã có trước thay đổi và không làm hỏng bundle.

## Bàn giao phản hồi đáp án 1.2.0
- Tái hiện các vấn đề ở renderer câu hỏi: phương án đã nộp vẫn xanh dương như trạng thái chọn; đáp án đúng bị bỏ sót chưa được đánh dấu; trạng thái sai thiếu nhãn; tên PDF dài lấn vào vùng đọc. Áp dụng trạng thái màu xanh dương cho lựa chọn chưa nộp, xanh lá cho đáp án đúng và đỏ cho lựa chọn sai sau khi lộ đáp án; luôn kèm ký hiệu và chữ. Trắc nghiệm nhiều đáp án chỉ báo “Chính xác!” khi tập lựa chọn khớp hoàn toàn; trạng thái mỗi phương án lấy từ `q.correct`.
- Rút gọn nhãn nguồn hiển thị, vẫn mở đúng PDF/trang và giữ tên tệp cùng metadata đầy đủ trong accessible name/tooltip. Focus bàn phím dùng viền xanh riêng, không nhầm với trạng thái chấm.
- Đã xác minh trên Chrome/macOS từ ZIP giải nén cùng origin/cổng: câu đơn đúng và sai, câu nhiều đáp án đúng đủ và chọn thừa/thiếu, bàn phím Space, chuyển câu rồi quay lại, tải lại giữ câu trả lời, lưu/khôi phục nháp tự luận, chế độ tập trung, các trang tổng quan/luyện/thi thử/ôn tập/thư viện/sao lưu; desktop 1366×768 và điện thoại 390×844 sáng/tối không tràn ngang. Ngân hàng/ID/đáp án/schema lưu không đổi.
- `npm test` 3/3, `npm run build`, `npm run package`; ZIP 1.2.0 có 108 mục và `testzip()` không báo lỗi. Ảnh Playwright nằm trong `output/playwright/`. Chỉ Chrome/macOS được chạy trực tiếp.
