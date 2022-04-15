/**
* used to compile reti and picoc code.
* @param code - string of code to compile
* @param language - language to compile ("reti" or "picoc")
*/
async function compile(code, language) {
    let response = await fetch("/compile", {method: "POST", headers: {"Language": language}, body: code})
    const text = await response.text()
    if (response.ok) {
        let json = JSON.parse(text)
        return json
    }
    return {error: !response.ok, text: text}
}

export { compile };