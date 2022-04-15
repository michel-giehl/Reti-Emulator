import utility as u
from constants import *

class CompilationError(RuntimeError):
    def __init__(self, message):
        self.message = message


encode_register = {
    0: "PC",
    1: "IN1",
    2: "IN2",
    3: "ACC",
    4: "SP",
    5: "BAF",
    6: "CS",
    7: "DS",
}

decode_register = u.inverse(encode_register)

def register(s):
    if s not in decode_register:
        raise CompilationError(f'Invalid Register "{s}"')
    return decode_register[s]

def compile_load(args):
    if args[0] not in load_instructions:
        raise CompilationError(f'Invalid Instruction "{args[0]}"')
    instr = load_instructions[args[0]]
    try:
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
    except ValueError:
        raise CompilationError("Integer value expected!")
    return instr

def compile_store(args) -> int:
    if args[0] not in store_instructions:
        raise CompilationError(f'Invalid Instruction "{args[0]}"')
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
    elif args[0] in jump_instructions:
        instr |= jump_instructions[args[0]]
    else:
        raise CompilationError(f'Invalid Instruction "{args[0]}"')
    if len(args) > 1:
        try:
            instr |= u.to_unsigned(int(args[1]))
        except:
            raise CompilationError("Integer value expected!")
    return instr

def compile_arithmetic(args):
    if len(args) != 3:
        raise CompilationError(f"Expected 3 arguments, {len(args)} provided")
    if args[0] not in compute_instructions:
        raise CompilationError(f'Invalid Instruction "{args[0]}"')
    instr = compute_instructions[args[0]]
    register_only = args[2] in encode_register.values()
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
    elif command in ("NOP", "JUMP>", "JUMP==", "JUMP>=", "JUMP<", "JUMP!=", "JUMP<=", "JUMP", "INT", "RTI"):
        return compile_jump(args)
    elif command in ("ADDI", "ADD", "SUBI", "SUB", "MULI", "MUL", "DIVI", "DIV", "OPLUSI", "OPLUS",
                     "MODI", "MOD","ORI", "OR", "ANDI", "AND"):
        return compile_arithmetic(args)
    else:
        raise CompilationError(f'Invalid Instruction "{command}"')

def compile(data):
    result = []
    for i, string in enumerate(data, start=1):
        args = string.split(";")[0].split("#")[0].split("//")[0] # strip comments
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
        return f"LOAD {encode_register[dest]} {param}"
    # LOADIN
    elif mode == 0b01:
        return f"LOADIN {encode_register[addr]} {encode_register[dest]} {u.to_signed(param)}"
    # LOADI
    elif mode == 0b11:
        return f"LOADI {encode_register[dest]} {param}"

def decompile_store(instruction):
    mode = (instruction >> 28) & 0x3
    source = (instruction >> 25) & 0x7
    dest = (instruction >> 22) & 0x7
    param = instruction & 0x3fffff
    # STORE
    if mode == 0b00:
        return f"STORE {encode_register[source]} {param}"
    # STOREIN
    elif mode == 0b01:
        return f"STOREIN {encode_register[dest]} {encode_register[source]} {u.to_signed(param)}"
    # MOVE
    elif mode == 0b11:
        return f"MOVE {encode_register[source]} {encode_register[dest]}"

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
        return f"JUMP> {param}"
    # JE
    elif condition == 0b010:
        return f"JUMP== {param}"
    # JGE
    elif condition == 0b011:
        return f"JUMP>= {param}"
    # JL
    elif condition == 0b100:
        return f"JUMP< {param}"
    # JNE
    elif condition == 0b101:
        return f"JUMP!= {param}"
    # JLE
    elif condition == 0b110:
        return f"JUMP<= {param}"
    # JMP
    elif condition == 0b111:
        return f"JUMP {param}"

def decompile_compute(instruction):
    compute_immidiate = (instruction >> 29) & 1
    register_only = (instruction >> 28) & 1
    func = (instruction >> 25) & 0x7
    dest = (instruction >> 22) & 0x7
    source = (instruction >> 19) & 0x7
    param = instruction & 0x3fffff
    if register_only:
        param = instruction & 0x7ffff
    d = encode_register[dest]
    s = encode_register[source] if register_only else param
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
        "JUMP> 5",
        "JUMP>= 412",
        "JUMP== -333",
        "JUMP!= -444",
        "JUMP< 14",
        "JUMP<= 1",
        "JUMP 0",
        "INT 420",
        "RTI"
    )
    for command in test_commands:
        print(f"Testing '{command}' == '{decompile(compile_single(command))}'")
        assert command == decompile(compile_single(command))

if __name__ == "__main__":
    print("Testing compiler & decompiler")
    test_compiler()