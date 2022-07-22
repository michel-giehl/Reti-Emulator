import os
import sys
import config.settings

APP_ENV = os.environ.get('APP_ENV', 'Dev')
_current = getattr(sys.modules['config.settings'], f'{APP_ENV}Config')()

# copy attributes to the module for convenience
for attr in [f for f in dir(_current) if not '__' in f]:
    val = os.environ.get(attr, getattr(_current, attr))
    setattr(sys.modules[__name__], attr, val)

def as_dict():
    res = {}
    for attr in [f for f in dir(config) if not '__' in f]:
        val = getattr(config, attr)
        res[attr] = val
    return res