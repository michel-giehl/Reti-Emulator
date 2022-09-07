FROM python:3.10

WORKDIR /opt/picoc/

RUN git clone https://github.com/matthejue/PicoC-Compiler /opt/picoc/
RUN pip3 install -r /opt/picoc/requirements.txt
RUN ln -sr /opt/picoc/src/main.py /usr/local/bin/picoc_compiler && echo "compiler /usr/local/bin/picoc_compiler was successfully installed" || echo "compiler /usr/local/bin/picoc_compiler is already installed"

RUN useradd picoc \
    && mkdir /home/picoc \
    && chown -R picoc:picoc /home/picoc

RUN chmod 0755 /usr/local/bin/picoc_compiler

COPY run_in_docker.sh /
RUN chmod 0755 /run_in_docker.sh

USER picoc

CMD ["/run_in_docker.sh"]