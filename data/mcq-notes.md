# Trắc nghiệm có bảng đáp án trong ba tài liệu

Đã nhập đủ số thứ tự câu xuất hiện trong ba bộ dưới đây. Trường học của bộ INT1332 chưa được khẳng định từ tiêu đề. Hai bản IT3100 ghi *giữa kỳ*, kỳ 20251 và thời lượng 60 phút ngay trên đề. Mã 2 và 6 nằm trong hình bên phải đầu trang đầu. Đây là tài liệu có khóa kèm theo, chưa có chứng cứ xác nhận đây là đáp án chính thức của giảng viên.

| Bộ tài liệu | Trang | Vị trí câu | Có căn cứ chấm | Chờ phân xử | Mâu thuẫn |
|---|---:|---:|---:|---:|---:|
| INT1332, bộ 100 câu | 21 | 100 | 87 | 10 | 3 |
| IT3100 13/01, mã 2 | 8 | 40 | 33 | 4 | 3 |
| IT3100 14/01, mã 6 | 7 | 40 | 31 | 8 | 1 |

Bốn cặp có cả đề bài lẫn phương án tương đương và khóa nhất quán. Mỗi cặp giữ hai nguồn, số câu và bản trích ban đầu tương ứng. Kết quả cho ba tài liệu là **176 câu**, gồm 148 câu có căn cứ chấm, 21 câu chờ phân xử, 7 câu mâu thuẫn. Trong 21 câu chờ, câu 1 mã 2 còn nghi vấn về ký tự thụt lề. Hai ô khóa trống được giữ dưới dạng null. Đối với câu 30 mã 2, đã giải độc lập và đối chiếu kết quả bằng JDK.

## Các bước đối chiếu

1. Dùng PyMuPDF trong `.venv`, kiểm tra SHA-256 từng tài liệu trước khi gắn bản hiệu đính. Đọc thứ tự khối bản gốc và các dòng chữ theo tọa độ trang. So sánh toàn bộ ký tự ngoài khoảng trắng. Kiểm tra số câu tăng liên tục và nhãn phương án không đứt đoạn. Bản gốc của câu nằm trong `raw`, bản trình bày nằm ở `stem` và `options`.
2. Render các trang, đối chiếu trực quan bảng khóa, mã đề, ví dụ code, nhãn phương án, đoạn mã sang trang, và một số biểu thức ảnh hưởng đến đáp án. Hai bảng hai cột của câu 5 và 23 mã 2 bị đọc lệch thứ tự khi nối trang. Phần trình bày nối lại đoạn mã bên trái trước các phương án bên phải. Không tự thay các toán tử sai hoặc khóa có vấn đề.
3. Phân tích từng phương án bằng lời giải biên soạn. Các ví dụ gồm INT1332 câu 19 về protected, câu 65 liên quan phiên bản Java, câu 86 phụ thuộc vùng cache số nguyên. Bản 14/01 câu 29 in phép cộng hai boolean. Bản 13/01 câu 23 phụ thuộc cờ assertion. Các lý do, ảnh hưởng đến việc chấm và dẫn nguồn nằm ở từng câu. Chương 0 dành cho nội dung chưa thấy trong phạm vi bài giảng như I/O chi tiết hoặc phối hợp luồng.
4. Đã chạy 48 phép thử trên 45 câu bằng `javac 17.0.11` và Java 17, gồm mã có chủ định lỗi biên dịch, lỗi runtime, thay đổi cấu hình cache và bật assertion. Bộ mã cố định ở `tools/mcq/java-cases.json`. Mỗi mẫu có lớp, mã, cờ JVM và điều kiện bao đoạn lệnh. Mỗi tiến trình chạy trong thư mục tạm, giới hạn 7 giây. Chương trình tham chiếu không dùng file, mạng, tiến trình con hoặc API hệ thống. Xem kết quả thực tế trong `data/mcq-java.json`. Phiên bản kiểm thử không xác lập phiên bản chấm thi của học phần.

Tạo lại `data/mcq.json` bằng `.venv/bin/python tools/mcq/extract.py`. Các dòng biên tập trong `tools/mcq/*.txt` lưu chương, chủ đề, nhận định, trạng thái và phân tích mỗi phương án. Muốn chạy lại bằng JDK 17 trên macOS, dùng:

```sh
.venv/bin/python tools/mcq/check_java.py --jdk "$(/usr/libexec/java_home -v 17)"
.venv/bin/python tools/mcq/extract.py
```

Chỉ thêm mẫu Java vào tập cố định sau khi đọc toàn bộ mã, đối chiếu ảnh trang và xem xét hành vi. Công cụ kiểm thử kiểm tra dấu vân tay bộ mẫu trước khi biên dịch. Giữ nguyên đáp án nguồn khi cập nhật phân tích. Tiếp tục xét các câu cần kiểm tra bằng nguồn bổ sung hoặc hướng dẫn học phần.
