import { config, registerNames } from "./global_vars.js"
import { ReTi, PC } from "./reti_emulator.js"

function run_code(code) {
    let animationSpeed = 1000 / $("#clockspeed").val()
    if (config.running) {
        clearInterval(config.timer)
    }
    config.running = true
    reset_sram_and_uart_display()
    config.reti = new ReTi()
    config.reti.readProgram(code)
    config.timer = setInterval(() => {
        display_state()
        config.reti.fetch()
        config.reti.execute()
    }, animationSpeed)
}

function display_state() {
    let reti = config.reti
    let num = reti.registers[PC]
    let sram = reti.sram
    let uart = reti.uart
    $("#instruction-counter").text(`Instruction ${num + 1}`)
    $("#instruction-decoded").text("N/A")
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
    for (let i = sram.length; i > reti.bds; i--) {
        let data = sram[i]
        if (data !== undefined) {
            $('#sram-table').after(`<tr class="sram-data"><th>${i}</th><th>${stringifyNumber(data)}</th></tr>`)
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

function stringifyNumber(num) {
    num = Number.parseInt(num)
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
            num = num.substring(0, num.length - count) + `${last}*${count}`
        }
    }
    return num
}

export { run_code };