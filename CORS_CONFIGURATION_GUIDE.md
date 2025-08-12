# MLG.clan CORS Configuration Guide

## Overview

This guide explains the comprehensive CORS (Cross-Origin Resource Sharing) configuration implemented for the MLG.clan platform to enable seamless communication between frontend and backend services during development.

## Problem Solved

**Before:** CORS errors prevented the frontend (port 9000) from communicating with API servers (ports 3000, 3001), blocking development and testing.

**After:** Complete CORS configuration with API proxying enables all services to communicate seamlessly across different ports.

## Server Configuration

### 1. Frontend Development Server (Port 9000)
**File:** `temp-server.js`

**Features:**
- ✅ Comprehensive CORS headers for all origins
- ✅ API proxy to demo server (port 3001) 
- ✅ API proxy to main server (port 3000)
- ✅ Preflight OPTIONS request handling
- ✅ Error handling for unavailable services
- ✅ Health check and CORS test endpoints

**Key Configuration:**
```javascript
const corsOptions = {
  origin: [
    'http://localhost:9000', // Frontend development server
    'http://localhost:3000', // Main development server
    'http://localhost:3001', // Demo server
    'http://127.0.0.1:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  maxAge: 86400 // 24 hours preflight cache
};
```

### 2. Main Development Server (Port 3000)
**File:** `server.js`

**Features:**
- ✅ Enhanced CORS configuration
- ✅ Support for all development ports
- ✅ Preflight request handling
- ✅ Gaming-specific API endpoints

### 3. Demo API Server (Port 3001)  
**File:** `demo/server.js`

**Features:**
- ✅ Complete demo API endpoints
- ✅ CORS headers for cross-origin access
- ✅ Request logging for debugging
- ✅ Enhanced error handling

### 4. Main API Server
**File:** `src/api/server.js`

**Features:**
- ✅ Production-ready CORS configuration
- ✅ Socket.IO CORS support
- ✅ Enhanced security headers
- ✅ Comprehensive API routing

## API Proxy Configuration

The frontend server (port 9000) includes intelligent API proxying:

### Demo API Proxy
- **Route:** `/api/demo/*`
- **Target:** `http://localhost:3001`
- **Purpose:** Access demo endpoints from frontend

### Main API Proxy  
- **Route:** `/api/*` (excluding `/api/demo/*`)
- **Target:** `http://localhost:3000`  
- **Purpose:** Access main API from frontend

## Development Workflow

### Starting Servers

1. **Frontend Server (Port 9000):**
   ```bash
   node temp-server.js
   # OR
   npm run start:frontend
   ```

2. **Main Development Server (Port 3000):**
   ```bash
   npm run dev
   # OR
   node server.js
   ```

3. **Demo API Server (Port 3001):**
   ```bash
   cd demo && node server.js
   # OR
   npm run start:demo
   ```

### Testing CORS Configuration

Run the comprehensive test suite:
```bash
npm run test:cors
# OR
node test-cors-configuration.js
```

### Quick Health Checks

- Frontend: `http://localhost:9000/health`
- Main Server: `http://localhost:3000/api/health`
- Demo Server: `http://localhost:3001/api/demo/status`

## CORS Headers Explained

### Access-Control-Allow-Origin
- **Purpose:** Specifies which origins can access the resource
- **Value:** Multiple localhost origins for development
- **Production:** Should be restricted to specific domains

### Access-Control-Allow-Methods
- **Purpose:** Specifies which HTTP methods are allowed
- **Value:** GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Note:** OPTIONS is required for preflight requests

### Access-Control-Allow-Headers
- **Purpose:** Specifies which headers can be sent
- **Includes:** Content-Type, Authorization, X-API-Key, etc.
- **Note:** Comprehensive list covers all gaming platform needs

### Access-Control-Allow-Credentials
- **Purpose:** Allows cookies and authentication headers
- **Value:** true
- **Security:** Required for user authentication

### Access-Control-Max-Age
- **Purpose:** How long browsers cache preflight responses
- **Value:** 86400 (24 hours)
- **Benefit:** Reduces preflight request frequency

## Security Considerations

### Development vs Production

**Development (Current):**
- ✅ Allows multiple localhost origins
- ✅ Comprehensive header support
- ✅ Request logging enabled
- ✅ Error details exposed

**Production (Recommended):**
- 🔒 Restrict origins to production domains
- 🔒 Minimize allowed headers
- 🔒 Disable request logging
- 🔒 Generic error messages

### Authentication Integration

The CORS configuration supports:
- JWT tokens in Authorization headers
- Session cookies with credentials
- Custom API keys in X-API-Key headers
- Phantom wallet signature headers

## Troubleshooting

### Common Issues

1. **"CORS error" in browser console:**
   - Verify all servers are running
   - Check origin is in allowed list
   - Confirm preflight requests succeed

2. **Proxy timeouts:**
   - Ensure target servers are running
   - Check port numbers in configuration
   - Review proxy error logs

3. **Authentication failures:**
   - Verify credentials: true is set
   - Check Authorization header format
   - Confirm token validation logic

### Debug Commands

```bash
# Test CORS headers
curl -H "Origin: http://localhost:9000" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:3001/api/demo/status

# Check server health
curl http://localhost:9000/health
curl http://localhost:3000/api/health
curl http://localhost:3001/api/demo/status

# Test proxy functionality
curl http://localhost:9000/api/demo/status
curl http://localhost:9000/api/health
```

## File Summary

| File | Purpose | Port | CORS Features |
|------|---------|------|---------------|
| `temp-server.js` | Frontend Server | 9000 | Full CORS + API Proxy |
| `server.js` | Main Development | 3000 | Enhanced CORS |
| `demo/server.js` | Demo API | 3001 | Complete CORS |
| `src/api/server.js` | Production API | Configurable | Enterprise CORS |
| `test-cors-configuration.js` | Test Suite | - | CORS Validation |

## Next Steps

1. **Install dependencies:** `npm install`
2. **Start all servers** in separate terminals
3. **Run CORS tests:** `npm run test:cors`
4. **Access frontend:** `http://localhost:9000`
5. **Verify API calls** work without CORS errors

## Production Migration

When moving to production:

1. Update CORS origins to production domains
2. Implement environment-based configuration
3. Add rate limiting and security middleware
4. Configure SSL/TLS certificates
5. Set up proper logging and monitoring

---

**✅ CORS Configuration Complete!**

All cross-origin communication between frontend (port 9000) and API servers (ports 3000, 3001) is now fully functional with proper security headers and error handling.