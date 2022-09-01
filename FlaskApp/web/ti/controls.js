
import { nextReTiState, run_code, updateClockSpeed } from "./run_code.js"
import { config } from "./global_vars.js"

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
            // document.getElementById("backward").hidden = false
        } else {
            document.getElementById("stop").value = "Pause"
            document.getElementById("forward").hidden = true
            document.getElementById("backward").hidden = true
        }
    })


    $('#forward').click(function() {
        if (config.running) {
            nextReTiState()
        }
    })


    $('#backward').click(function() {
        alert("Work in progress")
    })


    $('#clockspeed').change(function() {
        updateClockSpeed()
    })


    $('#run').click(async function() {
        run_code(config.editor.getValue())
    })


    $('#advanced').change(function() {
        window.location.href = "/";
    })
})
