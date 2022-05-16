import { config, registerNames } from "./global_vars.js"
import { ReTi, PC, I } from "./simple_reti_emulator.js"

function nextReTiState() {
    try {
        config.reti.fetch()
        display_state()
        config.reti.execute()
    } catch(e) {
        statusText(e)
        if (config.running) {
            clearInterval(config.timer)
        }
        throw e
    }
}

function statusText(text) {
    let statusElement = $('#status-message')
    statusElement.text(text)
    setTimeout(() => {
        if (statusElement.text() == text) {
            statusElement.text("")
        }
    }, 5000)
}

function run_code(code) {
    config.running = true
    reset_sram_and_uart_display()
    config.reti = new ReTi()
    try {
        config.reti.readProgram(code)
    } catch(e) {
        statusText(e)
        throw e
    }
    updateClockSpeed()
}

function updateClockSpeed() {
    if (config.reti == null)
        return
    let animationSpeed = 1000 / $("#clockspeed").val()
    if (config.running) {
        clearInterval(config.timer)
    }
    display_state()
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
    $("#instruction-counter").text(`Instruction ${num}/${config.reti.bds - 2}`)
    $("#instruction-decoded").text(reti.registers[I])
    // Display registers
    for (let i = 0; i < 4; i++) {
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
            $('#sram-table').after(`<tr class="sram-data" style="${style}"><th>${i}</th><th>${typeof data === 'number' ? stringifyNumber(data) : data}</th></tr>`)
        }
            
    }
}

function reset_sram_and_uart_display() {
    $('.sram-data').remove()
    $('.uart-data').remove()
}

function convertToUpperNumber(num) {
    const upperNumbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
    let i = 125421;
    let numbers = []
    while (num > 0){
      numbers.push(num % 10)
      num -= num % 10
      num /=10
    }
    numbers.reverse()
    let str = ""
    for(let n of numbers) {
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

export { run_code, nextReTiState, updateClockSpeed };
