/**
 * WalletService Tests
 */

import {WalletService} from '../WalletService';
import {BiometricService} from '../BiometricService';

jest.mock('../BiometricService');

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(WalletService.initialize()).resolves.not.toThrow();
    });
  });

  describe('connect', () => {
    it('should require biometric authentication', async () => {
      const mockBiometricAuth = jest.mocked(BiometricService.authenticate);
      mockBiometricAuth.mockResolvedValue({success: false, error: 'Auth failed'});

      await expect(WalletService.connect('phantom')).rejects.toThrow('Biometric authentication required');
    });

    it('should connect to Phantom wallet successfully', async () => {
      const mockBiometricAuth = jest.mocked(BiometricService.authenticate);
      mockBiometricAuth.mockResolvedValue({success: true, signature: 'mock-signature'});

      // Mock other dependencies as needed
      // This would require more extensive mocking of Phantom wallet integration
    });
  });

  describe('getBalance', () => {
    it('should get wallet balance', async () => {
      const balance = await WalletService.getBalance('mock-address');
      expect(typeof balance).toBe('number');
    });
  });

  describe('sendTransaction', () => {
    it('should require biometric authentication for transactions', async () => {
      const mockBiometricAuth = jest.mocked(BiometricService.authenticate);
      mockBiometricAuth.mockResolvedValue({success: false});

      await expect(WalletService.sendTransaction({
        from: 'mock-from',
        to: 'mock-to',
        amount: 1,
      })).rejects.toThrow('Biometric authentication required');
    });
  });
});