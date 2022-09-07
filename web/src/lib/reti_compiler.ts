
export class CompilationError extends Error {

    message: string;

    constructor(message: string) {
        super();
        this.message = message;
    }
}

const decodeRegister = new Map<string, number>([
    ["PC", 0],
    ["IN1", 1],
    ["IN2", 2],
    ["ACC", 3],
    ["SP", 4],
    ["BAF", 5],
    ["CS", 6],
    ["DS", 7],
]);

/**
 * parses number, throws CompilationError if NaN.
 * @param str string to convert to number
 * @returns parsed number
 * @throws CompilationError
 */
const getNumber = (str: string): number => {
    const num = Number.parseInt(str);

    if (isNaN(num)) {
        throw new CompilationError("Integer value expected");
    }

    return num;
}

const toUnsigned = (num: number): number => {
    return num + Math.pow(2, 21);
}
const toSigned = (num: number): number => {
    return num - Math.pow(2, 21);
}

export const register = (name: string): number => {
    if (decodeRegister.has(name)) {
        return decodeRegister.get(name)!!;
    }
    throw new CompilationError(`Invalid register ${name}`);
}

export const compileLoad = (args: Array<string>) => {
    if (args.length < 3)
        throw new CompilationError("Not enough arguments provided");

    let instruction = 0;

    switch (args[0].toLowerCase()) {
        case "load":
            instruction = (1 << 30) | 0 << 28;
            instruction |= register(args[1]) << 22 // destination
            instruction |= getNumber(args[2]);
            break;
        case "loadin":
            instruction = (1 << 30) | 1 << 28;
            instruction |= register(args[1]) << 25; // source
            instruction |= register(args[2]) << 22; // destination
            instruction |= toUnsigned(getNumber(args[3]));
            break;
        case "loadi":
            instruction = (1 << 30) | 3 << 28;
            instruction |= register(args[1]) << 22; // destination
            instruction |= getNumber(args[2]);
            break;
        default:
            throw new CompilationError(`Invalid instruction ${args[0]}`);
    }
    return instruction >>> 0;
}

export const compileStore = (args: Array<string>) => {
    let instruction = 0;

    switch (args[0].toLowerCase()) {
        case "store":
            instruction = 2 << 30 | 0 << 28;
            instruction |= register(args[1]) << 25 // source
            instruction |= getNumber(args[2]);
            break;
        case "storein":
            instruction = 2 << 30 | 1 << 28;
            instruction |= register(args[1]) << 22; // destination
            instruction |= register(args[2]) << 25; // source
            instruction |= toUnsigned(getNumber(args[3]));
            break;
        case "move":
            instruction = 2 << 30 | 3 << 28;
            instruction |= register(args[1]) << 25; // source
            instruction |= register(args[2]) << 22; // destination
            break;
        default:
            throw new CompilationError(`Invalid instruction ${args[0]}`);
    }
    return instruction >>> 0;
}

export const compileJump = (args: Array<string>) => {
    let instruction = 0;

    instruction = 3 << 30;

    if (args[0].toLowerCase() === "int") {
        instruction |= 1 << 25;
    } else if (args[0].toLowerCase() === "rti") {
        instruction |= 2 << 25;
    }


    switch (args[0].toLowerCase()) {
        case "nop":
            instruction |= 0 << 27;
            break;
        case "jump>":
            instruction |= 1 << 27;
            break;
        case "jump==":
            instruction |= 2 << 27;
            break;
        case "jump>=":
            instruction |= 3 << 27;
            break;
        case "jump<":
            instruction |= 4 << 27;
            break;
        case "jump!=":
            instruction |= 5 << 27;
            break;
        case "jump<=":
            instruction |= 6 << 27;
            break;
        case "jump":
            instruction |= 7 << 27;
            break;
        default:
            throw new CompilationError(`Invalid instruction ${args[0]}`);
    }
    if (args.length > 1) {
        instruction |= toUnsigned(getNumber(args[1]));
    }
    return instruction >>> 0;
}

export const compileCompute = (args: Array<string>) => {
    if (args.length != 3)
        throw new CompilationError(`Expected 3 arguments, ${args.length} provided.`);

    let instruction = 0;

    let isImmidiate = args[0].toLocaleLowerCase().at(-1) === "i";
    let isRegisterOnly = decodeRegister.has(args[2].toUpperCase());
    let instrType = isImmidiate ? args[0].substring(0, args[0].length - 1) : args[0];

    switch (instrType.toLowerCase()) {
        case "add":
            instruction = 0;
            break;
        case "sub":
            instruction = 1 << 25;
            break;
        case "mul":
            instruction = 2 << 25;
            break;
        case "div":
            instruction = 3 << 25;
            break;
        case "mod":
            instruction = 4 << 25;
            break;
        case "oplus":
            instruction = 5 << 25;
            break;
        case "or":
            instruction = 6 << 25;
            break;
        case "and":
            instruction = 7 << 25;
            break;
        default:
            throw new CompilationError(`Invalid instruction ${args[0]}`);
    }

    instruction |= register(args[1]) << 22;

    if (isRegisterOnly) {
        instruction |= 1 << 28;
        instruction |= register(args[2]) << 19;
    } else {
        instruction |= getNumber(args[2]);
    }

    if (isImmidiate) {
        instruction |= 1 << 29;
    }

    return instruction >>> 0;
}

export const compileSingle = (instruction: string) => {
    const args = instruction.split(";")[0].split("//")[0].split("#")[0].trim().split(" ");
    const command = args.at(0)?.toLowerCase();

    if (command === "" || command === null || command === undefined) {
        throw new CompilationError("No command provided");
    }

    if (command.includes("load")) {
        return compileLoad(args);
    } else if (command.includes("store") || command.includes("move")) {
        return compileStore(args);
    } else if(command.includes("jump") || command in ["nop", "int", "rti"]) {
        return compileJump(args);
    } else {
        return compileCompute(args);
    }
}

export const compile = (data: Array<string>) => {
    const result = new Array<number>();
    for (let i = 0; i < data.length; i++) {
        const args = data[i].split(";")[0].split("#")[0].split("//")[0].trim().split(" ");
        if (args.length === 0 || args[0] === "") {
            continue;
        }
        try {
            const res = compileSingle(data[i]);
            result.push(res);
        } catch(e) {
            if (e instanceof CompilationError) {
                throw new CompilationError(`${e.message} in line ${i + 1}: "${data[i]}"`)
            }
        }
    }
    return result;
}