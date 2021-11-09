import utility as u
from constants import types

class CompilationError(RuntimeError):
    def __init__(self, message):
        self.message = message
        pass
    pass


register_encode = {
    0: "PC",
    1: "IN1",
    2: "IN2",
    3: "ACC",
    4: "SP",
    5: "BAF",
    6: "CS",
    7: "DS"
}

register_decode = u.inverse(register_encode)

# LOAD
# T = Typ (LOAD)
# M = Modus
# S = Addressregister
# D = Destination
# TTMMSSSD DDPPPPPP PPPPPPPP PPPPPPPP
# 00000000 00000000 00000000 00000000
load_type = 0b01 << 30
load_instructions = {
    "LOAD": load_type | 0b0 << 28,
    "LOADIN": load_type | 0b01 << 28,
    "LOADI": load_type | 0b11 << 28
}

# STORE
# T = Typ (LOAD)
# M = Modus
# S = Quellregister
# D = Destination
# TTMMSSSD DDPPPPPP PPPPPPPP PPPPPPPP
# 00000000 00000000 00000000 00000000
store_type = 0b10 << 30
store_instructions = {
    "STORE": store_type | 0b0 << 28,
    "STOREIN": store_type | 0b01 << 28,
    "MOVE": store_type | 0b11 << 28
}

# JUMP
# T = Typ (LOAD)
# C = Condition
# J = Jump, Syscall, RTI
# * = not used
# TTCCCJJ* **PPPPPP PPPPPPPP PPPPPPPP
# 00000000 00000000 00000000 00000000
jump_type = 0b11 << 30
jump_instructions = {
    "NOP": jump_type | 0b000 << 27,
    "JG": jump_type | 0b001 << 27,
    "JE": jump_type | 0b010 << 27,
    "JGE": jump_type | 0b011 << 27,
    "JL": jump_type | 0b100 << 27,
    "JNE": jump_type | 0b101 << 27,
    "JLE": jump_type | 0b110 << 27,
    "JMP": jump_type | 0b111 << 27,
}

# COMPUTE
# T = Typ (LOAD)
# M = Compute Immidiate
# R = Register Only
# F = Function
# D = Destination
# S*= Source (if its register only)
# TTMRFFFD DDSSSPPP PPPPPPPP PPPPPPPP
# 00000000 00000000 00000000 00000000
compute_function_dist = 25
compute_ro_dist = 28
compute_ci_dist = 29
compute_source_dist = 19
compute_dest_dist = 22
compute_instructions = {
    "ADDI": 0 | 1 << compute_ci_dist,
    "SUBI": 0b001 << compute_function_dist | 1 << compute_ci_dist,
    "MULI": 0b010 << compute_function_dist | 1 << compute_ci_dist,
    "DIVI": 0b011 << compute_function_dist | 1 << compute_ci_dist,
    "MODI": 0b100 << compute_function_dist | 1 << compute_ci_dist,
    "OPLUSI": 0b101 << compute_function_dist | 1 << compute_ci_dist,
    "ORI": 0b110 << compute_function_dist | 1 << compute_ci_dist,
    "ANDI": 0b111 << compute_function_dist | 1 << compute_ci_dist,
    # Not register only
    "ADD": 0,
    "SUB": 0b001 << compute_function_dist,
    "MUL": 0b010 << compute_function_dist,
    "DIV": 0b011 << compute_function_dist,
    "MOD": 0b100 << compute_function_dist,
    "OPLUS": 0b101 << compute_function_dist,
    "OR": 0b110 << compute_function_dist,
    "AND": 0b111 << compute_function_dist,
}


def register(s):
    if s not in register_decode:
        raise CompilationError(f'Invalid Register "{s}"')
    return register_decode[s]

def compile_load(args):
    instr = load_instructions[args[0]]
    if args[0] == "LOAD":
        instr |= register(args[1]) << 22 # destination
        instr |= int(args[2])
    elif args[0] == "LOADIN":
        instr |= register(args[1]) << 25 # source
        instr |= register(args[2]) << 22 # destination
        instr |= u.to_unsigned(int(args[3]))
    elif args[0] == "LOADI":
        instr |= register(args[1]) << 22 # destination
        instr |= int(args[2])
    return instr

