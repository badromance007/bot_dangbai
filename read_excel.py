import xlrd 
import json
from glob import glob


def capitilize_word(txt):
    array = txt.split()
    new_array = [word.replace(word[0], word[0].upper(), 1) for word in array]
    return ' '.join(new_array)

file_excel = glob("excels/*.xlsx")[0]

wb = xlrd.open_workbook(file_excel) 
sheet = wb.sheet_by_index(0) 
sheet.cell_value(0, 1) 

data =[]

for i in range(sheet.nrows):
    if i >= 1:
      print(sheet.cell_value(i, 2) + " - " +  sheet.cell_value(i, 5) ) 
      item = {'danhmuc1': sheet.cell_value(i, 1),
              'danhmuc2': sheet.cell_value(i, 2),
              'danhmuc3': sheet.cell_value(i, 3),
              'masp': sheet.cell_value(i, 4),
              'name': capitilize_word(sheet.cell_value(i, 5)),
              'mota': sheet.cell_value(i, 6),
              'giaban': str(int(sheet.cell_value(i, 7))),
              'soluong': str(int(sheet.cell_value(i, 8))),
              'tonganh': sheet.cell_value(i, 9),
              'noidung': sheet.cell_value(i, 10)}
      data.append(item)
with open('data/data.json', 'w', encoding='utf-8') as f:
  json.dump(data, f, ensure_ascii=False, indent=4)
