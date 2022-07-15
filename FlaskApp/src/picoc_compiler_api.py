import os
from random import choices
import asyncio
from tabulate import tabulate
from string import ascii_letters

class CompiledCode:
  def __init__(self):
    self.reti_code = None
    self.symbol_table = None
    self.symbol_table_pretty = None
    self.warnings_and_errors = None

def read_reti_code(file_name: str) -> str:
  file_name_with_ending = f"{file_name}.reti"
  if not os.path.exists(file_name_with_ending):
    return None
  lines = None
  with open(file_name_with_ending, "r") as f:
    lines = f.readlines()
  for i in range(len(lines)):
    # remove ; from reti code
    lines[i] = lines[i].replace(";", "")
    # make comments start with ;
    lines[i] = lines[i].replace("#", ";")
  return "".join(lines)

def read_symbol_table(file_name: str) -> str:
  file_name_with_ending = f"{file_name}.csv"
  if not os.path.exists(file_name_with_ending):
    return None
  lines = None
  with open(file_name_with_ending, "r") as f:
    lines = f.readlines()
  return "".join(lines)

def read_warnings_and_errors(stdout: str) -> str:
  return None if stdout.startswith("Compilation successfull") else stdout

async def _start_sub_process(file_name: str, picoc_code: str) -> str:
  # write pico c file
  with open(f"{file_name}.picoc", "w") as f:
    f.write(picoc_code)
  command = f"picoc_compiler -v -s {file_name}.picoc"
  proc = await asyncio.create_subprocess_shell(command, stdout=asyncio.subprocess.PIPE)

  # return stdout
  return await proc.communicate()

def delete_temp_files(file_name: str):
  try:
    os.remove(file_name + ".picoc")
    os.remove(file_name + ".reti")
    os.remove(file_name + ".csv")
  except FileNotFoundError:
    return

async def compile_picoc(picoc_code: str):
  # get random file name in /tmp/
  file_name = "/tmp/" + "".join(choices(ascii_letters, k=7))
  stdout = await _start_sub_process(file_name,  picoc_code)
  stdout = "".join("" if s is None else s.decode() for s in stdout)

  result = CompiledCode()
  result.reti_code = read_reti_code(file_name)
  result.symbol_table = read_symbol_table(file_name)
  result.symbol_table_pretty = get_symbol_table_pretty(result.symbol_table)
  result.warnings_and_errors = read_warnings_and_errors(stdout)

  delete_temp_files(file_name)
  return result

def get_symbol_table_pretty(symbol_table: str):
  if symbol_table is None:
    return None
  lines = symbol_table.split("\n")
  header = lines[0].split(",")
  return tabulate((line.split(",") for line in lines[1:-1]), headers=header)