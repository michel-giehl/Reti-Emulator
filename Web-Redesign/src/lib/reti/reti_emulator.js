const SRAM_SIZE = (1 << 16)
const EPROM_SIZE = (1 << 16)
const PC = 0
const IN1 = 1
const IN2 = 2
const ACC = 3
const SP = 4
const BAF = 5
const CS = 6
const DS = 7
const I = 8

class ReTi {

    constructor(reti) {
        // create deep copy if argument is provided
        if (reti) {
            this.registers = [...reti.registers]
            this.uart = [...reti.uart]
            this.sram = [...reti.sram]
            this.eprom = [...reti.eprom]
            this.memoryMap = {
                0: this.eprom,
                1: this.uart,
                2: this.sram,
                3: this.eprom
            }
            this.bds = reti.bds
        } else {
            this.registers = new Array(9).fill(0)
            this.registers[CS] = (1 << 31) >>> 0
            this.registers[SP] = SRAM_SIZE - 1

            this.uart = new Array(8).fill(0)

            this.sram = new Array()
            this.eprom = new Array(EPROM_SIZE)
            this.memoryMap = {
                0: this.eprom,
                1: this.uart,
                2: this.sram,
                3: this.eprom
            }
            this.bds = 0
            this.#loadConstants()
        }
    }

    readProgram(code) {
        for (let i = 0; i < code.length; i++) {
            this.sram[i] = code[i]
        }
        this.bds = code.length + 1
    }

    #to32Bit(num) {
        return num >> 0
    }

    memWrite(addr, data) {
        let ds = this.registers[DS] >>> 30
        this.memoryMap[ds][addr] = this.#to32Bit(data)
    }

    memRead(addr, register = null, seg = DS) {
        let segment = this.registers[seg] >>> 30
        let data = this.memoryMap[segment][addr] || 0
        if (register != null) {
            this.registers[register] = data
            return
        }
        return data
    }

    fetch() {
        this.memRead(this.registers[PC], I, CS)
    }

    execute() {
        let instruction = this.registers[I]
        let instructionType = instruction >>> 30
        switch (instructionType) {
            case 0: // COMPUTE
                this.#compute(instruction)
                break
            case 1: // LOAD
                this.#load(instruction)
                break
            case 2: // STORE
                this.#store(instruction)
                break
            case 3: // JUMP
                this.#jump(instruction)
                break
        }
    }

  simulateUART(mode, data) {
    // UART writes data into R1 so the reti can read it.
    if (mode === "send") {
      if (data.length === 0) return false
      // check if R2 b1 == 0
      if ((this.uart[2] & 2) == 0) {
        this.uart[2] |= 2
        this.uart[1] = data[0] & 0xff
        data.shift()
        return true
      }
    } else if (mode === "receive") {
      // TODO implement
    }
    return false
  }

    #load(instruction) {
        let mode = (instruction >>> 28) & 0x3
        let addr = (instruction >>> 25) & 0x7
        let dest = (instruction >>> 22) & 0x7
        let param = instruction & 0x3fffff
        switch (mode) {
            case 0b00: // LOAD
                this.memRead(param, dest)
                break
            case 0b01: // LOADIN
                this.memRead(this.registers[addr] + this.#toSigned(param), dest)
                break
            case 0b11: // LOADI
                this.registers[dest] = param
                break
        }
        this.registers[PC]++
    }

    #store(instruction) {
        let mode = (instruction >>> 28) & 0x3
        let source = (instruction >>> 25) & 0x7
        let dest = (instruction >>> 22) & 0x7
        let param = instruction & 0x3fffff
        switch (mode) {
            case 0b00: // STORE
                this.memWrite(param, this.registers[source])
                break
            case 0b01: // STOREIN
                this.memWrite(this.registers[dest] + this.#toSigned(param), this.registers[source])
                break
            case 0b11: // MOVE
                this.registers[dest] = this.#to32Bit(this.registers[source])
                // don't increase PC if destination is PC
                if (dest == PC) {
                    return
                }
        }
        this.registers[PC]++
    }

    #jump(instruction) {
        let condition = (instruction >>> 27) & 0x7
        let j = (instruction >>> 25) & 0x3
        let param = this.#toSigned(instruction & 0x3fffff)
        let accRegister = this.registers[ACC]
        let conditionMap = {
            0: false,
            1: accRegister > 0,
            2: accRegister == 0,
            3: accRegister >= 0,
            4: accRegister < 0,
            5: accRegister != 0,
            6: accRegister <= 0,
            7: true,
        }
        // INT i & RTI
        if (j === 1 || j === 2) {
            throw new Error("Not yet implemented")
        }

        if (conditionMap[condition]) {
            this.registers[PC] += param
            // animateCOMPUTEI(0, 0)
        } else {
            this.registers[PC]++
        }
    }

    #compute(instruction) {
        let computeImmidiate = (instruction >>> 29) & 1
        let registerOnly = (instruction >>> 28) & 1
        let func = (instruction >>> 25) & 0x7
        let dest = (instruction >>> 22) & 0x7
        let source = (instruction >>> 19) & 0x7
        let param = instruction & 0x3ffff
        // param is only 19 bits long if command is register only
        if (registerOnly) {
            param = instruction & 0x7ffff
        }
        let s = registerOnly ? this.registers[source] : param
        // read from M[s] is not compute immidiate or register only
        s = computeImmidiate || registerOnly ? s : this.memRead(s)
        let r = this.registers[dest]
        switch (func) {
            case 0:
                r += s
                break
            case 1:
                r -= s
                break
            case 2:
                r *= s
                break
            case 3:
                r /= s
                break
            case 4:
                r %= s
                break
            case 5:
                r ^= s
                break
            case 6:
                r |= s
                break
            case 7:
                r &= s
                break
        }
        this.registers[dest] = this.#to32Bit(r)
        this.registers[PC]++
    }

    #loadConstants() {
        this.eprom[Math.pow(2,16) - 1] = 1 << 30 // UART
        this.eprom[Math.pow(2,16) - 2] = (1 << 31) >>> 0 // SRAM
        this.eprom[Math.pow(2,16) - 3] = 0x70000000 // LOADI PC 0
        this.registers[DS] = (1 << 31) >>> 0
        this.registers[SP] = SRAM_SIZE - 1
    }

    #toSigned(num) {
        return num - Math.pow(2, 21)
    }


    #toUnSigned(num) {
        return num + Math.pow(2, 21)
    }
}

export { ReTi, PC, IN1, IN2, ACC, SP, BAF, CS, DS, I, SRAM_SIZE, EPROM_SIZE };
