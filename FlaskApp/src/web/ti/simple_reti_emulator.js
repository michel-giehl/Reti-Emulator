const SRAM_SIZE = (1 << 16)
const PC = 0
const IN1 = 1
const IN2 = 2
const ACC = 3
const I = 8

const registerMapping = {
    "PC": 0,
    "IN1": 1,
    "IN2": 2,
    "ACC": 3,
    "I": 4
}

const instructionTypes = {
    "ADD": "COMPUTE",
    "ADDI": "COMPUTE",
    "SUB": "COMPUTE",
    "SUBI": "COMPUTE",
    "OPLUS": "COMPUTE",
    "OPLUSI": "COMPUTE",
    "OR": "COMPUTE",
    "ORI": "COMPUTE",
    "AND": "COMPUTE",
    "ANDI": "COMPUTE",
    "JUMP": "JUMP",
    "JUMP==": "JUMP",
    "JUMP<=": "JUMP",
    "JUMP>=": "JUMP",
    "JUMP<": "JUMP",
    "JUMP>": "JUMP",
    "JUMP!=": "JUMP",
    "NOP": "JUMP",
    "LOAD": "LOAD",
    "LOADI": "LOAD",
    "LOADIN1": "LOAD",
    "LOADIN2": "LOAD",
    "STORE": "STORE",
    "STOREIN1": "STORE",
    "STOREIN2": "STORE",
    "MOVE": "STORE",
}

function checkCompute(instruction) {
    let pattern = /.+ (PC|IN(1|2)|ACC) \d+/
    return pattern.test(instruction)
}

function checkJump(instruction) {
    let pattern = /NOP|((JUMP(==|<=?|>=?|!=)?) -?\d+)/
    return pattern.test(instruction)
}

function checkLoad(instruction) {
    let pattern = /((LOADI?) (PC|IN(1|2)|ACC) \d+)|(((LOADIN(1|2))) (PC|IN(1|2)|ACC) -?\d+)/
    return pattern.test(instruction)
}

function checkStore(instruction) {
    let pattern = /((STORE(IN(1|2))?) \d+)|(MOVE (PC|IN(1|2)|ACC) (PC|IN(1|2)|ACC))/
    return pattern.test(instruction)
}

class ReTi {

    constructor() {
        this.registers = new Array(5).fill(0)

        this.bds = 0
        this.sram = new Array(SRAM_SIZE)
    }

    readProgram(code) {
        let codeWithoutComments = []
        let lines = code.split("\n")
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            let lineStripped = line
                .split("#")[0]
                .split(";")[0]
                .split("//")[0]
                .trim()
            if (lineStripped != "") {
                let error = false
                switch (instructionTypes[lineStripped.split(" ")[0]]) {
                    case "COMPUTE":
                        error = !checkCompute(lineStripped)
                        break
                    case "JUMP":
                        error = !checkJump(lineStripped)
                        break
                    case "LOAD":
                        error = !checkLoad(lineStripped)
                        break
                    case "STORE":
                        error = !checkStore(lineStripped)
                        break
                    default:
                        error = true
                        break
                }
                if (error) {
                    throw new Error(`Error: Line ${i + 1}: Instruction "${lineStripped}" cannot be run.`)
                }
                codeWithoutComments.push(lineStripped)
            }
        }
        for (let i = 0; i < codeWithoutComments.length; i++) {
            this.sram[i] = codeWithoutComments[i]
        }
        this.bds = codeWithoutComments.length + 1
    }

    #to32Bit(num) {
        return num >> 0
    }

    memWrite(addr, data) {
        console.log(`${addr} := ${data}`)
        this.sram[addr] = this.#to32Bit(data)
    }

    memRead(addr, register = null) {
        let data = this.sram[addr] || 0
        if (register != null) {
            this.registers[register] = data
            return
        }
        return data
    }

    fetch() {
        this.memRead(this.registers[PC], I)
        if (typeof this.registers[I] !== 'string') {
            throw new Error(`Cannot execute command ${this.registers[I]}`)
        }
    }

    execute() {
        let instruction = this.registers[I]
        let args = instruction.split(" ")
        instruction = args.splice(0, 1).toString()
        let instructionType = instructionTypes[instruction]
        console.log(`${instruction} ${args}`)
        switch (instructionType) {
            case "COMPUTE":
                this.#compute(instruction, args)
                break
            case "LOAD":
                this.#load(instruction, args)
                break
            case "STORE":
                this.#store(instruction, args)
                break
            case "JUMP":
                this.#jump(instruction, args)
                break
        }
    }

    #load(instruction, args) {
        let dest = registerMapping[args[0]]
        let i = Number.parseInt(args[1])
        switch (instruction) {
            case "LOAD":
                console.log(`${args}`)
                console.log(`LOAD ${dest} ${i}`)
                this.memRead(i, dest)
                break
            case "LOADIN1":
                this.memRead(this.registers[IN1] + i, dest)
                break
            case "LOADIN2":
                this.memRead(this.registers[IN2] + i, dest)
                break
            case "LOADI":
                this.registers[dest] = i
                break
        }
        this.registers[PC]++
    }

    #store(instruction, args) {
        let i = Number.parseInt(args[0])
        switch (instruction) {
            case "STORE":
                this.memWrite(i, this.registers[ACC])
                break
            case "STOREIN1":
                this.memWrite(this.registers[IN1] + i, this.registers[ACC])
                break
            case "STOREIN2":
                this.memWrite(this.registers[IN2] + i, this.registers[ACC])
                break
            case "MOVE":
                let dest = registerMapping[args[1]]
                let source = registerMapping[args[0]]
                this.registers[dest] = this.registers[source]
                // don't increase PC if destination is PC
                if (dest == PC) {
                    return
                }
        }
        this.registers[PC]++
    }

    #jump(instruction, args) {
        if (instruction == "NOP") {
            this.registers[PC]++
            return
        }
        let i = Number.parseInt(args[0])
        let condition = instruction.split("JUMP")[1]
        let accRegister = this.registers[ACC]
        let conditionMap = {
            ">": accRegister > 0,
            "==": accRegister == 0,
            ">=": accRegister >= 0,
            "<": accRegister < 0,
            "!=": accRegister != 0,
            "<=": accRegister <= 0,
            "": true,
        }

        if (conditionMap[condition]) {
            this.registers[PC] += i
        } else {
            this.registers[PC]++
        }
    }

    #compute(instruction, args) { 
        let computeImmidiate = instruction.at(-1) == "I"
        let i = Number.parseInt(args[1])
        i = computeImmidiate ? i : this.memRead(i)
        let result = this.registers[registerMapping[args[0]]]
        if (instruction.startsWith("ADD")) {
            result += i
        } else if (instruction.startsWith("SUB")) {
            result -= i
        } else if (instruction.startsWith("OPLUS")) {
            result ^= i
        } else if (instruction.startsWith("OR")) {
            result |= i
        } else if(instruction.startsWith("AND")) {
            result &= i
        }
        this.registers[ACC] = this.#to32Bit(result)
        this.registers[PC]++
    }
}

export { ReTi, PC, IN1, IN2, ACC, I, SRAM_SIZE };