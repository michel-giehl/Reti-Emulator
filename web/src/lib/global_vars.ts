import { writable } from "svelte/store";
import { ReTi } from "./reti_emulator";

export const clockSpeed = writable(1);

export const numberStyle = writable(10);

export const uartData = writable({
  mode: "send",
  data: [] as Array<number>
});

export const reti = writable(new ReTi())

export const retiStates = writable([]);

export const isFetching = writable(false);

export const phase = writable(0);

export const paused = writable(false);

export const running = writable(false);

export const editorMode = writable("reti")

export const showAnimation = writable(true);

export const codeMirror = writable(null);

export const undoAmount = writable(20);

export const canvasScale = writable(0.6);

export const strokeColor = writable("black");

export const retiCode = writable("", function start() {
  fetch("/examples/fibonacci.reti").then(r => {
    r.text().then(str => {
      retiCode.set(str);
      let shouldUnsub = false;
      const unsubscribe = codeMirror.subscribe(cm => {
        if (shouldUnsub) {
          unsubscribe()
          return
        }
        if (cm !== null) {
          cm.setValue(str)
          shouldUnsub = true;
        }
      })
    })
  })
})

export const picoCCode = writable("", function start() {
  fetch("/examples/fibonacci.picoc").then(r => {
    r.text().then(str => {
      picoCCode.set(str);
    })
  })
})

export let retiClock = {
  timer: null as NodeJS.Timer | null
};

export const registerNames = ["PC", "IN1", "IN2", "ACC", "SP", "BAF", "CS", "DS", "I"]
