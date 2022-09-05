import { registerNames, numberStyle, showAnimation, canvasScale, strokeColor } from "$lib/reti/global_vars"
import { decompile } from "$lib/reti/reti_decompiler.js"
import { convertToUpperNumber, stringifyNumber } from "$lib/NumberUtils"
import Konva from "konva"

let stage = null
let layer = null

const colorPalette = {
    stroke: "black",
    primary: "#0057e7", // blue
    secondary: "#d62d20", // red
    fourth: "#ffa700", // orange
    fifth: "#008744", // green
}

let $numberStyle;
let $showAnimation;
let $canvasScale;

numberStyle.subscribe(v => $numberStyle = v);
showAnimation.subscribe(v => $showAnimation = v);
canvasScale.subscribe(v => $canvasScale = v);
strokeColor.subscribe(v => {
    colorPalette.stroke = v;
});



const registerDriverNames = ["0Ld", "PCLd", "IN1Ld", "IN2Ld", "ACCLd", "SPLd", "BAFLd", "CSLd", "DSLd", "0Rd", "IRd", "DRd"]
const registerToDataPathDriverNames = ["PCDd", "IN1Dd", "IN2Dd", "ACCDd", "SPDd", "BAFDd", "CSDd", "DSDd"]

const aluModes = [
    { text: "+", size: 40 },
    { text: "-", size: 40 },
    { text: "⋅", size: 40 },
    { text: "÷", size: 40 },
    { text: "%", size: 40 },
    { text: "XOR", size: 20 },
    { text: "OR", size: 20 },
    { text: "AND", size: 20 },
]

const options = {
    primary: {
        strokeWidth: 5,
    },
    secondary: {
        strokeWidth: 3,
    },
    tertiary: {
        strokeWidth: 2,
    },
    driverSize: 50,
}

/**
 * @param {number} fromX
 * @param {number} toX
 * @param {number} fromY
 * @param {number} toY
 * @param {object} opts custom options for the Konva Shape such as strokeWidth, fillcolor, etc. Visit {@link https://konvajs.org/api/Konva.Shape.html} for more
 */
function drawLine(fromX, fromY, toX, toY, opts) {
    let shape = new Konva.Shape({
        sceneFunc: function (ctx, shape) {
            ctx.beginPath()
            ctx.moveTo(fromX, fromY)
            ctx.lineTo(toX, toY)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
        }
    })
    shape.perfectDrawEnabled(false)
    // TODO find better way
    for (const key in opts) {
        shape[key](opts[key])
    }
    layer.add(shape)
}

/**
 * 
 * @param {number} x
 * @param {number} y
 * @param {number} rotation
 * @param {number} size
 * @param {number} strokeWidth
 * @param {number} textX
 * @param {number} textY
 * @param {string} text
 * @param {object} opts        custom options for the {@link Konva.RegularPolygon} such as strokeWidth, fillcolor, etc. Visit {@link https://konvajs.org/api/Konva.RegularPolygon.html} for more 
 * @param {number} textAlign   either 1 to align the text on the right, 0 to align it on the left. 0.5 to align at the center
 */
function drawDriver(x, y, rotation, size, strokeWidth, textX, textY, text, opts, textAlign = 1) {
    let driver = new Konva.RegularPolygon({
        sides: 3,
        rotation: rotation,
        height: size,
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        x: x,
        y: y,
    })

    // apply custom options
    for (const key in opts) {
        driver[key](opts[key])
    }

    let textElement = new Konva.Text({
        x: textX,
        y: textY,
        fill: colorPalette.primary,
        text: text,
        fontSize: 25,
        fontFamily: 'Arial',
    })

    // right align
    textElement.offsetX(textAlign * textElement.width())

    layer.add(textElement)
    layer.add(driver)
    return driver
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} height
 * @param {string} registerText register name
 * @param {string} driverText   driver name
 */
