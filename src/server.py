# my packages
import reti as r
import compiler as c
import utility as util
from constants import *
# system packages
import re
import time
from os import getenv
from string import ascii_letters
# other packages
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__)
limiter = Limiter(app, key_func=get_remote_address)


@app.route('/<path:path>')
@app.route('/')
def send(path = 'index.html'):
    """
    Route static files
    """
    return send_from_directory('web/', path)

@app.route('/legacy/<path:path>')
@app.route('/legacy/')
def send_legacy(path = 'index.html'):
    """
    Route static files
    """
    return send_from_directory('web-legacy/', path)

@app.errorhandler(429)
def ratelimit_handler(e):
    """
    Custom code 429 handler
    """
    return "Please slow down", 429

@app.route('/run', methods=['POST'])
@limiter.limit('2/second;20/minute')
def run():
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
    except c.CompilationError as e:
        return e.message, 400
    
    # new reti instance
    reti = r.ReTi()
    r.load_constants(reti)
    reti.read_program(compiled_code)
    reti_states = dict()
    size = 0
    execution_time = 0.0
    jsonify_time = 0.0
    execution_finished = False
    # run up to 10,000 iterations
    for i in range(10_000):
        start = time.monotonic()
        reti.fetch()
        if reti._register[I] == 0:
            execution_finished = True
            break
        reti.execute()
        execution_time += time.monotonic() - start
        start = time.monotonic()
        reti_states[i] = {
            "instruction": c.decompile(reti._register[I]),
            "registers": dict(zip(("PC", "IN1", "IN2", "ACC", "SP", "BAF", "CS", "DS", "I"), reti._register)),
            "sram": reti.sram.copy(),
            "uart": reti.uart.copy()
        }
        size += len(str(reti_states[i]))
        jsonify_time += time.monotonic() - start
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
    app.run(host=getenv("HOST") or "127.0.0.1", debug=True, port=getenv("PORT") or 8000)