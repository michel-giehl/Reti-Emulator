import { config, registerNames } from "./global_vars.js"
import { stringifyNumber } from "./run_code.js"
import { decompile } from "./reti_decompiler.js"

let stage = null
let layer = null

const registerDriverNames = ["0Ld", "PCLd", "IN1Ld", "IN2Ld", "ACCLd", "SPLd", "BAFLd", "CSLd", "DSLd", "0Rd", "IRd", "DRd"]
const registerToDataPathDriverNames = ["PCDd", "IN1Dd", "IN2Dd", "ACCDd", "SPDd", "BAFDd", "CSDd", "DSDd"]

const options = {
    colors: {
        // standard stroking color
        stroke: "black",
        // color when path is active
        strokeActive: "green",
        driverText: "blue",
        // standard text color, for registers, alu, sram, ...
        text: "red",
        // text color when thing is active. Only used for registers when /cken is enabled.
        textActive: "orange",
        addressAndDataPathText: "green",
    },
    strokeWidth: {
        // stroke width for address/data path and alu lanes
        large: 5,
        // default stroke width
        medium: 3,
        // stroke width for smaller things, such as register to data path lanes
        small: 2,
    },
}

function setALUMode(num) {
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
    const mode = aluModes[num]
    const textElement = stage.findOne('.alu-mode-text')
    textElement.text(mode.text)
    textElement.fontSize(mode.size)
}

/**
 * Overload for {@alias drawLine()}
 * @param {{x: number, y: number}}  from start position
 * @param {{x: number, y: number}}  to   end position
 * @param {object}                  opts custom options for the Konva Shape such as strokeWidth, fillcolor, etc. Visit {@link https://konvajs.org/api/Konva.Shape.html} for more
 */
function drawLine(from, to, opts) {
    const shape = new Konva.Shape({
        sceneFunc: function (ctx, shape) {
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.lineTo(to.x, to.y)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
        }
    })

    // apply custom options
    // to do this, im calling for example shape.strokeWidth(xyz)
    for (const key in opts) {
        shape[key](opts[key])
    }

    layer.add(shape)
}

/**
 * 
 * @param {{x: number, y: number}}  driverPos   driver position
 * @param {number}                  rotation    rotation in degrees
 * @param {number}                  size        size of the regular triangle
 * @param {number}                  strokeWidth stroke width in pixels
 * @param {{x: number, y: number}}  textPos     x positon for the text
 * @param {string}                  text        the text
 * @param {object}                  opts        custom options for the {@link Konva.RegularPolygon} such as strokeWidth, fillcolor, etc. Visit {@link https://konvajs.org/api/Konva.RegularPolygon.html} for more 
 */
function drawDriver(driverPos, rotation, size, strokeWidth, textPos, text, opts) {
    const driver = new Konva.RegularPolygon({
        sides: 3,
        rotation: rotation,
        height: size,
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        x: driverPos.x,
        y: driverPos.y,
    })

    // apply custom options
    for (const key in opts) {
        driver[key](opts[key])
    }

    let textElement = new Konva.Text({
        x: textPos.x,
        y: textPos.y,
        fill: options.colors.driverText,
        text: text,
        fontSize: 25,
        fontFamily: 'Arial',
    })

    // center text around textPos.x
    textElement.offsetX(textElement.width() / 2)

    layer.add(textElement)
    layer.add(driver)
}

/**
 * Overload for {@alias drawDriver}
 * 
 * @param {{pos: {x: number, y: number}, rotation: number, size: number, strokeWidth: number, text: {pos: {x: number, y: number}, text: string}, opts: Object}} driverData 
 */
function drawDriver$2(driverData) {
    drawDriver(driverData.pos, driverData.rotation, driverData.size, driverData.strokeWidth, driverData.text.pos, driverData.text.text, driverData.opts)
}

/**
 * 
 * @param {{x: number, y: number}}  pos          start pos
 * @param {number}                  height       height
 * @param {string}                  registerText register name
 * @param {string}                  driverText   driver name
 */
