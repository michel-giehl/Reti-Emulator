class BaseConfig():
    TESTING = False
    DEBUG = False
    API_PREFIX = '/api'

class DevConfig(BaseConfig):
    FLASK_ENV = 'development'
    DEBUG = True

class ProductionConfig(BaseConfig):
    FLASK_ENV = 'production'