function drawRegister(x, y, height, registerText, driverText) {
    let strokeWidth = options.secondary.strokeWidth

    let registerWidth = 80
    let registerHeight = 40
    let arrowLength = 40

    let registerName = `register-${registerText.toLowerCase()}`

    let segments = [
        `${registerName}-in`,
        `${registerName}-active`,
        `${registerName}-ck-enable`,
        `${registerName}-out`,
        `${registerName}-driver-active`
    ]

    let dataPathToRegister = new Konva.Arrow({
        x: x,
        y: y,
        points: [0, 0, 0, arrowLength],
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        fill: colorPalette.stroke,
        name: segments[0],
    })

    let register = new Konva.Rect({
        x: x - registerWidth / 2,
        y: y + arrowLength + strokeWidth,
        width: registerWidth,
        height: registerHeight,
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    let textRegister = new Konva.Text({
        x: x,
        y: 5 + y + arrowLength + registerHeight / 2,
        fill: colorPalette.secondary,
        text: registerText,
        fontSize: 35,
        name: segments[2],
    })
    // center text
    textRegister.offsetX(textRegister.width() / 2)
    textRegister.offsetY(textRegister.height() / 2)

    const ckenText = new Konva.Text({
        x: x - 12,
        y: y + 18,
        fill: colorPalette.fifth,
        visible: false,
        text: `/${registerText}cken`,
        fontSize: 18,
        name: segments[2],
    })
    // right align
    ckenText.offsetX(ckenText.width())

    let bottomPartHeight = height - registerHeight - arrowLength - strokeWidth
    let dataPathToDriverStartY = y + arrowLength + registerHeight + strokeWidth

    drawRegisterBottom(x, dataPathToDriverStartY, bottomPartHeight, driverText, 40, [segments[3], segments[4], segments[4]])


    layer.add(register)
    layer.add(textRegister)
    layer.add(ckenText)
    layer.add(dataPathToRegister)
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} height 
 * @param {string} driverText 
 * @param {number} arrowLength 
 * @param {Array.<string>} segments names of the 3 segments (line, driver, arrow). Used for the animation
 */
function drawRegisterBottom(x, y, height, driverText, arrowLength, segments = undefined) {

    let strokeWidth = options.secondary.strokeWidth
    let driverY = y + height

    drawLine(x, y, x, driverY + 18, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments?.at(0) ?? null,
    })

    drawDriver(x,
        driverY + 30,
        180,
        50,
        3,
        x - 5,
        driverY + arrowLength + 15,
        driverText,
        {
            name: segments?.at(1) ?? null,
        }
    )

    let dataPathToALU = new Konva.Arrow({
        x: x,
        y: 55 + driverY,
        points: [0, 0, 0, arrowLength],
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        fill: colorPalette.stroke,
        name: segments?.at(2) ?? null,
    })
    layer.add(dataPathToALU)
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {string} driverText 
 * @param {string} registerName 
 */
function drawRegisterPathToAddressPath(x, y, driverText, registerName) {
    registerName = registerName.toLowerCase()
    let strokeWidth = options.secondary.strokeWidth

    let segments = [
        `register-${registerName}-out`,
        `register-${registerName}-driver-address-path-active`,
    ]

    let connection = new Konva.Circle({
        x: x,
        y: y,
        radius: 5,
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke,
        name: segments[0],
    })

    let lineLength = -30
    drawLine(x, y, x + lineLength, y, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    drawLine(x + lineLength, y, x + lineLength, y + 380, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    drawDriver(
        x + lineLength,
        y + 394,
        180,
        60,
        strokeWidth,
        x + lineLength - 5,
        y + 420,
        driverText,
        {
            name: segments[1],
        }
    )

    let arrow = new Konva.Arrow({
        x: x + lineLength,
        y: y + 420,
        points: [0, 0, 0, 155],
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    layer.add(connection)
    layer.add(arrow)
}

/**
 * 
 * @param {number} startX 
 * @param {number} startY 
 * @param {number} endX 
 * @param {number} endY 
 * @param {string} driverText 
 * @param {string} registerName 
 */
function drawRegisterPathToDataPath(startX, startY, endX, endY, driverText, registerName) {
    let strokeWidth = options.tertiary.strokeWidth

    let segments = [
        `register-${registerName.toLowerCase()}-out`,
        `register-${registerName.toLowerCase()}-driver-data-path-active`
    ]

    let connection = new Konva.Circle({
        x: startX,
        y: startY,
        radius: 5,
        fill: colorPalette.stroke,
        name: segments[0],
    })

    let lineLength = 20
    drawLine(startX, startY, startX + lineLength, startY, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    let driverX = startX + lineLength + 12
    let driverSize = 50
    drawDriver(
        driverX,
        startY,
        90,
        driverSize,
        strokeWidth,
        startX + 10,
        startY - 50,
        driverText,
        {
            name: segments[1],
        },
        0
    )

    drawLine(startX + driverSize + 3, startY, endX, startY, { stroke: colorPalette.stroke, strokeWidth: strokeWidth, name: segments[1] })

    let arrow = new Konva.Arrow({
        x: endX,
        y: endY,
        points: [0, startY - endY, 0, 0],
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        fill: colorPalette.stroke,
        name: segments[1],
    })

    layer.add(connection)
    layer.add(arrow)
}

function drawDataPath(posX, posY) {
    let strokeWidth = options.primary.strokeWidth

    let segments = [
        "data-path-left",
        "data-path-right",
        "data-path-driver-active"
    ]

    // Data Line left side
    drawLine(posX, posY, posX + 1010, posY, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0]
    })

    // Data Line right side
    drawLine(posX + 1070, posY, posX + 3000, posY, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    let driverX = 1050 + posX
    drawDriver(
        driverX,
        posY,
        270,
        80,
        strokeWidth,
        driverX + 20,
        posY - 70,
        "DDId",
        {
            name: segments[2]
        },
        1
    )

    let textDI = new Konva.Text({
        x: posX + 30,
        y: posY - 50,
        text: 'DI',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: colorPalette.fifth,
    })

    let textD = new Konva.Text({
        x: posX + 1450,
        y: posY - 50,
        text: 'D',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: colorPalette.fifth,
    })

    layer.add(textDI)
    layer.add(textD)
    // done
}

function drawAddressPath(posX, posY) {

    let strokeWidth = options.primary.strokeWidth


    let segments = [
        'address-path'
    ]

    drawLine(posX, posY, posX + 3000, posY, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    let textD = new Konva.Text({
        x: posX + 1450,
        y: posY + 20,
        text: 'A',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: colorPalette.fifth,
    })

    layer.add(textD)
    // done
}

function drawALULanes(x, y, gapSize) {
    let strokeWidth = options.primary.strokeWidth

    let segments = [
        'alu-lane-left',
        'alu-lane-right',
    ]

    let xOffset = 1070
    let endXLeft = x + xOffset
    let beginXRight = endXLeft + gapSize
    let endXRight = x + 1500
    // left side
    drawLine(x, y, endXLeft, y, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    // right side
    drawLine(beginXRight, y, endXRight, y, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    let textL = new Konva.Text({
        x: x + 350,
        y: y + 20,
        text: 'L',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: colorPalette.fifth,
    })

    let textR = new Konva.Text({
        x: x + 1380,
        y: y + 20,
        text: 'R',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: colorPalette.fifth,
    })

    layer.add(textL)
    layer.add(textR)
}

function drawALU(x, y, gapSize) {
    let segments = [
        'alu-lane-right',
        'alu-lane-left',
        'alu-out',
        'alu-mode-text'
    ]
    let leftArrow = new Konva.Arrow({
        x: x - 10,
        y: y,
        points: [0, 0, 0, 60],
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke,
        strokeWidth: options.tertiary.strokeWidth,
        name: segments[1],
    })

    let arrowLength = 60
    let rightArrow = new Konva.Arrow({
        x: x + gapSize + 10,
        y: y,
        points: [0, 0, 0, arrowLength],
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke,
        strokeWidth: options.tertiary.strokeWidth,
        name: segments[0],
    })

    let overlap = 50
    let beginX = x - overlap
    let endX = x + gapSize + overlap
    let beginY = y + arrowLength
    let endY = beginY + 120
    let length = 90
    let alu = new Konva.Shape({
        sceneFunc: function (ctx, shape) {
            ctx.beginPath()
            ctx.moveTo(beginX, beginY)
            ctx.lineTo(beginX + length, beginY)
            ctx.lineTo(beginX + (endX - beginX) / 2, beginY + 34)
            ctx.lineTo(endX - length, beginY)
            ctx.lineTo(endX, beginY)
            ctx.lineTo(endX - 50, endY)
            ctx.lineTo(beginX + 50, endY)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
        },
        stroke: colorPalette.stroke,
        strokeWidth: options.secondary.strokeWidth,
        name: segments[2],
    })

    let aluModeText = new Konva.Text({
        x: beginX - 20,
        y: endY - (endY - beginY) / 2,
        fontSize: 40,
        text: "+",
        fill: "black",
        name: segments[3]
    })

    aluModeText.offsetY(aluModeText.height() / 2)

    let aluText = new Konva.Text({
        x: beginX + (endX - beginX) / 2,
        y: endY - 50,
        fontSize: 40,
        text: "ALU",
        fill: colorPalette.secondary,
    })

    aluText.offsetX(aluText.width() / 2)

    layer.add(leftArrow)
    layer.add(rightArrow)
    layer.add(alu)
    layer.add(aluText)
    layer.add(aluModeText)
}

function drawALUToDataPath(x, y, driverText) {
    let strokeWidth = options.secondary.strokeWidth

    let segments = [
        'alu-out',
        'alu-driver-data-path-active'
    ]

    let connection = new Konva.Circle({
        x: x,
        y: y,
        radius: 5,
        fill: colorPalette.stroke,
        name: segments[0],
    })

    let lineLength = 1180
    // horizontal line
    drawLine(x, y, x - lineLength, y, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    // vertical line
    drawLine(x - lineLength, y, x - lineLength, y - 138, {
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    let arrow = new Konva.Arrow({
        x: x - lineLength,
        y: 102,
        points: [0, y - 276, 0, 0],
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    drawDriver(
        x - lineLength,
        y - 150,
        0,
        50,
        strokeWidth,
        x - lineLength + 15,
        y - 180,
        driverText,
        {
            name: segments[1],
        },
        0 // text left aligned
    )

    layer.add(connection)
    layer.add(arrow)
}

function drawSRAM(x, y, reti, ram, name, driverNames) {
    const strokeWidth = options.secondary.strokeWidth
    const width = 350
    const height = 500

    const segments = [
        `${name.toLowerCase()}-read`,
        `${name.toLowerCase()}-write`,
        `${name.toLowerCase()}-address`,
    ]

    // SRAM
    const rect = new Konva.Rect({
        x: x - width / 2,
        y: y + 140,
        width: width,
        height: height,
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
        // name: segments[1],
    })

    // Data path into SRAM
    drawRegisterBottom(x - 70, y, (185 - y) / 2, driverNames[0], (185 - y) / 2, [segments[1], segments[1], segments[1]])
    // SRAM to Data path
    let pos = { x: x + 70, y: 200 - y }
    const arrow = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 70, 0, 0],
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0],
    })
    // SRAM to data path
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 15, pos.y + 55, driverNames[1], {
        name: segments[0]
    }, 1)
    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })
    pos = { x: x, y: y + 640 }
    const asmArrow = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 69, 0, 0],
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[2],
    })
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 15, pos.y + 55, driverNames[2], {
        name: segments[2],
    }, 1)

    const numBitsText = new Konva.Text({
        x: pos.x + 45,
        y: pos.y + 75,
        fontSize: 35,
        fontFamily: "Arial",
        text: "16",
        fill: colorPalette.fifth,
    })

    const bitsText = new Konva.Text({
        x: pos.x + 45,
        y: pos.y + 155,
        fontSize: 30,
        fontFamily: "Arial",
        text: `a${convertToUpperNumber(0)} ... a${convertToUpperNumber(15)}`,
        fill: colorPalette.stroke,
    })

    const arrowFromBitTextToNumBits = new Konva.Arrow({
        x: pos.x + 68,
        y: pos.y + 110,
        points: [20, 50, 0, 0],
        strokeWidth: 2,
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke
    })

    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[2],
    })

    const textSRAM = new Konva.Text({
        x: x,
        y: y + 150,
        fontSize: 40,
        text: name,
        fill: colorPalette.secondary,
    })
    textSRAM.offsetX(textSRAM.width() / 2)

    if (reti) {
        const numElementsToShow = 15
        const sram = ram
        let dataText = []
        let addressText = []
        for (let i = 0; i < sram.length; i++) {
            let data = sram[i]
            if (data !== undefined) {
                addressText.push(i + "")
                if (ram === reti.sram) {
                    dataText.push(`${i < reti.bds && $numberStyle !== 2 ? decompile(Number.parseInt(data)) : stringifyNumber(data)}`)
                } else {
                    dataText.push(stringifyNumber(data))
                }
            }
        }
        let text = new Konva.Text({
            x: x + 50,
            y: y + 200,
            fontSize: 25,
            fontFamily: "monospace",
            text: dataText.slice(-numElementsToShow).join("\n"),
            fill: colorPalette.stroke,
        })
        text.offsetX(text.width() / 2)

        let text2 = new Konva.Text({
            x: x - 120,
            y: y + 200,
            fontSize: 25,
            fontFamily: "monospace",
            text: addressText.slice(-numElementsToShow).join("\n"),
            fill: colorPalette.stroke,
        })
        text2.offsetX(text2.width() / 2)

        layer.add(text)
        layer.add(text2)
    }

    layer.add(rect)
    layer.add(textSRAM)
    layer.add(arrow)
    layer.add(asmArrow)
    layer.add(numBitsText)
    layer.add(bitsText)
    layer.add(arrowFromBitTextToNumBits)
}

function drawEPROM(x, y, reti, name, driverNames) {
    const strokeWidth = options.secondary.strokeWidth
    const width = 350
    const height = 500

    const segments = [
        `${name.toLowerCase()}-read`,
        `${name.toLowerCase()}-address`,
    ]

    // EPROM
    const rect = new Konva.Rect({
        x: x - width / 2,
        y: y + 140,
        width: width,
        height: height,
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
    })

    // SRAM to Data path
    let pos = { x: x, y: 200 - y }
    const arrow = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 70, 0, 0],
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0],
    })
    // SRAM to data path
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 15, pos.y + 55, driverNames[0], {
        name: segments[0]
    }, 1)

    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })
    pos = { x: x, y: y + 640 }
    const asmArrow = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 69, 0, 0],
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[2],
    })
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 15, pos.y + 55, driverNames[1], {
        name: segments[2],
    }, 1)

    const numBitsText = new Konva.Text({
        x: pos.x + 45,
        y: pos.y + 75,
        fontSize: 35,
        fontFamily: "Arial",
        text: "15",
        fill: colorPalette.fifth,
    })

    const bitsText = new Konva.Text({
        x: pos.x + 45,
        y: pos.y + 155,
        fontSize: 30,
        fontFamily: "Arial",
        text: `a${convertToUpperNumber(0)} ... a${convertToUpperNumber(14)}`,
        fill: colorPalette.stroke,
    })

    const arrowFromBitTextToNumBits = new Konva.Arrow({
        x: pos.x + 68,
        y: pos.y + 110,
        points: [20, 50, 0, 0],
        strokeWidth: 2,
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke
    })

    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[2],
    })

    let textSRAM = new Konva.Text({
        x: x,
        y: y + 150,
        fontSize: 40,
        text: name,
        fill: colorPalette.secondary,
    })
    textSRAM.offsetX(textSRAM.width() / 2)

    if (reti) {
        const numElementsToShow = 15
        const sram = reti.eprom
        let dataText = []
        let addressText = []
        for (let i = 0; i < sram.length; i++) {
            let data = sram[i]
            if (data !== undefined) {
                addressText.push(i + "")
                dataText.push(stringifyNumber(data))
            }
        }
        let text = new Konva.Text({
            x: x + 50,
            y: y + 200,
            fontSize: 25,
            fontFamily: "monospace",
            text: dataText.slice(-numElementsToShow).join("\n"),
            fill: colorPalette.stroke,
        })
        text.offsetX(text.width() / 2)

        let text2 = new Konva.Text({
            x: x - 120,
            y: y + 200,
            fontSize: 25,
            fontFamily: "monospace",
            text: addressText.slice(-numElementsToShow).join("\n"),
            fill: colorPalette.stroke,
        })
        text2.offsetX(text2.width() / 2)

        layer.add(text)
        layer.add(text2)
    }

    layer.add(rect)
    layer.add(textSRAM)
    layer.add(arrow)
    layer.add(asmArrow)
    layer.add(numBitsText)
    layer.add(bitsText)
    layer.add(arrowFromBitTextToNumBits)
}

function drawUART(x, y, reti, name, driverNames) {
    const strokeWidth = options.secondary.strokeWidth
    const width = 350
    const height = 500

    const segments = [
        `${name.toLowerCase()}-read`,
        `${name.toLowerCase()}-write`,
        `${name.toLowerCase()}-address`,
    ]

    // UART
    const rect = new Konva.Rect({
        x: x - width / 2,
        y: y + 140,
        width: width,
        height: height,
        stroke: colorPalette.stroke,
        strokeWidth: strokeWidth,
    })

    // UART to Data path
    let pos = { x: x, y: 200 - y }
    const arrow = new Konva.Arrow({
        x: pos.x + 50,
        y: pos.y,
        points: [0, 50, 0, 0],
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0],
    })

    // UART to data path
    drawDriver(pos.x + 50, pos.y + 70, 0, 50, 3, pos.x + 60, pos.y + 35, driverNames[2], {
        name: segments[0]
    }, 0)

    // line going out of uart
    drawLine(pos.x, pos.y + 110, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })

    // conncetion circle
    const circle = new Konva.Circle({
        x: pos.x,
        y: pos.y + 110,
        radius: 4,
        fill: colorPalette.stroke,
        stroke: colorPalette.stroke,
    })

    // line going to UDd
    drawLine(pos.x, pos.y + 110, pos.x + 50, pos.y + 83, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })

    drawLine(pos.x + 100, pos.y + 110, pos.x + 50, pos.y + 83, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })

    const zerosText = new Konva.Text({
        x: pos.x + 105,
        y: pos.y + 100,
        fontSize: 35,
        fontFamily: "Arial",
        text: `0${convertToUpperNumber(24)}`,
        fill: colorPalette.secondary,
    })

    drawLine(pos.x + 10, pos.y + 80, pos.x + 40, pos.y + 110, {
        strokeWidth: options.tertiary.strokeWidth,
        stroke: colorPalette.stroke,
    })

    const eightText = new Konva.Text({
        x: pos.x,
        y: pos.y + 55,
        fontSize: 28,
        fontFamily: "Arial",
        text: `8`,
        fill: colorPalette.fifth,
    })

    // line from uart to DUd (right)
    drawLine(pos.x, pos.y + 110, pos.x - 50, pos.y + 110, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })

    // line from uart to DUd (up)
    drawLine(pos.x - 50, pos.y + 82, pos.x - 50, pos.y + 111, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })

    // line from data path to DUd
    drawLine(pos.x - 50, pos.y, pos.x - 50, pos.y + 48, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[0]
    })

    // DUd
    drawDriver(pos.x - 50, pos.y + 60, 180, options.driverSize, strokeWidth, pos.x - 62, pos.y + 70, driverNames[1], {}, 1)


    pos = { x: x, y: y + 640 }
    const asmArrow = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 69, 0, 0],
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[2],
    })
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 15, pos.y + 55, driverNames[0], {
        name: segments[2],
    }, 1)
    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: colorPalette.stroke,
        name: segments[2],
    })

    let textSRAM = new Konva.Text({
        x: x,
        y: y + 150,
        fontSize: 40,
        text: name,
        fill: colorPalette.secondary,
    })
    textSRAM.offsetX(textSRAM.width() / 2)

    let dataText = []
    for (let i = 0; i < 8; i++) {
        dataText.push(reti?.uart?.at(i) ?? 0)
    }
    let text = new Konva.Text({
        x: x + 50,
        y: y + 200,
        fontSize: 25,
        fontFamily: "monospace",
        text: dataText.map((e) => e.toString(2).padStart(8, "0")).join("\n"),
        fill: colorPalette.stroke,
    })
    text.offsetX(text.width() / 2)

    let text2 = new Konva.Text({
        x: x - 120,
        y: y + 200,
        fontSize: 25,
        fontFamily: "monospace",
        text: [...Array(8).keys()].map((e) => `R${e}`).join("\n"),
        fill: colorPalette.stroke,
    })
    text2.offsetX(text2.width() / 2)

    const numBitsText = new Konva.Text({
        x: pos.x + 45,
        y: pos.y + 75,
        fontSize: 35,
        fontFamily: "Arial",
        text: "3",
        fill: colorPalette.fifth,
    })

    const bitsText = new Konva.Text({
        x: pos.x + 45,
        y: pos.y + 155,
        fontSize: 30,
        fontFamily: "Arial",
        text: `a${convertToUpperNumber(0)} ... a${convertToUpperNumber(2)}`,
        fill: colorPalette.stroke,
    })

    const arrowFromBitTextToNumBits = new Konva.Arrow({
        x: pos.x + 60,
        y: pos.y + 110,
        points: [30, 50, 0, 0],
        strokeWidth: 2,
        stroke: colorPalette.stroke,
        fill: colorPalette.stroke
    })

    layer.add(text)
    layer.add(text2)
    layer.add(rect)
    layer.add(textSRAM)
    layer.add(arrow)
    layer.add(circle)
    layer.add(asmArrow)
    layer.add(numBitsText)
    layer.add(bitsText)
    layer.add(arrowFromBitTextToNumBits)
    layer.add(zerosText)
    layer.add(eightText)
}


