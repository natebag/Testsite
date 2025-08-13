/**
 * API Security Testing Module
 * Specialized testing for API vulnerabilities and security issues
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-13
 */

import crypto from 'crypto';
import { performance } from 'perf_hooks';
import fetch from 'node-fetch';

export class APISecurityTester {
  constructor(framework) {
    this.framework = framework;
    this.config = framework.config;
    this.payloadHistory = new Map();
  }

  /**
   * Test input validation vulnerabilities
   */
  async testInputValidation() {
    const testStart = performance.now();
    
    try {
      console.log('🔍 Testing input validation...');
      
      const validationIssues = [];
      const testPayloads = [
        // XSS payloads
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '"><img src=x onerror=alert("XSS")>',
        
        // SQL injection payloads
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT null,null,null--",
        
        // Command injection payloads
        '; ls -la',
        '$(whoami)',
        '`id`',
        
        // Directory traversal
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        
        // XXE payloads
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        
        // Large payloads
        'A'.repeat(10000),
        
        // Special characters
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        '\x00\x01\x02\x03\x04\x05',
        
        // Unicode/encoding
        '%27%20OR%20%271%27%3D%271',
        '\u003cscript\u003ealert("XSS")\u003c/script\u003e'
      ];

      const endpoints = [
        { url: '/api/users', method: 'POST', field: 'username' },
        { url: '/api/clans', method: 'POST', field: 'name' },
        { url: '/api/voting', method: 'POST', field: 'content' },
        { url: '/api/content', method: 'POST', field: 'message' },
        { url: '/api/search', method: 'GET', field: 'q' }
      ];

      for (const endpoint of endpoints) {
        for (const payload of testPayloads) {
          try {
            let response;
            
            if (endpoint.method === 'GET') {
              const url = `${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}?${endpoint.field}=${encodeURIComponent(payload)}`;
              response = await fetch(url, {
                timeout: 10000
              });
            } else {
              const body = {};
              body[endpoint.field] = payload;
              
              response = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}`, {
                method: endpoint.method,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                timeout: 10000
              });
            }

            const responseText = await response.text();
            
            // Check for validation issues
            if (response.status === 200 && this.containsSuspiciousResponse(responseText, payload)) {
              validationIssues.push({
                endpoint: endpoint.url,
                method: endpoint.method,
                field: endpoint.field,
                payload: payload.substring(0, 100), // Truncate for logging
                issue: 'Potentially unsafe input accepted',
                responseStatus: response.status
              });
            }

            // Check for error disclosure
            if (response.status >= 500 && this.containsErrorDisclosure(responseText)) {
              validationIssues.push({
                endpoint: endpoint.url,
                method: endpoint.method,
                field: endpoint.field,
                payload: payload.substring(0, 100),
                issue: 'Error information disclosure detected',
                responseStatus: response.status
              });
            }

          } catch (error) {
            // Network errors might indicate DoS potential
            if (error.message.includes('timeout')) {
              validationIssues.push({
                endpoint: endpoint.url,
                method: endpoint.method,
                field: endpoint.field,
                payload: payload.substring(0, 100),
                issue: 'Request timeout - potential DoS vector',
                error: error.message
              });
            }
          }

          // Add delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const severity = validationIssues.length > 5 ? 'high' : 
                     validationIssues.length > 2 ? 'medium' : 
                     validationIssues.length > 0 ? 'low' : 'info';

      return {
        testId: 'input_validation',
        category: 'input_validation',
        severity,
        status: validationIssues.length > 0 ? 'VULNERABLE' : 'SECURE',
        title: 'Input Validation Security Testing',
        description: 'Testing API endpoints for proper input validation and sanitization',
        findings: {
          totalPayloadsTested: testPayloads.length * endpoints.length,
          vulnerabilities: validationIssues,
          endpointsTested: endpoints.length
        },
        recommendations: validationIssues.length > 0 ? [
          'Implement comprehensive input validation on all user inputs',
          'Use parameterized queries to prevent SQL injection',
          'Sanitize and encode all output to prevent XSS',
          'Implement rate limiting to prevent DoS attacks',
          'Use proper error handling to prevent information disclosure'
        ] : ['Input validation appears adequate'],
        duration: performance.now() - testStart
      };

    } catch (error) {
      return {
        testId: 'input_validation',
        category: 'input_validation',
        severity: 'info',
        status: 'ERROR',
        title: 'Input Validation Security Testing',
        error: error.message,
        duration: performance.now() - testStart
      };
    }
  }

  /**
   * Test SQL injection vulnerabilities
   */
  async testSQLInjection() {
    const testStart = performance.now();
    
    try {
      console.log('💉 Testing SQL injection vulnerabilities...');
      
      const sqlInjectionIssues = [];
      const sqlPayloads = [
        // Basic SQL injection
        "' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "admin'/*",
        
        // Union-based injection
        "' UNION SELECT 1,2,3--",
        "' UNION SELECT null,username,password FROM users--",
        
        // Boolean-based blind injection
        "' AND 1=1--",
        "' AND 1=2--",
        
        // Time-based blind injection
        "'; WAITFOR DELAY '00:00:05'--",
        "' OR SLEEP(5)--",
        
        // Error-based injection
        "' AND (SELECT COUNT(*) FROM information_schema.tables)>0--",
        "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--",
        
        // Second-order injection
        "test'; INSERT INTO users VALUES ('evil', 'user'); --"
      ];

      const sqlEndpoints = [
        { url: '/api/users/search', method: 'GET', param: 'query' },
        { url: '/api/clans/search', method: 'GET', param: 'name' },
        { url: '/api/users', method: 'GET', param: 'id' },
        { url: '/api/auth/login', method: 'POST', param: 'username' }
      ];

      for (const endpoint of sqlEndpoints) {
        for (const payload of sqlPayloads) {
          try {
            let response;
            const startTime = performance.now();

            if (endpoint.method === 'GET') {
              const url = `${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}?${endpoint.param}=${encodeURIComponent(payload)}`;
              response = await fetch(url, {
                timeout: 15000 // Longer timeout for time-based injections
              });
            } else {
              const body = {};
              body[endpoint.param] = payload;
              
              response = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}`, {
                method: endpoint.method,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                timeout: 15000
              });
            }

            const responseTime = performance.now() - startTime;
            const responseText = await response.text();

            // Check for SQL injection indicators
            const sqlInjectionDetected = this.detectSQLInjection(responseText, responseTime, payload);
            
            if (sqlInjectionDetected.detected) {
              sqlInjectionIssues.push({
                endpoint: endpoint.url,
                method: endpoint.method,
                parameter: endpoint.param,
                payload: payload,
                detectionMethod: sqlInjectionDetected.method,
                evidence: sqlInjectionDetected.evidence,
                responseStatus: response.status,
                responseTime
              });
            }

          } catch (error) {
            // Check for time-based injection
            if (error.message.includes('timeout') && payload.includes('SLEEP') || payload.includes('WAITFOR')) {
              sqlInjectionIssues.push({
                endpoint: endpoint.url,
                method: endpoint.method,
                parameter: endpoint.param,
                payload: payload,
                detectionMethod: 'time_based',
                evidence: 'Request timeout on time-based payload',
                error: error.message
              });
            }
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const severity = sqlInjectionIssues.length > 0 ? 'critical' : 'info';

      return {
        testId: 'sql_injection',
        category: 'sql_injection',
        severity,
        status: sqlInjectionIssues.length > 0 ? 'VULNERABLE' : 'SECURE',
        title: 'SQL Injection Vulnerability Testing',
        description: 'Testing for SQL injection vulnerabilities in API endpoints',
        findings: {
          vulnerabilities: sqlInjectionIssues,
          payloadsTested: sqlPayloads.length,
          endpointsTested: sqlEndpoints.length
        },
        recommendations: sqlInjectionIssues.length > 0 ? [
          'CRITICAL: Use parameterized queries or prepared statements',
          'Implement proper input validation and sanitization',
          'Use an ORM that provides SQL injection protection',
          'Apply principle of least privilege to database accounts',
          'Implement database query monitoring and alerting'
        ] : ['No SQL injection vulnerabilities detected'],
        duration: performance.now() - testStart
      };

    } catch (error) {
      return {
        testId: 'sql_injection',
        category: 'sql_injection',
        severity: 'info',
        status: 'ERROR',
        title: 'SQL Injection Vulnerability Testing',
        error: error.message,
        duration: performance.now() - testStart
      };
    }
  }

  /**
   * Test XSS prevention mechanisms
   */
  async testXSSPrevention() {
    const testStart = performance.now();
    
    try {
      console.log('🚨 Testing XSS prevention mechanisms...');
      
      const xssIssues = [];
      const xssPayloads = [
        // Basic XSS
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        
        // Event-based XSS
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<marquee onstart=alert("XSS")>',
        
        // Encoded XSS
        '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E',
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        
        // Filter bypass attempts
        '<ScRiPt>alert("XSS")</ScRiPt>',
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        'javascript:alert("XSS")',
        
        // CSS-based XSS
        '<style>@import"data:,*{x:expression(alert(`XSS`))}"</style>',
        
        // HTML5 XSS
        '<video><source onerror="alert(`XSS`)">',
        '<audio src=x onerror=alert("XSS")>',
        
        // DOM-based XSS payloads
        '#<script>alert("XSS")</script>',
        'data:text/html,<script>alert("XSS")</script>'
      ];

      const xssEndpoints = [
        { url: '/api/content', method: 'POST', field: 'message' },
        { url: '/api/clans', method: 'POST', field: 'description' },
        { url: '/api/users', method: 'PUT', field: 'bio' },
        { url: '/api/voting', method: 'POST', field: 'content' },
        { url: '/api/comments', method: 'POST', field: 'text' }
      ];

      for (const endpoint of xssEndpoints) {
        for (const payload of xssPayloads) {
          try {
            const body = {};
            body[endpoint.field] = payload;
            
            const response = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}`, {
              method: endpoint.method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body),
              timeout: 10000
            });

            const responseText = await response.text();

            // Check if payload is reflected without proper encoding
            if (this.detectXSSVulnerability(responseText, payload)) {
              xssIssues.push({
                endpoint: endpoint.url,
                method: endpoint.method,
                field: endpoint.field,
                payload: payload,
                responseStatus: response.status,
                evidence: 'XSS payload reflected without proper encoding'
              });
            }

            // Check Content-Security-Policy header
            const csp = response.headers.get('content-security-policy');
            if (!csp && response.status === 200) {
              // Only flag missing CSP once per endpoint
              const cspKey = `${endpoint.url}_missing_csp`;
              if (!this.payloadHistory.has(cspKey)) {
                this.payloadHistory.set(cspKey, true);
                xssIssues.push({
                  endpoint: endpoint.url,
                  method: endpoint.method,
                  field: endpoint.field,
                  issue: 'Missing Content-Security-Policy header',
                  responseStatus: response.status
                });
              }
            }

          } catch (error) {
            // Continue testing other payloads
          }

          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const severity = xssIssues.filter(issue => issue.payload).length > 0 ? 'high' : 
                     xssIssues.length > 0 ? 'medium' : 'info';

      return {
        testId: 'xss_prevention',
        category: 'xss_prevention',
        severity,
        status: xssIssues.length > 0 ? 'VULNERABLE' : 'SECURE',
        title: 'Cross-Site Scripting (XSS) Prevention Testing',
        description: 'Testing for XSS vulnerabilities and prevention mechanisms',
        findings: {
          vulnerabilities: xssIssues,
          payloadsTested: xssPayloads.length,
          endpointsTested: xssEndpoints.length
        },
        recommendations: xssIssues.length > 0 ? [
          'Implement proper output encoding/escaping for all user input',
          'Use Content-Security-Policy headers to prevent XSS execution',
          'Validate and sanitize all input on the server side',
          'Use secure templating engines with auto-escaping',
          'Implement input validation whitelist approach'
        ] : ['XSS prevention mechanisms appear adequate'],
        duration: performance.now() - testStart
      };

    } catch (error) {
      return {
        testId: 'xss_prevention',
        category: 'xss_prevention',
        severity: 'info',
        status: 'ERROR',
        title: 'Cross-Site Scripting (XSS) Prevention Testing',
        error: error.message,
        duration: performance.now() - testStart
      };
    }
  }

  /**
   * Test CSRF protection mechanisms
   */
  async testCSRFProtection() {
    const testStart = performance.now();
    
    try {
      console.log('🔐 Testing CSRF protection mechanisms...');
      
      const csrfIssues = [];
      const stateChangingEndpoints = [
        { url: '/api/users', method: 'POST' },
        { url: '/api/users/1', method: 'PUT' },
        { url: '/api/users/1', method: 'DELETE' },
        { url: '/api/clans', method: 'POST' },
        { url: '/api/voting', method: 'POST' },
        { url: '/api/auth/logout', method: 'POST' }
      ];

      for (const endpoint of stateChangingEndpoints) {
        try {
          // Test 1: Request without CSRF token
          const responseWithoutToken = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://evil.com'
            },
            body: endpoint.method !== 'DELETE' ? JSON.stringify({ test: 'data' }) : undefined,
            timeout: 10000
          });

          if (responseWithoutToken.status === 200) {
            csrfIssues.push({
              endpoint: endpoint.url,
              method: endpoint.method,
              issue: 'Request succeeded without CSRF token',
              statusCode: responseWithoutToken.status
            });
          }

          // Test 2: Request with invalid CSRF token
          const responseWithInvalidToken = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint.url}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': 'invalid_token_12345',
              'Origin': 'https://evil.com'
            },
            body: endpoint.method !== 'DELETE' ? JSON.stringify({ test: 'data' }) : undefined,
            timeout: 10000
          });

          if (responseWithInvalidToken.status === 200) {
            csrfIssues.push({
              endpoint: endpoint.url,
              method: endpoint.method,
              issue: 'Request succeeded with invalid CSRF token',
              statusCode: responseWithInvalidToken.status
            });
          }

          // Test 3: Check for SameSite cookie attribute
          const cookieHeader = responseWithoutToken.headers.get('set-cookie');
          if (cookieHeader && !cookieHeader.includes('SameSite')) {
            csrfIssues.push({
              endpoint: endpoint.url,
              method: endpoint.method,
              issue: 'Session cookie missing SameSite attribute',
              cookie: cookieHeader
            });
          }

        } catch (error) {
          // Network errors are expected for some tests
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test for CSRF token availability
      const csrfTokenTest = await this.testCSRFTokenAvailability();
      if (!csrfTokenTest.available) {
        csrfIssues.push({
          issue: 'CSRF token not available or accessible',
          details: csrfTokenTest
        });
      }

      const severity = csrfIssues.filter(issue => 
        issue.issue.includes('succeeded without') || 
        issue.issue.includes('succeeded with invalid')
      ).length > 0 ? 'high' : 
      csrfIssues.length > 0 ? 'medium' : 'info';

      return {
        testId: 'csrf_protection',
        category: 'csrf_protection',
        severity,
        status: csrfIssues.length > 0 ? 'VULNERABLE' : 'SECURE',
        title: 'Cross-Site Request Forgery (CSRF) Protection Testing',
        description: 'Testing CSRF protection mechanisms on state-changing operations',
        findings: {
          vulnerabilities: csrfIssues,
          endpointsTested: stateChangingEndpoints.length,
          csrfTokenTest
        },
        recommendations: csrfIssues.length > 0 ? [
          'Implement CSRF tokens for all state-changing operations',
          'Use SameSite cookie attribute to prevent CSRF attacks',
          'Validate Origin and Referer headers',
          'Implement double-submit cookie pattern',
          'Use proper CSRF middleware in your framework'
        ] : ['CSRF protection mechanisms appear adequate'],
        duration: performance.now() - testStart
      };

    } catch (error) {
      return {
        testId: 'csrf_protection',
        category: 'csrf_protection',
        severity: 'info',
        status: 'ERROR',
        title: 'Cross-Site Request Forgery (CSRF) Protection Testing',
        error: error.message,
        duration: performance.now() - testStart
      };
    }
  }

  /**
   * Test API rate limiting effectiveness
   */
  async testAPIRateLimiting() {
    const testStart = performance.now();
    
    try {
      console.log('⏱️ Testing API rate limiting effectiveness...');
      
      const rateLimitIssues = [];
      const testEndpoints = [
        '/api/auth/login',
        '/api/users',
        '/api/clans',
        '/api/voting',
        '/api/search'
      ];

      for (const endpoint of testEndpoints) {
        try {
          const requests = [];
          const requestCount = 20; // Number of rapid requests to test
          const startTime = Date.now();

          // Send rapid requests
          for (let i = 0; i < requestCount; i++) {
            requests.push(
              fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint}`, {
                method: 'GET',
                timeout: 5000
              }).catch(error => ({ error: error.message, index: i }))
            );
          }

          const responses = await Promise.all(requests);
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Analyze responses
          const successfulRequests = responses.filter(r => r.status && r.status < 400).length;
          const rateLimitedRequests = responses.filter(r => r.status === 429).length;
          const requestsPerSecond = (requestCount / duration) * 1000;

          // Check rate limiting effectiveness
          if (rateLimitedRequests === 0 && successfulRequests > 10) {
            rateLimitIssues.push({
              endpoint,
              issue: 'No rate limiting detected',
              successfulRequests,
              totalRequests: requestCount,
              requestsPerSecond: requestsPerSecond.toFixed(2)
            });
          } else if (rateLimitedRequests > 0) {
            // Check rate limit headers
            const rateLimitedResponse = responses.find(r => r.status === 429);
            if (rateLimitedResponse) {
              const rateLimitHeaders = this.extractRateLimitHeaders(rateLimitedResponse);
              if (!rateLimitHeaders.hasHeaders) {
                rateLimitIssues.push({
                  endpoint,
                  issue: 'Rate limiting active but missing informative headers',
                  rateLimitedRequests,
                  totalRequests: requestCount
                });
              }
            }
          }

          // Test rate limit bypass attempts
          const bypassTest = await this.testRateLimitBypass(endpoint);
          if (bypassTest.bypassed) {
            rateLimitIssues.push({
              endpoint,
              issue: 'Rate limit bypass possible',
              bypassMethod: bypassTest.method,
              details: bypassTest.details
            });
          }

        } catch (error) {
          rateLimitIssues.push({
            endpoint,
            issue: 'Error during rate limit testing',
            error: error.message
          });
        }

        // Wait between endpoint tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const severity = rateLimitIssues.filter(issue => 
        issue.issue.includes('No rate limiting') || 
        issue.issue.includes('bypass possible')
      ).length > 0 ? 'medium' : 
      rateLimitIssues.length > 0 ? 'low' : 'info';

