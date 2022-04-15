
import { compile } from "./api.js"
import { run_code } from "./run_code.js"
import { config } from "./global_vars.js"

function changeNumberStyle(base) {
    if (isNaN(base)) {
        baseMapping = {
            "Binary": 2,
            "Decimal": 10,
            "Hexadecimal": 16
        }
        base = baseMapping[base]
    }
    config.numberStyle = base
}

function changeTheme(theme) {
    config.editor.setOption("theme", theme)
}

function codeWithoutSymbolTable(code) {
    if (code.startsWith("/*                      Symbol Table")) {
        let codeSplitted = code.split("*/\n")
        codeSplitted.shift() // remove first comment
        code = codeSplitted.join(" ")
    }
    return code;
}

function insertSymbolTable(symbolTablePretty) {
    let symbolTableString = "/*" + " ".repeat(22) + "Symbol Table\n" + symbolTablePretty + "*/\n"
    config.editor.setValue(symbolTableString + codeWithoutSymbolTable(config.editor.getValue()))
}

async function compileAndRun(language = config.mode, startTime = Date.now()) {
    let statusElement = $('#status-message')
    // statusElement.text(`Compiling...`)
    let code = config.mode === language ? config.editor.getValue() : (language === "picoc" ? config.picoCCode : config.retiCode)
    let response = await compile(code, language)
    if (response.error || response.warnings_and_errors) {
        console.log("ERRORRRRR")
        statusElement.text(response.error || response.warnings_and_errors)
        return
    }
    if (language === "picoc") {
        config.retiCode = response.reti_code
        insertSymbolTable(response.symbol_table_pretty)
        // Compile reti
        await compileAndRun("reti", startTime=startTime)
    } else {
        run_code(response.code)
    }
    statusElement.text(`Compilation successful (finished after ${Date.now() - startTime}ms)`)
}

function switchToReTiCodeWindow() {
    config.picoCCode = config.editor.getValue()
    config.mode = "reti"
    config.editor.setOption("mode", "reti")
    config.editor.setValue(config.retiCode)
    $('#navbar-select-picoc').prop("disabled", false)
}

function switchToPicoCCodeWindow() {
    config.retiCode = config.editor.getValue()
    config.mode = "picoc"
    $('#navbar-select-reti').prop("disabled", false)
    config.editor.setOption("mode", "text/x-csrc")
    config.editor.setValue(config.picoCCode)
}

$(function() {

    $('#number-base-selector').change(function() {
        changeNumberStyle($(this).val())
    })


    $('#theme-selector').change(function() {
        changeTheme($(this).val().toLowerCase())
    })


    $('#stop').click(function() {
    })


    // Code Selector
    $('.navbar-item').click(function() {
        $(this).prop("disabled", true)
        let buttonText = $(this).text()
        if (buttonText === "ReTi") {
            switchToReTiCodeWindow()
        } else {
            switchToPicoCCodeWindow()
        }
    })


    $('#forward').click(function() {
    })


    $('#backward').click(function() {
    })


    $('#clockspeed').change(function() {
    })


    $('#run').click(async function() {
        compileAndRun()
    })
})