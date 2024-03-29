
import { compile } from "./api.js"
import { previousReTiState, nextReTiState, run_code, updateClockSpeed } from "./run_code.js"
import { config } from "./global_vars.js"
import { draw } from "./canvas.js"

function changeNumberStyle(base) {
  if (isNaN(base)) {
      let baseMapping = {
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

function statusText(text) {
    let statusElement = $('#status-message')
    statusElement.text(text)
    setTimeout(() => {
        if (statusElement.text() === text) {
            statusElement.text("")
        }
    }, 2500)
}

async function compileAndRun(language = config.mode, startTime = Date.now()) {
    statusText(`Compiling...`)
    if (language === "uart") {
        statusText('You must select ReTi or Pico C code to run!')
        return
    }
    let code = config.mode === language ? config.editor.getValue() : (language === "picoc" ? config.picoCCode : config.retiCode)
    let response = await compile(code, language)
    if (response.error || response.warnings_and_errors) {
        statusText(response.error || response.warnings_and_errors)
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
    statusText(`Compilation successful (finished after ${Date.now() - startTime}ms)`)
}

function handleNavBar(element) {
    const active = $('.navbar-item-active')
    if ($(active)[0].id === $(element)[0].id)
        return
    $(active).removeClass('navbar-item-active')
    $(element).addClass('navbar-item-active')
    const currentMode = config.mode
    const newMode = $(element)[0].id.split('-')[2]
    config.mode = newMode
    const code = config.editor.getValue()
    switch (currentMode) {
        case 'reti':
            config.retiCode = code
            break
        case 'picoc':
            config.picoCCode = code
            break
        case 'uart':
            config.uartCode = code
            break
    }
    switch (newMode) {
        case 'reti':
            config.editor.setOption('mode', 'reti')
            config.editor.setValue(config.retiCode)
            break
        case 'picoc':
            config.editor.setOption('mode', 'text/x-csrc')
            config.editor.setValue(config.picoCCode)
            break
        case 'uart':
            config.editor.setOption('mode', 'javascript')
            config.editor.setValue(config.uartCode)
            break
    }
}

$(function() {

    $('#number-base-selector').change(function() {
        changeNumberStyle($(this).val())
    })


    $('#theme-selector').change(function() {
        changeTheme($(this).val().toLowerCase())
    })


    $('#stop').click(function() {
        config.paused = !config.paused
        if (config.paused) {
            document.getElementById("stop").value = "Unpause"
            document.getElementById("forward").hidden = false
            document.getElementById("backward").hidden = false
        } else {
            document.getElementById("stop").value = "Pause"
            document.getElementById("forward").hidden = true
            document.getElementById("backward").hidden = true
        }
    })


    // Code Selector
    $('.navbar-item').click(function() {
      handleNavBar($(this))
    })


    $('#forward').click(function() {
        if (config.running) {
            nextReTiState()
        }
    })


    $('#backward').click(function() {
        if (config.running) {
            previousReTiState()
        }
    })


    $('#clockspeed').change(function() {
        updateClockSpeed()
        if ($(this).val() <= 1) {
            $(this).attr("step", "0.1")
        } else if ($(this).val() == "1.1") {
            $(this).val("2")
            $(this).attr("step", "1")
        } else if ($(this).val() == "0") {
            $(this).val("0.1")
        } else {
            $(this).attr("step", "1")
        }
    })


    $('#run').click(async function() {
        compileAndRun()
    })

    $('#yes').change(function() {
        if ($(this).prop("checked")) {
            $('#container').show()
            config.showAnimation = true
        }
    })

    $('#no').change(function() {
        if ($(this).prop("checked")) {
            $('#container').hide()
            config.showAnimation = false
        }
    })

    $('#simple').change(function() {
        window.location.href = "/ti/index.html";
    })

    $('#canvas-scale').change(function() {
        const defaultScale = 0.6
        const increment = defaultScale / 10
        config.canvasScale = 10 * $(this).val() * increment
        draw()
    })
})
