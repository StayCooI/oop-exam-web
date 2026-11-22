# Vở OOP · Ôn thi Java
Ứng dụng web tĩnh React, TypeScript và Vite. Ngân hàng câu hỏi dùng tài liệu trong Materials. Người học dùng bản build qua Node trên localhost và lưu tiến độ cá nhân vào IndexedDB.

## Phát triển
Dùng Node.js 24 LTS và Python trong `.venv`. Xem [MOI-TRUONG.md](MOI-TRUONG.md) để khôi phục Python, PyMuPDF và mô hình OCR tiếng Việt/Anh.

```sh
npm ci
.venv/bin/python tools/ingest.py
.venv/bin/python tools/build_bank.py
npm run dev
```

Trích xuất tạo checkpoint trong `.cache/pages-v2` theo SHA-256 và số trang. Khi thêm hoặc thay PDF, chạy lại hai lệnh Python. Công cụ lấy PDF hoặc ảnh theo đúng cây thư mục thực tế. Nội dung cũ trùng hash được tái sử dụng. Kiểm tra [BAO-PHU.md](BAO-PHU.md), ghi nhận trang thiếu và đối chiếu ảnh gốc trước khi biên tập. Tên NFC được dùng trong dữ liệu và ZIP. Tên tệp gốc trên máy được giữ.

## Hiệu đính và phát hành ngân hàng
Các tệp câu trong `data/` chứa nội dung biên tập, ID, nguồn, khóa đáp án, lý giải và bằng chứng. `data/source-metadata.json` chỉ ghi năm, kỳ, trường hay mã đề có căn cứ. Giữ câu mờ ở trạng thái `review` và khóa mâu thuẫn ở `conflict`. Điều kiện chấm tự động là `checked` và `supported`, kèm phương án, đáp án và bằng chứng.

1. Người học mở **Đối chiếu**, ghi nội dung đề xuất, số trang và căn cứ rồi lưu.
2. Người học xuất JSON từ **Sao lưu**. Người biên tập đọc các bản ghi `type: "edit"`, mở đúng trang nguồn và kiểm tra từng thay đổi. Bản ghi sửa trên trình duyệt là dữ liệu đề xuất.
3. Với chỉnh sửa được duyệt, sửa bản ghi trong tệp nguồn của câu và giữ ID. Lưu bản trước cùng căn cứ duyệt trong nhật ký hiệu đính. Với trang chưa tạo câu, thêm ID mới vào tệp biên tập phù hợp. Cập nhật trạng thái bản chép và đáp án độc lập.
4. Chạy lại `tools/build_bank.py` và kiểm tra báo cáo. Chỉ thêm danh sách câu đã kiểm tra đủ vào `data/complete.json`. Khi thay đổi nội dung ngân hàng, tăng phiên bản trong `tools/build_bank.py`. Lịch sử vẫn giữ ID và phiên bản của từng lượt. Phiên cũ chưa hoàn tất được giữ để sao lưu.
5. Chạy các lệnh kiểm tra và đóng gói bên dưới. Danh sách nguồn, hash và phiên bản nằm trong ZIP. Xem [hướng dẫn người nhận](distribution/HUONG-DAN.md).

```sh
npm test
npm run build
npm run package
```

## Kiểm thử phát hành
Giải nén ZIP vào thư mục mới có dấu tiếng Việt và khoảng trắng. Chạy `node server.mjs` trong đó. Trên máy phát triển, mở Chrome bằng skill Playwright tại http://127.0.0.1:47831. Tệp `tests/browser.cjs` thử các luồng học, sao lưu, PDF và chặn truy cập ngoài localhost. Dùng một phiên trình duyệt thử riêng.

```sh
mkdir -p output/playwright
cd output/playwright
pw="$HOME/.codex/skills/playwright/scripts/playwright_cli.sh"
"$pw" -s=oop-qa open http://127.0.0.1:47831 --browser=chrome
"$pw" -s=oop-qa run-code --filename=../../tests/browser.cjs
"$pw" -s=oop-qa close
```

Trên Windows và Linux, thử launcher gốc, rồi thử lại lệnh Terminal với Node LTS. Kiểm tra PDF tiếng Việt, tải lại phiên, xuất/nhập JSON, mở lại lần hai khi cùng ứng dụng đang chạy và trường hợp cổng bị chương trình khác dùng. Có thể ngắt mạng để xác nhận chạy offline. Xem [TIEN-DO.md](TIEN-DO.md) để biết các môi trường đã kiểm thử thực tế và phần dữ liệu còn chờ biên tập.
