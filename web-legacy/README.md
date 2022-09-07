# ReTi-Emulator

Executes ReTi code and displays it.

## [Live version](https://reti.gim.one/)

## Built with

* [Python 3](https://python.org/) (ReTi logic & emulator)
* [Flask](https://flask.palletsprojects.com/en/2.0.x/) (Server backend)
* [CodeMirror](https://codemirror.net/) (Code Editor)
* [PicoC-Compiler](https://github.com/matthejue/PicoC-Compiler)
* [ReTi Simulator](http://reti.agrafix.net) (ReTi Code highlighting)

## 🚀 Quick Start

### Linux

Installing Pico-C Compiler
```sh
git clone https://github.com/michel-giehl/PicoC-Compiler .
```

```sh
make -C ./PicoC-Compiler/ setup_pyinstaller_linux
```

```sh
make -C ./PicoC-Compiler/ install
```

Installing Reti Simulator
```sh
git clone https://github.com/michel-giehl/Reti-Emulator .
```

```sh
cd ./Reti-Emulator/FlaskApp/
```

```sh
pip3 install -r requirements.txt
```

Running Reti Simulator

```sh
gunicorn --worker-class gevent --workers 2 --bind 0.0.0.0:8000 wsgi:app --max-requests 10000 --timeout 5 --keep-alive 5 --log-level info
```

Arguments:
- `--workers` Number of worker processes
- `--max-requests` The maximum number of requests a worker will process
- `--timeout` Request timeout


## Instruction set
- [x] `LOAD D i`
- [x] `LOADI D i`
- [x] `LOADIN S D i`
- [x] `STORE S i`
- [x] `STOREIN D S i`
- [x] `MOVE S D`
- [x] `ADDI D i`
- [x] `SUBI D i`
- [x] `DIVI D i`
- [x] `MULI D i`
- [x] `MODI D i`
- [x] `OPLUSI D i`
- [x] `ORI D i`
- [x] `ANDI D i`
- [x] `ADD D i`
- [x] `SUB D i`
- [x] `DIV D i`
- [x] `MUL D i`
- [x] `MOD D i`
- [x] `OPLUS D i`
- [x] `OR D i`
- [x] `AND D i`
- [x] `ADD D S`
- [x] `SUB D S`
- [x] `DIV D S`
- [x] `MUL D S`
- [x] `MOD D S`
- [x] `OPLUS D S`
- [x] `OR D S`
- [x] `AND D S`
- [x] `NOP`
- [x] `JUMP i`
- [x] `JUMP== i`
- [x] `JUMP!= i`
- [x] `JUMP> i`
- [x] `JUMP>= i`
- [x] `JUMP< i`
- [x] `JUMP<= i`
- [ ] `INT i`
- [ ] `RTI`