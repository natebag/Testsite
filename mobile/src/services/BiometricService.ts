/**
 * Biometric Authentication Service
 * Provides secure biometric authentication using TouchID/FaceID/Fingerprint
 */

import ReactNativeBiometrics from 'react-native-biometrics';
import {Platform, Alert} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

interface BiometricResult {
  success: boolean;
  signature?: string;
  error?: string;
}

interface BiometricCapabilities {
  isSupported: boolean;
  biometryType: string;
  isEnrolled: boolean;
}

class BiometricServiceClass {
  private rnBiometrics: ReactNativeBiometrics;
  private isInitialized = false;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  /**
   * Initialize biometric service
   */
  async initialize(): Promise<void> {
    try {
      const {available, biometryType} = await this.rnBiometrics.isSensorAvailable();
      
      if (available) {
        console.log(`Biometrics available: ${biometryType}`);
        await this.setupBiometricKeys();
      } else {
        console.log('Biometrics not available on this device');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize biometric service:', error);
    }
  }

  /**
   * Check if biometric authentication is supported
   */
  async isSupported(): Promise<boolean> {
    try {
      const {available} = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.warn('Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Get biometric capabilities
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const {available, biometryType} = await this.rnBiometrics.isSensorAvailable();
      const {keysExist} = await this.rnBiometrics.biometricKeysExist();
      
      return {
        isSupported: available,
        biometryType: biometryType || 'Unknown',
        isEnrolled: keysExist,
      };
    } catch (error) {
      console.warn('Error getting biometric capabilities:', error);
      return {
        isSupported: false,
        biometryType: 'Unknown',
        isEnrolled: false,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(reason?: string): Promise<BiometricResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const capabilities = await this.getCapabilities();
      if (!capabilities.isSupported) {
        return {
          success: false,
          error: 'Biometric authentication not supported on this device',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: 'No biometric credentials enrolled. Please enroll biometrics first.',
        };
      }

      const promptMessage = reason || this.getDefaultPromptMessage(capabilities.biometryType);
      
      const {success, signature} = await this.rnBiometrics.createSignature({
        promptMessage,
        payload: this.generateAuthPayload(),
      });

      if (success && signature) {
        // Store successful authentication timestamp
        await this.recordSuccessfulAuth();
        
        return {
          success: true,
          signature,
        };
      } else {
        return {
          success: false,
          error: 'Biometric authentication failed',
        };
      }
    } catch (error: any) {
      console.warn('Biometric authentication error:', error);
      
      let errorMessage = 'Biometric authentication failed';
      
      // Handle specific error types
      if (error.message.includes('UserCancel')) {
        errorMessage = 'Authentication cancelled by user';
      } else if (error.message.includes('UserFallback')) {
        errorMessage = 'User chose fallback authentication';
      } else if (error.message.includes('SystemCancel')) {
        errorMessage = 'Authentication cancelled by system';
      } else if (error.message.includes('TouchIDNotAvailable')) {
        errorMessage = 'Touch ID not available';
      } else if (error.message.includes('TouchIDNotEnrolled')) {
        errorMessage = 'No fingerprints enrolled';
      } else if (error.message.includes('TouchIDLockout')) {
        errorMessage = 'Touch ID locked due to too many attempts';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Enroll biometric authentication
   */
  async enroll(): Promise<BiometricResult> {
    try {
      const capabilities = await this.getCapabilities();
      if (!capabilities.isSupported) {
        return {
          success: false,
          error: 'Biometric authentication not supported on this device',
        };
      }

      // Check if keys already exist
      const {keysExist} = await this.rnBiometrics.biometricKeysExist();
      
      if (keysExist) {
        // Delete existing keys first
        await this.rnBiometrics.deleteKeys();
      }

      // Create new biometric keys
      const {available} = await this.rnBiometrics.isSensorAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric sensor not available',
        };
      }

      // Create keys
      const {publicKey} = await this.rnBiometrics.createKeys();
      
      // Store enrollment data
      await EncryptedStorage.setItem('biometric_enrolled', JSON.stringify({
        enrolled: true,
        enrolledAt: new Date().toISOString(),
        publicKey,
      }));

      return {
        success: true,
      };
    } catch (error: any) {
      console.warn('Biometric enrollment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to enroll biometric authentication',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disable(): Promise<BiometricResult> {
    try {
      // Delete biometric keys
      await this.rnBiometrics.deleteKeys();
      
      // Clear enrollment data
      await EncryptedStorage.removeItem('biometric_enrolled');
      await EncryptedStorage.removeItem('biometric_last_auth');

      return {
        success: true,
      };
    } catch (error: any) {
      console.warn('Error disabling biometrics:', error);
      return {
        success: false,
        error: error.message || 'Failed to disable biometric authentication',
      };
    }
  }

  /**
   * Check if biometric authentication is enrolled and enabled
   */
  async isEnrolled(): Promise<boolean> {
    try {
      const {keysExist} = await this.rnBiometrics.biometricKeysExist();
      const enrollmentData = await EncryptedStorage.getItem('biometric_enrolled');
      
      return keysExist && !!enrollmentData;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get last successful authentication timestamp
   */
  async getLastAuthTime(): Promise<string | null> {
    try {
      const lastAuth = await EncryptedStorage.getItem('biometric_last_auth');
      return lastAuth ? JSON.parse(lastAuth).timestamp : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if re-authentication is required
   */
  async isReAuthRequired(maxAgeMinutes = 5): Promise<boolean> {
    try {
      const lastAuth = await this.getLastAuthTime();
      if (!lastAuth) {
        return true;
      }

      const lastAuthTime = new Date(lastAuth).getTime();
      const now = Date.now();
      const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

      return (now - lastAuthTime) > maxAge;
    } catch (error) {
      return true;
    }
  }

  /**
   * Authenticate for wallet operations
   */
  async authenticateForWallet(): Promise<BiometricResult> {
    const reason = 'Authenticate to access your wallet';
    return await this.authenticate(reason);
  }

  /**
   * Authenticate for transactions
   */
  async authenticateForTransaction(): Promise<BiometricResult> {
    const reason = 'Authenticate to authorize this transaction';
    return await this.authenticate(reason);
  }

  /**
   * Authenticate for sensitive operations
   */
  async authenticateForSensitiveOperation(operation: string): Promise<BiometricResult> {
    const reason = `Authenticate to ${operation}`;
    return await this.authenticate(reason);
  }

  // Private helper methods

  private async setupBiometricKeys(): Promise<void> {
    try {
      const {keysExist} = await this.rnBiometrics.biometricKeysExist();
      if (!keysExist) {
        // Check if user has previously enrolled
        const enrollmentData = await EncryptedStorage.getItem('biometric_enrolled');
        if (enrollmentData) {
          // Re-create keys if enrollment data exists but keys don't
          await this.rnBiometrics.createKeys();
        }
      }
    } catch (error) {
      console.warn('Error setting up biometric keys:', error);
    }
  }

  private getDefaultPromptMessage(biometryType: string): string {
    switch (biometryType) {
      case 'TouchID':
        return 'Use Touch ID to authenticate';
      case 'FaceID':
        return 'Use Face ID to authenticate';
      case 'Fingerprint':
        return 'Use your fingerprint to authenticate';
      default:
        return 'Use biometric authentication';
    }
  }

  private generateAuthPayload(): string {
    // Generate a unique payload for each authentication
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `mlg-auth-${timestamp}-${random}`;
  }

  private async recordSuccessfulAuth(): Promise<void> {
    try {
      await EncryptedStorage.setItem('biometric_last_auth', JSON.stringify({
        timestamp: new Date().toISOString(),
        success: true,
      }));
    } catch (error) {
      console.warn('Failed to record authentication:', error);
    }
  }

  /**
   * Show biometric setup prompt
   */
  async promptForSetup(): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    
    if (!capabilities.isSupported) {
      Alert.alert(
        'Biometric Authentication',
        'Biometric authentication is not supported on this device.',
        [{text: 'OK'}]
      );
      return false;
    }

    return new Promise((resolve) => {
      const biometricTypeName = this.getBiometricTypeName(capabilities.biometryType);
      
      Alert.alert(
        'Enable Biometric Authentication',
        `Would you like to enable ${biometricTypeName} for secure and convenient access to your wallet?`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            onPress: async () => {
              const result = await this.enroll();
              resolve(result.success);
            },
          },
        ]
      );
    });
  }

  private getBiometricTypeName(biometryType: string): string {
    switch (biometryType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric authentication';
    }
  }
}

export const BiometricService = new BiometricServiceClass();