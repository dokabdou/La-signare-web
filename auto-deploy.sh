#!/bin/bash

cd ~/La-signare-web || exit

git fetch origin

# Compare the local code hash with the GitHub code hash
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): New code found! Pulling and rebuilding..." >> ~/deploy.log
    
    # Pull the new code
    git pull origin main
    
    # Rebuild and restart the Docker containers in the background
    docker-compose up -d --build >> ~/deploy.log 2>&1
    
    # Clean up old, unused Docker images so your server's hard drive doesn't fill up!
    docker image prune -f >> ~/deploy.log 2>&1
    
    echo "$(date): Deployment complete." >> ~/deploy.log
else
    # Uncomment the line below if you want a log entry every single day, even when nothing happens
    echo "$(date): No new code. Skipping deployment." >> ~/deploy.log
    true
fi
