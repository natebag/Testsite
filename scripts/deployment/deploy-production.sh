#!/bin/bash

# MLG.clan Production Deployment Script
# Comprehensive production deployment with safety checks and rollback capability

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_LOG="/var/log/mlg-clan/deployment.log"
BACKUP_DIR="/var/backups/mlg-clan"
DEPLOY_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ROLLBACK_DATA_FILE="$BACKUP_DIR/rollback_$DEPLOY_TIMESTAMP.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$DEPLOYMENT_LOG"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Deployment failed at step: $CURRENT_STEP"
    log_error "Exit code: $exit_code"
    
    if [[ "$CURRENT_STEP" != "pre-checks" ]]; then
        log_warn "Initiating automatic rollback..."
        rollback_deployment
    fi
    
    exit $exit_code
}

trap 'handle_error' ERR

# Pre-deployment checks
pre_deployment_checks() {
    CURRENT_STEP="pre-checks"
    log_info "Starting pre-deployment checks..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        log_error "Do not run this script as root for security reasons"
        exit 1
    fi
    
    # Check required environment variables
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "SOLANA_RPC_URL"
        "MLG_TOKEN_MINT"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check disk space (require at least 5GB free)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=5242880  # 5GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Required: 5GB, Available: $(($available_space/1024/1024))GB"
        exit 1
    fi
    
    # Check if services are running
    local required_services=("postgresql" "redis-server" "nginx")
    for service in "${required_services[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            log_error "Required service $service is not running"
            exit 1
        fi
    done
    
    # Check network connectivity to Solana
    if ! curl -s --connect-timeout 10 "$SOLANA_RPC_URL" > /dev/null; then
        log_error "Cannot connect to Solana RPC endpoint"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    CURRENT_STEP="backup"
    log_info "Creating deployment backup..."
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log_info "Backing up database..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_$DEPLOY_TIMESTAMP.sql"
    
    # Backup current application files
    log_info "Backing up application files..."
    tar -czf "$BACKUP_DIR/application_$DEPLOY_TIMESTAMP.tar.gz" \
        -C "$PROJECT_ROOT" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=logs \
        --exclude=temp \
        .
    
    # Backup Redis data
    log_info "Backing up Redis data..."
    redis-cli --rdb "$BACKUP_DIR/redis_$DEPLOY_TIMESTAMP.rdb"
    
    # Create rollback metadata
    cat > "$ROLLBACK_DATA_FILE" << EOF
{
    "timestamp": "$DEPLOY_TIMESTAMP",
    "git_commit": "$(git rev-parse HEAD)",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
    "database_backup": "$BACKUP_DIR/database_$DEPLOY_TIMESTAMP.sql",
    "application_backup": "$BACKUP_DIR/application_$DEPLOY_TIMESTAMP.tar.gz",
    "redis_backup": "$BACKUP_DIR/redis_$DEPLOY_TIMESTAMP.rdb",
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)"
}
EOF
    
    log_success "Backup created successfully"
}

# Build application
build_application() {
    CURRENT_STEP="build"
    log_info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log_info "Installing production dependencies..."
    npm ci --only=production --no-audit
    
    # Type checking
    log_info "Running TypeScript type checks..."
    npm run type:check
    
    # Build application
    log_info "Building application bundle..."
    NODE_ENV=production npm run build
    
    # Build Vite bundle for optimized frontend
    log_info "Building optimized frontend bundle..."
    NODE_ENV=production npm run build:vite
    
    # Generate TypeScript definitions
    log_info "Generating TypeScript definitions..."
    npm run build:types
    
    log_success "Application built successfully"
}

# Run tests
run_tests() {
    CURRENT_STEP="testing"
    log_info "Running production readiness tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    # Run security tests
    log_info "Running security audit..."
    npm audit --audit-level=high
    
    # Run performance tests
    log_info "Running performance validation..."
    npm run audit:performance
    
    log_success "All tests passed"
}

# Database migrations
run_migrations() {
    CURRENT_STEP="migrations"
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Run migrations
    npm run db:migrate
    
    # Verify database schema
    log_info "Verifying database schema..."
    psql "$DATABASE_URL" -c "\dt" > /dev/null
    
    log_success "Database migrations completed"
}

# Deploy application
deploy_application() {
    CURRENT_STEP="deployment"
    log_info "Deploying application..."
    
    # Stop application services
    log_info "Stopping application services..."
    systemctl stop mlg-clan-app || true
    
    # Copy application files
    log_info "Copying application files..."
    rsync -av \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=logs \
        --exclude=temp \
        "$PROJECT_ROOT/" \
        "/opt/mlg-clan/"
    
    # Install production dependencies in deployment location
    cd "/opt/mlg-clan"
    npm ci --only=production --no-audit
    
    # Set proper ownership and permissions
    chown -R mlg-clan:mlg-clan /opt/mlg-clan
    chmod -R 755 /opt/mlg-clan
    chmod 600 /opt/mlg-clan/.env
    
    log_success "Application deployed"
}

