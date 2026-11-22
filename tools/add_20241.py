"""Reviewed questions from five manually inspected pages in the 2024.1 compilation."""
import json,re,unicodedata
from pathlib import Path
import pymupdf
from ingest import ROOT

rows={
6:(6,7,[0,1,3],'1, 2, 4','review',8,'Lớp trừu tượng',['Không new trực tiếp được.','Mô tả công dụng thông thường.','Có thể khai báo abstract dù không có phương thức abstract.','Mơ hồ: có thể bỏ khai báo tường minh, nhưng Java vẫn tạo constructor mặc định.']),
7:(6,4,[0,1,2,3],'1, 2, 3, 4','supported',8,'Constructor',['Constructor có thể public.','Bỏ modifier để dùng truy cập trong gói.','Constructor có thể protected.','Constructor có thể private.']),
15:(14,2,[6],'7','supported',10,'Mảng',['Hợp lệ, dấu [] sau tên biến được phép.','Hợp lệ, 2*3 là biểu thức kích thước nguyên.','Hợp lệ, initializer khớp kiểu int[].','Hợp lệ, new int[] đi với initializer.','Hợp lệ, initializer lồng nhau.','Hợp lệ, cả hai [] được đặt sau tên biến.','Đúng vì cả sáu khai báo hợp lệ.']),
16:(14,7,[0,1,2],'1, 2, 3, 4','conflict',8,'Ghi đè',['Cùng chữ ký là dạng ghi đè thông thường; đặc tả dùng điều kiện subsignature.','Có thể trả về kiểu tham chiếu con tương thích.','Phương thức ghi đè không được giới hạn quyền truy cập hơn.','Quy tắc về throws áp dụng với checked exception; unchecked exception là phản ví dụ cho phát biểu tổng quát.']),
23:(20,3,[1,3,5,6],'1, 2, 3, 4, 6, 7','review',8,'Package',['Thư mục tương ứng là cách lưu tệp phổ biến, tùy hệ thống lưu trữ.','Tên package chữ thường là quy ước.','Dấu chấm tổ chức các tên nhưng không cho package con đặc quyền truy cập.','Quyền truy cập trong package phụ thuộc khai báo.','Đây là nguyên tắc tổ chức, không phải cú pháp bắt buộc.','Tên đầy đủ được phân biệt theo package.','Tên package giúp tổ chức và tìm lớp.']),
24:(20,7,[2],'3','supported',9,'Giao diện',['intf là định danh thường.','Intf là định danh thường.','interface là từ khóa Java.','Java phân biệt hoa thường, Interface không phải từ khóa.']),
}
file='OOP - cuối kì 20241.pdf'
path=next(p for p in (ROOT/'Materials').rglob('*.pdf') if unicodedata.normalize('NFC',p.name)==file)
bank=[]
with pymupdf.open(path) as pdf:
 for number,(page,chapter,correct,key,status,jls,topic,analysis) in rows.items():
  text=pdf[page-1].get_text()
  raw=re.search(rf'Câu {number}:\s*(.*?)Giải thích:',text,re.S)[1]
  options=re.split(r'(?m)^\d+\.\s+',raw)
  stem=' '.join(options.pop(0).split())
  options=[' '.join(x.split()) for x in options]
  assert len(options)==len(analysis)
  ref=f'https://docs.oracle.com/javase/specs/jls/se25/html/jls-{jls}.html'
  bank.append(dict(id=f'hust-20241-{number}',kind='single' if len(correct)==1 else 'multi',stem=stem,options=options,correct=correct,chapter=chapter,topics=[topic],
   sources=[dict(file=file,n=page,number=str(number),term='2024.1')],transcript='checked',answerStatus=status,sourceAnswer='Tô đỏ trong tài liệu ôn tập: '+key,
   explanation=' '.join(analysis[i] for i in correct),analysis=analysis,evidence=[f'Đối chiếu ảnh trang PDF {page} và các lựa chọn tô đỏ.',f'Java SE 25 Language Specification, chương {jls}: {ref}'],issues=[] if status=='supported' else ['Cách diễn đạt hoặc đáp án tô đỏ cần kiểm tra trước khi dùng để chấm.'],raw=raw))
(ROOT/'data/additional.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n')
