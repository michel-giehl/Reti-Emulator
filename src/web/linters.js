import { compile } from "./api.js"

async function retiValidator(text, options) {
    let found = []
    let result = await compile(text, "reti")
    if (result.error) {
        let line = Number.parseInt(result.error.split("in line ")[1].split(" ")[0])
        found.push({
            message: result.error.split("in line ")[0],
            severity: "error",
            from: CodeMirror.Pos(line - 1, 0),
            to: CodeMirror.Pos(line - 1, text.split("\n")[line - 1].length)
        })
    }
    return found
}

async function picocCValidator(text, options) {
    let found = []
    let result = await compile(text, "picoc")
    if (result.warnings_and_errors) {
        let output = result.warnings_and_errors
        let isError = output.includes("Compilation unsuccessfull")
        if (isError)  {
            let line = output.split(":")[1]
            let char = output.split(":")[2]
            found.push({
                message: output,
                severity: "error",
                from: CodeMirror.Pos(line - 1, char),
                to: CodeMirror.Pos(line - 1, text.split("\n")[line - 1].length)
            })
        } else {
            let warnings = []
            let lines = output.split("\n")
            let currWarning = ""
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith("/tmp/") && currWarning.length > 0) {
                    warnings.push(currWarning)
                    currWarning = ""
                }
                currWarning += lines[i] + "\n"
            }
            warnings.push(currWarning)
            warnings.forEach(warning => {
                let line = warning.split(":")[1]
                let char = warning.split(":")[2]
                found.push({
                    message: warning,
                    severity: "warning",
                    from: CodeMirror.Pos(line - 1, char),
                    to: CodeMirror.Pos(line - 1, char + 100)
                })
            })
        }
    }
    return found
}

export { retiValidator, picocCValidator };