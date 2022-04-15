const config = {
  triangleStretch: 0.8,
  marginSides: 0.04,
  registerNames: ["PC", "IN1", "IN2", "ACC", "SP", "BAF", "CS", "DS", "I"],
  driverNames: ["0Ld", "PCLd", "IN1Ld", "IN2Ld", "ACCLd", "SPLd", "BAFLd", "CSLd", "DSLd", "0Rd", "IRd", "DRd"],
}

/**
* Helper class
*/
class Rotation {
  static UP = new Rotation("UP")
  static DOWN = new Rotation("DOWN")
  static LEFT = new Rotation("LEFT")
  static RIGHT = new Rotation("RIGHT")

  constructor(name) {
    this.name = name
  }

  toString() {
    return this.name
  }
}

class Point {
  constructor(x, y) {
    if (isNaN(x) || isNaN(y)) {
      throw Error("x and y must be numbers")
    }
    this.x = x
    this.y = y
  }
}

drawTriangle = (ctx, position, length, rotation) => {
  ctx.beginPath()
  ctx.moveTo(position.x, position.y)
  switch (rotation) {
    case Rotation.UP:
      ctx.lineTo(position.x - length / 2, position.y + length * config.triangleStretch)
      ctx.lineTo(position.x + length / 2, position.y + length * config.triangleStretch)
      break
    case Rotation.DOWN:
      ctx.lineTo(position.x - length / 2, position.y - length * config.triangleStretch)
      ctx.lineTo(position.x + length / 2, position.y - length * config.triangleStretch)
      break
    case Rotation.LEFT:
      ctx.lineTo(position.x + length * config.triangleStretch, position.y - length / 2)
      ctx.lineTo(position.x + length * config.triangleStretch, position.y + length / 2)
      break
    case Rotation.RIGHT:
      ctx.lineTo(position.x - length * config.triangleStretch, position.y - length / 2)
      ctx.lineTo(position.x - length * config.triangleStretch, position.y + length / 2)
      break
  }
  ctx.closePath()
}
/**
 * Draw rectangle
 * @param position{Point(x, y)} start position (top center)
 */
drawRect = (ctx, position, width, height) => {
  if (!(position instanceof Point)) {
    throw Error("position must be a Point")
  }
  let leftX = position.x - width / 2
  let rightX = position.x + width / 2
  let topY = position.y
  let bottomY = position.y + height
  ctx.moveTo(leftX, topY)
  ctx.lineTo(leftX, bottomY)
  ctx.lineTo(rightX, bottomY)
  ctx.lineTo(rightX, topY)
  ctx.lineTo(leftX, topY)
}


drawDataPath = (ctx, startPosX, startPosY) => {
  let width = ctx.canvas.width
  let triangleSize = 0.04 * width
  let lineALength = 0.65
  let lineALengthPixels = (lineALength - config.marginSides) * width
  let lineAStartPosX = startPosX + config.marginSides * width
  let triagnleLength = triangleSize * config.triangleStretch
  let lineBLengthPixels = ((1 - lineALength - config.marginSides) * width) - triagnleLength
  let lineBStartPosX = lineAStartPosX + lineALengthPixels + triagnleLength
  ctx.moveTo(lineAStartPosX, startPosY)
  ctx.lineTo(lineAStartPosX + lineALengthPixels, startPosY)
  ctx.stroke()
  drawTriangle(ctx, {x: lineAStartPosX + lineALengthPixels, y: startPosY}, triangleSize, Rotation.LEFT)
  ctx.stroke()
  ctx.moveTo(lineBStartPosX, startPosY)
  ctx.lineTo(lineBStartPosX + lineBLengthPixels, startPosY)
  ctx.stroke()
}

drawLAndRPaths = (ctx, startPos) => {
  if (!(startPos instanceof Point)) {
    throw Error("position must be a Point")
  }
  let width = ctx.canvas.width
  let length = (1 - config.marginSides) * width
  let gapBegin = startPos.x + (0.7 * length)
  let gapSize = 0.08 * width
  ctx.moveTo(startPos.x + config.marginSides * width, startPos.y)
  ctx.lineTo(gapBegin, startPos.y)
  ctx.moveTo(gapBegin + gapSize, startPos.y)
  ctx.lineTo(startPos.x + length, startPos.y)
  ctx.stroke()
}

