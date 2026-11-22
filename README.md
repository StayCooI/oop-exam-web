# Vở OOP — hướng dẫn sử dụng

Ứng dụng ôn thi OOP Java bằng tiếng Việt, chạy cục bộ trên máy của bạn. Có trắc nghiệm, tự luận, thi thử, thư viện đề và lưu tiến độ riêng. Không cần tài khoản.

## Tải ứng dụng

[Tải Vở OOP mới nhất (ZIP)](https://github.com/StayCooI/oop-exam-web/releases/latest)

Cần cài Node.js 22 trở lên. Khuyến nghị Node.js 24 LTS từ [trang tải chính thức](https://nodejs.org/). Cài Node.js một lần; không cần cài npm packages, Python, OCR hay JDK.

## Mở ứng dụng

1. Giải nén toàn bộ ZIP vào một thư mục trên máy.
2. Chạy launcher tương ứng:
   - **Windows:** mở `Khoi-dong.cmd`.
   - **macOS:** mở `Khoi-dong.command`.
   - **Linux:** mở Terminal trong thư mục vừa giải nén và chạy `sh ./Khoi-dong.command`.
3. Trình duyệt sẽ mở tại **http://127.0.0.1:47831**. Nếu chưa mở, dán địa chỉ đó vào trình duyệt.
4. Giữ cửa sổ launcher đang chạy khi học. Đóng cửa sổ hoặc nhấn `Ctrl+C` trong Terminal để tắt ứng dụng.

Ứng dụng dùng tài nguyên trong ZIP và có thể học offline sau khi giải nén. Không mở `index.html` trực tiếp bằng `file://`.

## Tiến độ và sao lưu

Tiến độ lưu trên máy theo trình duyệt, profile và địa chỉ ứng dụng. Dùng cùng trình duyệt và `http://127.0.0.1:47831` để tiếp tục học. Đổi trình duyệt, profile hoặc cổng có thể làm kho tiến độ khác đi.

Trước khi đổi máy hoặc cập nhật phiên bản, vào **Sao lưu** trong ứng dụng và tải bản sao JSON. Đóng ứng dụng, giải nén ZIP mới rồi chạy launcher như cũ. Nếu cần, mở **Sao lưu** và nhập tệp JSON để khôi phục tiến độ.

## Nếu không mở được

- Kiểm tra Node.js đã cài bằng `node --version`; nếu vừa cài, đóng và mở lại launcher.
- Nếu báo cổng `47831` đang được sử dụng, đóng phiên bản Vở OOP đang chạy rồi thử lại.
- Đảm bảo mở ứng dụng qua `http://127.0.0.1:47831`, không mở tệp HTML trực tiếp.