function setALUMode(num) {
    let mode = aluModes[num]
    let textElement = stage.findOne('.alu-mode-text')
    textElement.text(mode.text)
    textElement.fontSize(mode.size)
}

function animateFetch(phase) {
    const PC2AddressPath = [
        "register-pc-active",
        "register-pc-out",
        "register-pc-driver-address-path-active",
        "address-path",
        "sram-address",
    ]

    const dataPath2I = [
        "data-path-right",
        "register-i-in",
        "register-i-active",
        "sram-read",
    ]
    switch (phase) {
        case 0:
            animate(PC2AddressPath)
            break
        case 1:
            animate([...PC2AddressPath, ...dataPath2I, "register-i-ck-enable"])
            break
        case 2:
            animate(dataPath2I)
            break
    }
}

function animateLOAD(register, phase) {
    register = register.toLowerCase()
    const I2AddressPath = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-address-path-active",
        "address-path"
    ]

    const dataPath2Register = [
        "data-path-left",
        "data-path-right",
        "data-path-driver-active",
        `register-${register}-in`,
        `register-${register}-active`,
    ]
    switch (phase) {
        case 0:
            animate(I2AddressPath)
            break
        case 1:
            animate([...I2AddressPath, ...dataPath2Register, "sram-read", "sram-address"])
            break
        case 2:
            animate([...I2AddressPath, ...dataPath2Register, `register-${register}-ck-enable`, "sram-read", "sram-address"])
            break
        case 3:
            animate(dataPath2Register)
            break
    }
}

