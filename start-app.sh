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

# ==========================================
# BUILD STEPS
# ==========================================

echo "Building Spring Boot backend..."
cd ~/La-signare-web/backend || exit
mvn clean package -DskipTests

echo "Building Angular frontend..."
cd ~/La-signare-web/grocery-frontend || exit
npm run build

echo "Committing and pushing frontend dist folder to GitHub..."
# Force add the dist folder
git add dist/ -f
# Commit the files (will just bypass if there are no changes)
git commit -m "Force adding production dist folder"
# Push to GitHub
git push

# ==========================================
# SERVER STARTUP
# ==========================================

echo "Starting Spring Boot backend (Production Mode)..."
cd ~/La-signare-web/backend || exit

# FIXED: The -D flag is now BEFORE the -jar flag!
java -Djava.security.egd=file:/dev/./urandom -jar target/grocery-backend-0.0.1-SNAPSHOT.jar &
BACKEND_PID=$!

# Give Java 5 seconds to boot up
sleep 5

echo "Starting Angular frontend..."
cd ~/La-signare-web/grocery-frontend || exit
HOST=0.0.0.0 PORT=4200 node dist/grocery-frontend/server/server.mjs &
FRONTEND_PID=$!
echo "FRONTEND LAUNCHED -- now go to https://lasignare.abdoudiallo.fr/"

wait