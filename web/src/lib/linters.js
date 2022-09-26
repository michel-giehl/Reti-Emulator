import { compile } from "$lib/controls"

async function retiValidator(text, options) {
    let found = []
    let result = await compile(text, "reti")
    if (result.error) {
        let line = Number.parseInt(result.text.split("in line ")[1].split(" ")[0])
        found.push({
            message: result.text.split("in line ")[0],
            severity: "error",
            from: CodeMirror.Pos(line - 1, 0),
            to: CodeMirror.Pos(line - 1, text.split("\n")[line - 1].length)
        })
    }
    return found
}

async function picoCValidator(text, options) {
    let found = []
    let result = await compile(text, "picoc")
    if (result.text.error) {
        let output = result.text.message.split("\n")[0]
        let line = output.split(":")[1]
        let char = output.split(":")[2]
        found.push({
            message: output,
            severity: "error",
            from: CodeMirror.Pos(line - 1, char),
            to: CodeMirror.Pos(line - 1, text.split("\n")[line - 1].length)
        })
    }
    return found
}

export { retiValidator, picoCValidator };
