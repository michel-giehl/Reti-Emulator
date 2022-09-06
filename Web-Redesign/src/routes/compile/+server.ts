import type { RequestEvent, RequestHandler } from "@sveltejs/kit";
import util from 'node:util';
import { exec as execOld } from "child_process";
import fs from "fs/promises";
import { CompilationError, compile } from "$lib/reti_compiler";
import { json } from '@sveltejs/kit';

const exec = util.promisify(execOld);

const randString = (length: number): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return result.join("");
}

const deleteTempFiles = async (filename: string) => {
  try {
    await fs.rm(`${filename}.picoc`);
    await fs.rm(`${filename}.error`);
    await fs.rm(`${filename}.out`);
  } catch (e: any) {
    if (e.code !== 'ENOENT') throw e;
  }
}

const readErrors = async (filename: string) => {
  try {
    await fs.access(`${filename}.error`)
    await fs.access(`${filename}.out`)
    // can access files => error
    const errorMessage = await fs.readFile(`${filename}.error`);
    const errorType = await fs.readFile(`${filename}.out`)
    return {
      error: true,
      type: errorType.toString(),
      message: errorMessage.toString(),
    };
  } catch {
    return {
      error: false
    }
  }
}

const parseCompiledCode = (code: string): string => {
  const lines = code.split("\n")
  lines.shift()
  lines.pop()
  lines.pop()
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(";", "")
  }
  return lines.join("\n")
}

const compilePicoC = async (code: string): Promise<object> => {
  const filename = `/tmp/${randString(8)}`;
  await fs.writeFile(`${filename}.picoc`, code);
  const stdout = await exec(`picoc_compiler -p ${filename}.picoc`);
  const errors = await readErrors(filename)
  if (errors.error) {
    await deleteTempFiles(filename)
    return errors;
  }
  return {
    error: false,
    compiledCode: parseCompiledCode(stdout.stdout)
  }
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST(event: RequestEvent) {
  const code = await event.request.text()
  const headers = event.request.headers;
  const language = headers.get("Language");
  if (language === "reti") {
    try {
      const result = compile(code.split("\n"))
      return json(result)
    } catch (e) {
      if (e instanceof CompilationError) {
        return json(e.message)
      }
    }
  }

  if (language === "picoc") {
    const compiledCode = await compilePicoC(code)
    return json(compiledCode)
  }
}
