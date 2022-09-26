import { statusText } from '$lib/components/Alert.svelte';
import * as config from "$lib/global_vars"
import { I, ReTi } from '$lib/reti_emulator';
import { animateCOMPUTE, animateCOMPUTEI, animateCOMPUTERegisterOnly, animateFetch, animateLOAD, animateLOADI, animateLOADIN, animateMOVE, animateSTORE, animateSTOREIN, draw } from '$lib/canvas';
import { decompile } from '$lib/reti_decompiler';

let $running: any;
let $clockSpeed: any;
let $codeMirror: any;
let $reti: ReTi;
let $retiStates: any;
let $fetch: any;
let $phase: any;
let $paused: boolean;
let $picocCode: string;
let $retiCode: string;
let $editorMode: string;
let $uartData: any;


/**
 * Compile reti/picoc code
 *
 * @param {string}         code     string of code to compile
 * @param {"reti"|"picoc"} language language to compile ("reti" or "picoc")
 */
export async function compile(code: string, language: 'picoc' | 'reti') {
  let response = await fetch('/compile', {
    method: 'POST',
    headers: { Language: language },
    body: code
  });

  const text = await response.text();

  if (response.ok) {
    let json = { error: false, text: JSON.parse(text) };
    return json;
  }

  return { error: !response.ok, text: text };
}

export const updateClockSpeed = (speed: number) => {
  if ($reti === null || !$running)
    return;

  const animationSpeed = 1000 / speed

  if ($running && config.retiClock.timer !== null) {
    clearInterval(config.retiClock.timer)
  }
  config.retiClock.timer = setInterval(() => {
    try {
      if (!$paused)
        nextReTiState()
    } catch (e) {
      clearInterval(config.retiClock.timer)
    }
  }, animationSpeed)
}

const doAnimate = () => {
  if ($fetch) {
    animateFetch($phase)
  } else {
    let reti = $reti
    let command = decompile(reti.registers[I])
    let args = command?.split(" ") ?? ""
    // LOAD & STORE
    switch (args[0]) {
      case "LOAD":
        animateLOAD(args[1], $phase)
        break
      case "LOADIN":
        animateLOADIN(args[1], args[2], $phase)
        break
      case "LOADI":
        animateLOADI(args[1], $phase)
        break
      case "STORE":
        animateSTORE(args[1], $phase)
        break
      case "STOREIN":
        animateSTOREIN(args[1], args[2], $phase)
        break
      case "MOVE":
        animateMOVE(args[1], args[2], $phase)
        break
    }
    // COMPUTE
    const computeCommands = ["ADD", "SUB", "MUL", "DIV", "MOD", "OPLUS", "OR", "AND"]
    const computeICommands = computeCommands.map(cmd => cmd + "I")
    if (computeICommands.includes(args[0])) {
      animateCOMPUTEI(computeICommands.indexOf(args[0]), args[1], $phase)
    } else if (computeCommands.includes(args[0])) {
      let registerOnly = config.registerNames.includes(args[2])
      let mode = computeCommands.indexOf(args[0])
      if (registerOnly) {
        animateCOMPUTERegisterOnly(mode, args[2], args[1], $phase)
      } else {
        animateCOMPUTE(mode, args[1], $phase)
      }
    }
    // JUMP
    if (args[0].startsWith("JUMP")) {
      animateCOMPUTEI(0, "PC")
    }
  }
}

export const nextReTiState = () => {
  if ($phase === 0) {
    $retiStates.push(new ReTi($reti))
    if ($retiStates.length >= 20) {
      $retiStates.shift()
    }
    config.retiStates.update(val => val)
    if ($fetch) {
      $reti.fetch()
      config.reti.update(reti => reti)
    } else {
      $reti.execute()
      config.reti.update(reti => reti)
    }
  }
  config.phase.update(p => p + 1)
  if ($fetch && $phase == 3) {
    config.isFetching.set(false)
    config.phase.set(0)
  } else if (!$fetch && $phase == 4) {
    config.isFetching.set(true)
    if ($reti.simulateUART($uartData.mode, $uartData.data)) {
      console.log(`LOL ${$uartData.data}`)
      config.uartData.update((u) => {
        return u
      })
    }
    config.phase.set(0)
  }
  draw($reti)
  doAnimate()
};


export const previousReTiState = () => {
  config.phase.update(val => val - 1)
  if ($phase === -1) {
    if ($retiStates.length === 0) {
      statusText(true, "error", "Can't go back any futher")
      config.phase.set(0)
      return
    }
    config.phase.set($fetch ? 3 : 2)
    config.isFetching.update(val => !val)
    config.reti.set($retiStates.pop())
    config.retiStates.update(val => val)
  }
  draw($reti)
  doAnimate()
  // display_state()
}

export async function runReti() {
  const start = Date.now();
  statusText(true, 'info', 'Compiling...');
  const mode = $editorMode;
  let code = $codeMirror.getValue();
  console.log(mode)
  if (mode === "picoc") {
    const compiledPicoCCode = (await compile(code, "picoc")).text
    if (compiledPicoCCode.error) {
      statusText(true, "error", compiledPicoCCode.message)
      return
    }
    code = compiledPicoCCode.compiledCode
    config.retiCode.set(code)
  }
  const compiledCode = await compile(code, 'reti');
  if (compiledCode.error) {
    statusText(true, 'error', compiledCode.text);
    return;
  } else {
    let took = Date.now() - start;
    statusText(true, 'success', `Compilation successful. Took ${took}ms.`);
  }
  // Clear reti states
  config.retiStates.set([]);
  config.running.set(true);
  config.isFetching.set(true);
  config.phase.set(0);
  let reti = new ReTi();
  reti.readProgram(compiledCode.text);
  config.reti.set(reti);
  reti.fetch();
  draw(reti);
  // doAnimate()
  // display_state()
  updateClockSpeed($clockSpeed)
}


export function save() {
  alert('KEKO');
}

export const switchCodeWindow = (newMode: string) => {
  const currMode = $codeMirror.getMode().name
  const code = $codeMirror.getValue()
  switch (currMode) {
    case "reti":
      config.retiCode.set(code)
      break;
    case "clike":
      console.log("LOLOLOLOLOLOL")
      config.picoCCode.set(code)
      break;
  }

  switch (newMode) {
    case "reti":
      $codeMirror.setValue($retiCode)
      $codeMirror.setOption('mode', 'reti')
      break;
    case "picoc":
      $codeMirror.setValue($picocCode)
      $codeMirror.setOption('mode', 'text/x-csrc')
      break;
  }
}

export const loadExample = async (name: string) => {
  const result = await fetch(`/examples/${name}`)
  if (!result.ok) {
    statusText(true, "error", `Unable to load ${name}`)
    return
  }
  const text = await result.text()
  $codeMirror.setValue(text)
}

config.running.subscribe(val => $running = val);
config.clockSpeed.subscribe(val => {
  $clockSpeed = val
  updateClockSpeed(val)
});
config.codeMirror.subscribe(val => $codeMirror = val);
config.reti.subscribe(val => $reti = val);
config.isFetching.subscribe(val => $fetch = val);
config.phase.subscribe(val => $phase = val);
config.retiStates.subscribe(val => $retiStates = val);
config.paused.subscribe(val => $paused = val);
config.retiCode.subscribe(val => $retiCode = val);
config.picoCCode.subscribe(val => $picocCode = val);
config.editorMode.subscribe(val => $editorMode = val);
config.uartData.subscribe(val => $uartData = val);
