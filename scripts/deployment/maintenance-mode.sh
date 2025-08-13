#!/bin/bash

# MLG.clan Maintenance Mode Script
# Graceful maintenance mode handling for production deployments

set -euo pipefail

# Configuration
MAINTENANCE_PAGE="/var/www/maintenance/index.html"
NGINX_MAINTENANCE_CONF="/etc/nginx/sites-available/mlg-clan-maintenance"
NGINX_PRODUCTION_CONF="/etc/nginx/sites-available/mlg-clan"
MAINTENANCE_FLAG="/tmp/mlg-clan-maintenance"
LOG_FILE="/var/log/mlg-clan/maintenance.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Create maintenance page
create_maintenance_page() {
    log_info "Creating maintenance page..."
    
    mkdir -p "$(dirname "$MAINTENANCE_PAGE")"
    
    cat > "$MAINTENANCE_PAGE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan - Maintenance</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .maintenance-container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient 3s ease infinite;
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .maintenance-title {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        
        .maintenance-message {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            line-height: 1.6;
            opacity: 0.9;
        }
        
        .gaming-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .feature-name {
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .progress-container {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            height: 6px;
            margin: 2rem 0;
            overflow: hidden;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
            height: 100%;
            border-radius: 25px;
            animation: loading 2s ease-in-out infinite;
        }
        
        @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        
        .eta {
            font-size: 1rem;
            opacity: 0.8;
            margin-top: 1rem;
        }
        
        .social-links {
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            gap: 1rem;
        }
        
        .social-link {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .social-link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @media (max-width: 768px) {
            .maintenance-container {
                margin: 1rem;
                padding: 1.5rem;
            }
            
            .logo {
                font-size: 2rem;
            }
            
            .maintenance-title {
                font-size: 2rem;
            }
            
            .maintenance-message {
                font-size: 1rem;
            }
            
            .gaming-features {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="particles" id="particles"></div>
    
    <div class="maintenance-container">
        <div class="logo">MLG.clan</div>
        
        <h1 class="maintenance-title">Under Maintenance</h1>
        
        <p class="maintenance-message">
            We're upgrading our gaming platform to bring you the ultimate Web3 gaming experience. 
            Our system will be back online shortly with enhanced features and improved performance.
        </p>
        
        <div class="gaming-features">
            <div class="feature-card">
                <div class="feature-icon">🗳️</div>
                <div class="feature-name">Token Voting</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🏰</div>
                <div class="feature-name">Clan System</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎮</div>
                <div class="feature-name">Gaming Content</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🏆</div>
                <div class="feature-name">Tournaments</div>
            </div>
        </div>
        
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        
        <div class="eta">
            Estimated completion: <span id="eta-time">Loading...</span>
        </div>
        
        <div class="social-links">
            <a href="#" class="social-link">Discord</a>
            <a href="#" class="social-link">Twitter</a>
            <a href="#" class="social-link">Status</a>
        </div>
    </div>
    
    <script>
        // Create floating particles
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 20;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.width = (Math.random() * 10 + 5) + 'px';
                particle.style.height = particle.style.width;
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
                particlesContainer.appendChild(particle);
            }
        }
        
        // Update ETA
        function updateETA() {
            const etaElement = document.getElementById('eta-time');
            const now = new Date();
            const eta = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes from now
            etaElement.textContent = eta.toLocaleTimeString();
        }
        
        // Auto-refresh every 30 seconds
        function autoRefresh() {
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
            updateETA();
            autoRefresh();
        });
    </script>
</body>
</html>
EOF
    
    log_success "Maintenance page created"
}

# Create Nginx maintenance configuration
create_nginx_maintenance_config() {
    log_info "Creating Nginx maintenance configuration..."
    
    cat > "$NGINX_MAINTENANCE_CONF" << EOF
# MLG.clan Maintenance Mode Configuration
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name mlg.clan www.mlg.clan;
    
    # SSL Configuration (if certificates exist)
    ssl_certificate /etc/ssl/certs/mlg-clan.crt;
    ssl_certificate_key /etc/ssl/private/mlg-clan.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Maintenance mode
    root /var/www/maintenance;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache control for maintenance page
        expires 5m;
        add_header Cache-Control "public, no-transform";
        
        # Custom maintenance headers
        add_header X-Maintenance-Mode "true" always;
        add_header X-Expected-Recovery "30-minutes" always;
        add_header Retry-After "1800" always;
    }
    
    # Health check endpoint for monitoring
    location /health {
        access_log off;
        return 503 '{"status":"maintenance","message":"System under maintenance"}';
        add_header Content-Type application/json always;
        add_header X-Maintenance-Mode "true" always;
    }
    
    # API endpoints return maintenance status
    location /api/ {
        access_log off;
        return 503 '{"error":"maintenance","message":"API temporarily unavailable due to maintenance","retry_after":1800}';
        add_header Content-Type application/json always;
        add_header X-Maintenance-Mode "true" always;
    }
    
    # Static assets for maintenance page
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1h;
        add_header Cache-Control "public, immutable";
        add_header X-Maintenance-Mode "true" always;
    }
}
EOF
    
    log_success "Nginx maintenance configuration created"
}

