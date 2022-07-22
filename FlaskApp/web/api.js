/**
* Compile reti/picoc code
*
* @param {string}         code     string of code to compile
* @param {"reti"|"picoc"} language language to compile ("reti" or "picoc")
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