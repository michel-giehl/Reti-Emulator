var animationState = {
    paused: false,
    running: false,
    code: null,
    instructionNum: 0,
    timer: null,
    retiCode: "",
    picoCCode: "",
    activeCodeWindow: 0,
    numberBase: 16,
}

var compiledPicoC = {
    retiCode: "",
    warningsAndErrors: "",
    symbolTable: ""
}

var myCodeMirror = false

/**
 * Run code on server
 */
fetch_code = async (code) => {
    let uartData = $("#uart-data").val()
    let response = await fetch("/run", {method: "POST", body: code, headers: {"UART-Data": uartData}})
    const text = await response.text()
    if (response.ok) {
        json = JSON.parse(text)
        animationState.code = json.reti
        animationState.instructionNum = 0
        run_code(text)
    }
    return {error: !response.ok, text: text}
}

compile_picoc = async (code) => {
    let response = await fetch("/compile", {method: "POST", body: code})
    const text = await response.text()
    if (response.ok) {
        json = JSON.parse(text)
        compiledPicoC.retiCode = json.reti_code
        compiledPicoC.symbolTable = json.symbol_table_csv
        compiledPicoC.warningsAndErrors = json.warnings_and_errors
    }
    return {error: !response.ok, compiledCode: compiledPicoC,text: text}
}

run_code = () => {
    let animation_speed = 1000 / $("#clockspeed").val()
    if (animationState.running) {
        clearInterval(animationState.timer)
    }
    animationState.running = true
    reset_sram_and_uart_display()
    let json = animationState.code
    let keys = Object.keys(json)
    let len = keys.length
    animationState.timer = setInterval(() => {
        if (animationState.paused) return
        let i = animationState.instructionNum
        if (i >= len) {
            animationState.running = false
            animationState.code = null
            clearInterval(animationState.timer)
            return
        }
        display_state(0)
        animationState.instructionNum += 1
    }, animation_speed)
}

display_state = (num) => {
    num += animationState.instructionNum
    if (num < 0 || !animationState.code || num > Object.keys(animationState.code)) {
        return
    }
    animationState.instructionNum = num
    let state = Object.values(animationState.code)[num]
    let registerKeys = Object.keys(state.registers)
    let sram = state.sram
    let uart = state.uart
    $("#instruction-counter").text(`Instruction ${num + 1}/${Object.keys(animationState.code).length}`)
    $("#instruction-decoded").text(state.instruction)
    // Display registers
    for (let i = 0; i < 9; i++) {
        registerName = registerKeys[i];
        let element = $(`#register-value-${registerName.toLowerCase()}`)
        if (element) {
            element.text(stringifyNumber(state.registers[registerName]))
        }
    }
    reset_sram_and_uart_display()
    let sramKeys = Object.keys(sram)
    // Display sram
    for (let i = sramKeys.length - 1; i >= 0; i--) {
        let addr = sramKeys[i]
        let data = sram[addr]
        $('#sram-table').after(`<tr class="sram-data"><th>${addr}</th><th>${stringifyNumber(data)}</th></tr>`)
    }
    // Display UART
    let uartKeys = Object.keys(uart)
    for (let i = uartKeys.length - 1; i >= 0; i--) {
        let addr = uartKeys[i]
        let data = uart[addr]
        $('#uart-table').after(`<tr class="uart-data"><th>${addr}</th><th>${data.toString(2).padStart(8, "0")}</th></tr>`)
    }
}

reset_sram_and_uart_display = () => {
    $('.sram-data').remove()
    $('.uart-data').remove()
}

stringifyNumber = (num) => {
    num = Number.parseInt(num)
    return num === NaN ? 0 : num.toString(animationState.numberBase)
}