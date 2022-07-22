FROM python:3.10

ADD . /flask-deploy

WORKDIR /flask-deploy

RUN pip3 install gunicorn[gevent]

RUN pip3 install -r requirements.txt

EXPOSE 8000

CMD gunicorn --worker-class gevent --workers 2 --bind 0.0.0.0:8000 wsgi:app --max-requests 10000 --timeout 5 --keep-alive 5 --log-level info
