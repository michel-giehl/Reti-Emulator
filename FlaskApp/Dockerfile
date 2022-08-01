FROM python:3.10

ADD . /flask-deploy

WORKDIR /flask-deploy

#RUN git clone https://github.com/matthejue/PicoC-Compiler /opt/picoc/
#RUN pip3 install -r /opt/picoc/requirements.txt
#RUN ln -sr /opt/picoc/src/main.py /usr/local/bin/picoc_compiler && echo "compiler /usr/local/bin/picoc_compiler was successfully installed" || echo "compiler /usr/local/bin/picoc_compiler is already installed"
RUN git clone https://github.com/michel-giehl/PicoC-Compiler /opt/picoc/
RUN make -C /opt/picoc/ setup_pyinstaller_linux
RUN make -C /opt/picoc/ install

RUN pip3 install -r requirements.txt

EXPOSE 8000

CMD gunicorn --worker-class gevent --workers 2 --bind 0.0.0.0:8000 wsgi:app --max-requests 10000 --timeout 5 --keep-alive 5 --log-level info
