document.addEventListener("DOMContentLoaded", function() {

    var animationState = {
        paused: false,
        running: false,
        code: null,
        instructionNum: 0,
        timer: null
    }
    var useDecimalNumbers = false

    document.querySelector("input[id=decimal-selector]").addEventListener('change', function() {
        if (this.checked) {
            useDecimalNumbers = true
        } else {
            useDecimalNumbers = false
        }
        display_state(0)
    })

    document.querySelector("input[id=stop]").addEventListener('click', function() {
        animationState.paused = !animationState.paused
        if (animationState.paused) {
            document.getElementById("stop").value = "Unpause"
            document.getElementById("forward").hidden = false
            document.getElementById("backward").hidden = false
        } else {
            document.getElementById("stop").value = "Pause"
            document.getElementById("forward").hidden = true
            document.getElementById("backward").hidden = true
        }
    })

    
    document.querySelector("input[id=forward]").addEventListener('click', function() {
        if(animationState.running) {
            display_state(1)
        }
    })

    document.querySelector("input[id=backward]").addEventListener('click', function() {
        if(animationState.running) {
            display_state(-1)
        }
    })

    document.querySelector("input[id=clockspeed]").addEventListener('change', function() {
        run_code()
    })

    document.querySelector("input[id=run]").addEventListener('click', async function() {
        let start_time = Date.now()
        let status_element = document.getElementById("status-message")
        status_element.innerHTML = "Compiling..."
        let response = await fetch_code()
        let took = Date.now() - start_time
        if (response.error) {
            status_element.innerText = response.text
            return
        }
        status_element.innerText = `Execution successful (took ${took}ms).`
    })

    /**
     * Run code on server
     */
    fetch_code = async () => {
        let code = document.getElementById("source-code").value
        let uartData = document.getElementById("uart-data").value
        let response = await fetch("/run", {method: "POST", body: code, headers: {"UART-Data": uartData}})
        const text = await response.text()
        if (response.ok) {
            animationState.code = JSON.parse(text)
            animationState.instructionNum = 0
            run_code(text)
        }
        return {error: !response.ok, text: text}
    }
    
    run_code = () => {
        let animation_speed = 1000 / document.getElementById("clockspeed").value
        if (animationState.running) {
            clearInterval(animationState.timer)
        }
        animationState.running = true
        reset_sram_display()
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
            display_state(1)
        }, animation_speed)
    }
    
    display_state = (num) => {
        num += animationState.instructionNum
        if (num < 0 || num > Object.keys(animationState.code)) {
            return
        }
        animationState.instructionNum = num
        let state = Object.values(animationState.code)[num]
        let registerKeys = Object.keys(state.registers)
        let sram = state.sram
        document.getElementById(`field-instruction-header`).innerText = `Instruction ${num + 1}/${Object.keys(animationState.code).length}`
        document.getElementById(`field-instruction`).innerText = state.instruction
        // Display registers
        for (let i = 0; i < 7; i++) {
            registerName = registerKeys[i];
            let element = document.getElementById(`field-${registerName.toLowerCase()}`)
            if (element) {
                element.innerText = stringifyNumber(state.registers[registerName])
            }
        }
        // Display sram
        let sramElements = document.getElementById("field-sram-container").children
        let sramKeys = Object.keys(sram)
        for (let i = 0; i < Math.min(11, sramKeys.length); i++) {
            let addr = sramKeys[i]
            let data = sram[addr]
            sramElements[i + 1].innerText = `${addr}    ${stringifyNumber(data)}`
        }
    }

    reset_sram_display = () => {
        let sram_elements = document.getElementById("field-sram-container").children
        for (let i = 1; i < 12; i++) {
            sram_elements[i].innerText = ""
        }
    }

    stringifyNumber = (num) => {
        num = Number.parseInt(num)
        return num === NaN ? 0 : num.toString(useDecimalNumbers ? 10 : 16)
    }
})