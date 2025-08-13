#!/bin/bash

# MLG.clan Production Rollback Script
# Advanced rollback procedure with multiple recovery options

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="/var/backups/mlg-clan"
ROLLBACK_LOG="/var/log/mlg-clan/rollback.log"
ROLLBACK_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$ROLLBACK_LOG"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Rollback failed at step: $CURRENT_STEP"
    log_error "Exit code: $exit_code"
    log_error "Manual intervention may be required"
    exit $exit_code
}

trap 'handle_error' ERR

# List available backups
list_backups() {
    log_info "Available backups:"
    echo
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    local rollback_files=($(ls -t "$BACKUP_DIR"/rollback_*.json 2>/dev/null || true))
    
    if [[ ${#rollback_files[@]} -eq 0 ]]; then
        log_error "No backup files found"
        exit 1
    fi
    
    echo -e "${BLUE}Available rollback points:${NC}"
    echo "=========================="
    
    for i in "${!rollback_files[@]}"; do
        local file="${rollback_files[$i]}"
        local timestamp=$(basename "$file" .json | cut -d'_' -f2-)
        local git_commit=$(jq -r '.git_commit' "$file" 2>/dev/null || echo "unknown")
        local git_branch=$(jq -r '.git_branch' "$file" 2>/dev/null || echo "unknown")
        local deploy_time=$(jq -r '.timestamp' "$file" 2>/dev/null || echo "unknown")
        
        echo -e "${GREEN}[$((i+1))]${NC} Backup: $deploy_time"
        echo "    File: $(basename "$file")"
        echo "    Commit: ${git_commit:0:8}"
        echo "    Branch: $git_branch"
        echo
    done
}

# Select backup for rollback
select_backup() {
    local backup_index=$1
    
    local rollback_files=($(ls -t "$BACKUP_DIR"/rollback_*.json))
    
    if [[ $backup_index -lt 1 || $backup_index -gt ${#rollback_files[@]} ]]; then
        log_error "Invalid backup selection: $backup_index"
        exit 1
    fi
    
    SELECTED_ROLLBACK="${rollback_files[$((backup_index-1))]}"
    log_info "Selected rollback point: $(basename "$SELECTED_ROLLBACK")"
}

# Validate rollback data
validate_rollback_data() {
    CURRENT_STEP="validation"
    log_info "Validating rollback data..."
    
    if [[ ! -f "$SELECTED_ROLLBACK" ]]; then
        log_error "Rollback data file not found: $SELECTED_ROLLBACK"
        exit 1
    fi
    
    # Parse rollback metadata
    GIT_COMMIT=$(jq -r '.git_commit' "$SELECTED_ROLLBACK")
    GIT_BRANCH=$(jq -r '.git_branch' "$SELECTED_ROLLBACK")
    DATABASE_BACKUP=$(jq -r '.database_backup' "$SELECTED_ROLLBACK")
    APPLICATION_BACKUP=$(jq -r '.application_backup' "$SELECTED_ROLLBACK")
    REDIS_BACKUP=$(jq -r '.redis_backup' "$SELECTED_ROLLBACK")
    
    # Validate backup files exist
    local backup_files=("$DATABASE_BACKUP" "$APPLICATION_BACKUP" "$REDIS_BACKUP")
    
    for backup_file in "${backup_files[@]}"; do
        if [[ ! -f "$backup_file" ]]; then
            log_error "Backup file not found: $backup_file"
            exit 1
        fi
    done
    
    log_info "Rolling back to:"
    log_info "  Commit: $GIT_COMMIT"
    log_info "  Branch: $GIT_BRANCH"
    log_info "  Database: $(basename "$DATABASE_BACKUP")"
    log_info "  Application: $(basename "$APPLICATION_BACKUP")"
    log_info "  Redis: $(basename "$REDIS_BACKUP")"
    
    log_success "Rollback data validation passed"
}

# Create pre-rollback backup
create_pre_rollback_backup() {
    CURRENT_STEP="pre-rollback-backup"
    log_info "Creating pre-rollback backup (emergency recovery)..."
    
    local emergency_backup_dir="$BACKUP_DIR/emergency_$ROLLBACK_TIMESTAMP"
    mkdir -p "$emergency_backup_dir"
    
    # Backup current database state
    log_info "Backing up current database state..."
    pg_dump "$DATABASE_URL" > "$emergency_backup_dir/database_emergency.sql"
    
    # Backup current application files
    log_info "Backing up current application files..."
    tar -czf "$emergency_backup_dir/application_emergency.tar.gz" \
        -C "/opt/mlg-clan" \
        --exclude=node_modules \
        --exclude=logs \
        --exclude=temp \
        .
    
    # Backup current Redis state
    log_info "Backing up current Redis state..."
    redis-cli --rdb "$emergency_backup_dir/redis_emergency.rdb"
    
    # Create emergency recovery metadata
    cat > "$emergency_backup_dir/emergency_recovery.json" << EOF
{
    "timestamp": "$ROLLBACK_TIMESTAMP",
    "reason": "pre_rollback_backup",
    "current_commit": "$(cd /opt/mlg-clan && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "database_backup": "$emergency_backup_dir/database_emergency.sql",
    "application_backup": "$emergency_backup_dir/application_emergency.tar.gz",
    "redis_backup": "$emergency_backup_dir/redis_emergency.rdb"
}
EOF
    
    log_success "Emergency backup created at: $emergency_backup_dir"
}

# Stop services gracefully
stop_services() {
    CURRENT_STEP="stop-services"
    log_info "Stopping services gracefully..."
    
    # Enable maintenance mode
    if [[ -f "/opt/mlg-clan/scripts/maintenance-mode.sh" ]]; then
        log_info "Enabling maintenance mode..."
        bash "/opt/mlg-clan/scripts/maintenance-mode.sh" enable
    fi
    
    # Stop application service
    log_info "Stopping MLG.clan application..."
    systemctl stop mlg-clan-app || true
    
    # Wait for connections to close
    log_info "Waiting for connections to close..."
    sleep 10
    
    # Force kill if necessary
    local app_pids=$(pgrep -f "mlg-clan" || true)
    if [[ -n "$app_pids" ]]; then
        log_warn "Force killing remaining processes..."
        echo "$app_pids" | xargs -r kill -9
    fi
    
    log_success "Services stopped"
}

# Restore database
restore_database() {
    CURRENT_STEP="restore-database"
    log_info "Restoring database from backup..."
    
    # Create database restore script
    cat > "/tmp/db_restore_$ROLLBACK_TIMESTAMP.sql" << EOF
-- MLG.clan Database Rollback
-- Timestamp: $ROLLBACK_TIMESTAMP
-- Source: $(basename "$DATABASE_BACKUP")

-- Terminate active connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid();

-- Drop and recreate database objects
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Restore from backup
\i $DATABASE_BACKUP

-- Verify restore
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public';
EOF
    
    # Execute database restore
    log_info "Executing database restore..."
    psql "$DATABASE_URL" -f "/tmp/db_restore_$ROLLBACK_TIMESTAMP.sql"
    
    # Verify database integrity
    log_info "Verifying database integrity..."
    psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null
    
    # Cleanup restore script
    rm -f "/tmp/db_restore_$ROLLBACK_TIMESTAMP.sql"
    
    log_success "Database restored successfully"
}

# Restore application files
restore_application() {
    CURRENT_STEP="restore-application"
    log_info "Restoring application files..."
    
    # Remove current application
    log_info "Removing current application files..."
    rm -rf "/opt/mlg-clan"
    
    # Extract backup
    log_info "Extracting application backup..."
    cd "/opt"
    tar -xzf "$APPLICATION_BACKUP"
    
    # Ensure correct directory structure
    if [[ ! -d "/opt/mlg-clan" ]]; then
        # Handle different backup structures
        local extracted_dir=$(find /opt -maxdepth 1 -type d -name "*mlg*" | head -n 1)
        if [[ -n "$extracted_dir" && "$extracted_dir" != "/opt/mlg-clan" ]]; then
            mv "$extracted_dir" "/opt/mlg-clan"
        else
            log_error "Could not find extracted application directory"
            exit 1
        fi
    fi
    
    # Install dependencies
    log_info "Installing application dependencies..."
    cd "/opt/mlg-clan"
    npm ci --only=production --no-audit
    
    # Set proper ownership and permissions
    log_info "Setting file permissions..."
    chown -R mlg-clan:mlg-clan "/opt/mlg-clan"
    chmod -R 755 "/opt/mlg-clan"
    chmod 600 "/opt/mlg-clan/.env" 2>/dev/null || true
    
    log_success "Application files restored"
}

# Restore Redis data
restore_redis() {
    CURRENT_STEP="restore-redis"
    log_info "Restoring Redis data..."
    
    # Stop Redis service
    log_info "Stopping Redis service..."
    systemctl stop redis-server
    
    # Backup current Redis data (just in case)
    if [[ -f "/var/lib/redis/dump.rdb" ]]; then
        cp "/var/lib/redis/dump.rdb" "/var/lib/redis/dump.rdb.pre-rollback"
    fi
    
    # Restore Redis backup
    log_info "Restoring Redis backup..."
    cp "$REDIS_BACKUP" "/var/lib/redis/dump.rdb"
    chown redis:redis "/var/lib/redis/dump.rdb"
    chmod 660 "/var/lib/redis/dump.rdb"
    
    # Start Redis service
    log_info "Starting Redis service..."
    systemctl start redis-server
    
    # Verify Redis connectivity
    sleep 5
    redis-cli ping > /dev/null
    
    log_success "Redis data restored"
}

# Update configurations
update_configurations() {
    CURRENT_STEP="update-configurations"
    log_info "Updating configurations for rollback..."
    
    cd "/opt/mlg-clan"
    
    # Update Nginx configuration
    if [[ -f "config/nginx/production.conf" ]]; then
        log_info "Updating Nginx configuration..."
        cp "config/nginx/production.conf" "/etc/nginx/sites-available/mlg-clan"
        nginx -t
        systemctl reload nginx
    fi
    
    # Update systemd service
    if [[ -f "config/systemd/mlg-clan.service" ]]; then
        log_info "Updating systemd service..."
        cp "config/systemd/mlg-clan.service" "/etc/systemd/system/"
        systemctl daemon-reload
    fi
    
    # Verify environment variables
    if [[ -f ".env" ]]; then
        log_info "Verifying environment configuration..."
        source .env
        
        # Check critical environment variables
        local required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET")
        for var in "${required_vars[@]}"; do
            if [[ -z "${!var:-}" ]]; then
                log_error "Critical environment variable $var is missing"
                exit 1
            fi
        done
    fi
    
    log_success "Configurations updated"
}

# Start services
start_services() {
    CURRENT_STEP="start-services"
    log_info "Starting services after rollback..."
    
    # Start application service
    log_info "Starting MLG.clan application..."
    systemctl start mlg-clan-app
    
    # Wait for application to be ready
    log_info "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/health" > /dev/null 2>&1; then
            log_success "Application is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Attempt $attempt/$max_attempts - waiting for application..."
        sleep 5
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Application failed to start within timeout"
        
        # Check application logs
        log_error "Application logs:"
        journalctl -u mlg-clan-app --lines=20 --no-pager || true
        
        exit 1
    fi
    
    # Disable maintenance mode
    if [[ -f "/opt/mlg-clan/scripts/maintenance-mode.sh" ]]; then
        log_info "Disabling maintenance mode..."
        bash "/opt/mlg-clan/scripts/maintenance-mode.sh" disable
    fi
    
    log_success "Services started successfully"
}

# Run post-rollback verification
verify_rollback() {
    CURRENT_STEP="verification"
    log_info "Running post-rollback verification..."
    
    # Test health endpoints
    local health_endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/voting/health"
        "http://localhost:3000/api/clans/health"
    )
    
    for endpoint in "${health_endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        
        local response=$(curl -s -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
        local http_code="${response: -3}"
        
        if [[ "$http_code" != "200" ]]; then
            log_error "Health check failed for $endpoint (HTTP $http_code)"
            exit 1
        fi
    done
    
    # Verify database connectivity
    log_info "Verifying database connectivity..."
    psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null
    
    # Verify Redis connectivity
    log_info "Verifying Redis connectivity..."
    redis-cli ping > /dev/null
    
    # Verify Git state
    cd "/opt/mlg-clan"
    local current_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    log_info "Current Git commit: $current_commit"
    
    if [[ "$current_commit" != "$GIT_COMMIT" ]]; then
        log_warn "Git commit mismatch. Expected: $GIT_COMMIT, Current: $current_commit"
    fi
    
    log_success "Rollback verification passed"
}

# Generate rollback report
generate_rollback_report() {
    local report_file="/var/log/mlg-clan/rollback_report_$ROLLBACK_TIMESTAMP.json"
    
    cat > "$report_file" << EOF
{
    "rollback_timestamp": "$ROLLBACK_TIMESTAMP",
    "rollback_source": "$(basename "$SELECTED_ROLLBACK")",
    "target_commit": "$GIT_COMMIT",
    "target_branch": "$GIT_BRANCH",
    "database_backup": "$DATABASE_BACKUP",
    "application_backup": "$APPLICATION_BACKUP",
    "redis_backup": "$REDIS_BACKUP",
    "emergency_backup": "$BACKUP_DIR/emergency_$ROLLBACK_TIMESTAMP",
    "success": true,
    "verification_passed": true,
    "rollback_duration": "$(date +%s)"
}
EOF
    
    log_info "Rollback report generated: $report_file"
}

# Main rollback function
main() {
    local backup_selection=${1:-}
    
    log_info "Starting MLG.clan production rollback"
    log_info "Rollback timestamp: $ROLLBACK_TIMESTAMP"
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$ROLLBACK_LOG")"
    
    # If no backup specified, list available backups
    if [[ -z "$backup_selection" ]]; then
        list_backups
        echo
        read -p "Enter backup number to rollback to: " backup_selection
    fi
    
    # Select and validate backup
    select_backup "$backup_selection"
    validate_rollback_data
    
    # Confirm rollback
    echo
    log_warn "⚠️  This will rollback the MLG.clan platform to a previous state"
    log_warn "⚠️  Current data will be backed up but the rollback is irreversible"
    echo
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
    
    # Execute rollback steps
    create_pre_rollback_backup
    stop_services
    restore_database
    restore_application
    restore_redis
    update_configurations
    start_services
    verify_rollback
    generate_rollback_report
    
    log_success "🎉 MLG.clan production rollback completed successfully!"
    log_info "Rollback timestamp: $ROLLBACK_TIMESTAMP"
    log_info "Rolled back to commit: $GIT_COMMIT"
    log_info "Emergency backup available at: $BACKUP_DIR/emergency_$ROLLBACK_TIMESTAMP"
    
    # Send notification (if configured)
    if [[ -n "${ROLLBACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$ROLLBACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"MLG.clan production rollback completed\", \"timestamp\": \"$ROLLBACK_TIMESTAMP\", \"commit\": \"$GIT_COMMIT\"}"
    fi
}

# Display help
show_help() {
    echo "MLG.clan Production Rollback Script"
    echo "Usage: $0 [options] [backup_number]"
    echo
    echo "Options:"
    echo "  --list, -l      List available backups"
    echo "  --help, -h      Show this help message"
    echo
    echo "Examples:"
    echo "  $0              Interactive mode - list backups and select"
    echo "  $0 1            Rollback to the most recent backup"
    echo "  $0 3            Rollback to the 3rd most recent backup"
    echo "  $0 --list       List all available backups"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        --list|-l)
            list_backups
            exit 0
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            main "$@"
            ;;
    esac
fi