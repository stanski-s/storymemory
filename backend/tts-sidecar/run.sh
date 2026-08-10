#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment (venv)..."
    python3 -m venv venv
fi

echo "Activating virtual environment & installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

echo "Starting Edge-TTS FastAPI Sidecar Microservice on port 8090..."
exec uvicorn app:app --port 8090 --host 0.0.0.0