function drawRegister(pos, height, registerText, driverText) {
    const strokeWidth = options.strokeWidth.medium
    const registerName = "register-" + registerText.toLowerCase()

    const segments = [
        `${registerName}-in`,
        `${registerName}-active`,
        `${registerName}-ck-enable`,
        `${registerName}-out`,
        `${registerName}-driver-active`
    ]

    const arrowLength = 40

    const registerWidth = 80
    const registerHeight = 40
    const registerPos = {
        x: pos.x - registerWidth / 2,
        y: pos.y + arrowLength + strokeWidth
    }
    const registerTextData = {
        size: 35,
        pos: {
            x: pos.x,
            y: registerPos.y + registerHeight / 2
        }
    }
    const registerBottom = {
        segments: [segments[3], segments[4], segments[4]],
        height: height -registerHeight - arrowLength - strokeWidth,
        pos: {
            x: pos.x,
            y: registerPos.y + registerHeight,
        },
    }

    const arrowFromDataPathToRegister = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 0, 0, arrowLength],
        strokeWidth: strokeWidth,
        stroke: options.colors.stroke,
        fill: options.colors.stroke,
        name: segments[0],
    })

    const register = new Konva.Rect({
        x: registerPos.x,
        y: registerPos.y,
        width: registerWidth,
        height: registerHeight,
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    const textRegister = new Konva.Text({
        x: registerTextData.pos.x,
        y: registerTextData.pos.y,
        fill: options.colors.text,
        text: registerText,
        fontSize: registerTextData.size,
        name: segments[2],
    })
    // center text
    textRegister.offsetX(textRegister.width() / 2)
    textRegister.offsetY(textRegister.height() / 2)

    drawRegisterBottom(registerBottom.pos, registerBottom.height, driverText, arrowLength, registerBottom.segments)

    layer.add(register)
    layer.add(textRegister)
    layer.add(arrowFromDataPathToRegister)
}

/**
 * 
 * @param {{x: number, y: number}} pos               starting position
 * @param {number}                 height           total height of the whole thing
 * @param {string}                 driverText 
 * @param {number}                 arrowLength
 * @param {Array.<string>}         segments names of the 3 segments (line, driver, arrow). Used for the animation
 */
function drawRegisterBottom(pos, height, driverText, arrowLength, segments = undefined) {

    let strokeWidth = options.strokeWidth.medium
    let driverY = pos.y + height
    const lineEndPos = new Point(pos.x, driverY + 18)

    drawLine(pos, lineEndPos, {
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        name: segments?.at(0) ?? null,
    })

    const data = {
        driver: {
            pos: {
                x: pos.x,
                y: driverY + 30
            },
            rotation: 180,
            size: 50,
            text: {
                pos: {
                    x: pos.x - 40,
                    y: driverY + 45,
                }
            }
        },
        arrow: {
            pos: {
                x: pos.x,
                y: driverY + 55,
            },
        }
    }

    drawDriver(data.driver.pos, data.driver.rotation, data.driver.size, strokeWidth, data.driver.text.pos, driverText, { name: segments[1] })

    let dataPathToALU = new Konva.Arrow({
        x: data.arrow.pos.x,
        y: data.arrow.pos.y,
        points: [0, 0, 0, arrowLength],
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        fill: options.colors.stroke,
        name: segments[2],
    })
    layer.add(dataPathToALU)
}

/**
 * Draws the connection from a register to the address path (for PC and I register)
 * 
 * @param {{x: number, y: number}} pos
 * @param {string}                 driverText
 * @param {string}                 registerName
 */
function drawRegisterPathToAddressPath(pos, driverText, registerName) {
    registerName = registerName.toLowerCase()
    const strokeWidth = options.strokeWidth.medium

    const segments = [
        `register-${registerName}-out`,
        `register-${registerName}-driver-address-path-active`,
    ]

    const lineRight = 45
    // Line going right
    const lineRightEnd = {
        x: pos.x + lineRight,
        y: pos.y,
    }
    // Line going downwards into driver
    const lineDownEnd = {
        x: pos.x + lineRight,
        y: pos.y + 380,
    }
    const driverData = {
        pos: {
            x: pos.x + lineRight,
            y: pos.y + 394,
        },
        rotation: 180,
        size: 60,
        text: {
            pos: {
                x: pos.x,
                y: pos.y + 410,
            },
        },
        opts: {
            name: segments[1],
        }
    }

    const arrowData = {
        pos: {
            x: pos.x + lineRight,
            y: pos.y + 420,
        },
        length: 155,
    }

    const connection = new Konva.Circle({
        x: pos.x,
        y: pos.y,
        radius: 5,
        stroke: options.colors.stroke,
        fill: options.colors.stroke,
        name: segments[0],
    })

    // Line going right
    drawLine(pos, lineRightEnd, {
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    // Line going downwards into driver
    drawLine(lineRightEnd, lineDownEnd, {
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    drawDriver(driverData.pos, driverData.rotation, driverData.size, strokeWidth, driverData.text.pos, driverText, driverData.opts)

    let arrow = new Konva.Arrow({
        x: arrowData.pos.x,
        y: arrowData.pos.y,
        points: [0, 0, 0, arrowData.length],
        stroke: options.colors.stroke,
        fill: options.colors.stroke,
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    layer.add(connection)
    layer.add(arrow)
}

/**
 * Draws the connection from the registers to the data path
 * 
 * @param {{x: number, y: number}} start 
 * @param {{x: number, y: number}} end 
 * @param {string}                 driverText 
 * @param {string}                 registerName 
 */
function drawRegisterToDataPath(start, end, driverText, registerName) {
    const strokeWidth = options.strokeWidth.small

    const segments = [
        `register-${registerName.toLowerCase()}-out`,
        `register-${registerName.toLowerCase()}-driver-data-path-active`
    ]

    const lineToDriverLength = 20
    const lineToDriverEnd = {
        x: start.x + lineToDriverLength,
        y: start.y,
    }
    const driverData = {
        pos: {
            x: start.x + lineToDriverLength + 12,
            y: start.y,
        },
        rotation: 90,
        size: 50,
        strokeWidth: strokeWidth,
        text: {
            pos: {
                x: start.x + lineToDriverLength + 25,
                y: start.x - 50,
            },
            text: driverText
        },
        opts: {
            name: segments[1]
        }
    }
    const lineFromDriverToArrowData = {
        startPos: {
            x: start.x + driverData.size + strokeWidth,
            y: start.y
        },
        endPos: {
            pos: {
                x: end.x,
                y: start.y,
            }
        },
        opts: {
            stroke: options.colors.stroke,
            strokeWidth: strokeWidth,
            name: segments[1],
        }
    }

    const connection = new Konva.Circle({
        x: start.x,
        y: start.y,
        radius: 5,
        fill: options.colors.stroke,
        name: segments[0],
    })

    drawLine(start, lineToDriverEnd, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    drawDriver$2(driverData)

    drawLine(lineFromDriverToArrowData.startPos, lineFromDriverToArrowData.endPos, lineFromDriverToArrowData.opts)

    let arrow = new Konva.Arrow({
        x: end.x,
        y: end.y,
        points: [0, start.y - end.y, 0, 0],
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        fill: options.colors.stroke,
        name: segments[1],
    })

    layer.add(connection)
    layer.add(arrow)
}

function drawDataPath(pos) {
    const strokeWidth = options.strokeWidth.large

    const data = {
        beginLeftSide: {
            x: pos.x,
            y: pos.y,
        },
        endLeftSide: {
            x: pos.x + 1010,
            y: pos.y
        },
        beginRightSide: {
            x: pos.x + 1070,
            y: pos.y,
        },
        endRightSide: {
            x: pos.x + 2500,
            y: pos.y
        },
        driverLocation: {
            x: pos.x + 1050,
            y: pos.y,
            rotation:  270,
            size: 80,
            text: {
                text: "DDId",
                pos: {
                    x: pos.x + 1050,
                    y: pos.y - 70,
                },
            }
        }
    }

    const segments = [
        "data-path-left",
        "data-path-right",
        "data-path-driver-active"
    ]

    // Data Line left side
    drawLine(data.beginLeftSide, data.endLeftSide, {
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
        name: segments[0]
    })

    // Data Line right side
    drawLine(data.beginRightSide, data.endRightSide, {
        stroke: options.colors.stroke,
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
        driverX,
        posY - 70,
        "DDId",
        {
            name: segments[2]
        }
    )

    let textDI = new Konva.Text({
        x: posX + 30,
        y: posY - 50,
        text: 'DI',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: 'green',
    })

    let textD = new Konva.Text({
        x: posX + 1450,
        y: posY - 50,
        text: 'D',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: 'green',
    })

    layer.add(textDI)
    layer.add(textD)
    // done
}

function drawAddressPath(posX, posY) {
    let strokeWidth = options.strokeWidth.large

    let segments = [
        'address-path'
    ]

    drawLine(posX, posY, posX + 2000, posY, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    let textD = new Konva.Text({
        x: posX + 1450,
        y: posY + 20,
        text: 'A',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: 'green',
    })

    layer.add(textD)
    // done
}

function drawALULanes(x, y, gapSize) {
    let strokeWidth = options.strokeWidth.large

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
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    // right side
    drawLine(beginXRight, y, endXRight, y, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    let textL = new Konva.Text({
        x: x + 350,
        y: y + 20,
        text: 'L',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: 'green',
    })

    let textR = new Konva.Text({
        x: x + 1380,
        y: y + 20,
        text: 'R',
        fontSize: 40,
        fontFamily: 'Arial',
        fill: 'green',
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
        stroke: 'black',
        fill: 'black',
        strokeWidth: options.strokeWidth.small,
        name: segments[1],
    })

    let arrowLength = 60
    let rightArrow = new Konva.Arrow({
        x: x + gapSize + 10,
        y: y,
        points: [0, 0, 0, arrowLength],
        stroke: 'black',
        fill: 'black',
        strokeWidth: options.strokeWidth.small,
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
        stroke: 'black',
        strokeWidth: options.strokeWidth.medium,
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
        fill: "red",
    })

    aluText.offsetX(aluText.width() / 2)

    layer.add(leftArrow)
    layer.add(rightArrow)
    layer.add(alu)
    layer.add(aluText)
    layer.add(aluModeText)
}

function drawALUToDataPath(x, y, driverText) {
    let strokeWidth = options.strokeWidth.medium

    let segments = [
        'alu-out',
        'alu-driver-data-path-active'
    ]

    let connection = new Konva.Circle({
        x: x,
        y: y,
        radius: 5,
        fill: 'black',
        name: segments[0],
    })

    let lineLength = 1180
    // horizontal line
    drawLine(x, y, x - lineLength, y, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    // vertical line
    drawLine(x - lineLength, y, x - lineLength, y - 138, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    let arrow = new Konva.Arrow({
        x: x - lineLength,
        y: 102,
        points: [0, y - 276, 0, 0],
        stroke: 'black',
        fill: 'black',
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    drawDriver(
        x - lineLength,
        y - 150,
        0,
        50,
        strokeWidth,
        x - lineLength + 60,
        y - 130,
        driverText,
        {
            name: segments[1],
        }
    )

    layer.add(connection)
    layer.add(arrow)
}

function drawSRAM(pos, reti) {
    const strokeWidth = options.strokeWidth.medium
    const width = 350
    const height = 500

    const segments = [
        "sram-read",
        "sram-write",
        "sram-address",
    ]

    // TODO fix
    const data = {
        sram: {
            pos: {
                x: x - width / 2,
                y: y + 140,
            },
        },
        offsetX: 70,
        dataPathToSRAM: {
            pos: {
                x: pos.x - data.offsetX,
                y: pos.y
            },
            lineLength: (185 - pos.y) / 2,
            driverName: "DSMd",
            segments: [segments[1], segments[1], segments[1]]
        },
        sramToDataPath: {
            pos: {
                x: pos.x + data.offsetX,
                y: 200 - pos.y
            },
            arrow: {
                length: 70,
            }
        },
        sramToAddressPath: {
            driver: {
                pos: {
                    x: data.sramToDataPath.pos.x,
                    y: data.sramToDataPath.pos.y + 90,
                },
                rotation: 0,
                size: 50,
                text: {
                    pos: {
                    }
                }
            }
        }
    }

    // SRAM
    const rect = new Konva.Rect({
        x: data.sram.pos.x,
        y: data.sram.pos.y,
        width: width,
        height: height,
        stroke: options.colors.stroke,
        strokeWidth: strokeWidth,
    })

    // Data path into SRAM
    drawRegisterBottom(data.dataPathToSRAM.pos, data.dataPathToSRAM.lineLength, data.dataPathToSRAM.driverName, data.dataPathToSRAM.lineLength, data.dataPathToSRAM.segments)
    // SRAM to Data path
    const arrow = new Konva.Arrow({
        x: data.sramToDataPath.pos.x,
        y: data.sramToDataPath.pos.y,
        points: [0, data.sramToDataPath.arrow.length, 0, 0],
        strokeWidth: strokeWidth,
        stroke: options.colors.stroke,
        name: segments[0],
    })
    // SRAM to Address path
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 50, pos.y + 60, "SMDd", {
        name: segments[0]
    })
    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: 'black',
        name: segments[0]
    })
    pos = { x: x, y: y + 640 }
    const asmArrow = new Konva.Arrow({
        x: pos.x,
        y: pos.y,
        points: [0, 69, 0, 0],
        strokeWidth: strokeWidth,
        stroke: "black",
        name: segments[2],
    })
    drawDriver(pos.x, pos.y + 90, 0, 50, 3, pos.x - 50, pos.y + 60, "ASMd", {
        name: segments[2],
    })
    drawLine(pos.x, pos.y + 102, pos.x, pos.y + 140, {
        strokeWidth: strokeWidth,
        stroke: 'black',
        name: segments[2],
    })
    // drawRegisterBottom(x, y + 638, (185 - y) / 2, "ASMd", (185 - y) / 2, ["sram-address", "sram-address", "sram-address"], 0)

    let textSRAM = new Konva.Text({
        x: x,
        y: y + 150,
        fontSize: 40,
        text: "SRAM",
        fill: "red",
    })
    textSRAM.offsetX(textSRAM.width() / 2)

    if (reti) {
        const numElementsToShow = 15
        const sram = config.reti.sram
        let dataText = []
        let addressText = []
        for (let i = 0; i < sram.length; i++) {
            let data = sram[i]
            if (data !== undefined) {
                addressText.push(i + "")
                dataText.push(`${i < reti.bds && config.numberStyle !== 2 ? decompile(Number.parseInt(data)) : stringifyNumber(data)}`)
            }
        }
        let text = new Konva.Text({
            x: x + 50,
            y: y + 200,
            fontSize: 25,
            fontFamily: "monospace",
            text: dataText.slice(-numElementsToShow).join("\n"),
            fill: "black",
        })
        text.offsetX(text.width() / 2)

        let text2 = new Konva.Text({
            x: x - 120,
            y: y + 200,
            fontSize: 25,
            fontFamily: "monospace",
            text: addressText.slice(-numElementsToShow).join("\n"),
            fill: "black",
        })
        text2.offsetX(text2.width() / 2)

        layer.add(text)
        layer.add(text2)
    }

    layer.add(rect)
    layer.add(textSRAM)
    layer.add(arrow)
    layer.add(asmArrow)
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
/**
 * @param {Array.<string>} active list of elements by name to be colored in
 */
function animate(active) {
    if (!config.showAnimation) {
        return
    }
    for (let element of active) {
        stage.find(`.${element?.name ?? element}`).forEach(kovnaElement => {
            const colorActive = options.colors.strokeActive
            // Text only needs to be filled
            if (kovnaElement instanceof Konva.Text) {
                kovnaElement.fill(options.colors.textActive)
                return
            }
            // Circle and arrow need fill + stroke
            if (kovnaElement instanceof Konva.Circle || kovnaElement instanceof Konva.Arrow) {
                kovnaElement.fill(colorActive)
            }
            // Everything else only needs stroke
            kovnaElement.stroke(colorActive)
        })
    }
}

function setup() {

    let container = document.querySelector('#container')

    stage = new Konva.Stage({
        container: 'container',
        width: container.offsetWidth,
        height: container.offsetHeight,
    });
}

// TODO fix high memory usage on firefox
function draw(reti) {
    if (!config.showAnimation) {
        return
    }

    // clear all layers from stage
    stage.clear()
    layer?.destroy()
    // create new layer
    let container = document.querySelector('#container')

    let containerWidth = container.offsetWidth
    let containerHeight = container.offsetHeight
    let stageWidth = 4000
    let stageHeight = 1000
    let scaleX = containerWidth / stageWidth
    let scaleY = containerHeight / stageHeight
    layer = new Konva.Layer({
        scaleX: scaleX,
        scaleY: scaleY,
    });

    // Disable listening to mouse/keyboard events, this optimizes performance.
    layer.listening(false)

    // Draw registers
    let ttlRegisterHeight = 400
    let beginX = 100
    let beginY = 100
    // PC Register 
    drawRegister(beginX + 115, beginY, ttlRegisterHeight, registerNames[0], registerDriverNames[1])
    drawRegisterToDataPath(
        beginX + 115,
        beginY + 350,
        beginX + 1370 - 32,
        beginY,
        registerToDataPathDriverNames[0],
        "pc"
    )
    drawRegisterPathToAddressPath(beginX + 115, beginY + 200, "PCAd", "pc")

    // Other registers
    for (let i = 2; i <= 8; i++) {
        let x = beginX + i * 115
        drawRegister(x, beginY, ttlRegisterHeight, registerNames[i - 1], registerDriverNames[i])
        drawRegisterToDataPath(
            x,
            (beginY + 380) - (i * 30),
            beginX + 1370 - i * 32,
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

        drawRegisterBottom(beginX + 1130, 780, 20, "ALUAd   ", 20, [
            'alu-out', 'alu-driver-address-path-active', 'alu-driver-address-path-active'
        ])
    }

    // DRd
    drawRegisterBottom(1570, beginY, ttlRegisterHeight, registerDriverNames[11], 40, ['data-path-right-to-alu', 'data-path-to-alu-lane-right-active', 'data-path-to-alu-lane-right-active'])
    drawRegisterBottom(1350, 500, 2, registerDriverNames[9], 40, ['0-right-active', '0-right-active', '0-right-active'])
    let text0Rd = new Konva.Text({
        x: 1340,
        y: 465,
        fill: 'red',
        text: "0³²",
        fontSize: 35,
    })
    layer.add(text0Rd)
    // LRd
    drawRegisterBottom(115, 500, 2, registerDriverNames[0], 40, ['0-left-active', '0-left-active', '0-left-active'])
    let text0Ld = new Konva.Text({
        x: 105,
        y: 465,
        fill: 'red',
        text: "0³²",
        fontSize: 35,
    })

    drawSRAM(1800, 100, reti)

    layer.add(text0Ld)
    // add the layer to the stage
    stage.add(layer)
}

// Draw on content load
document.addEventListener('DOMContentLoaded', function () {
    setup()
    draw()
})

export {
    draw,
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
