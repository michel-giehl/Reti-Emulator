import { config, registerNames } from "./global_vars.js"
import { ReTi, PC, I} from "./reti_emulator.js"
import { decompile } from "./reti_decompiler.js"
import { animateCOMPUTE, animateCOMPUTEI, animateCOMPUTERegisterOnly, animateFetch, animateLOAD, animateLOADI, animateLOADIN, animateMOVE, animateSTORE, animateSTOREIN, draw } from "./canvas.js"


function doAnimate() {
    if (config.fetch) {
        animateFetch(config.phase)
    } else {
        let reti = config.reti
        let command = decompile(reti.registers[I])
        let args = command.split(" ")
        // LOAD & STORE
        switch (args[0]) {
            case "LOAD":
                animateLOAD(args[1], config.phase)
                break
            case "LOADIN":
                animateLOADIN(args[1], args[2], config.phase)
                break
            case "LOADI":
                animateLOADI(args[1], config.phase)
                break
            case "STORE":
                animateSTORE(args[1], config.phase)
                break
            case "STOREIN":
                animateSTOREIN(args[1], args[2], config.phase)
                break
            case "MOVE":
                animateMOVE(args[1], args[2], config.phase)
                break
        }
        // COMPUTE
        const computeCommands = ["ADD", "SUB", "MUL", "DIV", "MOD", "OPLUS", "OR", "AND"]
        const computeICommands = computeCommands.map(cmd => cmd + "I")
        if (computeICommands.includes(args[0])) {
            animateCOMPUTEI(computeICommands.indexOf(args[0]), args[1], config.phase)
        } else if (computeCommands.includes(args[0])) {
            let registerOnly = registerNames.includes(args[2])
            let mode = computeCommands.indexOf(args[0])
            if (registerOnly) {
                animateCOMPUTERegisterOnly(mode, args[2], args[1], config.phase)
            } else {
                animateCOMPUTE(mode, args[1], config.phase)
            }
        }
        // JUMP
        if (args[0].startsWith("JUMP")) {
            animateCOMPUTEI(0, "PC")
        }
    }
}

function previousReTiState() {
    config.phase--
    if (config.phase === -1) {
        if (config.retiStates.length === 0) {
            alert("Can't go back")
            config.phase = 0
            return
        }
        config.phase = config.fetch ? 3 : 2
        config.fetch = !config.fetch
        config.reti = config.retiStates.pop()
    }
    draw(config.reti)
    doAnimate()
    display_state()
}

function nextReTiState() {
    if (config.phase === 0) {
        config.retiStates.push(new ReTi(config.reti))
        if (config.retiStates.length >= config.undoAmount) {
            config.retiStates.shift()
        }
        if (config.fetch) {
            config.reti.fetch()
        } else {
            config.reti.execute()
        }
    }
    config.phase++
    if (config.fetch && config.phase == 3) {
        config.fetch = false
        config.phase = 0
    } else if (!config.fetch && config.phase == 4) {
        config.fetch = true
        config.phase = 0
        // config.uartSimulation.loop()
    }
    draw(config.reti)
    doAnimate()
    display_state()
}

function run_code(code) {
    // clear retiStates
    config.retiStates = []
    let animationSpeed = 1000 / $("#clockspeed").val()
    if (config.running) {
        clearInterval(config.timer)
    }
    config.running = true
    config.reti = new ReTi()
    config.reti.readProgram(code)
    // config.uartSimulation = new UARTSimulation(config.reti.uart, config.uartCode)
    config.fetch = true
    config.phase = 0
    config.reti.fetch()
    reset_sram_and_uart_display()
    draw(config.reti)
    doAnimate()
    display_state()
    config.timer = setInterval(() => {
        if (!config.paused) {
            nextReTiState()
        }
    }, animationSpeed)
}

function updateClockSpeed() {
    if (config.reti == null)
        return
    let animationSpeed = 1000 / $("#clockspeed").val()
    if (config.running) {
        clearInterval(config.timer)
    }
    config.timer = setInterval(() => {
        if (!config.paused) {
            nextReTiState()
        }
    }, animationSpeed)
}


function display_state() {
    let reti = config.reti
    let num = reti.registers[PC]
    let sram = reti.sram
    let uart = reti.uart
    $("#instruction-counter").text(`Instruction ${num + 1} | ${config.fetch ? "FETCH P" : "EXECUTE P"}${config.phase}`)
    $("#instruction-decoded").text(decompile(reti.registers[I]))
    // Display registers
    for (let i = 0; i < 9; i++) {
        let registerName = registerNames[i];
        let element = $(`#register-value-${registerName.toLowerCase()}`)
        if (element) {
            element.text(stringifyNumber(reti.registers[i]))
        }
    }
    reset_sram_and_uart_display()
    // Display sram
    for (let i = sram.length; i >= 0; i--) {
        let data = sram[i]
        if (data !== undefined) {
            let style = ""
            if (i == reti.registers[PC]) {
                style = "background-color: green"
            }
            $('#sram-table').after(`<tr class="sram-data" style="${style}"><th>${i}</th><th>${i < reti.bds && config.numberStyle !== 2 ? decompile(Number.parseInt(data)) : stringifyNumber(data)}</th></tr>`)
        }

    }
    // Display UART
    for (let i = 0; i < uart.length; i++) {
        let data = uart[i]
        $('#uart-table').after(`<tr class="uart-data"><th>${i}</th><th>${data.toString(2).padStart(8, "0")}</th></tr>`)
    }
}

function reset_sram_and_uart_display() {
    $('.sram-data').remove()
    $('.uart-data').remove()
}

function convertToUpperNumber(num) {
    const upperNumbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
    let numbers = []
    if (num === 0) return upperNumbers.at(0)
    while (num > 0) {
        numbers.push(num % 10)
        num -= num % 10
        num /= 10
    }
    numbers.reverse()
    let str = ""
    for (let n of numbers) {
        str += upperNumbers[n]
    }
    return `${str}`
}

function stringifyNumber(num) {
    num = Number.parseInt(num)
    if (config.numberStyle === 10) {
        return num.toString(10)
    }
    // show negative numbers as 2s complement.
    num = num >>> 0
    num = num === NaN ? 0 : num.toString(config.numberStyle)
    if (config.numberStyle === 2) {
        let last = num.at(-1)
        let count = 0
        for (let i = num.length - 1; i > 0; i--) {
            if (num.at(i) !== last) {
                break
            }
            count++
        }
        if (count > 4) {
            num = num.substring(0, num.length - count) + `${last}${convertToUpperNumber(count)}`
        }
    }
    return num
}

export { run_code, previousReTiState, nextReTiState, updateClockSpeed, stringifyNumber, convertToUpperNumber };
