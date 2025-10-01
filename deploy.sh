#!/bin/bash

# Dream Library - Synology Deployment Script
# Usage: ./deploy.sh <nas-ip> [username]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAS_IP="${1}"
NAS_USER="${2:-admin}"
REMOTE_PATH="/volume1/docker/dream-library"

if [ -z "$NAS_IP" ]; then
    echo -e "${RED}Error: NAS IP address required${NC}"
    echo "Usage: ./deploy.sh <nas-ip> [username]"
    echo "Example: ./deploy.sh 192.168.1.100 admin"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Dream Library Deployment to Synology${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Target: ${NAS_USER}@${NAS_IP}:${REMOTE_PATH}"
echo ""

# Step 1: Check SSH connection
echo -e "${YELLOW}[1/5] Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 "${NAS_USER}@${NAS_IP}" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed. Please check:${NC}"
    echo "  - NAS IP address is correct"
    echo "  - SSH service is enabled on Synology"
    echo "  - Your SSH key is configured or password is correct"
    exit 1
fi

# Step 2: Create remote directory
echo -e "${YELLOW}[2/5] Creating remote directory...${NC}"
ssh "${NAS_USER}@${NAS_IP}" "sudo mkdir -p ${REMOTE_PATH} && sudo chown ${NAS_USER}:users ${REMOTE_PATH}"
echo -e "${GREEN}✓ Directory created${NC}"

# Step 3: Sync files
echo -e "${YELLOW}[3/5] Syncing files to NAS...${NC}"
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'venv' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.DS_Store' \
    --exclude 'screenshots' \
    --exclude 'test_scripts' \
    --exclude 'download_log.txt' \
    . "${NAS_USER}@${NAS_IP}:${REMOTE_PATH}/"

echo -e "${GREEN}✓ Files synced${NC}"

# Step 4: Setup environment
echo -e "${YELLOW}[4/5] Setting up environment...${NC}"
ssh "${NAS_USER}@${NAS_IP}" "cd ${REMOTE_PATH} && \
    if [ ! -f .env ]; then \
        cp .env.example .env && \
        echo 'JWT_SECRET='$(openssl rand -base64 32) >> .env && \
        echo '✓ .env file created with random JWT secret'; \
    else \
        echo '✓ .env file already exists'; \
    fi"

# Step 5: Start containers
echo -e "${YELLOW}[5/5] Starting Docker containers...${NC}"
ssh "${NAS_USER}@${NAS_IP}" "cd ${REMOTE_PATH} && \
    docker-compose down 2>/dev/null || true && \
    docker-compose up -d --build web"

echo -e "${GREEN}✓ Containers started${NC}"

# Final info
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your application at:"
echo "  → http://${NAS_IP}:3000"
echo ""
echo "Useful commands:"
echo "  • View logs: ssh ${NAS_USER}@${NAS_IP} 'cd ${REMOTE_PATH} && docker-compose logs -f web'"
echo "  • Restart: ssh ${NAS_USER}@${NAS_IP} 'cd ${REMOTE_PATH} && docker-compose restart web'"
echo "  • Run crawler: ssh ${NAS_USER}@${NAS_IP} 'cd ${REMOTE_PATH} && docker-compose run --rm crawler'"
echo ""
