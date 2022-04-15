decompileLoad = (instruction) => {
    let mode = (instruction >>> 28) & 0x3
    let addr = (instruction >>> 25) & 0x7
    let dest = (instruction >>> 22) & 0x7
    let param = instruction & 0x3fffff
    switch (mode) {
        case 0:
            return `LOAD ${registerNames[dest]} ${param}`
        case 1:
            return `LOADIN ${registerNames[addr]} ${registerNames[dest]} ${toSigned(param)}`
        case 2:
            return `LOADI ${registerNames[dest]} ${param}`
    }
}

decompileStore = (instruction) => {}

decompileJump = (instruction) => {}

decompileCompute = (instruction) => {}

decompile = (instruction) => {}