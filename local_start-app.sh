#!/bin/bash
#to run it in cmder : sh ./local_start-app.sh

cleanup() {
    echo ""
    echo "Stopping Spring Boot and Angular servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Both servers stopped cleanly."
    exit 0
}

# detects the Ctrl+C to start the cleanup function
trap cleanup SIGINT

# finds the directory where this script is saved
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# start the Java backend
echo "Starting Spring Boot backend..."
cd "$BASE_DIR/backend" || { echo "Error: backend folder not found!"; exit 1; }
mvn spring-boot:run &
BACKEND_PID=$!

# start the Angular frontend
echo "Starting Angular frontend..."
cd "$BASE_DIR/grocery-frontend" || { echo "Error: grocery-frontend folder not found!"; exit 1; }
ng serve --host 0.0.0.0 &
FRONTEND_PID=$!

wait