function animateLOADIN(source, dest, phase) {
    source = source.toLowerCase()
    dest = dest.toLowerCase()
    const I2ALU = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-active",
        `register-${source}-active`,
        `register-${source}-out`,
        `register-${source}-driver-active`,
        "alu-lane-right",
        "alu-lane-left",
        "alu-out",
        "alu-driver-address-path-active",
        "address-path"
    ]

    const dataPath2Register = [
        "data-path-left",
        "data-path-right",
        "data-path-driver-active",
        `register-${dest}-in`,
        `register-${dest}-active`,
        "sram-read",
        "sram-address",
    ]
    switch (phase) {
        case 0:
            animate(I2ALU)
            break
        case 1:
            animate([...I2ALU, ...dataPath2Register])
            break
        case 2:
            animate([...I2ALU, ...dataPath2Register, `register-${dest}-ck-enable`])
            break
        case 3:
            animate(dataPath2Register)
            break
    }
}

function animateLOADI(register, phase) {
    register = register.toLowerCase()
    setALUMode(0)
    const I2ALU = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-active",
        "alu-lane-right",
        "alu-lane-left",
        "0-left-active",
        "alu-out"
    ]

    const alu2DataPath = [
        "alu-driver-data-path-active",
        "data-path-left",
        `register-${register}-active`,
        `register-${register}-in`,
    ]
    switch (phase) {
        case 0:
        case 1:
            animate(I2ALU)
            break
        case 2:
            animate([...I2ALU, ...alu2DataPath, `register-${register}-ck-enable`])
            break
        case 3:
            animate([...alu2DataPath])
            break
    }
}

