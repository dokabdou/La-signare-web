#!/bin/bash

# Ensure automation tools can find Docker and Git
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH

# Finds the directory where this script is saved
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR" || exit

git fetch origin

# Compare the local code hash with the GitHub code hash
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): New code found! Pulling and rebuilding..." >> "$BASE_DIR/deploy.log"
    
    # Pull the new code
    git pull origin main
    
    # OVERWRITE MONGODB ENV FOR LOCAL DOCKER
    export MONGO_URI="mongodb://localhost:27017/grocerydb"
    
    # Rebuild and restart the Docker containers in the background
    docker-compose up -d --build >> "$BASE_DIR/deploy.log" 2>&1
    
    # Clean up old, unused Docker images
    docker image prune -f >> "$BASE_DIR/deploy.log" 2>&1
    
    echo "$(date): Deployment complete." >> "$BASE_DIR/deploy.log"
else
    # Log entry every single day even when nothing happens
    echo "$(date): No new code. Skipping deployment." >> "$BASE_DIR/deploy.log"
    true
fi