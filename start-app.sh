#!/bin/bash

cleanup() {
    echo ""
    echo "Stopping Spring Boot and Angular servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo "Both servers stopped cleanly."
    exit 0
}

# detects the ctrl C to start the cleanup function
trap cleanup SIGINT

echo "Pulling latest code from GitHub..."
cd ~/La-signare-web || exit
git pull origin main

echo "Starting Spring Boot backend (Production Mode)..."
cd ~/La-signare-web/backend || exit
# Run the compiled JAR directly! Adjust the filename if yours is slightly different.
java -jar target/grocery-backend-0.0.1-SNAPSHOT.jar -Djava.security.egd=file:/dev/./urandom &
BACKEND_PID=$!

# Give Java 5 seconds to boot up
sleep 5

echo "Starting Angular frontend..."
cd ~/La-signare-web/grocery-frontend || exit
# Ensure Node listens to the outside world!
HOST=0.0.0.0 PORT=4200 node dist/grocery-frontend/server/server.mjs &
FRONTEND_PID=$!

wait