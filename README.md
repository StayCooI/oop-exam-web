# Vở OOP — web ôn thi Java

Ứng dụng ôn thi OOP bằng tiếng Việt, chạy trên máy cá nhân. Hỗ trợ trắc nghiệm một/nhiều đáp án, tự luận, thi thử, thư viện đề và tiến độ riêng theo trình duyệt. Không cần tài khoản hay backend.

Repository hiện để **private**. Mời bạn bè làm collaborator để họ có thể clone, chạy và gửi thay đổi bằng Pull Request. Repository gồm mã nguồn, ngân hàng đã biên tập và tài liệu PDF gốc trong `Materials/` (bản clone khoảng 400 MB). ZIP phát hành, build, cache, `node_modules` và môi trường Python không lưu trong Git.

## Chạy thử hoặc phát triển

Cài Node.js **24 LTS** trên Windows, macOS hoặc Linux. Sau đó clone repository và cài dependency một lần:

```sh
git clone https://github.com/StayCooI/oop-exam-web.git
cd oop-exam-web
npm ci
npm run dev
```

Mở **http://127.0.0.1:47831**. Máy chủ chỉ lắng nghe trên máy cục bộ. Dừng bằng `Ctrl+C`. Dev server dùng cổng cố định và từ chối tự đổi cổng; nếu đang chạy bản phát hành ở cổng này, hãy dừng một bản trước khi chạy bản kia.

Lệnh trên giống nhau trong PowerShell/Command Prompt, Terminal macOS và shell Linux. Node/npm chỉ cần cài toàn hệ thống một lần; dependency của ứng dụng được cài riêng trong `node_modules/` và không được commit.

Để kiểm tra thay đổi:

```sh
npm test
npm run build
```

## Chạy bản phát hành

Bản ZIP có sẵn sau khi tạo được hướng dẫn tại [distribution/HUONG-DAN.md](distribution/HUONG-DAN.md), gồm launcher Windows và macOS/Linux. Bản ZIP yêu cầu Node.js 22 trở lên; khi chạy từ mã nguồn nên dùng Node 24 LTS. Người học không cần Python, OCR hay JDK.

Tạo ZIP đa nền tảng từ source:

```sh
npm run build
npm run package
```

Lệnh đóng gói dùng Python 3 hệ thống hoặc `.venv` nếu có. Nó chỉ cần thư viện chuẩn Python; không cần cài OCR/PDF packages để tạo ZIP. Trên macOS/Linux, nếu muốn xử lý PDF/OCR, xem [MOI-TRUONG.md](MOI-TRUONG.md) và `requirements.txt`; bước này không cần cho việc chạy web hoặc sửa frontend.

## Dữ liệu và tiến độ

- Câu hỏi và metadata biên tập nằm trong `data/`; `public/data/` là ngân hàng đã dựng để ứng dụng chạy.
- PDF/ảnh nguồn nằm trong `Materials/`. Không đổi hoặc xóa tài liệu gốc khi cập nhật câu hỏi.
- Quy tắc nguồn, hiệu đính, kiểm chứng và chất lượng dữ liệu xem trong [AGENTS.md](AGENTS.md), [BAO-PHU.md](BAO-PHU.md) và [TIEN-DO.md](TIEN-DO.md).
- Tiến độ học lưu trong IndexedDB theo trình duyệt, profile và origin. Dùng cùng `http://127.0.0.1:47831` để tiếp tục cùng kho tiến độ; đổi cổng/trình duyệt có thể tạo kho riêng. Sao lưu/khôi phục trong ứng dụng trước khi chuyển máy.
- Tạo ngân hàng hoặc phát hành phiên bản mới cần xem [quy trình hiệu đính và phát hành bên dưới](#xử-lý-tài-liệu-và-hiệu-đính-ngân-hàng).

## Xử lý tài liệu và hiệu đính ngân hàng

PDF gốc và checkpoint không được sửa trực tiếp. Ưu tiên lớp chữ; OCR chỉ dùng cho trang scan/chữ lỗi. Câu hỏi chỉ lấy từ đề đã cung cấp. Giữ riêng đáp án nguồn, lời giải biên soạn, trạng thái bản chép và trạng thái kiểm chứng. Xem chi tiết trong `AGENTS.md` và `MOI-TRUONG.md`.

Tạo môi trường Python riêng khi cần chạy pipeline:

**macOS / Linux**

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python tools/ingest.py
.venv/bin/python tools/build_bank.py
```

**Windows PowerShell**

```powershell
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe tools/ingest.py
.venv\Scripts\python.exe tools/build_bank.py
```

Đọc [BAO-PHU.md](BAO-PHU.md), xem ảnh trang nguồn và chỉ đưa câu đủ bằng chứng vào trạng thái có thể chấm. Chỉnh sửa trên web là đề xuất cá nhân; xuất bản sao hiệu đính, đối chiếu tài liệu gốc, rồi mới cập nhật tệp trong `data/`. Không đưa dữ liệu tiến độ người học vào Git.

## Cộng tác qua GitHub

Repository private nên chủ sở hữu mời bạn bè trong GitHub: **Settings → Collaborators → Add people**. Người được mời cần chấp nhận invitation trước khi clone. Không đổi repository sang public để chia sẻ.

Mỗi người tạo branch riêng rồi mở Pull Request:

```sh
git switch -c ten-thay-doi
# sửa mã hoặc dữ liệu đã được đối chiếu
npm test
npm run build
git add README.md src data
git commit -m "Mo ta thay doi"
git push -u origin ten-thay-doi
```

Tạo Pull Request trên GitHub để cùng review trước khi gộp vào `main`. Với thay đổi câu hỏi, giữ ID ổn định và kèm tài liệu/trang nguồn; không gộp chỉnh sửa chưa kiểm chứng.

## Tài liệu liên quan

- [Hướng dẫn người nhận bản ZIP](distribution/HUONG-DAN.md)
- [Môi trường Python/PDF/OCR/JDK](MOI-TRUONG.md)
- [Tiến độ và giới hạn dữ liệu hiện tại](TIEN-DO.md)
- [Độ bao phủ nguồn và câu hỏi](BAO-PHU.md)
