"""First visually checked questions from the TNoOOP1 compilation."""
import json,re
from pathlib import Path
import pymupdf
from ingest import ROOT

selected=[
(1,2,6,1,'B','Quan hệ has-a',['Sai. Kế thừa mô tả quan hệ is-a.','Đúng. Quan hệ has-a nói về đối tượng giữ hoặc dùng đối tượng khác.']),
(2,2,8,0,'A','Kiểu tham chiếu',['Đúng. Một tham chiếu kiểu cha có thể trỏ tới đối tượng thuộc kiểu con.','Sai. Kiểu động được phép là một kiểu con tương thích.']),
(3,3,6,0,'True','Kết tập',['Đúng. Kết tập là quan hệ liên kết toàn thể và bộ phận.','Sai. Kết tập là một dạng cụ thể của liên kết.']),
(4,3,7,1,'B','Interface',['Sai. Interface có thể khai báo thành viên là lớp.','Đúng. Lớp lồng trong interface ngầm định public và static.']),
(5,3,5,2,'C','Nạp chồng',['Thời gian chạy dùng cho chọn hiện thực ghi đè.','Liên kết động mô tả việc chọn hiện thực lúc chạy.','Đúng. Trình biên dịch phân giải overload từ chữ ký và kiểu đối số.','Late binding thuộc cơ chế chọn phương thức tại thời gian chạy.']),
(6,3,8,0,'A','Đa hình',['Nạp chồng là ví dụ đa hình ad hoc.','Ghi đè thực hiện đa hình kiểu con.','Đa hình phân lớp là đa hình kiểu con.','Liên kết động là cơ chế chọn hiện thực phương thức phụ thuộc kiểu động.']),
(7,3,7,1,'B','Ghi đè',['Sai. Có thể khai báo hiện thực ghi đè nếu phương thức đủ điều kiện.','Đúng. Lớp con có thể ghi đè phương thức thực thể kế thừa được phép ghi đè.'])
]
path=next((ROOT/'Materials').rglob('TNoOOP1.pdf'))
with pymupdf.open(path) as pdf:
 for i,page,chapter,key,source,topic,analysis in selected:
  text=pdf[page-1].get_text()
  raw=re.search(rf'Câu {i}\s*:?\s+(.+?)\nAns:',text,re.S)[1]
  fields=re.split(r'(?m)^\s*[A-D]\.\s+',raw)
  stem=' '.join(fields.pop(0).split())
  options=[' '.join(x.split()) for x in fields]
  assert len(options)==len(analysis),(i,options)
  path_out=ROOT/'data/additional.json'
  combined=json.loads(path_out.read_text())
  record=dict(id=f'tno1-{i}',kind='single',stem=stem,options=options,correct=[key],chapter=chapter,topics=[topic],sources=[dict(file=path.name,n=page,number=str(i),printed=str(page-1))],transcript='checked',answerStatus='supported',sourceAnswer=source,explanation=analysis[key],analysis=analysis,evidence=[f'Ảnh trang PDF {page} đối chiếu với lớp chữ và đáp án Ans.',f'Bài {chapter:02d}, phần {topic}.'],issues=[],raw=raw)
  combined=[q for q in combined if q['id']!=record['id']]+[record]
  path_out.write_text(json.dumps(combined,ensure_ascii=False,indent=2)+'\n')