def compile_store(args) -> int:
    instr = store_instructions[args[0]]
    if args[0] == "STORE":
        instr |= register(args[1]) << 25 # source
        instr |= int(args[2])
    elif args[0] == "STOREIN":
        instr |= register(args[1]) << 22 # destination
        instr |= register(args[2]) << 25 # source
        instr |= u.to_unsigned(int(args[3]))
    elif args[0] == "MOVE":
        instr |= register(args[1]) << 25 # source
        instr |= register(args[2]) << 22 # destination
    return instr

def compile_jump(args) -> int:
    instr = 0
    if args[0] in ("INT", "RTI"):
        instr |= jump_instructions["NOP"]
        if args[0] == "INT":
            instr |= 1 << 25
        else:
            instr |= 2 << 25
    else:
        instr |= jump_instructions[args[0]]
    if len(args) > 1:
        instr |= u.to_unsigned(int(args[1]))
    return instr

def compile_arithmetic(args):
    if len(args) != 3:
        raise CompilationError(f"Expected 3 arguments, {len(args)} provided")
    instr = compute_instructions[args[0]]
    register_only = args[2] in register_encode.values()
    instr |= register(args[1]) << compute_dest_dist # destination
    if register_only:
        instr |= 1 << compute_ro_dist
        instr |= register(args[2]) << compute_source_dist # source register
    else:
        try:
            instr |= int(args[2])
        except ValueError as e:
            raise CompilationError(f"Expected integer value")
    return instr


def compile_single(string):
    """
    Compiles a single instruction
    """
    args = string.split(";")[0].split("//")[0] # strip comments
    args = args.strip()
    args = args.split(" ")
    command = args[0]
    if command == "":
        raise CompilationError("No command provided")
    if "LOAD" in command:
        return compile_load(args)
    elif "STORE" in command or "MOVE" in command:
        return compile_store(args)
    elif command in ("NOP", "JG", "JE", "JGE", "JL", "JNE", "JLE", "JMP", "INT", "RTI"):
        return compile_jump(args)
    elif command in ("ADDI", "ADD", "SUBI", "SUB", "MULI", "MUL", "DIVI", "DIV", "OPLUSI", "OPLUS",
                     "MODI", "MOD","ORI", "OR", "ANDI", "AND"):
        return compile_arithmetic(args)
    else:
        raise CompilationError(f'Invalid Instruction "{command}"')

def compile(data):
    result = []
    for i, string in enumerate(data, start=1):
        args = string.split(";")[0].split("//")[0] # strip comments
        args = args.strip()
        args = args.split(" ")
        if args[0] == "": # skip empty lines
            continue
        try:
            result.append(compile_single(string))
        except CompilationError as e:
            raise CompilationError(e.message + f' in line {i} "{string}"')
    return result

# ------------------------------------------------------------------------------------------
#
#
#                                         DECOMPILER
#
#
# ------------------------------------------------------------------------------------------


def decompile_load(instruction):
    mode = (instruction >> 28) & 0x3
    addr = (instruction >> 25) & 0x7
    dest = (instruction >> 22) & 0x7
    param = instruction & 0x3fffff
    # LOAD
    if mode == 0b00:
        return f"LOAD {register_encode[dest]} {param}"
    # LOADIN
    elif mode == 0b01:
        return f"LOADIN {register_encode[addr]} {register_encode[dest]} {u.to_signed(param)}"
    # LOADI
    elif mode == 0b11:
        return f"LOADI {register_encode[dest]} {param}"

