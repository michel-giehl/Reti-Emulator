export function convertToUpperNumber(num: number) {
    const upperNumbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
    let numbers = []
    if (num === 0) return upperNumbers.at(0)
    while (num > 0) {
        numbers.push(num % 10)
        num -= num % 10
        num /= 10
    }
    numbers.reverse()
    let str = ""
    for (let n of numbers) {
        str += upperNumbers[n]
    }
    return `${str}`
}

export function stringifyNumber(numStr: string, numberStyle: number) {
    let num = Number.parseInt(numStr)
    if (numberStyle === 10) {
        return num.toString(10)
    }
    // show negative numbers as 2s complement.
    num = num >>> 0
    let result = num === NaN ? "0" : num.toString(numberStyle)
    if (numberStyle === 2) {
        let last = result.at(-1)
        let count = 0
        for (let i = result.length - 1; i > 0; i--) {
            if (result.at(i) !== last) {
                break
            }
            count++
        }
        if (count > 4) {
            result = result.substring(0, result.length - count) + `${last}${convertToUpperNumber(count)}`
        }
    }
    return result
}