/**
 * Mobile Wallet Service with Native Integration
 * Provides secure wallet connectivity with biometric authentication
 */

import {Linking, Alert} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {Connection, PublicKey, Transaction} from '@solana/web3.js';
import {BiometricService} from './BiometricService';
import {WalletProvider, Wallet, Transaction as AppTransaction} from '@/types';

interface WalletConnection {
  provider: WalletProvider;
  publicKey: string;
  isConnected: boolean;
}

class WalletServiceClass {
  private connection: Connection;
  private currentWallet: WalletConnection | null = null;
  private deepLinkCallbacks: Map<string, (result: any) => void> = new Map();

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.setupDeepLinkListener();
  }

  /**
   * Initialize wallet service
   */
  async initialize(): Promise<void> {
    try {
      // Try to restore previous wallet connection
      const savedWallet = await this.getSavedWallet();
      if (savedWallet) {
        await this.validateSavedConnection(savedWallet);
      }
    } catch (error) {
      console.warn('Failed to restore wallet connection:', error);
    }
  }

  /**
   * Connect to wallet with biometric authentication
   */
  async connect(provider: WalletProvider): Promise<Wallet> {
    try {
      // Check biometric authentication first
      const biometricResult = await BiometricService.authenticate();
      if (!biometricResult.success) {
        throw new Error('Biometric authentication required for wallet access');
      }

      switch (provider) {
        case 'phantom':
          return await this.connectPhantom();
        case 'solflare':
          return await this.connectSolflare();
        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }
    } catch (error: any) {
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  /**
   * Connect to Phantom wallet
   */
  private async connectPhantom(): Promise<Wallet> {
    const dappKeyPair = await this.getOrCreateDappKeyPair();
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappKeyPair.publicKey,
      cluster: 'mainnet-beta',
      app_url: 'https://mlg.clan',
      redirect_link: 'mlgclan://wallet-response',
    });

    const connectUrl = `https://phantom.app/ul/connect?${params.toString()}`;
    
    return new Promise((resolve, reject) => {
      const callbackId = Date.now().toString();
      this.deepLinkCallbacks.set(callbackId, (result) => {
        if (result.errorCode) {
          reject(new Error(result.errorMessage || 'Connection failed'));
        } else {
          this.handlePhantomConnection(result).then(resolve).catch(reject);
        }
      });

      // Set timeout for connection attempt
      setTimeout(() => {
        if (this.deepLinkCallbacks.has(callbackId)) {
          this.deepLinkCallbacks.delete(callbackId);
          reject(new Error('Connection timeout'));
        }
      }, 60000); // 60 second timeout

      Linking.openURL(connectUrl).catch((error) => {
        this.deepLinkCallbacks.delete(callbackId);
        reject(new Error(`Failed to open Phantom app: ${error.message}`));
      });
    });
  }

  /**
   * Connect to Solflare wallet
   */
  private async connectSolflare(): Promise<Wallet> {
    const params = new URLSearchParams({
      cluster: 'mainnet-beta',
      redirect_link: 'mlgclan://wallet-response',
    });

    const connectUrl = `https://solflare.com/ul/connect?${params.toString()}`;
    
    return new Promise((resolve, reject) => {
      const callbackId = Date.now().toString();
      this.deepLinkCallbacks.set(callbackId, (result) => {
        if (result.errorCode) {
          reject(new Error(result.errorMessage || 'Connection failed'));
        } else {
          this.handleSolflareConnection(result).then(resolve).catch(reject);
        }
      });

      setTimeout(() => {
        if (this.deepLinkCallbacks.has(callbackId)) {
          this.deepLinkCallbacks.delete(callbackId);
          reject(new Error('Connection timeout'));
        }
      }, 60000);

      Linking.openURL(connectUrl).catch((error) => {
        this.deepLinkCallbacks.delete(callbackId);
        reject(new Error(`Failed to open Solflare app: ${error.message}`));
      });
    });
  }

  /**
   * Handle Phantom wallet connection response
   */
  private async handlePhantomConnection(result: any): Promise<Wallet> {
    const publicKey = new PublicKey(result.public_key);
    const balance = await this.connection.getBalance(publicKey);
    const tokens = await this.getTokenAccounts(publicKey.toString());

    const wallet: Wallet = {
      address: publicKey.toString(),
      balance: balance / 1e9, // Convert lamports to SOL
      tokens,
      transactions: [],
      isConnected: true,
      provider: 'phantom',
    };

    this.currentWallet = {
      provider: 'phantom',
      publicKey: publicKey.toString(),
      isConnected: true,
    };

    // Save connection securely
    await this.saveWalletConnection(this.currentWallet, result);
    
    return wallet;
  }

  /**
   * Handle Solflare wallet connection response
   */
  private async handleSolflareConnection(result: any): Promise<Wallet> {
    const publicKey = new PublicKey(result.public_key);
    const balance = await this.connection.getBalance(publicKey);
    const tokens = await this.getTokenAccounts(publicKey.toString());

    const wallet: Wallet = {
      address: publicKey.toString(),
      balance: balance / 1e9,
      tokens,
      transactions: [],
      isConnected: true,
      provider: 'solflare',
    };

    this.currentWallet = {
      provider: 'solflare',
      publicKey: publicKey.toString(),
      isConnected: true,
    };

    await this.saveWalletConnection(this.currentWallet, result);
    
    return wallet;
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    try {
      // Clear saved connection
      await EncryptedStorage.removeItem('wallet_connection');
      await EncryptedStorage.removeItem('wallet_session');
      
      this.currentWallet = null;
    } catch (error) {
      console.warn('Error during disconnect:', error);
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get token accounts
   */
  async getTokens(address: string): Promise<any[]> {
    try {
      const publicKey = new PublicKey(address);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      return tokenAccounts.value.map((account) => {
        const tokenInfo = account.account.data.parsed.info;
        return {
          mint: tokenInfo.mint,
          balance: tokenInfo.tokenAmount.uiAmount,
          decimals: tokenInfo.tokenAmount.decimals,
        };
      });
    } catch (error: any) {
      console.warn('Failed to get tokens:', error);
      return [];
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(params: {
    from: string;
    to: string;
    amount: number;
    token?: string;
    memo?: string;
  }): Promise<AppTransaction> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    // Require biometric authentication for transactions
    const biometricResult = await BiometricService.authenticate();
    if (!biometricResult.success) {
      throw new Error('Biometric authentication required for transactions');
    }

    try {
      const transaction = new Transaction();
      // Add transfer instruction based on token type
      // Implementation would depend on specific token transfer logic
      
      // Sign and send through wallet app
      const signature = await this.signAndSendTransaction(transaction);
      
      const appTransaction: AppTransaction = {
        id: signature,
        type: 'transfer',
        amount: params.amount,
        token: params.token || 'SOL',
        to: params.to,
        from: params.from,
        status: 'pending',
        signature,
        createdAt: new Date().toISOString(),
      };

      return appTransaction;
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    const biometricResult = await BiometricService.authenticate();
    if (!biometricResult.success) {
      throw new Error('Biometric authentication required for message signing');
    }

    return new Promise((resolve, reject) => {
      const callbackId = Date.now().toString();
      this.deepLinkCallbacks.set(callbackId, (result) => {
        if (result.errorCode) {
          reject(new Error(result.errorMessage || 'Message signing failed'));
        } else {
          resolve(result.signature);
        }
      });

      const signUrl = this.buildSignMessageUrl(message);
      
      setTimeout(() => {
        if (this.deepLinkCallbacks.has(callbackId)) {
          this.deepLinkCallbacks.delete(callbackId);
          reject(new Error('Signing timeout'));
        }
      }, 60000);

      Linking.openURL(signUrl).catch((error) => {
        this.deepLinkCallbacks.delete(callbackId);
        reject(new Error(`Failed to open wallet app: ${error.message}`));
      });
    });
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(address: string): Promise<AppTransaction[]> {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit: 50,
      });

      const transactions: AppTransaction[] = [];
      
      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature);
        if (tx) {
          // Parse transaction details
          const appTx: AppTransaction = {
            id: sig.signature,
            type: 'transfer', // Would need to parse actual type
            amount: 0, // Would need to parse actual amount
            token: 'SOL',
            status: tx.meta?.err ? 'failed' : 'confirmed',
            signature: sig.signature,
            blockTime: sig.blockTime ? sig.blockTime * 1000 : undefined,
            fee: tx.meta?.fee ? tx.meta.fee / 1e9 : undefined,
            createdAt: new Date(sig.blockTime ? sig.blockTime * 1000 : Date.now()).toISOString(),
          };
          transactions.push(appTx);
        }
      }

      return transactions;
    } catch (error: any) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(params: {
    from: string;
    to: string;
    amount: number;
    token?: string;
  }): Promise<number> {
    try {
      // Create a dummy transaction to estimate fee
      const transaction = new Transaction();
      // Add transfer instruction
      
      const {feeCalculator} = await this.connection.getRecentBlockhash();
      return feeCalculator.lamportsPerSignature / 1e9; // Convert to SOL
    } catch (error: any) {
      throw new Error(`Failed to estimate fee: ${error.message}`);
    }
  }

  // Private helper methods

  private async getOrCreateDappKeyPair() {
    // Implementation for creating/retrieving dapp key pair
    return {
      publicKey: 'dummy_public_key',
      privateKey: 'dummy_private_key',
    };
  }

  private async saveWalletConnection(wallet: WalletConnection, sessionData: any) {
    try {
      await EncryptedStorage.setItem('wallet_connection', JSON.stringify(wallet));
      await EncryptedStorage.setItem('wallet_session', JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save wallet connection:', error);
    }
  }

  private async getSavedWallet(): Promise<WalletConnection | null> {
    try {
      const saved = await EncryptedStorage.getItem('wallet_connection');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  private async validateSavedConnection(wallet: WalletConnection): Promise<void> {
    // Validate that the saved connection is still valid
    try {
      const publicKey = new PublicKey(wallet.publicKey);
      await this.connection.getBalance(publicKey);
      this.currentWallet = wallet;
    } catch (error) {
      // Clear invalid connection
      await this.disconnect();
    }
  }

  private setupDeepLinkListener() {
    Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });
  }

  private handleDeepLink(url: string) {
    try {
      const parsed = new URL(url);
      const params = Object.fromEntries(parsed.searchParams);
      
      // Find matching callback and execute it
      for (const [id, callback] of this.deepLinkCallbacks) {
        callback(params);
        this.deepLinkCallbacks.delete(id);
        break; // Handle first matching callback
      }
    } catch (error) {
      console.warn('Failed to handle deep link:', error);
    }
  }

  private buildSignMessageUrl(message: string): string {
    const params = new URLSearchParams({
      message: Buffer.from(message).toString('base64'),
      redirect_link: 'mlgclan://wallet-response',
    });

    return `https://phantom.app/ul/signMessage?${params.toString()}`;
  }

  private async signAndSendTransaction(transaction: Transaction): Promise<string> {
    // Implementation for signing and sending transaction through wallet
    return 'dummy_signature';
  }
}

export const WalletService = new WalletServiceClass();