def decompile_store(instruction):
    mode = (instruction >> 28) & 0x3
    source = (instruction >> 25) & 0x7
    dest = (instruction >> 22) & 0x7
    param = instruction & 0x3fffff
    # STORE
    if mode == 0b00:
        return f"STORE {register_encode[source]} {param}"
    # STOREIN
    elif mode == 0b01:
        return f"STOREIN {register_encode[dest]} {register_encode[source]} {u.to_signed(param)}"
    # MOVE
    elif mode == 0b11:
        return f"MOVE {register_encode[source]} {register_encode[dest]}"

def decompile_jump(instruction):
    condition = (instruction >> 27) & 0x7
    j = (instruction >> 25) & 0x3
    param = instruction & 0x3fffff
    param = u.to_signed(param)
    # INT i
    if j == 1:
        return f"INT {param}"
    # RTI
    elif j == 2:
        return "RTI"
    # NOP
    if condition == 0:
        return "NOP"
    # JG
    elif condition == 0b001:
        return f"JG {param}"
    # JE
    elif condition == 0b010:
        return f"JE {param}"
    # JGE
    elif condition == 0b011:
        return f"JGE {param}"
    # JL
    elif condition == 0b100:
        return f"JL {param}"
    # JNE
    elif condition == 0b101:
        return f"JNE {param}"
    # JLE
    elif condition == 0b110:
        return f"JLE {param}"
    # JMP
    elif condition == 0b111:
        return f"JMP {param}"

def decompile_compute(instruction):
    compute_immidiate = (instruction >> 29) & 1
    register_only = (instruction >> 28) & 1
    func = (instruction >> 25) & 0x7
    dest = (instruction >> 22) & 0x7
    source = (instruction >> 19) & 0x7
    param = instruction & 0x3fffff
    if register_only:
        param = instruction & 0x7ffff
    d = register_encode[dest]
    s = register_encode[source] if register_only else param
    i = "I" if compute_immidiate else ""
    if func == 0b000:
        return f"ADD{i} {d} {s}"
    if func == 0b001:
        return f"SUB{i} {d} {s}"
    if func == 0b010:
        return f"MUL{i} {d} {s}"
    if func == 0b011:
        return f"DIV{i} {d} {s}"
    if func == 0b100:
        return f"MOD{i} {d} {s}"
    if func == 0b101:
        return f"OPLUS{i} {d} {s}"
    if func == 0b110:
        return f"OR{i} {d} {s}"
    if func == 0b111:
        return f"AND{i} {d} {s}"

def decompile(i):
    instruction_type = i >> 30
    if types[instruction_type] == "LOAD":
        return decompile_load(i)
    elif types[instruction_type] == "STORE":
        return decompile_store(i)
    elif types[instruction_type] == "JUMP":
        return decompile_jump(i)
    elif types[instruction_type] == "COMPUTE":
        return decompile_compute(i)

def test_compiler():
    test_commands = (
        "LOAD ACC 1111",
        "LOADI PC 0",
        "LOADIN IN1 IN2 -1",
        "STORE ACC 1",
        "STOREIN SP IN1 0",
        "MOVE ACC PC",

        "ADDI ACC 1",
        "SUBI ACC 1",
        "MULI ACC 1",
        "DIVI ACC 1",
        "MODI ACC 1",
        "OPLUSI ACC 1",
        "ORI ACC 1",
        "ANDI ACC 1",

        "ADD ACC 1",
        "SUB ACC 1",
        "MUL ACC 1",
        "DIV ACC 1",
        "MOD ACC 1",
        "OPLUS ACC 1",
        "OR ACC 1",
        "AND ACC 1",

        "ADD ACC IN1",
        "SUB ACC IN1",
        "MUL ACC IN1",
        "DIV ACC IN1",
        "MOD ACC IN1",
        "OPLUS ACC IN1",
        "OR ACC IN1",
        "AND ACC IN1",
        
        "NOP",
        "JG 5",
        "JE -333",
        "JGE 412",
        "JNE -444",
        "JLE 1",
        "JMP 0",
        "INT 420",
        "RTI"
    )
    for command in test_commands:
        print(f"Testing '{command}'")
        assert command == decompile(compile_single(command))

if __name__ == "__main__":
    print("Testing compiler & decompiler")
    test_compiler()