# Update configurations
update_configurations() {
    CURRENT_STEP="configuration"
    log_info "Updating configurations..."
    
    # Update Nginx configuration
    log_info "Updating Nginx configuration..."
    cp "$PROJECT_ROOT/config/nginx/production.conf" "/etc/nginx/sites-available/mlg-clan"
    nginx -t  # Test configuration
    systemctl reload nginx
    
    # Update systemd service
    log_info "Updating systemd service..."
    cp "$PROJECT_ROOT/config/systemd/mlg-clan.service" "/etc/systemd/system/"
    systemctl daemon-reload
    
    # Update SSL certificates (if needed)
    if [[ -f "$PROJECT_ROOT/config/ssl/update-certs.sh" ]]; then
        log_info "Updating SSL certificates..."
        bash "$PROJECT_ROOT/config/ssl/update-certs.sh"
    fi
    
    log_success "Configurations updated"
}

# Start services
start_services() {
    CURRENT_STEP="service-start"
    log_info "Starting services..."
    
    # Start application
    systemctl start mlg-clan-app
    systemctl enable mlg-clan-app
    
    # Wait for application to be ready
    log_info "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/health" > /dev/null; then
            log_success "Application is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Attempt $attempt/$max_attempts - waiting for application..."
        sleep 5
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Application failed to start within timeout"
        exit 1
    fi
    
    log_success "Services started successfully"
}

# Health checks
run_health_checks() {
    CURRENT_STEP="health-checks"
    log_info "Running post-deployment health checks..."
    
    local health_endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/voting/health"
        "http://localhost:3000/api/clans/health"
    )
    
    for endpoint in "${health_endpoints[@]}"; do
        log_info "Checking endpoint: $endpoint"
        
        local response=$(curl -s -w "%{http_code}" "$endpoint")
        local http_code="${response: -3}"
        
        if [[ "$http_code" != "200" ]]; then
            log_error "Health check failed for $endpoint (HTTP $http_code)"
            exit 1
        fi
    done
    
    # Check database connectivity
    log_info "Checking database connectivity..."
    psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null
    
    # Check Redis connectivity
    log_info "Checking Redis connectivity..."
    redis-cli ping > /dev/null
    
    # Check Solana connectivity
    log_info "Checking Solana connectivity..."
    curl -s -X POST "$SOLANA_RPC_URL" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' > /dev/null
    
    log_success "All health checks passed"
}

# Cleanup old backups
cleanup_old_backups() {
    CURRENT_STEP="cleanup"
    log_info "Cleaning up old backups..."
    
    # Keep only last 10 backups
    cd "$BACKUP_DIR"
    ls -t database_*.sql | tail -n +11 | xargs -r rm -f
    ls -t application_*.tar.gz | tail -n +11 | xargs -r rm -f
    ls -t redis_*.rdb | tail -n +11 | xargs -r rm -f
    ls -t rollback_*.json | tail -n +11 | xargs -r rm -f
    
    log_success "Cleanup completed"
}

# Rollback function
rollback_deployment() {
    log_warn "Starting rollback procedure..."
    
    # Find most recent rollback data
    local latest_rollback=$(ls -t "$BACKUP_DIR"/rollback_*.json | head -n 1)
    
    if [[ ! -f "$latest_rollback" ]]; then
        log_error "No rollback data found"
        exit 1
    fi
    
    # Parse rollback data
    local git_commit=$(jq -r '.git_commit' "$latest_rollback")
    local database_backup=$(jq -r '.database_backup' "$latest_rollback")
    local application_backup=$(jq -r '.application_backup' "$latest_rollback")
    local redis_backup=$(jq -r '.redis_backup' "$latest_rollback")
    
    log_info "Rolling back to commit: $git_commit"
    
    # Stop services
    systemctl stop mlg-clan-app || true
    
    # Restore database
    log_info "Restoring database..."
    psql "$DATABASE_URL" < "$database_backup"
    
    # Restore application files
    log_info "Restoring application files..."
    cd /opt
    rm -rf mlg-clan
    tar -xzf "$application_backup"
    mv mlg-clan-* mlg-clan
    chown -R mlg-clan:mlg-clan mlg-clan
    
    # Restore Redis data
    log_info "Restoring Redis data..."
    systemctl stop redis-server
    cp "$redis_backup" /var/lib/redis/dump.rdb
    chown redis:redis /var/lib/redis/dump.rdb
    systemctl start redis-server
    
    # Start services
    systemctl start mlg-clan-app
    
    log_success "Rollback completed successfully"
}

# Main deployment function
main() {
    log_info "Starting MLG.clan production deployment"
    log_info "Deployment timestamp: $DEPLOY_TIMESTAMP"
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
    
    # Run deployment steps
    pre_deployment_checks
    create_backup
    build_application
    run_tests
    run_migrations
    deploy_application
    update_configurations
    start_services
    run_health_checks
    cleanup_old_backups
    
    log_success "🎉 MLG.clan production deployment completed successfully!"
    log_info "Deployment timestamp: $DEPLOY_TIMESTAMP"
    log_info "Application is now live and ready for users"
    
    # Send notification (if configured)
    if [[ -n "${DEPLOYMENT_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$DEPLOYMENT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"MLG.clan production deployment completed successfully\", \"timestamp\": \"$DEPLOY_TIMESTAMP\"}"
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rollback)
                rollback_deployment
                exit 0
                ;;
            --help)
                echo "MLG.clan Production Deployment Script"
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --rollback    Rollback to previous deployment"
                echo "  --help        Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
        shift
    done
    
    # Run main deployment
    main
fi