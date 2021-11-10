import os
list_of_files = []
for a, b, files in os.walk('./src/web-redesign/codemirror/theme'):
    for file in files:
      list_of_files.append(file)

for f in list_of_files:
    if ".css" in f:
        print(f"<option>{f.split('.')[0].lower()}</option>")