function animateSTORE(register, phase) {
    register = register.toLowerCase()
    const I2AddressPath = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-address-path-active",
        "address-path"
    ]

    const register2DataPath = [
        "data-path-right",
        `register-${register}-out`,
        `register-${register}-active`,
        `register-${register}-driver-data-path-active`
    ]
    switch (phase) {
        case 0:
            animate(I2AddressPath)
            break
        case 1:
        case 2:
            animate([...I2AddressPath, ...register2DataPath, "sram-write", "sram-address"])
            break
        case 3:
            animate(register2DataPath)
            break
    }
}

function animateSTOREIN(source, dest, phase) {
    source = source.toLowerCase()
    dest = dest.toLowerCase()
    const I2ALU = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-active",
        `register-${source}-active`,
        `register-${source}-out`,
        `register-${source}-driver-active`,
        "alu-lane-right",
        "alu-lane-left",
        "alu-out",
        "alu-driver-address-path-active",
        "address-path"
    ]

    const dataPath2Register = [
        "data-path-right",
        `register-${dest}-out`,
        `register-${dest}-driver-data-path-active`,
        `register-${dest}-active`,
    ]
    switch (phase) {
        case 0:
            animate(I2ALU)
            break
        case 1:
        case 2:
            animate([...I2ALU, ...dataPath2Register, "sram-write", "sram-address"])
            break
        case 3:
            animate(dataPath2Register)
            break
    }
}

