# Môi trường local cho web ôn thi OOP Java

Đã kiểm tra trên macOS 26.0.1 (25A362), Apple Silicon `arm64`, shell `/bin/zsh` ngày 22/11/2026. Có thể bắt đầu xây web và xử lý đề. Phiên bản Java dùng để chấm thi vẫn cần xác nhận với học phần.

## Node và kiểm thử giao diện

Máy dùng Node.js **24.22.3 LTS** (Krypton, bản chính thức cho Darwin arm64), npm và npx **11.19.1**. Nhánh 24 đáp ứng yêu cầu Node của Vite 8 và Playwright CLI. Dự án chưa chọn framework. [Lịch phát hành Node.js](https://nodejs.org/en/about/previous-releases) · [Yêu cầu của Vite](https://vite.dev/guide/)

Trước khi cài, cả hai shell và các vị trí Homebrew, Conda, trình quản lý phiên bản Node đã kiểm tra đều thiếu bộ Node/npm/npx. Bản Node hiện nằm ở `~/.local/opt/node-v24.22.3-darwin-arm64`. Tệp tải về đã được đối chiếu với `SHASUMS256.txt` của Node.js. Một mục trong `~/.zshenv` thêm thư mục `bin` vào PATH khi cần. Đã kiểm tra cả shell Codex và zsh đăng nhập với môi trường ban đầu tối giản. Với cửa sổ Terminal đã mở từ trước khi cài, chạy `source ~/.zshenv` một lần. [Bản phân phối Node đã dùng](https://nodejs.org/dist/v24.22.3/)

```sh
command -v node npm npx
node -p '[process.version, process.arch, process.release.lts]'
npm --version
npx --version
```

Codex đã nhận diện `$frontend-design`, `$pdf` và `$playwright`. Skill thiết kế dùng trực tiếp. Khi gọi `$pdf`, dùng Python trong `.venv` theo ví dụ bên dưới. Skill Playwright dùng script ở `~/.codex/skills/playwright/scripts/playwright_cli.sh` để chạy `@playwright/cli` qua npx. Phiên bản CLI đã kiểm tra là **0.1.25**. Trình duyệt đã dùng là Google Chrome **149.0.7827.197** có sẵn trong Applications.

Để kiểm tra lại, mở hai terminal tại thư mục dự án. Terminal thứ nhất chạy một trang nhỏ trên địa chỉ loopback. Lệnh chỉ phục vụ trang thử và in URL với cổng còn trống.

```sh
node --input-type=module <<'JS'
import http from 'node:http';
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  res.end('<!doctype html><title>Kiểm tra OOP</title><button onclick="document.querySelector(\'output\').textContent=\'Đã nhận đáp án\'">Nộp thử</button><output>Chờ thao tác</output>');
});
server.listen(0, '127.0.0.1', () => console.log('http://127.0.0.1:' + server.address().port));
JS
```

Tại terminal thứ hai, đặt `url` thành địa chỉ vừa in. Chạy `snapshot` để lấy mã nút “Nộp thử”, rồi dùng mã đó trong lệnh `click`. Sau khi bấm, trạng thái phải chuyển từ “Chờ thao tác” sang “Đã nhận đáp án”. Dừng máy chủ thử bằng Ctrl+C.

```sh
pw="$HOME/.codex/skills/playwright/scripts/playwright_cli.sh"
read -r 'url?Dán URL của máy chủ thử rồi nhấn Enter: '
"$pw" -s=oop-check open "$url" --browser=chrome
"$pw" -s=oop-check snapshot
# Ví dụ khi snapshot ghi ref=e2 cho nút Nộp thử
"$pw" -s=oop-check click e2
"$pw" -s=oop-check snapshot
"$pw" -s=oop-check close
```

## Python, PDF và OCR

`.venv` dùng Python **3.14.7 arm64** từ `/opt/miniconda3/bin/python3`. Python mặc định của macOS là 3.9.6. Anaconda cũng có Python 3.12 và PyMuPDF riêng. Các gói dự án nằm trong `.venv` với `include-system-site-packages = false`.

Dependency Python duy nhất là `pymupdf-lite`, import bằng `pymupdf`. MuPDF trích lớp văn bản và render trang. Tesseract tích hợp trong wheel thực hiện OCR với hai tệp dữ liệu ngôn ngữ `vie` và `eng` ở `.venv/share/tessdata/`. Đường dẫn dữ liệu được truyền khi gọi OCR. Pipeline này chạy không cần Poppler, Tesseract CLI, ReportLab hay OCRmyPDF. [Tích hợp Tesseract của PyMuPDF](https://pymupdf.readthedocs.io/en/latest/installation.html#enabling-integrated-ocr-support)

**Khôi phục môi trường** từ thư mục gốc dự án nếu cần tạo lại `.venv` trên máy này. Hai mô hình lấy từ cùng một commit của kho chính thức. [Dữ liệu Tesseract](https://github.com/tesseract-ocr/tessdata_fast/tree/87416418657359cb625c412a48b6e1d6d41c29bd)

```sh
/opt/miniconda3/bin/python3 -m venv .venv
.venv/bin/python -m pip install --only-binary=:all: -r requirements.txt
.venv/bin/python -m pip check
mkdir -p .venv/share/tessdata
base=https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/87416418657359cb625c412a48b6e1d6d41c29bd
for lang in vie eng; do
  curl -fLsS --retry 2 "$base/$lang.traineddata" -o ".venv/share/tessdata/$lang.traineddata"
done
shasum -a 256 -c <<'SUMS'
79df64caf7bcfb2a27df5042ecb6121e196eada34da774956995747636d5bfa1  .venv/share/tessdata/vie.traineddata
7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2  .venv/share/tessdata/eng.traineddata
SUMS
```

**Chạy lại trên tài liệu thật.** Ví dụ dùng số trang tính từ 1. Nó ghi ảnh và văn bản vào thư mục kết quả dành riêng cho lần kiểm tra.

```sh
.venv/bin/python - <<'PY'
from pathlib import Path
import sys
import pymupdf

out = Path("output/pdf/environment-check")
out.mkdir(parents=True, exist_ok=True)
models = str(Path(sys.prefix) / "share/tessdata")
samples = [
    ("Materials/Slide/Bai 09 - Lap trinh tong quat.pdf", 10, "slide"),
    ("Materials/exams/HUST/OOP - cuối kì 20222.pdf", 2, "scan"),
]
for filename, number, label in samples:
    with pymupdf.open(filename) as doc:
        page = doc[number - 1]
        page.get_pixmap(dpi=180).save(out / f"{label}.png")
        text = page.get_text()
        name = f"{label}-text.txt"
        if not text.strip():
            layer = page.get_textpage_ocr(full=True, language="vie+eng", dpi=300, tessdata=models)
            text = page.get_text(textpage=layer)
            name = f"{label}-ocr.txt"
        (out / name).write_text(text, encoding="utf-8")
PY
```

| Mẫu đã đối chiếu | Kết quả |
|---|---|
| Bài 09, trang 10 | Lớp chữ giữ đúng `new LinkedList<Integer>();` và `myList.add(new String("Hello"));`. Sơ đồ UML bên phải hiện trong ảnh render, không có trong văn bản trích. |
| Đề HUST cuối kì 20222, trang 2 | Trang có một ảnh và lớp chữ rỗng. OCR song ngữ đọc được `Question #12266b` và cụm “Cho chương trình Java”. Trong ảnh, dòng 1 có `public class Test {`, còn OCR trả về `public class test [`. Ở dòng 4, OCR làm mất toán tử chia `/`. |
| Cùng đề, trang 1 | Thử từng mô hình riêng. Mô hình `vie` nhận được “Trong Java không có phương thức hủy”. Mô hình `eng` nhận được “graded, results hidden”. |

Khi đưa câu hỏi vào ngân hàng đề, đối chiếu code và đáp án với ảnh trang, kể cả khi trang có lớp chữ vì code có thể là ảnh nhúng. Riêng trang 2 của `Materials/exams/OtherSchool/ĐềThiUET3.pdf` có cảnh báo thiếu đối tượng trong bảng tham chiếu PDF (`xref`), cần xem lại khi nhập đề này.

## Java và phạm vi kiểm chứng

| Công cụ đã có | Vị trí hoặc cách gọi |
|---|---|
| Oracle JDK 25.0.1 | `java` và `javac` mặc định qua cấu hình zsh hiện có |
| Oracle JDK 17.0.11 và Temurin JDK 17.0.8.1 | `/Library/Java/JavaVirtualMachines/`, xem bằng `/usr/libexec/java_home -V` |
| Homebrew OpenJDK 21.0.12.1 | `/opt/homebrew/opt/openjdk@21/bin/javac`, đã cài ngoài PATH |
| Java 8 Internet Plug-In | Runtime cũ do macOS liệt kê, thư mục này không có `javac` |

Đã biên dịch và chạy một chương trình thử bằng JDK 25 mặc định. Bài 01 trang 45 minh họa cấu hình với JDK 1.6 trên Windows và Java 7 trên Linux. Bài 07 trang 41 phân biệt tính năng interface của Java 8 và 9. Bài 11 trang 10 mô tả việc tách JavaFX khỏi JDK 11. Các slide cho biết phiên bản liên quan đến từng ví dụ. **Chuẩn Java chấm thi chung vẫn chờ đề cương hoặc quy định của giảng viên.** Chưa cài thêm JDK hoặc đổi `JAVA_HOME`.
