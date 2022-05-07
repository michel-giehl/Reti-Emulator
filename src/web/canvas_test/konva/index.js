import { registerNames } from "../../global_vars.js"

let stage = null
let layer = null

// const registerNames = ["PC", "IN1", "IN2", "ACC", "SP", "BAF", "CS", "DS", "I"]
const registerDriverNames = ["0Ld", "PCLd", "IN1Ld", "IN2Ld", "ACCLd", "SPLd", "BAFLd", "CSLd", "DSLd", "0Rd", "IRd", "DRd"]
const registerToDataPathDriverNames = ["PCDd", "IN1Dd", "IN2Dd", "ACCDd", "SPDd", "BAFDd", "CSDd", "DSDd"]

const aluModes = [
    {text: "+", size: 40},
    {text: "-", size: 40},
    {text: "⋅", size: 40},
    {text: "÷", size: 40},
    {text: "%", size: 40},
    {text: "XOR", size: 20},
    {text: "OR", size: 20},
    {text: "AND", size: 20},
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
}

function drawLine(fromX, fromY, toX, toY, opts) {
      let shape = new Konva.Shape({
        sceneFunc: function(ctx, shape) {
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


function drawDriver(x, y, rotation, size, strokeWidth, textX, textY, text, opts) {
    let fillColor = "black"
    let driver = new Konva.RegularPolygon({
        sides: 3,
        rotation: rotation,
        height: size,
        stroke: fillColor,
        strokeWidth: strokeWidth,
        x: x,
        y: y,
    })

    // TODO find better way
    for (const key in opts) {
        driver[key](opts[key])
    }

    let textElement = new Konva.Text({
        x: textX,
        y: textY,
        fill: 'blue',
        text: text,
        fontSize: 25,
        fontFamily: 'Arial',
    })

    // center text around (textX, textY)
    textElement.offsetX(textElement.width() / 2)

    layer.add(textElement)
    layer.add(driver)
    return driver
}

function drawRegister(x, y, height,  registerText, driverText) {
    let strokeWidth = options.secondary.strokeWidth

    let registerWidth = 80
    let registerHeight = 40
    let arrowLength = 40

    let registerName = `register-${registerText.toLowerCase()}`

    let segments = [
        `${registerName}-in`,
        `${registerName}-ck-enable`,
        `${registerName}-out`,
        `${registerName}-driver-active`
    ]

    let dataPathToRegister = new Konva.Arrow({
        x: x,
        y: y,
        points: [0, 0, 0, arrowLength],
        stroke: 'black',
        strokeWidth: strokeWidth,
        fill: 'black',
        name: segments[0],
    })

    let register = new Konva.Rect({
        x: x - registerWidth / 2,
        y: y + arrowLength + strokeWidth,
        width: registerWidth,
        height: registerHeight,
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    let textRegister = new Konva.Text({
        x: x,
        y: 5 + y + arrowLength + registerHeight / 2,
        fill: 'red',
        text: registerText,
        fontSize: 35,
        name: segments[1],
    })
    // center text
    textRegister.offsetX(textRegister.width() / 2)
    textRegister.offsetY(textRegister.height() / 2)

    let bottomPartHeight = height - registerHeight - arrowLength - strokeWidth
    let dataPathToDriverStartY = y + arrowLength + registerHeight + strokeWidth

    drawRegisterBottom(x, dataPathToDriverStartY, bottomPartHeight, driverText, 40, [segments[2], segments[3], segments[3]])


    layer.add(register)
    layer.add(textRegister)
    layer.add(dataPathToRegister)
}

function drawRegisterBottom(x, y, height, driverText, arrowLength, segments = undefined) {
    
    let strokeWidth = options.secondary.strokeWidth
    let driverY = y + height

    drawLine(x, y, x, driverY + 18, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments?.at(0) ?? null,
    })

    drawDriver(x,
             driverY + 30,
             180,
             50,
             3,
             x - 40,
             driverY + 45,
             driverText,
             {
                name: segments?.at(1) ?? null,
             }
    )

    let dataPathToALU = new Konva.Arrow({
        x: x,
        y: 55 + driverY,
        points: [0, 0, 0, arrowLength],
        stroke: 'black',
        strokeWidth: strokeWidth,
        fill: 'black',
        name: segments?.at(2) ?? null,
    })
    layer.add(dataPathToALU)
}

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
        stroke: 'black',
        fill: "black",
        name: segments[0],
    })

    let lineLength = 45
    drawLine(x, y, x + lineLength, y, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    drawLine(x + lineLength, y, x + lineLength, y + 380, {
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0],
    })

    drawDriver(
        x + lineLength,
        y + 394,
        180,
        60,
        strokeWidth,
        x,
        y + 410,
        driverText,
        {
            name: segments[1],
        }
    )

    let arrow = new Konva.Arrow({
        x: x + lineLength,
        y: y + 420,
        points: [0, 0, 0, 155],
        stroke: 'black',
        fill: 'black',
        strokeWidth: strokeWidth,
        name: segments[1],
    })

    layer.add(connection)
    layer.add(arrow)
}

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
        fill: 'black',
        name: segments[0],
    })

    let lineLength = 20
    drawLine(startX, startY, startX + lineLength, startY, {
        stroke: 'black',
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
        startX + lineLength + 25,
        startY - 50,
        driverText,
        {
            name: segments[1],
        }
    )

    drawLine(startX + driverSize + 3, startY, endX, startY, {stroke: 'black', strokeWidth: strokeWidth, name: segments[1]})

    let arrow = new Konva.Arrow({
        x: endX,
        y: endY,
        points: [0, startY - endY, 0, 0],
        stroke: 'black',
        strokeWidth: strokeWidth,
        fill: 'black',
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
        stroke: 'black',
        strokeWidth: strokeWidth,
        name: segments[0]
    })

    // Data Line right side
    drawLine(posX + 1070, posY, posX + 2000, posY, {
        stroke: 'black',
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

    let strokeWidth = options.primary.strokeWidth


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
    let strokeWidth = options.primary.strokeWidth

    let segments = [
        'alu-lane-left',
        'alu-lane-right',
    ]

    let xOffset = 1070
    let endXLeft = x + xOffset
    let beginXRight = endXLeft + gapSize
    let endXRight = x + 1600
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
        strokeWidth: options.tertiary.strokeWidth,
        name: segments[1],
    })

    let arrowLength = 60
    let rightArrow = new Konva.Arrow({
        x: x + gapSize + 10,
        y: y,
        points: [0, 0, 0, arrowLength],
        stroke: 'black',
        fill: 'black',
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
        sceneFunc: function(ctx, shape) {
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
        strokeWidth: options.secondary.strokeWidth,
        name: segments[2],
    })

    let aluModeText = new Konva.Text({
        x: beginX - 20,
        y: endY - (endY-beginY) / 2,
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
    let strokeWidth = options.secondary.strokeWidth

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

function setALUMode(num) {
    let mode = aluModes[num]
    let textElement = stage.findOne('.alu-mode-text')
    textElement.text(mode.text)
    textElement.fontSize(mode.size)
}

function animateFetch() {
    let color = "green"
    let active = [
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "register-i-in",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: "register-pc-out",
            type: "stroke"
        },
        {
            name: "register-pc-in",
            type: "stroke"
        },
        {
            name: "register-pc-driver-active",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "0-right-active",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-address-path-active",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: "register-i-ck-enable",
            type: "fill",
            color: "orange",
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateLOAD(register) {
    register = registerNames[register].toLowerCase()
    let color = "green"
    let active = [
        {
            name: "register-i-driver-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "0-left-active",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-address-path-active",
            type: "stroke"
        },
        {
            name: "data-path-left",
            type: "stroke"
        },
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "data-path-driver-active",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: `register-${register}-in`,
            type: "stroke"
        },
        {
            name: `register-${register}-ck-enable`,
            type: "fill",
            color: "orange",
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateLOADIN(source, dest) {
    source = registerNames[source].toLowerCase()
    dest = registerNames[dest].toLowerCase()
    let color = "green"
    let active = [
        {
            name: "register-i-driver-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: `register-${source}-out`,
            type: "stroke"
        },
        {
            name: `register-${source}-driver-active`,
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-address-path-active",
            type: "stroke"
        },
        {
            name: "data-path-left",
            type: "stroke"
        },
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "data-path-driver-active",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: `register-${dest}-in`,
            type: "stroke"
        },
        {
            name: `register-${dest}-ck-enable`,
            type: "fill",
            color: "orange",
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateLOADI(registerName) {
    registerName = registerNames[registerName].toLowerCase()
    let color = "green"
    setALUMode(0)
    let active = [
        {
            name: "register-i-driver-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "0-left-active",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-data-path-active",
            type: "stroke"
        },
        {
            name: "data-path-left",
            type: "stroke"
        },
        {
            name: `register-${registerName}-in`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-ck-enable`,
            type: "fill",
            color: "orange",
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateSTORE(registerName) {
    registerName = registerNames[registerName].toLowerCase()
    let color = "green"
    let active = [
        {
            name: "register-i-driver-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "0-left-active",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-address-path-active",
            type: "stroke"
        },
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: `register-${registerName}-out`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-in`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-driver-data-path-active`,
            type: "stroke"
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateSTOREIN(source, dest) {
    source = registerNames[source].toLowerCase()
    dest = registerNames[dest].toLowerCase()
    let color = "green"
    let active = [
        {
            name: "register-i-driver-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: `register-${source}-out`,
            type: "stroke"
        },
        {
            name: `register-${source}-driver-active`,
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-address-path-active",
            type: "stroke"
        },
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: `register-${dest}-out`,
            type: "stroke"
        },
        {
            name: `register-${dest}-in`,
            type: "stroke"
        },
        {
            name: `register-${dest}-driver-data-path-active`,
            type: "stroke"
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateMOVE(source, dest) {
    source = registerNames[source].toLowerCase()
    dest = registerNames[dest].toLowerCase()
    let color = "green"
    let active = [
        {
            name: 'data-path-left',
            type: "stroke"
        },
        {
            name: 'data-path-right',
            type: "stroke"
        },
        {
            name: 'data-path-driver-active',
            type: "stroke"
        },
        {
            name: `register-${source}-out`,
            type: "stroke"
        },
        {
            name: `register-${source}-in`,
            type: "stroke"
        },
        {
            name: `register-${source}-driver-data-path-active`,
            type: "stroke"
        },
        {
            name: `register-${dest}-in`,
            type: "stroke"
        },
        {
            name: `register-${dest}-ck-enable`,
            type: "fill",
            color: "orange",
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateCOMPUTEI(mode, registerName) {
    registerName = registerNames[registerName].toLowerCase()
    let color = "green"
    setALUMode(mode)
    let active = [
        {
            name: "register-i-driver-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-data-path-active",
            type: "stroke"
        },
        {
            name: "data-path-left",
            type: "stroke"
        },
        {
            name: `register-${registerName}-in`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-out`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-driver-active`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-ck-enable`,
            type: "fill",
            color: "orange",
        },
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateCOMPUTE(mode, registerName) {
    registerName = registerNames[registerName].toLowerCase()
    let color = "green"
    setALUMode(mode)
    let active = [
        {
            name: "register-i-driver-address-path-active",
            type: "stroke"
        },
        {
            name: "register-i-out",
            type: "stroke"
        },
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-data-path-active",
            type: "stroke"
        },
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "data-path-left",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: `register-${registerName}-in`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-out`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-driver-active`,
            type: "stroke"
        },
        {
            name: `register-${registerName}-ck-enable`,
            type: "fill",
            color: "orange",
        },
        {
            name: 'data-path-to-alu-lane-right-active',
            type: 'stroke'
        }
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function animateCOMPUTERegisterOnly(mode, source, dest) {
    source = registerNames[source].toLowerCase()
    dest = registerNames[dest].toLowerCase()
    let color = "green"
    setALUMode(mode)
    let active = [
        {
            name: "alu-lane-right",
            type: "stroke"
        },
        {
            name: "alu-lane-left",
            type: "stroke"
        },
        {
            name: "alu-out",
            type: "stroke"
        },
        {
            name: "alu-driver-data-path-active",
            type: "stroke"
        },
        {
            name: "data-path-right",
            type: "stroke"
        },
        {
            name: "data-path-left",
            type: "stroke"
        },
        {
            name: "address-path",
            type: "stroke"
        },
        {
            name: `register-${source}-in`,
            type: "stroke"
        },
        {
            name: `register-${source}-driver-data-path-active`,
            type: "stroke"
        },
        {
            name: `register-${source}-out`,
            type: "stroke"
        },
        {
            name: `register-${dest}-in`,
            type: "stroke"
        },
        {
            name: `register-${dest}-out`,
            type: "stroke"
        },
        {
            name: `register-${dest}-driver-active`,
            type: "stroke"
        },
        {
            name: `register-${dest}-ck-enable`,
            type: "fill",
            color: "orange",
        },
        {
            name: 'data-path-to-alu-lane-right-active',
            type: 'stroke'
        }
    ]
    for (let element of active) {
        stage.find(`.${element.name}`).forEach(kovnaElement => {
            kovnaElement[element.type](element.color ?? color)
        })
    }
}

function draw() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height,
    });

    layer = new Konva.Layer({
        scaleX: 0.7,
        scaleY: 0.7,
    });
    layer.listening(false)
    // Draw registers
    let ttlRegisterHeight = 400
    let beginX = 100
    let beginY = 100
    // PC Register 
    drawRegister(beginX + 115, beginY, ttlRegisterHeight, registerNames[0], registerDriverNames[1])
    drawRegisterPathToDataPath(
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
        drawRegisterPathToDataPath(
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
    drawRegisterBottom(1570, beginY, ttlRegisterHeight, registerDriverNames[11], 40, ['data-path-right', 'data-path-to-alu-lane-right-active', 'data-path-to-alu-lane-right-active'])
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
    layer.add(text0Ld)
    // add the layer to the stage
    stage.add(layer)
}

document.addEventListener('DOMContentLoaded', function() {
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