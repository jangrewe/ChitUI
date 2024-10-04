FROM python:3.12-alpine

WORKDIR /app

RUN pip install gevent==24.2.1 gevent-websocket==0.10.1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

ENTRYPOINT ["python", "main.py"]
