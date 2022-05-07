FROM python:3.11.0a7
WORKDIR /code
ADD . /code
RUN git clone https://github.com/michel-giehl/PicoC-Compiler /opt/picoc/
RUN make -C /opt/picoc/ setup_pyinstaller_linux
RUN make -C /opt/picoc/ install
RUN pip install -r requirements.txt
RUN cd /code/src
CMD ["python", "server.py"]
