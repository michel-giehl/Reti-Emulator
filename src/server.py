# my packages
import reti as r
import reti_compiler as c
from constants import *
from picoc_compiler_api import compile_picoc
# system packages
import re
import os
# other packages
import asyncio
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import Flask, send_from_directory, request, jsonify


# Flask App
app = Flask(__name__)
# Custom JSONEncoder
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
# Rate Limiter
limiter = Limiter(app, key_func=get_remote_address)

@app.route('/<path:path>')
@app.route('/')
async def send(path = 'index.html'):
    """
    Route static files
    """
    return send_from_directory('web/', path)


@app.errorhandler(429)
async def ratelimit_handler(e):
    """
    Custom code 429 handler
    """
    return "You are being rate limited", 429

@app.route('/compile', methods=['POST'])
@limiter.limit('240/minute;20000/day')
async def compile():
    """
    Compiles Pico-C Code into ReTi Assembler and returns it as plain text.
    """
    code = request.data.decode()
    return jsonify(compile_picoc(code))

@app.route('/run', methods=['POST'])
# @limiter.limit('1/2seconds;12/minute')
async def run():
    """
    Runs reti code and returns the reti's state after every execution
    """
    # get request body as string
    code = request.data.decode()
    # get data that uart sends to ReTi.
    # default is 2 commands, encoded in 8 bit segments. LOADI ACC 42, LOADI PC 0
    uart_data = request.headers.get("UART-Data", default="112,192,0,42,112,0,0,0")
    if re.match("([0-9]{1,3},{0,1})+", uart_data):
        uart_data = [int(i) for i in uart_data.split(",")]
    else:
        return "Error while decoding UART-Data. Make sure to provide comma-seperated numbers in range [0-255]", 400
    # compile code, return error if compilation failed
    compiled_code = None
    try:
        compiled_code = c.compile(code.split("\n"))
    except RuntimeError as e:
        if isinstance(e, c.CompilationError):
            return e.message, 400
        else:
            print(e)
            return "An error was thrown during compilation. Please check your syntax.", 400
    
    # new reti instance
    reti = r.ReTi()
    r.load_constants(reti)
    reti.read_program(compiled_code)
    reti_states = dict()
    size = 0
    execution_finished = False
    # run up to 10,000 iterations
    for i in range(10_000):
        reti.fetch()
        if reti._register[I] == 0 or reti._register[I] == c.compile_single("JUMP 0"):
            execution_finished = True
            break
        reti.execute()
        reti_states[i] = {
            "instruction": c.decompile(reti._register[I]),
            "registers": dict(zip(("PC", "IN1", "IN2", "ACC", "SP", "BAF", "CS", "DS", "I"), reti._register)),
            "sram": reti.sram.copy(),
            "uart": reti.uart.copy()
        }
        size += len(str(reti_states[i]))
        # limit to 1 MB of data
        if size > 1_000_000:
            break
        r.simulate_uart(reti, uart_data, mode="READ")
    return_data = {
        "execution_finished": execution_finished,
        "reti": reti_states
    }
    return jsonify(return_data)

if __name__ == '__main__':
    debug = os.getenv("DEBUG") if os.getenv("DEBUG") is not None else True
    app.run(host=os.getenv("HOST") or "127.0.0.1", debug=bool(debug), port=int(os.getenv("PORT") or 8000))
