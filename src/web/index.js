$(() => {

    $('#decimal-selector').change(() => {
        if ($('#decimal-selector').prop("checked")) {
            useDecimalNumbers = true
        } else {
            useDecimalNumbers = false   
        }
        display_state(0)
    })

    // Change Theme
    $('#theme-selector').change(() => {
        
        myCodeMirror.setOption("theme", $('#theme-selector').val().toLowerCase())
    })

    $('#stop').click(() => {
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

    $('#forward').click(() => {
        if(animationState.running) {
            display_state(1)
        }
    })

    $('#backward').click(() => {
        if(animationState.running) {
            display_state(-1)
        }
    })

    $('#clockspeed').change(() => {
        run_code()
    })

    $('#run').click(async () => {
        let start_time = Date.now()
        let status_element = $('#status-message')
        status_element.text("Compiling...")
        let response = await fetch_code(myCodeMirror.getValue())
        let took = Date.now() - start_time
        if (response.error) {
            status_element.text(response.text.substring(0, 100))
            let line_number = Number.parseInt(response.text.split("in line ")[1].split(' "')[0])
            console.log("Error in line: " + line_number)
            return
        }
        status_element.text(`Execution successful (took ${took}ms).`)
    })

    myCodeMirror = CodeMirror.fromTextArea(document.getElementById("code-window"),
    {
        mode: "reti",
        lineNumbers: true,
        enterMode: "keep",
        theme: "monokai"
    })

    myCodeMirror.setValue('; +------------------------------------------+' +
    '\n;            Online ReTi Emulator           ' +
    '\n; +------------------------------------------+' +
    '\n;' +
    '\n; UART-Data field:' +
    '\n; comma-seperated 8 bit numbers that the UART stores in R1 and the CPU' +
    '\n; can then retrieve. The default values "112,192,0,42,112,0,0,0" are the 2 instructions:' +
    '\n; LOADI ACC 42' +
    '\n; LOADI PC 0' +
    '\n; encoded as 8 bit comma-seperated numbers' +
    '\n;' +
    '\n; Constants in EPROM:' +
    '\n; +-------+-----------------------------------+' +
    '\n; | ADDR  |               DATA                |' +
    '\n; +-------+-----------------------------------+' +
    '\n; | 65535 | 01000000000000000000000000000000  |' +
    '\n; | 65534 | 10000000000000000000000000000000  |' +
    '\n; | 65533 |            LOADI PC 0             |' +
    '\n; +-------+-----------------------------------+' +
    '\n; JUMP Instructions:' +
    '\n; +--------+----------------------------------+' +
    '\n; | JUMP   |                JMP               |' +
    '\n; | JUMP>  |                JG                |' +
    '\n; | JUMP>= |                JGE               |' +
    '\n; | JUMP<  |                JL                |' +
    '\n; | JUMP<= |                JLE               |' +
    '\n; | JUMP=  |                JE                |' +
    '\n; | JUMP!= |                JNE               |' +
    '\n; +--------+----------------------------------+' +
    '\n; Comments start with ";" or "//"' +
    '\n; Example program: fib.reti' +
    '\n;' +
    '\nLOAD DS 65534     ; access SRAM' +
    '\nLOAD SP 0         ; use SP as a counter (evil)' +
    '\nLOADI IN1 0       ; IN1 = 0' +
    '\nLOADI IN2 1       ; IN2 = 1' +
    '\nLOADI ACC 0       ; ACC = 0' +
    '\nMOVE IN1 ACC      ; ACC = IN1 + IN2' +
    '\nADD ACC IN2       ; ACC = IN1 + IN2' +
    '\nMOVE IN2 IN1      ; IN1 = IN2' +
    '\nMOVE ACC IN2      ; IN2 = ACC' +
    '\nSTOREIN SP IN1 0  ; store in SRAM' +
    '\nADDI SP 1         ; increment counter' +
    '\nJMP -6            ; loop forever')
})