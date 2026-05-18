#!/bin/bash
set -e

# Linux Upgrade Manager - Docker Compose Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[LUM]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

# Check if .env exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        log "Creating .env from .env.example..."
        cp .env.example .env
        warn "Please edit .env and set secure values before continuing!"
        exit 1
    else
        error ".env file not found and .env.example is missing"
    fi
fi

# Parse arguments
MODE="${1:-dev}"

if [ "$MODE" == "prod" ] || [ "$MODE" == "production" ]; then
    log "Starting in PRODUCTION mode..."
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
    BUILD_ARGS="--build"
elif [ "$MODE" == "build" ]; then
    log "Building production images..."
    docker-compose -f docker-compose.yml build
    success "Build complete!"
    exit 0
else
    log "Starting in DEVELOPMENT mode..."
    COMPOSE_FILES=""
fi

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    error "Docker Compose not found. Please install Docker Compose."
fi

# Pull latest images
log "Pulling latest images..."
$COMPOSE_CMD $COMPOSE_FILES pull

# Start services
log "Starting services..."
$COMPOSE_CMD $COMPOSE_FILES up -d --remove-orphans

# Wait for health checks
log "Waiting for services to be healthy..."
sleep 5

# Check portal health
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        success "Portal is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "Portal failed to start. Check logs with: docker-compose logs portal"
fi

echo ""
success "Linux Upgrade Manager is running!"
echo ""
echo -e "  ${GREEN}Portal:${NC}    http://localhost:3001"
echo -e "  ${GREEN}Database:${NC}  localhost:5432"
echo ""
echo "Useful commands:"
echo -e "  ${BLUE}View logs:${NC}     docker-compose logs -f portal"
echo -e "  ${BLUE}Stop:${NC}          docker-compose down"
echo -e "  ${BLUE}Restart:${NC}       docker-compose restart portal"
echo ""
