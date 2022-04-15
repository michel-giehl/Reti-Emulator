$(() => {

    $('#number-base-selector').change(function() {
        base = {
            "Binary": 2,
            "Decimal": 10,
            "Hexadecimal": 16
        }
        animationState.numberBase = base[$(this).val()]
        if (animationState.paused) {
             display_state(0)
        }
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

    switchToReTiCodeWindow = () => {
        animationState.picoCCode = myCodeMirror.getValue()
        animationState.activeCodeWindow = 0;
        myCodeMirror.setOption("mode", "reti")
        myCodeMirror.setValue(animationState.retiCode)
        $('#navbar-select-picoc').prop("disabled", false)
    }

    switchToPicoCCodeWindow = () => {
        animationState.retiCode = myCodeMirror.getValue()
        animationState.activeCodeWindow = 1;
        $('#navbar-select-reti').prop("disabled", false)
        myCodeMirror.setOption("mode", "text/x-csrc")
        myCodeMirror.setValue(animationState.picoCCode)
    }

    // Source Code Selector
    $('.navbar-item').click(function() {
        $(this).prop("disabled", true)
        let buttonText = $(this).text()
        if (buttonText === "ReTi") {
            switchToReTiCodeWindow()
        } else {
            switchToPicoCCodeWindow()
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

    codeWithoutSymbolTable = (code) => {
        if (code.startsWith("/*                      Symbol Table")) {
            let codeSplitted = code.split("*/\n")
            codeSplitted.shift() // remove first comment
            code = codeSplitted.join(" ")
        }
        return code;
    }

    insertSymbolTable = (symbolTablePretty) => {
        let symbolTableString = "/*" + " ".repeat(22) + "Symbol Table\n" + symbolTablePretty + "*/\n"
        myCodeMirror.setValue(symbolTableString + codeWithoutSymbolTable(myCodeMirror.getValue()))
    }

    $('#run').click(async () => {
        let start_time = Date.now()
        let status_element = $('#status-message')
        let needCompilePicoC = animationState.activeCodeWindow === 1;
        if (needCompilePicoC) {
            status_element.text("Compiling PicoC code...")
            // Compile pico-c code. Remove Symbol table comment first,
            // or the symbol table positions will change. 
            let response = await compile_picoc(codeWithoutSymbolTable(myCodeMirror.getValue()))
            if (response.error) {
                status_element.text(response.error)
                return;
            } else if (response.compiledCode.warningsAndErrors) {
                status_element.text(response.compiledCode.warningsAndErrors)
                return;
            }
            insertSymbolTable(response.compiledCode.symbolTable)
            animationState.retiCode = response.compiledCode.retiCode
        }
        let retiCode = needCompilePicoC ? animationState.retiCode : myCodeMirror.getValue()
        status_element.text("Compiling ReTi assembler...")
        let response = await fetch_code(retiCode)
        let took = Date.now() - start_time
        if (response.error) {
            status_element.text(response.text.substring(0, 100))
            let line_number = Number.parseInt(response.text.split("in line ")[1].split(' "')[0])
            console.log("Error in line: " + line_number)
            return
        }
        let json = JSON.parse(response.text)
        status_element.text(`Execution successful (request took ${took}ms, execution finished: ${json.execution_finished}).`)
    })

    myCodeMirror = CodeMirror.fromTextArea(document.getElementById("code-window"),
    {
        mode: "reti",
        lineNumbers: true,
        enterMode: "keep",
        theme: "monokai"
    })

    this.animationState.retiCode = '; +------------------------------------------+' +
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
        '\n; Comments start with ";" or "#"' +
        '\n; Example program: fib.reti' +
        '\n;' +
        '\nLOAD DS 65534     ; access SRAM' +
        '\nLOADI SP 100      ; use SP as a counter (evil)' +
        '\nLOADI IN1 0       ; IN1 = 0' +
        '\nLOADI IN2 1       ; IN2 = 1' +
        '\nLOADI ACC 0       ; ACC = 0' +
        '\nMOVE IN1 ACC      ; ACC = IN1 + IN2' +
        '\nADD ACC IN2       ; ACC = IN1 + IN2' +
        '\nMOVE IN2 IN1      ; IN1 = IN2' +
        '\nMOVE ACC IN2      ; IN2 = ACC' +
        '\nSTOREIN SP IN1 0  ; store in SRAM' +
        '\nADDI SP 1         ; increment counter' +
        '\nJUMP -6            ; loop forever'
    this.animationState.picoCCode = "void main() {" +
        "\n    // Deklarationsteil" +
        "\n    int x;" +
        "\n    int y;" +
        "\n    int z;" +
        "\n    // Anweisungsteil" +
        "\n    while (1) {" +
        "\n        x = 0;" +
        "\n        y = 1;" +
        "\n        while (x < 255) {" +
        "\n            z = x + y;" +
        "\n            x = y;" +
        "\n            y = z;" +
        "\n        };" +
        "\n    }" +
        "\n}"
    myCodeMirror.setValue(this.animationState.retiCode)
})
