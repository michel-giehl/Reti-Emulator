import { retiValidator, picocCValidator } from "./linters.js"

const config = {
  numberStyle: 10,
  reti: null,
  retiStates: [],
  fetch: null,
  phase: 0,
  paused: false,
  running: false,
  mode: "reti",
  timer: null,
  editor: null,
  retiCode: null,
  picoCCode: null,
  uartCode: null,
  uartSimulation: null,
  showAnimation: true,
  undoAmount: 20,
  canvasScale: 0.6,
}

const registerNames = ["PC", "IN1", "IN2", "ACC", "SP", "BAF", "CS", "DS", "I"]

config.retiCode = 
'LOADI SP 100      ; use SP as counter' +
'\nLOADI IN1 0       ; IN1 = 0' +
'\nLOADI IN2 1       ; IN2 = 1' +
'\nLOADI ACC 0       ; ACC = 0' +
'\nMOVE IN1 ACC      ; ACC = IN1 + IN2' +
'\nADD ACC IN2       ; ACC = IN1 + IN2' +
'\nMOVE IN2 IN1      ; IN1 = IN2' +
'\nMOVE ACC IN2      ; IN2 = ACC' +
'\nSTOREIN SP IN1 0  ; store in SRAM' +
'\nADDI SP 1         ; increment counter' +
'\nJUMP -6           ; loop forever'

config.picoCCode = "void main() {" +
"\n    int x;" +
"\n    int y;" +
"\n    int z;" +
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

config.uartCode = "// Declarations" +
"\n\n// Loop" +
"\n\nconst loop = () => {" +
"\n    // Code goes here" +
"\n}"

$(function() {
  // Load defaults
  $('#yes').prop("checked", true)
  $('#no').prop("checked", false)
  $('#clockspeed').val(5)
  config.editor = CodeMirror.fromTextArea(document.getElementById("code-window"),
  {
      mode: "reti",
      lineNumbers: true,
      enterMode: "keep",
      theme: "monokai",
      gutters: ["CodeMirror-line-numbers", "CodeMirror-lint-markers"],
      lint: {options: {async: true}},
  })
  config.editor.setValue(config.retiCode)
  // Register Linter
  CodeMirror.registerHelper("lint", "reti", retiValidator)
  CodeMirror.registerHelper("lint", "clike", picocCValidator)
})

export { config, registerNames };
