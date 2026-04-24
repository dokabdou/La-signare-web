#!/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH

cd ~/La-signare-web || exit

git fetch origin

# Compare the local code hash with the GitHub code hash
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): New code found! Pulling and rebuilding..." >> ~/deploy.log
    
    # Pull the new code
    git pull origin main

	# OVERWRITE MONGODB ENV FOR PROXMOX (Adjust IP if necessary)
    export MONGO_URI="mongodb://10.10.10.6:27017/grocery"
    
    # Rebuild and restart the Docker containers in the background
    docker-compose up -d --build >> ~/deploy.log 2>&1
    
    # Clean up old, unused Docker images so the server's hard drive doesn't fill up!
    docker image prune -f >> ~/deploy.log 2>&1
    
    echo "$(date): Deployment complete." >> ~/deploy.log
else
    # Uncomment the line below for a log entry every single day, even when nothing happens
    echo "$(date): No new code. Skipping deployment." >> ~/deploy.log
    true
fi