      return {
        testId: 'api_rate_limiting',
        category: 'rate_limiting',
        severity,
        status: rateLimitIssues.length > 0 ? 'VULNERABLE' : 'SECURE',
        title: 'API Rate Limiting Effectiveness Testing',
        description: 'Testing rate limiting mechanisms on API endpoints',
        findings: {
          issues: rateLimitIssues,
          endpointsTested: testEndpoints.length
        },
        recommendations: rateLimitIssues.length > 0 ? [
          'Implement rate limiting on all public API endpoints',
          'Use proper HTTP status codes (429) for rate limited requests',
          'Include informative rate limit headers (X-RateLimit-*)',
          'Implement different rate limits for different user types',
          'Monitor and log rate limiting events'
        ] : ['API rate limiting appears adequate'],
        duration: performance.now() - testStart
      };

    } catch (error) {
      return {
        testId: 'api_rate_limiting',
        category: 'rate_limiting',
        severity: 'info',
        status: 'ERROR',
        title: 'API Rate Limiting Effectiveness Testing',
        error: error.message,
        duration: performance.now() - testStart
      };
    }
  }

  /**
   * Test for sensitive data exposure
   */
  async testDataExposure() {
    const testStart = performance.now();
    
    try {
      console.log('🔍 Testing for sensitive data exposure...');
      
      const dataExposureIssues = [];
      const testEndpoints = [
        '/api/users',
        '/api/users/1',
        '/api/auth/me',
        '/api/admin',
        '/api/config',
        '/api/debug',
        '/api/.env',
        '/api/swagger.json',
        '/api/openapi.json'
      ];

      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /key/i,
        /token/i,
        /private/i,
        /api[_-]?key/i,
        /database/i,
        /connection/i,
        /credentials/i,
        /email/i,
        /phone/i,
        /ssn/i,
        /credit[_-]?card/i,
        /bank/i
      ];

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint}`, {
            method: 'GET',
            timeout: 10000
          });

          if (response.ok) {
            const responseText = await response.text();
            let responseData;

            try {
              responseData = JSON.parse(responseText);
            } catch {
              responseData = responseText;
            }

            // Check for sensitive data patterns
            const exposedData = this.findSensitiveData(responseData, sensitivePatterns);
            
            if (exposedData.length > 0) {
              dataExposureIssues.push({
                endpoint,
                issue: 'Sensitive data exposure detected',
                exposedFields: exposedData,
                statusCode: response.status
              });
            }

            // Check for excessive data exposure
            if (typeof responseData === 'object' && responseData) {
              const fieldCount = this.countFields(responseData);
              if (fieldCount > 20) {
                dataExposureIssues.push({
                  endpoint,
                  issue: 'Excessive data exposure - too many fields returned',
                  fieldCount,
                  statusCode: response.status
                });
              }
            }

            // Check for stack traces or debug information
            if (responseText.includes('stack trace') || 
                responseText.includes('traceback') ||
                responseText.includes('at ') && responseText.includes('.js:')) {
              dataExposureIssues.push({
                endpoint,
                issue: 'Debug information or stack traces exposed',
                statusCode: response.status
              });
            }
          }

        } catch (error) {
          // Continue testing other endpoints
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const severity = dataExposureIssues.filter(issue => 
        issue.issue.includes('Sensitive data exposure')
      ).length > 0 ? 'high' : 
      dataExposureIssues.length > 0 ? 'medium' : 'info';

      return {
        testId: 'data_exposure',
        category: 'api_security',
        severity,
        status: dataExposureIssues.length > 0 ? 'VULNERABLE' : 'SECURE',
        title: 'Sensitive Data Exposure Testing',
        description: 'Testing for exposure of sensitive data through API endpoints',
        findings: {
          vulnerabilities: dataExposureIssues,
          endpointsTested: testEndpoints.length
        },
        recommendations: dataExposureIssues.length > 0 ? [
          'Implement proper data filtering to return only necessary fields',
          'Remove sensitive information from API responses',
          'Use proper error handling to prevent debug information leakage',
          'Implement field-level access controls',
          'Regular audit of API response data'
        ] : ['No sensitive data exposure detected'],
        duration: performance.now() - testStart
      };

    } catch (error) {
      return {
        testId: 'data_exposure',
        category: 'api_security',
        severity: 'info',
        status: 'ERROR',
        title: 'Sensitive Data Exposure Testing',
        error: error.message,
        duration: performance.now() - testStart
      };
    }
  }

  /**
   * Helper method to check for suspicious responses
   */
  containsSuspiciousResponse(responseText, payload) {
    // Check if the payload is directly reflected in the response
    if (responseText.includes(payload)) {
      return true;
    }

    // Check for SQL error messages
    const sqlErrors = [
      'syntax error',
      'mysql_fetch',
      'ORA-',
      'PostgreSQL',
      'Warning: mysql',
      'valid MySQL result',
      'MySqlClient'
    ];

    return sqlErrors.some(error => responseText.toLowerCase().includes(error.toLowerCase()));
  }

  /**
   * Helper method to check for error disclosure
   */
  containsErrorDisclosure(responseText) {
    const errorPatterns = [
      /stack trace/i,
      /traceback/i,
      /at\s+.*\.js:\d+:\d+/,
      /Error:\s+.*\n\s+at/,
      /Exception:\s+.*\n\s+at/,
      /Internal server error/i,
      /database.*error/i,
      /connection.*failed/i
    ];

    return errorPatterns.some(pattern => pattern.test(responseText));
  }

  /**
   * Helper method to detect SQL injection
   */
  detectSQLInjection(responseText, responseTime, payload) {
    // Time-based detection
    if (responseTime > 5000 && (payload.includes('SLEEP') || payload.includes('WAITFOR'))) {
      return {
        detected: true,
        method: 'time_based',
        evidence: `Response time: ${responseTime}ms`
      };
    }

    // Error-based detection
    const sqlErrors = [
      'SQL syntax',
      'mysql_fetch',
      'ORA-01756',
      'Microsoft OLE DB Provider',
      'Unclosed quotation mark',
      'ODBC Microsoft Access Driver'
    ];

    for (const error of sqlErrors) {
      if (responseText.includes(error)) {
        return {
          detected: true,
          method: 'error_based',
          evidence: error
        };
      }
    }

    // Union-based detection
    if (payload.includes('UNION') && responseText.length > 1000) {
      return {
        detected: true,
        method: 'union_based',
        evidence: 'Large response with UNION payload'
      };
    }

    return { detected: false };
  }

  /**
   * Helper method to detect XSS vulnerability
   */
  detectXSSVulnerability(responseText, payload) {
    // Check if the payload is reflected without proper encoding
    const unescapedPayload = payload.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    
    if (responseText.includes(unescapedPayload)) {
      return true;
    }

    // Check for specific XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*alert.*<\/script>/i,
      /<img[^>]*onerror[^>]*>/i,
      /<svg[^>]*onload[^>]*>/i,
      /javascript:alert/i
    ];

    return xssPatterns.some(pattern => pattern.test(responseText));
  }

  /**
   * Helper method to test CSRF token availability
   */
  async testCSRFTokenAvailability() {
    try {
      const response = await fetch(this.config.TEST_ENVIRONMENT.BASE_URL, {
        timeout: 5000
      });

      const responseText = await response.text();
      const headers = response.headers;

      // Check for CSRF token in various locations
      const tokenSources = {
        cookie: headers.get('set-cookie')?.includes('csrf'),
        header: headers.get('x-csrf-token'),
        meta: responseText.includes('csrf-token') || responseText.includes('_token'),
        form: responseText.includes('_csrf') || responseText.includes('csrf_token')
      };

      const available = Object.values(tokenSources).some(source => source);

      return {
        available,
        sources: tokenSources
      };

    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Helper method to extract rate limit headers
   */
  extractRateLimitHeaders(response) {
    const rateLimitHeaders = {
      'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
      'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
      'retry-after': response.headers.get('retry-after')
    };

    const hasHeaders = Object.values(rateLimitHeaders).some(header => header !== null);

    return {
      hasHeaders,
      headers: rateLimitHeaders
    };
  }

  /**
   * Helper method to test rate limit bypass
   */
  async testRateLimitBypass(endpoint) {
    try {
      // Test IP spoofing bypass
      const spoofingResponse = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint}`, {
        headers: {
          'X-Forwarded-For': '192.168.1.100',
          'X-Real-IP': '192.168.1.100',
          'X-Originating-IP': '192.168.1.100'
        },
        timeout: 5000
      });

      if (spoofingResponse.ok) {
        return {
          bypassed: true,
          method: 'ip_spoofing',
          details: 'Rate limit bypassed using spoofed IP headers'
        };
      }

      // Test User-Agent bypass
      const userAgentResponse = await fetch(`${this.config.TEST_ENVIRONMENT.API_BASE_URL}${endpoint}`, {
        headers: {
          'User-Agent': 'Bypass-Agent-' + Math.random()
        },
        timeout: 5000
      });

      if (userAgentResponse.ok) {
        return {
          bypassed: true,
          method: 'user_agent_rotation',
          details: 'Rate limit bypassed using different User-Agent'
        };
      }

      return { bypassed: false };

    } catch (error) {
      return { bypassed: false, error: error.message };
    }
  }

  /**
   * Helper method to find sensitive data
   */
  findSensitiveData(data, patterns) {
    const exposedFields = [];
    
    const checkObject = (obj, path = '') => {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Check if field name matches sensitive patterns
          if (patterns.some(pattern => pattern.test(key))) {
            exposedFields.push({
              field: currentPath,
              type: 'field_name',
              pattern: key
            });
          }

          // Check if value contains sensitive data
          if (typeof value === 'string' && patterns.some(pattern => pattern.test(value))) {
            exposedFields.push({
              field: currentPath,
              type: 'field_value',
              value: value.substring(0, 50) + '...' // Truncate for security
            });
          }

          // Recursively check nested objects
          if (typeof value === 'object') {
            checkObject(value, currentPath);
          }
        }
      }
    };

    checkObject(data);
    return exposedFields;
  }

  /**
   * Helper method to count fields in an object
   */
  countFields(obj, count = 0) {
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        count++;
        if (typeof value === 'object') {
          count = this.countFields(value, count);
        }
      }
    }
    return count;
  }

  /**
   * Cleanup testing resources
   */
  async cleanup() {
    this.payloadHistory.clear();
  }
}

export default APISecurityTester;