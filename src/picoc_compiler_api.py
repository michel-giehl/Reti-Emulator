import subprocess
from string import ascii_letters
from random import choices
import os


def read_reti_code(file_name: str) -> str:
  if not os.path.exists(file_name):
    return ""
  lines = None
  with open(file_name, "r") as f:
    lines = f.readlines()
  return "".join(map(lambda l: l[:-1] if l[-1] == ";" else l, lines[:-1])).replace("#", ";")

def read_symbol_table(file_name: str) -> str:
  if not os.path.exists(file_name):
    return ""
  lines = None
  with open(file_name, "r") as f:
    lines = f.readlines()
  return "".join(lines)

def _start_sub_process(picoc_code: str) -> str:
  # get random file name in /tmp/
  file_name = "".join(["/tmp/"] + choices(ascii_letters, k=7))
  with open(file_name, "w") as f:
    f.write(picoc_code)
  command = f"python /home/michel/Projects/picoc/src/main.py -v -s {file_name}"
  output = subprocess.run(command.split(" "), capture_output=True).stdout.decode()
  warnings_and_errors = "" if output.startswith("Compilation successfull") else output
  print("Warnings and errors:", warnings_and_errors)
  result = {
    "reti_code": read_reti_code(f"{file_name}.reti"),
    "warnings_and_errors": warnings_and_errors,
    "symbol_table": read_symbol_table(f"{file_name}.csv")
  }
  try:
    # delete temp files
    os.remove(file_name)
    os.remove(file_name + ".reti")
    os.remove(file_name + ".csv")
  except FileNotFoundError:
    pass
  return result

"""
def parse_reti_code(output: str):
  # split in lines and remove empty lines
  lines = list(
    filter(
      lambda x: len(x) > 0,
      output.split("\n")
    )
  )
  compile_successful = lines[-1] == "Compilation successfull"
  has_warning = not lines[0].startswith("# File '")
  warnings = []
  # check if warnings exist, remove them if they do.
  if has_warning:
    for i in range(len(lines)):
      if lines[i].startswith("# File '"):
        warnings = lines[:i]
        lines = lines[i:]
        break
  if compile_successful:
    # remove semicolons, join reti code back together and fix comments
    reti_code = ""
    warnings_str = "\n".join(warnings)
    return {
      "reti_code": reti_code,
      "warnings": warnings_str,
    }
  else:
    return {
      "errors": "\n".join(lines[:-1])
    }
"""

def compile_picoc(picoc_code: str):
  return _start_sub_process(picoc_code)

def main():
    test_str = """void main() {
    // Deklarationsteil
    int x;
    int y;
    int z;
    // Anweisungsteil
    while (1) {
        x = 0;
        y = 1;
        while (x < 255) {
            z = x + y;
            x = y;
            y = z;
        };
    }
}"""
    print(compile_picoc(test_str))


if __name__ == "__main__":
    main()