#!/bin/bash

# Dream Library Service Management Script
# Usage: ./manage.sh [command] [service]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$SCRIPT_DIR/web"
CRAWLER_DIR="$SCRIPT_DIR/crawler"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Service commands
start_web() {
    print_header "Starting Web Service"
    cd "$WEB_DIR"
    docker-compose up -d
    print_success "Web service started"
}

start_crawler() {
    print_header "Starting Crawler Service"
    cd "$CRAWLER_DIR"
    docker-compose up -d
    print_success "Crawler service started"
}

stop_web() {
    print_header "Stopping Web Service"
    cd "$WEB_DIR"
    docker-compose down
    print_success "Web service stopped"
}

stop_crawler() {
    print_header "Stopping Crawler Service"
    cd "$CRAWLER_DIR"
    docker-compose down
    print_success "Crawler service stopped"
}

restart_web() {
    print_header "Restarting Web Service"
    cd "$WEB_DIR"
    docker-compose restart
    print_success "Web service restarted"
}

restart_crawler() {
    print_header "Restarting Crawler Service"
    cd "$CRAWLER_DIR"
    docker-compose restart
    print_success "Crawler service restarted"
}

build_web() {
    print_header "Building Web Service"
    cd "$WEB_DIR"
    docker-compose build
    print_success "Web service built"
}

build_crawler() {
    print_header "Building Crawler Service"
    cd "$CRAWLER_DIR"
    docker-compose build
    print_success "Crawler service built"
}

logs_web() {
    print_header "Web Service Logs"
    cd "$WEB_DIR"
    docker-compose logs -f web
}

logs_crawler() {
    print_header "Crawler Service Logs"
    cd "$CRAWLER_DIR"
    docker-compose logs -f crawler
}

status() {
    print_header "Service Status"
    echo ""
    echo "Web Containers:"
    docker ps -a --filter "name=dream-library-web" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Crawler Containers:"
    docker ps -a --filter "name=dream-library-crawler" --format "table {{.Names}}\t{{.Status}}"
    docker ps -a --filter "name=dream-library-enricher" --format "table {{.Names}}\t{{.Status}}"
}

# Main script
COMMAND=${1:-help}
SERVICE=${2:-all}

case "$COMMAND" in
    start)
        case "$SERVICE" in
            web) start_web ;;
            crawler) start_crawler ;;
            all)
                start_crawler
                start_web
                ;;
            *) print_error "Unknown service: $SERVICE" && exit 1 ;;
        esac
        ;;

    stop)
        case "$SERVICE" in
            web) stop_web ;;
            crawler) stop_crawler ;;
            all)
                stop_web
                stop_crawler
                ;;
            *) print_error "Unknown service: $SERVICE" && exit 1 ;;
        esac
        ;;

    restart)
        case "$SERVICE" in
            web) restart_web ;;
            crawler) restart_crawler ;;
            all)
                restart_web
                restart_crawler
                ;;
            *) print_error "Unknown service: $SERVICE" && exit 1 ;;
        esac
        ;;

    build)
        case "$SERVICE" in
            web) build_web ;;
            crawler) build_crawler ;;
            all)
                build_crawler
                build_web
                ;;
            *) print_error "Unknown service: $SERVICE" && exit 1 ;;
        esac
        ;;

    logs)
        case "$SERVICE" in
            web) logs_web ;;
            crawler) logs_crawler ;;
            *) print_error "Please specify service: web or crawler" && exit 1 ;;
        esac
        ;;

    status)
        status
        ;;

    dev)
        # Development mode: rebuild and restart web only
        print_header "Development Mode - Rebuilding Web"
        cd "$WEB_DIR"
        docker-compose down
        docker-compose build
        docker-compose up -d
        print_success "Web service rebuilt and started"
        print_warning "Crawler service unchanged"
        ;;

    help|*)
        echo "Dream Library Service Management"
        echo ""
        echo "Usage: ./manage.sh [command] [service]"
        echo ""
        echo "Commands:"
        echo "  start [service]    - Start service(s)"
        echo "  stop [service]     - Stop service(s)"
        echo "  restart [service]  - Restart service(s)"
        echo "  build [service]    - Build service(s)"
        echo "  logs [service]     - View logs (web or crawler)"
        echo "  status             - Show service status"
        echo "  dev                - Development mode (rebuild web only)"
        echo ""
        echo "Services:"
        echo "  web                - Web service only"
        echo "  crawler            - Crawler service only"
        echo "  all                - All services (default)"
        echo ""
        echo "Examples:"
        echo "  ./manage.sh start              # Start all services"
        echo "  ./manage.sh restart web        # Restart web only"
        echo "  ./manage.sh logs crawler       # View crawler logs"
        echo "  ./manage.sh dev                # Rebuild and restart web (for development)"
        echo "  ./manage.sh status             # Show service status"
        ;;
esac
