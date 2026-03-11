#!/bin/bash

cleanup() {
    echo ""
    echo "Stopping Spring Boot and Angular servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo "Both servers stopped cleanly."
    exit 0
}

# detects the crtl C to start the cleanup function
trap cleanup SIGINT

# start the java backend
echo "Starting Spring Boot backend..."
cd ~/La-signare-web/backend || exit
mvn spring-boot:run &
BACKEND_PID=$!

# start the angular frontend
echo "Starting Angular frontend..."
cd ~/La-signare-web/grocery-frontend || exit
ng serve --host 0.0.0.0 --configuration production & &
FRONTEND_PID=$!


wait
