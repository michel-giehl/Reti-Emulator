const config = {
  numberStyle: 10,
  reti: null,
  paused: false,
  running: false,
  mode: "reti",
  timer: null,
  editor: null,
}

const registerNames = ["PC", "IN1", "IN2", "ACC", "I"]

config.retiCode = 'JUMP 0'

$(function() {
  // Load defaults
  $('#yes').prop("checked", true)
  $('#no').prop("checked", false)
  $('#clockspeed').val(5)
  config.editor = CodeMirror.fromTextArea(document.getElementById("code-window"),
  {
      mode: "reti-simple",
      lineNumbers: true,
      enterMode: "keep",
      theme: "monokai",
      gutters: ["CodeMirror-line-numbers"],
  })
  config.editor.setValue(config.retiCode)
})

export { config, registerNames };