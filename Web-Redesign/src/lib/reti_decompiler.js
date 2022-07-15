import { registerNames } from "./global_vars.js"

function toSigned(num) {
    return num - Math.pow(2, 21)
}

function decompileLoad(instruction) {
    let mode = (instruction >>> 28) & 0x3
    let addr = (instruction >>> 25) & 0x7
    let dest = (instruction >>> 22) & 0x7
    let param = instruction & 0x3fffff
    switch (mode) {
        case 0:
            return `LOAD ${registerNames[dest]} ${param}`
        case 1:
            return `LOADIN ${registerNames[addr]} ${registerNames[dest]} ${toSigned(param)}`
        case 3:
            return `LOADI ${registerNames[dest]} ${param}`
    }
}

function decompileStore(instruction) {
    let mode = (instruction >>> 28) & 0x3
    let source = (instruction >>> 25) & 0x7
    let dest = (instruction >>> 22) & 0x7
    let param = instruction & 0x3fffff
    switch (mode) {
        case 0:
            return `STORE ${registerNames[source]} ${param}`
        case 1:
            return `STOREIN ${registerNames[dest]} ${registerNames[source]} ${toSigned(param)}`
        case 3:
            return `MOVE ${registerNames[source]} ${registerNames[dest]}`
    }
}

function decompileJump(instruction) {
    let condition = (instruction >>> 27) & 0x7
    let j = (instruction >>> 25) & 0x3
    let param = toSigned(instruction & 0x3fffff)
    if (j == 1)
        return `INT ${param}`
    else if (j == 2)
        return "RTI"
    let conditions = [
        "NIX",
        ">",
        "==",
        ">=",
        "<",
        "!=",
        "<=",
        ""
    ]
    if (condition == 0) {
        return "NOP"
    }
    return `JUMP${conditions[condition]} ${param}`
}

function decompileCompute (instruction) {
    let computeImmidiate = (instruction >>> 29) & 1 ? "I" : ""
    let registerOnly = (instruction >>> 28) & 1
    let func = (instruction >>> 25) & 0x7
    let dest = (instruction >>> 22) & 0x7
    let source = (instruction >>> 19) & 0x7
    let param = instruction & 0x3ffff
    // param is only 19 bits long if command is register only
    if (registerOnly) {
        param = instruction & 0x7ffff
    }
    let s = registerOnly ? registerNames[source] : param
    
    let funcs = [
        "ADD",
        "SUB",
        "MUL",
        "DIV",
        "MOD",
        "OPLUS",
        "OR",
        "AND",
    ]
    return `${funcs[func]}${computeImmidiate} ${registerNames[dest]} ${s}`
}

function decompile (instruction) {
    let instructionType = instruction >>> 30
    switch (instructionType) {
        case 0:
            return decompileCompute(instruction)
        case 1:
            return decompileLoad(instruction)
        case 2:
            return decompileStore(instruction)
        case 3:
            return decompileJump(instruction)
    }
}

export { decompile };