function animateMOVE(source, dest, phase) {
    source = source.toLowerCase()
    dest = dest.toLowerCase()
    const source2DataPath = [
        `register-${source}-active`,
        `register-${source}-out`,
        `register-${source}-driver-data-path-active`,
        "data-path-right",
    ]

    const dataPath2Dest = [
        "data-path-left",
        "data-path-driver-active",
        `register-${dest}-active`,
        `register-${dest}-in`,
    ]
    switch (phase) {
        case 0:
            animate(source2DataPath)
            break
        case 1:
            animate([...source2DataPath, ...dataPath2Dest])
            break
        case 2:
            animate([...source2DataPath, ...dataPath2Dest, `register-${dest}-ck-enable`])
            break
        case 3:
            animate(dataPath2Dest)
            break
    }
}

function animateCOMPUTEI(mode, register, phase) {
    register = register.toLowerCase()
    setALUMode(mode)
    const registerComputeALU = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-active",
        "alu-lane-left",
        "alu-lane-right",
        "alu-out",
        `register-${register}-active`,
        `register-${register}-out`,
        `register-${register}-driver-active`,
    ]

    const alu2DataPath = [
        "alu-driver-data-path-active",
        "data-path-left",
    ]
    switch (phase) {
        case 0:
            animate(registerComputeALU)
            break
        case 1:
            animate([...registerComputeALU, ...alu2DataPath])
            break
        case 2:
            animate([...registerComputeALU, ...alu2DataPath, `register-${register}-ck-enable`])
            break
        case 3:
            animate(alu2DataPath)
            break
    }
}

function animateCOMPUTE(mode, register, phase) {
    register = register.toLowerCase()
    setALUMode(mode)
    const I2AddressPath = [
        "register-i-active",
        "register-i-out",
        "register-i-driver-address-path-active",
        "address-path",
    ]

    const register2ALU = [
        `register-${register}-active`,
        `register-${register}-out`,
        `register-${register}-driver-active`,
        "alu-lane-left",
        "alu-out",
    ]
    const dataPath2ALU = [
        "data-path-right",
        "data-path-right-to-alu",
        "data-path-to-alu-lane-right-active",
        "alu-lane-right",
        "sram-read",
        "sram-address",
    ]

    const alu2DataPath = [
        "alu-driver-data-path-active",
        "data-path-left",
        `register-${register}-in`,
        `register-${register}-active`,
    ]

    switch (phase) {
        case 0:
            animate(I2AddressPath)
            break
        case 1:
            animate([...I2AddressPath, ...register2ALU, ...dataPath2ALU, ...alu2DataPath])
            break
        case 2:
            animate([...I2AddressPath, ...register2ALU, ...dataPath2ALU, ...alu2DataPath, `register-${register}-ck-enable`])
            break
        case 3:
            animate([...alu2DataPath])
            break
    }
}

function animateCOMPUTERegisterOnly(mode, source, dest, phase) {
    source = source.toLowerCase()
    dest = dest.toLowerCase()
    setALUMode(mode)
    const source2DataPath = [
        `register-${source}-active`,
        `register-${source}-out`,
        `register-${source}-driver-data-path-active`,
        "data-path-right",
        "data-path-right-to-alu",
    ]

    const register2ALU = [
        `register-${dest}-active`,
        `register-${dest}-out`,
        `register-${dest}-driver-active`,
        "alu-lane-left",
        "alu-out",
        "data-path-to-alu-lane-right-active",
        "alu-lane-right",
    ]

    const alu2DataPath = [
        "alu-driver-data-path-active",
        "data-path-left",
        `register-${dest}-in`,
        `register-${dest}-active`,
    ]

    switch (phase) {
        case 0:
            animate(source2DataPath)
            break
        case 1:
            animate([...source2DataPath, ...register2ALU, ...alu2DataPath])
            break
        case 2:
            animate([...source2DataPath, ...register2ALU, ...alu2DataPath, `register-${dest}-ck-enable`])
            break
        case 3:
            animate([...alu2DataPath])
            break
    }
}