drawALU = (ctx, startPos) => {
  if (!(startPos instanceof Point)) {
    throw Error("position must be a Point")
  }
  let width = ctx.canvas.width
  let triangleSize = 0.03 * width
  let triangleLength = triangleSize * config.triangleStretch
  let margin = (1 - config.marginSides) * width
  let begin = startPos.x + (0.68 * margin)
  let length = 0.12 * width
  let height = 100
  let middle = begin + length / 2
  let angle = 60
  // text
  ctx.fillStyle = "red"
  ctx.textAlign = "center"
  ctx.fillText("ALU", middle, startPos.y + height / 2 + 15)
  // ALU Outline
  ctx.moveTo(begin, startPos.y)
  ctx.lineTo(begin + length, startPos.y)
  ctx.stroke()
  ctx.lineTo(begin + length - angle, startPos.y + height)
  ctx.lineTo(begin + angle, startPos.y + height)
  ctx.closePath()
  // Connection to Address path
  ctx.moveTo(middle, startPos.y + height)
  ctx.lineTo(middle, startPos.y + 175 - triangleLength)
  ctx.stroke()
  drawTriangle(ctx, new Point(middle, startPos.y + 175), triangleSize, Rotation.DOWN)
  ctx.moveTo(middle, startPos.y + 175)
  ctx.lineTo(middle, startPos.y + 200)
  ctx.stroke()
  // ALUDId
  let ALUDIdStartPosition = new Point(30, startPos.y - height + triangleLength)
  drawTriangle(ctx, ALUDIdStartPosition, triangleSize, Rotation.UP)
  ctx.moveTo(middle, startPos.y + 110)
  ctx.lineTo(30, startPos.y + 110)
  ctx.lineTo(30, ALUDIdStartPosition.y + triangleLength)
  ctx.moveTo(30, ALUDIdStartPosition.y)
  ctx.lineTo(30, 50)
  ctx.stroke()
}

drawAddressPath = (ctx, startPosX, startPosY) => {
  let width = ctx.canvas.width
  let length = (1 - config.marginSides) * width
  ctx.moveTo(startPosX + config.marginSides * width, startPosY)
  ctx.lineTo(startPosX + length, startPosY)
  ctx.stroke()
  ctx.fillStyle = "green"
  ctx.fillText("A", startPosX + length - 30, startPosY + 30)
}

drawRegister = (ctx, startPos, text = "N/A", driverName = "N/A") => {
  if (!(startPos instanceof Point)) {
    throw Error("startPos must be a Point")
  }
  let height = ctx.canvas.height
  let width = ctx.canvas.width
  let dataPathArrowLength = 0.04 * height
  let registerBoxLength = 0.05 * width
  let registerBoxHeight = 0.04 * height
  let triangleSize = 0.05 * height
  let dataPathLineEndPos = new Point(startPos.x, startPos.y + dataPathArrowLength)
  let registerOutputPathStartPos = new Point(dataPathLineEndPos.x, dataPathLineEndPos.y + registerBoxHeight)
  let registerOutputPathEndPos = new Point(dataPathLineEndPos.x, registerOutputPathStartPos.y + 350) // TODO: calculate actual y offset
  let driverStartPos = new Point(registerOutputPathEndPos.x, registerOutputPathEndPos.y + triangleSize * config.triangleStretch)
  // Register Name
  ctx.fillStyle = "red"
  ctx.textAlign = "center"
  ctx.fillText(text, startPos.x, dataPathLineEndPos.y + registerBoxHeight / 2 + 10)
  // Register
  ctx.moveTo(startPos.x, startPos.y)
  ctx.lineTo(dataPathLineEndPos.x, dataPathLineEndPos.y)
  ctx.moveTo(dataPathLineEndPos.x, dataPathLineEndPos.y)
  ctx.lineTo(dataPathLineEndPos.x, dataPathLineEndPos.y)
  drawRect(ctx, dataPathLineEndPos, registerBoxLength, registerBoxHeight)
  ctx.moveTo(registerOutputPathStartPos.x, registerOutputPathStartPos.y)
  ctx.lineTo(registerOutputPathEndPos.x, registerOutputPathEndPos.y)
  ctx.stroke()
  drawTriangle(ctx, driverStartPos, triangleSize, Rotation.DOWN)
  // Driver Name
  ctx.fillStyle = "blue"
  ctx.textAlign = "right"
  ctx.fillText(driverName, driverStartPos.x - 5, driverStartPos.y + registerBoxHeight / 2 + 10)
  ctx.stroke()
  ctx.moveTo(driverStartPos.x, driverStartPos.y)
  ctx.lineTo(startPos.x, 600)
  ctx.stroke()
}

document.addEventListener("DOMContentLoaded", function() {
  let start = Date.now()
  let c = document.getElementById("canvas")
  let ctx = c.getContext("2d")
  let width = ctx.canvas.width
  ctx.lineWidth = 4
  ctx.font = "30px Consolas, 'Courier New', monospace"
  drawDataPath(ctx, 0, 50)
  drawLAndRPaths(ctx, new Point(0, 600))
  ctx.lineWidth = 2
  drawALU(ctx, new Point(0, 650))
  ctx.lineWidth = 4
  drawAddressPath(ctx, 0, 850)
  ctx.lineWidth = 2
  for (let i = 1; i <= 8; i++) {
    drawRegister(ctx, new Point(100 + i * 0.07 * width, 50), config.registerNames[i - 1], config.driverNames[i])
  }
  drawRegister(ctx, new Point(50 + 12 * 0.07 * width, 50), config.registerNames[8], config.driverNames[10])
  let took = Date.now() - start
  console.log(`Finished drawing after ${took}ms!`)
})

