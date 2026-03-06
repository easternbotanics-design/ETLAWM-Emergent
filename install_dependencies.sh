#!/bin/bash

echo "Starting installation of all project dependencies..."

# Backend dependencies
echo "Installing backend dependencies (Python)..."
cd backend
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
else
    echo "pip3 is not installed. Please install Python 3 and pip3."
fi
cd ..

# Frontend dependencies
echo "Installing frontend dependencies (Node.js)..."
cd frontend
if command -v npm &> /dev/null; then
    npm install
else
    echo "npm is not installed. Please install Node.js (which includes npm) to install frontend dependencies."
    echo "You can download Node.js from https://nodejs.org/ or install it via Homebrew: brew install node"
fi
cd ..

echo "Dependency installation process finished."