function animate(active) {
    if (!$showAnimation) {
        return
    }
    for (let element of active) {
        stage.find(`.${element?.name ?? element}`).forEach(kovnaElement => {
            let color = colorPalette.fifth
            // Text only needs to be filled
            if (kovnaElement instanceof Konva.Text) {
                kovnaElement.fill(kovnaElement.fill() === colorPalette.secondary ? colorPalette.fourth : color)
                kovnaElement.visible(true)
                return
            }
            // Circle and arrow need fill + stroke
            if (kovnaElement instanceof Konva.Circle || kovnaElement instanceof Konva.Arrow) {
                kovnaElement.fill(color)
            }
            // Everything else only needs stroke
            kovnaElement.stroke(color)
        })
    }
}

function setup() {

    let container = document.querySelector('#canvas')
    stage = new Konva.Stage({
        container: 'canvas',
        width: container.offsetWidth,
        height: container.offsetHeight,
    });
}

function draw(reti) {
    if (!$showAnimation) {
        return
    }

    // clear all layers from stage
    stage.clear()
    stage.getLayers().forEach(l => l?.destroy())
    layer?.destroy()
    // create new layer

    layer = new Konva.Layer({
        scaleX: $canvasScale,
        scaleY: $canvasScale,
    });

    // layer.listening(false)

    // Draw registers
    let ttlRegisterHeight = 400
    let beginX = 100
    let beginY = 100
    // PC Register 
    drawRegister(beginX + 115, beginY, ttlRegisterHeight, registerNames[0], registerDriverNames[1])
    drawRegisterPathToDataPath(
        beginX + 115,
        beginY + 350,
        beginX + 1300 - 32,
        beginY,
        registerToDataPathDriverNames[0],
        "pc"
    )
    drawRegisterPathToAddressPath(beginX + 115, beginY + 200, "PCAd", "pc")

    // Other registers
    for (let i = 2; i <= 8; i++) {
        let x = beginX + i * 115
        drawRegister(x, beginY, ttlRegisterHeight, registerNames[i - 1], registerDriverNames[i])
        drawRegisterPathToDataPath(
            x,
            (beginY + 380) - (i * 30),
            beginX + 1300 - i * 32,
            beginY,
            registerToDataPathDriverNames[i - 1],
            registerNames[i - 1]
        )
    }
    // I Register
    drawRegister(beginX + 1390, beginY, ttlRegisterHeight, registerNames[8], registerDriverNames[10])
    drawRegisterPathToAddressPath(beginX + 1390, beginY + 200, "IAd", "i")

    {
        let gapSize = 120
        drawDataPath(25, beginY)
        // Draw ALU
        drawALULanes(beginX, 2 * beginY + ttlRegisterHeight, gapSize = gapSize)
        drawALU(beginX + 1070, 2 * beginY + ttlRegisterHeight, gapSize = gapSize)

        drawAddressPath(beginX, 2 * beginY + ttlRegisterHeight + 280)

        drawALUToDataPath(beginX + 1130, 800, "ALUDId")

        drawRegisterBottom(beginX + 1130, 780, 20, "ALUAd ", 20, [
            'alu-out', 'alu-driver-address-path-active', 'alu-driver-address-path-active'
        ])
    }

    // DRd
    drawRegisterBottom(1570, beginY, ttlRegisterHeight, registerDriverNames[11], 40, ['data-path-right-to-alu', 'data-path-to-alu-lane-right-active', 'data-path-to-alu-lane-right-active'])
    drawRegisterBottom(1350, 500, 2, registerDriverNames[9], 40, ['0-right-active', '0-right-active', '0-right-active'])
    let text0Rd = new Konva.Text({
        x: 1340,
        y: 465,
        fill: colorPalette.secondary,
        text: "0³²",
        fontSize: 35,
    })
    layer.add(text0Rd)
    // LRd
    drawRegisterBottom(115, 500, 2, registerDriverNames[0], 40, ['0-left-active', '0-left-active', '0-left-active'])
    let text0Ld = new Konva.Text({
        x: 105,
        y: 465,
        fill: colorPalette.secondary,
        text: "0³²",
        fontSize: 35,
    })

    drawSRAM(2800, 100, reti, reti?.sram, "SRAM", ["DSMd", "SMDd", "ASMd"])
    drawEPROM(2300, 100, reti, "EPROM", ["EDd", "AEd"])
    drawUART(1800, 100, reti, "UART", ["AUd", "DUd", "UDd"])

    layer.add(text0Ld)
    // add the layer to the stage
    stage.add(layer)
}

// draw on initial page load
document.addEventListener('DOMContentLoaded', function () {
    setup()
    draw()
})

export {
    draw,
    setup,
    animateCOMPUTE,
    animateCOMPUTERegisterOnly,
    animateCOMPUTEI,
    animateFetch,
    animateLOAD,
    animateLOADI,
    animateLOADIN,
    animateMOVE,
    animateSTORE,
    animateSTOREIN
}