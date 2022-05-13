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


# Flask App
app = Flask(__name__)
# Custom JSONEncoder
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
# Rate Limiter
limiter = Limiter(app, key_func=get_remote_address)

@app.errorhandler(429)
async def ratelimit_handler(e):
    """
    Custom code 429 handler
    """
    return "You are being rate limited", 429

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

@app.route('/<path:path>')
@app.route('/')
async def send(path = 'index.html'):
    """
    Route static files
    """
    return send_from_directory('web/', path)

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
