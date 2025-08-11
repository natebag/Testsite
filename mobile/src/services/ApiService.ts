/**
 * API Service for MLG.clan Mobile App
 * Handles HTTP requests with authentication and error handling
 */

import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  requireAuth?: boolean;
  retries?: number;
}

class ApiServiceClass {
  private baseUrl: string;
  private authToken: string | null = null;
  private requestQueue: Array<{
    url: string;
    options: RequestOptions;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private isOnline = true;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://api.mlg.clan';
    this.setupNetworkListener();
  }

  /**
   * Initialize API service
   */
  async initialize(): Promise<void> {
    try {
      // Check network status
      const networkState = await NetInfo.fetch();
      this.isOnline = networkState.isConnected ?? false;

      // Restore auth token
      const savedToken = await EncryptedStorage.getItem('auth_token');
      if (savedToken) {
        this.authToken = savedToken;
      }
    } catch (error) {
      console.warn('Failed to initialize API service:', error);
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Make GET request
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make POST request
   */
  async post<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  /**
   * Make PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: {
      uri: string;
      type: string;
      name: string;
    },
    additionalData?: Record<string, any>
  ): Promise<T> {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await this.handleErrorResponse(response);
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'File upload failed');
    }
  }

  /**
   * Download file
   */
  async downloadFile(url: string, filename: string): Promise<string> {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    try {
      const RNFS = require('react-native-fs');
      const downloadDest = `${RNFS.DocumentDirectoryPath}/${filename}`;

      const options = {
        fromUrl: url,
        toFile: downloadDest,
        headers: this.authToken ? {
          'Authorization': `Bearer ${this.authToken}`,
        } : {},
      };

      const result = await RNFS.downloadFile(options).promise;
      
      if (result.statusCode === 200) {
        return downloadDest;
      } else {
        throw new Error(`Download failed with status code: ${result.statusCode}`);
      }
    } catch (error: any) {
      throw new Error(error.message || 'File download failed');
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      requireAuth = true,
      retries = 3,
    } = options;

    // Check if online for non-cached requests
    if (!this.isOnline && !this.isCacheableRequest(method, endpoint)) {
      return this.queueRequest(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };

    if (requireAuth && this.authToken) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await this.handleErrorResponse(response);
          
          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          lastError = error;
        }
      } catch (error: any) {
        lastError = error;
        
        // Don't retry for abort errors (timeouts) or network errors
        if (error.name === 'AbortError' || error.message.includes('Network')) {
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
            continue;
          }
        }
        
        if (attempt === retries) {
          throw error;
        }
        
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError!;
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    try {
      const errorData = await response.json();
      const message = errorData.message || errorData.error || `HTTP ${response.status}`;
      
      // Handle specific error cases
      switch (response.status) {
        case 401:
          // Unauthorized - clear auth token and redirect to login
          this.clearAuthToken();
          await EncryptedStorage.removeItem('auth_token');
          return new Error('Session expired. Please login again.');
        
        case 403:
          return new Error('Access denied. Insufficient permissions.');
        
        case 404:
          return new Error('Resource not found.');
        
        case 429:
          return new Error('Too many requests. Please try again later.');
        
        case 500:
          return new Error('Server error. Please try again later.');
        
        default:
          return new Error(message);
      }
    } catch {
      return new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
  }

  /**
   * Queue request for offline processing
   */
  private async queueRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        url: endpoint,
        options,
        resolve,
        reject,
      });

      // Show offline message
      Alert.alert(
        'Offline',
        'Request queued for when connection is restored.',
        [{text: 'OK'}]
      );
    });
  }

  /**
   * Process queued requests when online
   */
  private async processQueuedRequests(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) {
      return;
    }

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const {url, options, resolve, reject} of queue) {
      try {
        const result = await this.request(url, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }

  /**
   * Check if request can be cached/handled offline
   */
  private isCacheableRequest(method: string, endpoint: string): boolean {
    // Only GET requests for certain endpoints can be cached
    return method === 'GET' && (
      endpoint.includes('/content') ||
      endpoint.includes('/user') ||
      endpoint.includes('/clan')
    );
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Came back online - process queued requests
        this.processQueuedRequests();
      }
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<{
    isOnline: boolean;
    connectionType: string;
    isWifiEnabled: boolean;
  }> {
    const state = await NetInfo.fetch();
    return {
      isOnline: state.isConnected ?? false,
      connectionType: state.type,
      isWifiEnabled: state.type === 'wifi',
    };
  }

  /**
   * Clear request queue
   */
  clearQueue(): void {
    this.requestQueue.forEach(({reject}) => {
      reject(new Error('Request cancelled'));
    });
    this.requestQueue = [];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.requestQueue.length;
  }
}

export const ApiService = new ApiServiceClass();