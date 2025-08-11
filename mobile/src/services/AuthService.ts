/**
 * Authentication Service for Mobile App
 * Integrates with existing web platform authentication
 */

import EncryptedStorage from 'react-native-encrypted-storage';
import {Alert} from 'react-native';
import {User} from '@/types';
import {ApiService} from './ApiService';
import {BiometricService} from './BiometricService';

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  mfaRequired?: boolean;
}

interface BiometricLoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthServiceClass {
  private baseUrl: string;
  private currentToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://api.mlg.clan';
  }

  /**
   * Initialize authentication service
   */
  async initialize(): Promise<void> {
    try {
      // Restore token from secure storage
      const savedToken = await EncryptedStorage.getItem('auth_token');
      if (savedToken) {
        this.currentToken = savedToken;
        ApiService.setAuthToken(savedToken);
      }
    } catch (error) {
      console.warn('Failed to initialize auth service:', error);
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          platform: 'mobile',
          deviceInfo: await this.getDeviceInfo(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.mfaRequired) {
        await this.saveAuthTokens(data.token, data.refreshToken);
        ApiService.setAuthToken(data.token);
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during login');
    }
  }

  /**
   * Login with wallet signature
   */
  async loginWithWallet(walletAddress: string, signature: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/wallet-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          platform: 'mobile',
          deviceInfo: await this.getDeviceInfo(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Wallet login failed');
      }

      const data = await response.json();
      await this.saveAuthTokens(data.token, data.refreshToken);
      ApiService.setAuthToken(data.token);

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during wallet login');
    }
  }

  /**
   * Login with biometric authentication
   */
  async loginWithBiometrics(): Promise<BiometricLoginResponse> {
    try {
      // Check if biometric credentials exist
      const biometricCredentials = await EncryptedStorage.getItem('biometric_credentials');
      if (!biometricCredentials) {
        throw new Error('No biometric credentials found. Please login with your credentials first.');
      }

      const credentials = JSON.parse(biometricCredentials);
      
      // Authenticate with biometrics
      const biometricResult = await BiometricService.authenticate('Login to MLG.clan');
      if (!biometricResult.success) {
        throw new Error(biometricResult.error || 'Biometric authentication failed');
      }

      // Use stored refresh token or credentials
      const response = await fetch(`${this.baseUrl}/auth/biometric-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: credentials.userId,
          biometricSignature: biometricResult.signature,
          refreshToken: credentials.refreshToken,
          platform: 'mobile',
          deviceInfo: await this.getDeviceInfo(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Biometric login failed');
      }

      const data = await response.json();
      await this.saveAuthTokens(data.token, data.refreshToken);
      ApiService.setAuthToken(data.token);

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Biometric login failed');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<{token: string; refreshToken: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
          platform: 'mobile',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Token refresh failed');
      }

      const data = await response.json();
      await this.saveAuthTokens(data.token, data.refreshToken);
      ApiService.setAuthToken(data.token);

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * Logout user
   */
  async logout(token?: string): Promise<void> {
    try {
      if (token || this.currentToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || this.currentToken}`,
          },
          body: JSON.stringify({
            platform: 'mobile',
          }),
        });
      }
    } catch (error) {
      console.warn('Error during logout request:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(code: string): Promise<{token: string; refreshToken: string}> {
    try {
      const tempToken = await EncryptedStorage.getItem('temp_mfa_token');
      if (!tempToken) {
        throw new Error('No MFA session found');
      }

      const response = await fetch(`${this.baseUrl}/auth/verify-mfa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({
          code,
          platform: 'mobile',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'MFA verification failed');
      }

      const data = await response.json();
      await this.saveAuthTokens(data.token, data.refreshToken);
      ApiService.setAuthToken(data.token);
      
      // Clear temporary MFA token
      await EncryptedStorage.removeItem('temp_mfa_token');

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'MFA verification failed');
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometrics(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const refreshToken = await EncryptedStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Store biometric credentials
      await EncryptedStorage.setItem('biometric_credentials', JSON.stringify({
        userId: user.id,
        refreshToken,
        enabledAt: new Date().toISOString(),
      }));

      // Update user preference on server
      await ApiService.post('/auth/enable-biometrics', {
        enabled: true,
        platform: 'mobile',
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to enable biometric authentication');
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometrics(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('biometric_credentials');
      await BiometricService.disable();

      // Update user preference on server
      if (this.currentToken) {
        await ApiService.post('/auth/enable-biometrics', {
          enabled: false,
          platform: 'mobile',
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to disable biometric authentication');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await EncryptedStorage.getItem('auth_token');
      if (!token) {
        return false;
      }

      // Verify token validity with server
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await EncryptedStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      const response = await ApiService.get('/auth/me');
      return response.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await ApiService.post('/auth/change-password', {
        currentPassword,
        newPassword,
        platform: 'mobile',
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          platform: 'mobile',
        }),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to request password reset');
    }
  }

  /**
   * Register new user
   */
  async register(userData: {
    email: string;
    username: string;
    password: string;
    walletAddress?: string;
  }): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          platform: 'mobile',
          deviceInfo: await this.getDeviceInfo(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      await this.saveAuthTokens(data.token, data.refreshToken);
      ApiService.setAuthToken(data.token);

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Private helper methods

  private async saveAuthTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        EncryptedStorage.setItem('auth_token', token),
        EncryptedStorage.setItem('refresh_token', refreshToken),
      ]);
      this.currentToken = token;
    } catch (error) {
      console.error('Failed to save auth tokens:', error);
      throw new Error('Failed to save authentication credentials');
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        EncryptedStorage.removeItem('auth_token'),
        EncryptedStorage.removeItem('refresh_token'),
        EncryptedStorage.removeItem('temp_mfa_token'),
        EncryptedStorage.removeItem('biometric_credentials'),
      ]);
      
      this.currentToken = null;
      ApiService.clearAuthToken();
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  private async getDeviceInfo(): Promise<any> {
    try {
      const DeviceInfo = require('react-native-device-info');
      
      return {
        deviceId: await DeviceInfo.getDeviceId(),
        deviceType: await DeviceInfo.getDeviceType(),
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        bundleId: await DeviceInfo.getBundleId(),
      };
    } catch (error) {
      return {
        platform: 'mobile',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Show authentication prompt for sensitive operations
   */
  async promptForAuthentication(operation: string): Promise<boolean> {
    const biometricEnabled = await BiometricService.isEnrolled();
    
    if (biometricEnabled) {
      const biometricResult = await BiometricService.authenticateForSensitiveOperation(operation);
      return biometricResult.success;
    }

    // Fallback to password prompt
    return new Promise((resolve) => {
      Alert.prompt(
        'Authentication Required',
        `Please enter your password to ${operation}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Authenticate',
            onPress: async (password) => {
              if (password) {
                try {
                  const user = await this.getCurrentUser();
                  if (user) {
                    // Verify password
                    await this.verifyPassword(password);
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                } catch (error) {
                  resolve(false);
                }
              } else {
                resolve(false);
              }
            },
          },
        ],
        'secure-text'
      );
    });
  }

  private async verifyPassword(password: string): Promise<boolean> {
    try {
      const response = await ApiService.post('/auth/verify-password', {
        password,
      });
      return response.valid;
    } catch (error) {
      return false;
    }
  }
}

export const AuthService = new AuthServiceClass();