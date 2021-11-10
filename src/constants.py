# T = Typ
# S = Spezifikation
# P = Parameter i
# TTSSSSSS SSPPPPPP PPPPPPPP PPPPPPPP
# 00000000 00000000 00000000 00000000
types = {
    0b00: "COMPUTE",
    0b01: "LOAD",
    0b10: "STORE",
    0b11: "JUMP"
}

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

# MASKS
type_mask = 0x80000000
specification_mask = 0x3fc00000
param_mask = 0x3fffff

# LOAD Instruction masks
LOAD_MASKS = {
    "MODE": 0x30000000,
    "SOURCE": 0xe000000,
    "DEST": 0x1c00000
}

# STORE Instruction masks
STORE_MASKS = {
    "MODE": 0x30000000,
    "SOURCE": 0xe000000,
    "DEST": 0x1c00000
}

PC = 0
IN1 = 1
IN2 = 2
ACC = 3
SP = 4
BAF = 5
CS = 6
DS = 7
I = 8