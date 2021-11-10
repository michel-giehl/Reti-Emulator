import sys
import compiler as c
import utility as u
from constants import *

class ReTi:
    def __init__(self):
        self._register = [0 for i in range(9)]

        self.sram = dict()
        self.uart = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0}
        self.eprom = dict()
        self.memory_map = {
            0b00: self.eprom,
            0b01: self.uart,
            0b10: self.sram,
            0b11: self.sram
        }
    
    def read_program(self, code):
        """
        Loads a (compiled) program
        """
        for i in range(len(code)):
            self.eprom[i] = code[i]

    def mem_write(self, addr, data):
        """
        write to memory
        """
        ds = self._register[DS] >> 30
        self.memory_map[ds][addr] = data

    def mem_read(self, addr, dest = None, seg = DS):
        """
        read from memory
        """
        segment = self._register[seg] >> 30
        data = self.memory_map[segment].get(addr) or 0
        if dest:
            self._register[dest] = data
        else:
            return data


    def fetch(self):
        """
        Loads SRAM[PC] into I _register
        """
        self.mem_read(self._register[PC], I, CS)

    def execute(self):
        """
        executes the instruction in I
        """
        i = self._register[I]
        instruction_type = i >> 30
        if types[instruction_type] == "LOAD":
            self.load(i)
        elif types[instruction_type] == "STORE":
            self.store(i)
        elif types[instruction_type] == "JUMP":
            self.jump(i)
        elif types[instruction_type] == "COMPUTE":
            self.compute(i)

    def load(self, instruction):
        mode = (instruction >> 28) & 0x3
        addr = (instruction >> 25) & 0x7
        dest = (instruction >> 22) & 0x7
        param = instruction & 0x3fffff
        # LOAD
        if mode == 0b00:
            self.mem_read(param, dest)
        # LOADIN
        elif mode == 0b01:
            self.mem_read(u.to_unsigned(addr) + u.to_signed(param), dest)
        # LOADI
        elif mode == 0b11:
            self._register[dest] = param
        self._register[PC] += 1

    def store(self, instruction):
        mode = (instruction >> 28) & 0x3
        source = (instruction >> 25) & 0x7
        dest = (instruction >> 22) & 0x7
        param = instruction & 0x3fffff
        # STORE
        if mode == 0b00:
            self.mem_write(param, self._register[source])
            self._register[PC] += 1
        # STOREIN
        elif mode == 0b01:
            self.mem_write(self._register[dest] + u.to_signed(param), self._register[source])
            self._register[PC] += 1
        # MOVE
        elif mode == 0b11:
            self._register[dest] = self._register[source]
            if dest != PC:
                self._register[PC] += 1

    def jump(self, instruction):
        condition = (instruction >> 27) & 0x7
        j = (instruction >> 25) & 0x3
        param = u.to_signed(instruction & 0x3fffff)
        acc_content = self._register[ACC]
        condition_map = {
            0: False, # NOP
            1: acc_content > 0, # JG
            2: acc_content == 0, # JE
            3: acc_content >= 0, # JGE
            4: acc_content < 0, # JL
            5: acc_content != 0, # JNE
            6: acc_content <= 0, # JLE
            7: True, # JMP
        }
        # INT i
        if j == 1:
            raise NotImplemented("Not yet implemented")
        # RTI
        elif j == 2:
            raise NotImplemented("Not yet implemented")

        if condition_map[condition]:
            self._register[PC] += param
        else:
            self._register[PC] += 1


    def compute(self, instruction):
        compute_immidiate = (instruction >> 29) & 1
        _register_only = (instruction >> 28) & 1
        func = (instruction >> 25) & 0x7
        dest = (instruction >> 22) & 0x7
        source = (instruction >> 19) & 0x7
        param = instruction & 0x3fffff
        if _register_only:
            param = instruction & 0x7ffff
        s = self._register[source] if _register_only else param
        s = s if compute_immidiate or _register_only else self.mem_read(s)
        r = self._register[dest]
        if func == 0b000:
            r += s
        elif func == 0b001:
            r -= s
        elif func == 0b010:
            r *= s
        elif func == 0b011:
            r /= s
        elif func == 0b100:
            r %= s
        elif func == 0b101:
            r ^= s
        elif func == 0b110:
            r |= s
        elif func == 0b111:
            r &= s
        self._register[dest] = r
        self._register[PC] += 1

    def print_state(self):
        print(f"PC: {self._register[PC]}\tIN1: {hex(self._register[IN1])}\t" + \
              f"IN2: {hex(self._register[IN2])}\tACC: {hex(self._register[ACC])}\t" + \
              f"SP: {hex(self._register[SP])}\tBAF: {hex(self._register[BAF])}\t" + \
              f"CS: {hex(self._register[CS])}\tDS: {hex(self._register[DS])}\tram: {[self.sram.get(i) or 0 for i in range(100, 110)]}\tI: {c.decompile(self._register[I])}")

def load_constants(reti: ReTi):
    reti.eprom[2**16-1] = 0b1 << 30
    reti.eprom[2**16-2] = 0b1 << 31
    reti.eprom[2**16-3] = c.compile_single("LOADI PC 0")


def init_program(reti, filename):
    """
    Compiles program in code/main.reti and loads it into the EPROM
    """
    lines = []
    with open(filename, "r") as f:
        for line in f:
            lines.append(line)
    compiled_code = c.compile(lines)
    for i, instr in enumerate(compiled_code):
        reti.eprom[i] = instr
    print(f"initialized program: {reti.eprom}")

def run(filename):
    """
    Loads the program, and runs the cpu loop.
    """
    reti = ReTi()
    init_program(reti, filename)
    while True:
        reti.fetch()
        if reti._register[I] == 0:
            print("Exeecution finished.")
            break
        reti.execute()
        reti.print_state()

def simulate_uart(reti, data: list, mode):
    """
    reads/writes data.
    mode: READ = RETI  wants to READ  from UART
    mode: WRITE = RETI wants to WRITE to UART
    """
    if mode == "READ":
        # check if b1 = 0
        if reti.uart[2] & 2 == 0 and len(data):
            # set b1 = 1 and put new data in R1
            reti.uart[2] |= 2
            reti.uart[1] = data[0] & 0xff
            del data[0]
    elif mode == "WRITE":
        # TODO: Implement
        pass

if __name__ == "__main__":
    args = sys.argv
    if len(args) == 1:
        print(f"Usage: {args[0]} <filename>")
        sys.exit(1)
    filename = " ".join(sys.argv[1:])
    print("Compiling...")
    run(filename)
