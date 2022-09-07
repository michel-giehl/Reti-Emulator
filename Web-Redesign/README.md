# ReTi-Simulator

Executes ReTi code and displays it.

## [Live version](https://reti-new.gim.one/)

## Built with

* [SvelteKit](https://kit.svelte.dev/)
* [Node JS](https://nodejs.org/)
* [CodeMirror](https://codemirror.net/) (Code Editor)
* [PicoC-Compiler](https://github.com/matthejue/PicoC-Compiler)
* [TailwindCSS](https://tailwindcss.com/)
* [DaisyUI](https://daisyui.com/)

## 🚀 Quick Start

### Linux

Requirements:
* Python >= 3.10
* NodeJS >= 16.14

Installing Pico-C Compiler:

```sh
git clone https://github.com/matthejue/PicoC-Compiler .
```

```sh
make -C ./PicoC-Compiler/ setup_pyinstaller_linux
```

```sh
make -C ./PicoC-Compiler/ install
```

Installing Reti Simulator:
```sh
git clone https://github.com/michel-giehl/Reti-Emulator .
```

```sh
cd ./Reti-Emulator/Web-Redesign/
```

```sh
npm install
npm run build
```

Running Reti Simulator

```sh
cd build/
node index.js
```