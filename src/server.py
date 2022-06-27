# my packages
import reti_compiler as c
from picoc_compiler_api import compile_picoc
# system packages
import re
import os
import random
# other packages
import asyncio
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import Flask, send_from_directory, request, jsonify
from prometheus_flask_exporter import PrometheusMetrics

# Flask App
app = Flask(__name__)
metrics = PrometheusMetrics(app, path='/metrics')
# Rate Limiter
limiter = Limiter(app, key_func=get_remote_address)

@app.errorhandler(429)
async def ratelimit_handler(e):
    """
    Custom code 429 handler
    """
    return "You are being rate limited", 429

@app.route('/<path:path>')
@app.route('/')
@metrics.do_not_track()
def send(path = 'index.html'):
    """
    Route static files
    """
    return send_from_directory('web/', path)

@app.route('/sentry/run', methods=['POST'])
@metrics.counter('simulations_run_by_type', 'Number of simulations by type',
         labels={'type': lambda: request.headers.get('Type')})
def sentry_run():
    return ""

@app.route('/compile', methods=['POST'])
async def compile():
    """
    Compiles Pico-C Code into ReTi Assembler and returns it as plain text.
    """
    code = request.data.decode()
    lang = request.headers.get("Language")

    if lang is None:
        return "No Language provided", 400
    
    lang = lang.lower()

    if lang == "picoc":
        compiled_code = await compile_picoc(code)
        return jsonify({
            "reti_code": compiled_code.reti_code,
            "symbol_table": compiled_code.symbol_table,
            "symbol_table_pretty": compiled_code.symbol_table_pretty,
            "warnings_and_errors": compiled_code.warnings_and_errors
        })
    elif lang == "reti":
        try:
            return jsonify({"code": c.compile(code.split("\n"))})
        except c.CompilationError as e:
            return jsonify({"error": e.message})


if __name__ == '__main__':
    app.run(host=os.getenv("HOST") or "127.0.0.1", debug=True, port=int(os.getenv("PORT") or 8000))
