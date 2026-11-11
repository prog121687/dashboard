"""엑셀의 프로그램별 재원 시트를 읽어 대시보드 데이터만 갱신합니다.
실행: python "데이터 갱신.py"  (openpyxl 필요)
"""
import json
from pathlib import Path
import openpyxl

folder = Path(__file__).resolve().parent
source = folder.parent / '프로그램별_재원.xlsx'
book = openpyxl.load_workbook(source, data_only=True)
sheet = book['프로그램별 재원']
rows = []
for values in sheet.iter_rows(min_row=6, max_col=6, values_only=True):
    if not values[0] or not values[3] or not isinstance(values[4], (int, float)) or not isinstance(values[5], (int, float)):
        continue
    row = dict(zip(['sector', 'account', 'category', 'program', 'y2026', 'y2027'], values))
    row['category'] = row['category'] or row['program']
    rows.append(row)
if not rows:
    raise ValueError('엑셀에서 재원 데이터를 찾을 수 없습니다.')
payload = {'source': source.name, 'unit': '억원', 'rows': rows}
(folder / 'data.js').write_text('window.BUDGET_DATA = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'데이터 갱신 완료: {len(rows)}개 항목. 브라우저에서 새로고침하세요.')
