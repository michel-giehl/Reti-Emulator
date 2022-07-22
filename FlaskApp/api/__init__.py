import time
from flask import jsonify
from flask_restful import Api, Resource
import config

api = Api(prefix=config.API_PREFIX)

class CompilationAPI(Resource):
    def post(self):
        return jsonify({
            "a": "b",
            "c": "d"
        })

api.add_resource(CompilationAPI, '/compile')