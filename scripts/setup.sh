#!/bin/bash
# ClipFlow Setup Script

echo "ClipFlow Setup"
echo "=============="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Install from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "Node.js 22+ required. Current: $(node -v)"
    exit 1
fi
echo "[ok] Node.js $(node -v)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 not found. Install from https://python.org"
    exit 1
fi
echo "[ok] Python $(python3 --version 2>&1)"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ffmpeg
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y ffmpeg
    else
        echo "Please install FFmpeg manually: https://ffmpeg.org/download.html"
        exit 1
    fi
fi
echo "[ok] FFmpeg $(ffmpeg -version 2>&1 | head -1)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi
echo "[ok] pnpm $(pnpm --version)"

# Install Node dependencies
echo ""
echo "Installing Node.js dependencies..."
pnpm install

# Setup Python environment for WhisperX
echo ""
echo "Setting up WhisperX..."
cd whisper
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
deactivate
cd ..
echo "[ok] WhisperX Python environment ready"

# Create data directories
mkdir -p data/{db,uploads,audio,transcriptions,renders,templates}

# Copy .env.example if no .env exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "Created .env file. Please add your API keys:"
    echo "  ANTHROPIC_API_KEY=sk-ant-..."
    echo "  HF_TOKEN=hf_... (optional, for speaker diarization)"
fi

echo ""
echo "ClipFlow setup complete!"
echo ""
echo "To start:"
echo "  pnpm dev"
echo ""
echo "Server: http://localhost:4400"
echo "App:    http://localhost:4401"
echo "Docs:   http://localhost:4400/docs"
