FROM python:3.8
WORKDIR /code
ADD . /code
RUN pip install -r requirements.txt
CMD ["python", "server.py"]