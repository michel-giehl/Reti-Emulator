import { statusText } from "$lib/components/Alert.svelte";
import { compileSingle } from "./reti_compiler";

const SRAM_SIZE = (1 << 12)
const EPROM_SIZE = (1 << 8)
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
        this.processBegin = 3
        this.dataSegmentSize = 32
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

            this.uart = new Array(8).fill(0)
            this.sram = new Array(5).fill(0)

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

    readProgram(code, mode) {
        // load eprom stuff
        let instrLen = code.length;
        this.eprom[0] = compileSingle("LOADI DS -2097152")
        this.eprom[1] = compileSingle("MULI DS 1024")
        this.eprom[2] = compileSingle("MOVE DS SP")
        this.eprom[3] = compileSingle("MOVE DS BAF")
        this.eprom[4] = compileSingle("MOVE DS CS")
        this.eprom[5] = compileSingle(`ADDI SP ${this.processBegin + instrLen + this.dataSegmentSize - 1}`)
        this.eprom[6] = compileSingle("ADDI BAF 2")
        this.eprom[7] = compileSingle(`ADDI CS ${this.processBegin}`)
        this.eprom[8] = compileSingle(`ADDI DS ${this.processBegin + instrLen}`)
        this.eprom[9] = compileSingle("MOVE CS PC")
        // load sram stuff
        this.sram[0] = compileSingle("JUMP 0");
        this.sram[1] = (1 << 31) >>> 0;
        for (let i = 0; i < code.length; i++) {
            this.sram[i + this.processBegin] = code[i]
        }
        this.bds = code.length + this.processBegin
    }

    toSimpleNum(num) {
        if (num >= Math.pow(2,31)) {
            return num - Math.pow(2,31)
        }
        if (num >= Math.pow(2,30)) {
            return num - Math.pow(2,30)
        }
        return num
    }

    #to32Bit(num) {
        return num >>> 0
    }

    memWrite(addr, data) {
        if (addr >= Math.pow(2,31)) {
            this.sram[addr - Math.pow(2,31)] = this.#to32Bit(data)
        } else if(addr >= Math.pow(2,30)) {
            this.uart[addr - Math.pow(2,31)] = this.#to32Bit(data)
        } else {
            let ds = this.registers[DS] >>> 30
            if (this.memoryMap[ds] === this.sram && addr > SRAM_SIZE) {
                statusText(true, "error", `Can't write to Address ${addr}`)
                throw new Error("Canot write to this address")
            }
            this.memoryMap[ds][addr] = this.#to32Bit(data)
        }
    }

    memRead(addr, register = null, seg = DS) {
        let data = 0;
        if (addr >= Math.pow(2,31)) {
            data = this.sram[addr - Math.pow(2,31)] || 0
        } else if(addr >= Math.pow(2,30)) {
            data = this.uart[addr - Math.pow(2,31)] || 0
        } else {
            let segment = this.registers[seg] >>> 30
            data = this.memoryMap[segment][addr] || 0
        }
        if (register != null) {
            this.registers[register] = data
        }
        return data
    }

    fetch() {
        let instr = this.registers[PC];
        if (instr >= Math.pow(2,31)) {
            this.registers[I] = this.sram[instr - Math.pow(2,31)]
        } else if (instr >= Math.pow(2,30)) {
            this.registers[I] = this.uart[instr - Math.pow(2,30)]
        } else {
            this.registers[I] = this.eprom[instr]
        }
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
            if ((this.uart[2] & 1) === 0) {
                data.push(this.uart[0])
                this.uart[0] = 0
                this.uart[2] |= 1
            }
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
                this.registers[dest] = this.#toSigned(param)
                break
        }
        if (dest != PC) {
            this.registers[PC]++
        }
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
        accRegister = ((~(accRegister >>> 0) + 1) * -1);
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
        if (j === 1) {
            statusText(true, "info", `<strong>OUTPUT</strong> ${this.registers[param]}`)
        }
        if (j === 2) {
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
        this.eprom[Math.pow(2, 16) - 1] = 1 << 30 // UART
        this.eprom[Math.pow(2, 16) - 2] = (1 << 31) >>> 0 // SRAM
        this.eprom[Math.pow(2, 16) - 3] = 0x70000000 // LOADI PC 0
        this.uart[2] = 1;
    }

    #toSigned(num) {
        return num - Math.pow(2, 21)
    }


    #toUnSigned(num) {
        return num + Math.pow(2, 21)
    }
}

export { ReTi, PC, IN1, IN2, ACC, SP, BAF, CS, DS, I, SRAM_SIZE, EPROM_SIZE };