# Enable maintenance mode
enable_maintenance() {
    log_info "Enabling maintenance mode..."
    
    # Create maintenance page if it doesn't exist
    if [[ ! -f "$MAINTENANCE_PAGE" ]]; then
        create_maintenance_page
    fi
    
    # Create Nginx configuration if it doesn't exist
    if [[ ! -f "$NGINX_MAINTENANCE_CONF" ]]; then
        create_nginx_maintenance_config
    fi
    
    # Switch to maintenance configuration
    log_info "Switching to maintenance configuration..."
    
    # Backup current configuration
    if [[ -L "/etc/nginx/sites-enabled/mlg-clan" ]]; then
        rm -f "/etc/nginx/sites-enabled/mlg-clan"
    fi
    
    # Enable maintenance configuration
    ln -sf "$NGINX_MAINTENANCE_CONF" "/etc/nginx/sites-enabled/mlg-clan"
    
    # Test Nginx configuration
    if ! nginx -t; then
        log_error "Nginx configuration test failed"
        exit 1
    fi
    
    # Reload Nginx
    systemctl reload nginx
    
    # Create maintenance flag
    echo "$(date)" > "$MAINTENANCE_FLAG"
    
    log_success "Maintenance mode enabled"
    log_info "Maintenance page is now active at all endpoints"
}

# Disable maintenance mode
disable_maintenance() {
    log_info "Disabling maintenance mode..."
    
    # Check if maintenance mode is active
    if [[ ! -f "$MAINTENANCE_FLAG" ]]; then
        log_warn "Maintenance mode is not currently active"
        return 0
    fi
    
    # Switch back to production configuration
    log_info "Switching back to production configuration..."
    
    # Remove maintenance configuration
    if [[ -L "/etc/nginx/sites-enabled/mlg-clan" ]]; then
        rm -f "/etc/nginx/sites-enabled/mlg-clan"
    fi
    
    # Enable production configuration
    if [[ -f "$NGINX_PRODUCTION_CONF" ]]; then
        ln -sf "$NGINX_PRODUCTION_CONF" "/etc/nginx/sites-enabled/mlg-clan"
    else
        log_error "Production Nginx configuration not found: $NGINX_PRODUCTION_CONF"
        exit 1
    fi
    
    # Test Nginx configuration
    if ! nginx -t; then
        log_error "Nginx configuration test failed"
        exit 1
    fi
    
    # Reload Nginx
    systemctl reload nginx
    
    # Remove maintenance flag
    rm -f "$MAINTENANCE_FLAG"
    
    log_success "Maintenance mode disabled"
    log_info "Production configuration restored"
}

# Check maintenance status
check_status() {
    if [[ -f "$MAINTENANCE_FLAG" ]]; then
        local enabled_since=$(cat "$MAINTENANCE_FLAG")
        log_info "Maintenance mode is ENABLED since: $enabled_since"
        
        # Check if maintenance page is accessible
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost/" | grep -q "503\|200"; then
            log_success "Maintenance page is accessible"
        else
            log_error "Maintenance page is not accessible"
        fi
        
        return 0
    else
        log_info "Maintenance mode is DISABLED"
        
        # Check if production site is accessible
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost/health" | grep -q "200"; then
            log_success "Production site is accessible"
        else
            log_warn "Production site may not be accessible"
        fi
        
        return 1
    fi
}

# Schedule maintenance window
schedule_maintenance() {
    local start_time=$1
    local duration=${2:-30}  # Default 30 minutes
    
    log_info "Scheduling maintenance window..."
    log_info "Start time: $start_time"
    log_info "Duration: $duration minutes"
    
    # Calculate end time
    local end_time=$(date -d "$start_time + $duration minutes" '+%Y-%m-%d %H:%M:%S')
    
    # Create cron job for maintenance start
    local cron_start="$(date -d "$start_time" '+%M %H %d %m') * $0 enable"
    local cron_end="$(date -d "$end_time" '+%M %H %d %m') * $0 disable"
    
    log_info "Maintenance will start at: $start_time"
    log_info "Maintenance will end at: $end_time"
    log_info "Cron entry for start: $cron_start"
    log_info "Cron entry for end: $cron_end"
    
    echo "# Add these entries to cron:"
    echo "$cron_start"
    echo "$cron_end"
}

# Show usage
show_usage() {
    echo "MLG.clan Maintenance Mode Script"
    echo "Usage: $0 {enable|disable|status|schedule}"
    echo
    echo "Commands:"
    echo "  enable              Enable maintenance mode"
    echo "  disable             Disable maintenance mode"
    echo "  status              Check maintenance mode status"
    echo "  schedule TIME DURATION  Schedule maintenance window"
    echo
    echo "Examples:"
    echo "  $0 enable           Enable maintenance mode now"
    echo "  $0 disable          Disable maintenance mode now"
    echo "  $0 status           Check if maintenance mode is active"
    echo "  $0 schedule '2024-01-01 02:00' 60  Schedule 1-hour maintenance"
}

# Main function
main() {
    local command=${1:-status}
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    case "$command" in
        enable)
            enable_maintenance
            ;;
        disable)
            disable_maintenance
            ;;
        status)
            check_status
            ;;
        schedule)
            if [[ $# -lt 2 ]]; then
                log_error "Schedule command requires start time"
                show_usage
                exit 1
            fi
            schedule_maintenance "$2" "${3:-30}"
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi