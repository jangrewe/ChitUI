# ChitUI

A web UI for Chitubox SDCP 3.0 resin printers

## Setup
```
python -mvenv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage
After creating the virtual environment and installing the requirements, you can run ChitUI like this:
```
python main.py
```
and then access the web interface on port 54780, e.g. http://127.0.0.1:54780/

## Docker
As ChitUI needs to broadcast UDP messages on your network segment, running ChitUI in a Docker container requires host networking to be enabled for the container:
```
docker build -t chitui:latest .
docker run --rm --name chitui --net=host chitui:latest
```

## Configuration
Configuration is done via environment variables:
* `PORT` to set the HTTP port of the web interface (default: `54780`)
* `DEBUG` to enable debug logging, log colorization and code reloading (default: `False`)
