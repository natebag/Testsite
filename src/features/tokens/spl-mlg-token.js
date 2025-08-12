/**
 * SPL MLG Token Management System
 * 
 * Handles interaction with the real MLG SPL token on Solana blockchain
 * including balance fetching, token account management, and burn transactions
 */

import { 
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createBurnInstruction,
  getAccount,
  getMint
} from '@solana/spl-token';
import { createConnection, createMLGTokenConnection, CURRENT_NETWORK, CONNECTION_CONFIG, MLG_TOKEN_CONFIG as CONFIG_MLG, TOKEN_PROGRAMS } from '../../../config/environment/solana-config.js';

/**
 * MLG Token Configuration
 * 
 * Real MLG SPL Token deployed on Solana mainnet-beta
 * Mint Address: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 */
export const MLG_TOKEN_CONFIG = {
  // Real MLG token mint address on Solana mainnet
  MINT_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  
  // Token metadata for discovery
  TOKEN_SYMBOL: 'MLG',
  TOKEN_NAME: 'MLG Gaming Token',
  
  // Expected token decimals (common values: 6, 8, 9)
  EXPECTED_DECIMALS: 9,
  
  // Token program addresses
  TOKEN_PROGRAM_ID: TOKEN_PROGRAM_ID.toString(),
  ASSOCIATED_TOKEN_PROGRAM_ID: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
  
  // Burn transaction configuration
  BURN_CONFIG: {
    MAX_RETRIES: 3,
    CONFIRMATION_TIMEOUT: 30000,
    PREFLIGHT_COMMITMENT: 'confirmed',
    COMMITMENT: 'confirmed'
  }
};

/**
 * Real-time Balance Configuration
 */
const BALANCE_CONFIG = {
  // Polling intervals
  DEFAULT_POLL_INTERVAL: 5000, // 5 seconds
  FAST_POLL_INTERVAL: 2000, // 2 seconds for active users
  SLOW_POLL_INTERVAL: 15000, // 15 seconds for inactive users
  
  // Cache settings
  CACHE_DURATION: 3000, // 3 seconds cache
  MAX_CACHE_ENTRIES: 100,
  
  // Batch processing
  BATCH_SIZE: 10,
  BATCH_TIMEOUT: 1000,
  
  // Error handling
  MAX_POLLING_ERRORS: 5,
  ERROR_BACKOFF_MULTIPLIER: 2,
  MIN_ERROR_BACKOFF: 1000,
  MAX_ERROR_BACKOFF: 30000
};

/**
 * Balance Validation Configuration
 */
const VALIDATION_CONFIG = {
  // Balance thresholds
  MLG_WARNING_THRESHOLD: 10, // Warn when MLG balance below 10 tokens
  MLG_CRITICAL_THRESHOLD: 2, // Critical warning when below 2 tokens
  SOL_WARNING_THRESHOLD: 0.01, // Warn when SOL balance below 0.01 SOL
  SOL_CRITICAL_THRESHOLD: 0.005, // Critical warning when below 0.005 SOL
  
  // Fee estimation settings
  DYNAMIC_FEE_ESTIMATION: true,
  FEE_CACHE_DURATION: 10000, // 10 seconds cache for fees
  NETWORK_CONGESTION_MULTIPLIER: 1.5, // Fee multiplier during congestion
  MAX_FEE_RETRIES: 3,
  FEE_SIMULATION_TIMEOUT: 5000, // 5 second timeout for fee simulation
  
  // Pre-transaction validation
  REQUIRE_BALANCE_CHECK: true,
  REQUIRE_FEE_ESTIMATION: true,
  REQUIRE_SIMULATION: true,
  VALIDATION_TIMEOUT: 10000, // 10 second timeout for validation
  
  // Error messages
  ERROR_MESSAGES: {
    INSUFFICIENT_MLG: 'Insufficient MLG tokens for this transaction',
    INSUFFICIENT_SOL: 'Insufficient SOL for transaction fees',
    NO_TOKEN_ACCOUNT: 'No MLG token account found',
    SIMULATION_FAILED: 'Transaction simulation failed',
    FEE_ESTIMATION_FAILED: 'Unable to estimate transaction fees',
    NETWORK_ERROR: 'Network error during validation',
    TIMEOUT_ERROR: 'Validation timeout - please try again'
  }
};

/**
 * Associated Token Account Creation Configuration
 * Handles automatic account creation for new MLG token users
 */
const ACCOUNT_CREATION_CONFIG = {
  // Detection and validation settings
  AUTO_DETECT_MISSING_ACCOUNTS: true,
  ACCOUNT_EXISTENCE_CACHE_DURATION: 30000, // 30 seconds cache
  VALIDATE_BEFORE_CREATION: true,
  
  // Creation process settings
  MAX_CREATION_RETRIES: 3,
  CREATION_TIMEOUT: 45000, // 45 second timeout
  RETRY_DELAY_BASE: 2000, // 2 second base delay
  RETRY_DELAY_MULTIPLIER: 2, // Exponential backoff
  
  // Fee estimation and safety
  REQUIRE_FEE_CONSENT: true,
  FEE_BUFFER_MULTIPLIER: 1.2, // 20% buffer for account creation fees
  MIN_SOL_AFTER_CREATION: 0.005, // Minimum SOL to keep after creation
  
  // UI/UX settings
  SHOW_PROGRESS_INDICATORS: true,
  CONFIRM_BEFORE_CREATION: true,
  DISPLAY_FEE_BREAKDOWN: true,
  ENABLE_CREATION_NOTIFICATIONS: true,
  
  // Safety and security
  SIMULATE_BEFORE_CREATION: true,
  VERIFY_AFTER_CREATION: true,
  CREATION_AUDIT_LOGGING: true,
  
  ERROR_MESSAGES: {
    ACCOUNT_EXISTS: 'Associated token account already exists',
    CREATION_FAILED: 'Failed to create associated token account',
    INSUFFICIENT_SOL_FOR_CREATION: 'Insufficient SOL to create token account',
    CREATION_TIMEOUT: 'Token account creation timed out',
    VALIDATION_FAILED: 'Account creation validation failed',
    NETWORK_ERROR: 'Network error during account creation',
    USER_REJECTED: 'User rejected account creation',
    VERIFICATION_FAILED: 'Failed to verify created account'
  },
  
  SUCCESS_MESSAGES: {
    ACCOUNT_CREATED: 'MLG token account successfully created',
    ACCOUNT_VERIFIED: 'Token account verified and ready to use',
    POLLING_STARTED: 'Real-time balance tracking activated'
  }
};

/**
 * Transaction History Configuration
 */
const TRANSACTION_HISTORY_CONFIG = {
  // History settings
  DEFAULT_HISTORY_LIMIT: 50,
  MAX_HISTORY_LIMIT: 100,
  CACHE_DURATION: 30000, // 30 seconds cache
  
  // Real-time monitoring
  SIGNATURE_POLL_INTERVAL: 3000, // 3 seconds for signature status checks
  MAX_PENDING_DURATION: 60000, // 1 minute max for pending transactions
  
  // Storage settings
  STORAGE_KEY: 'mlg_transaction_history',
  MAX_STORED_TRANSACTIONS: 200,
  HISTORY_RETENTION_DAYS: 30,
  
  // Transaction parsing
  PARSE_INSTRUCTION_DATA: true,
  INCLUDE_FAILED_TRANSACTIONS: true,
  INCLUDE_META_DATA: true,
  
  // Categorization
  AUTO_CATEGORIZE: true,
  BURN_SIGNATURES: ['burn', 'burnChecked'],
  TRANSFER_SIGNATURES: ['transfer', 'transferChecked'],
  
  // Display formatting
  DATE_FORMAT: 'relative', // 'relative' or 'absolute'
  AMOUNT_PRECISION: 4,
  SHOW_RAW_AMOUNTS: false
};

/**
 * Transaction Types and Categories
 */
const TRANSACTION_TYPES = {
  BURN_TO_VOTE: 'burn_to_vote',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  MINT: 'mint',
  REWARD: 'reward',
  UNKNOWN: 'unknown'
};

/**
 * Transaction Status Types
 */
const TRANSACTION_STATUS = {
  CONFIRMED: 'confirmed',
  FINALIZED: 'finalized',
  PENDING: 'pending',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
};

/**
 * Balance change event types
 */
const BALANCE_EVENTS = {
  BALANCE_UPDATED: 'balance_updated',
  BALANCE_ERROR: 'balance_error',
  ACCOUNT_CREATED: 'account_created',
  POLLING_STARTED: 'polling_started',
  POLLING_STOPPED: 'polling_stopped',
  CONNECTION_CHANGED: 'connection_changed'
};

/**
 * Account Creation Events
 * Comprehensive event system for token account creation process
 */
const ACCOUNT_CREATION_EVENTS = {
  // Detection events
  ACCOUNT_DETECTION_STARTED: 'account_detection_started',
  ACCOUNT_NOT_FOUND: 'account_not_found',
  ACCOUNT_EXISTS: 'account_exists',
  
  // Creation process events
  CREATION_REQUESTED: 'creation_requested',
  CREATION_CONSENT_REQUESTED: 'creation_consent_requested',
  CREATION_CONSENT_GIVEN: 'creation_consent_given',
  CREATION_CONSENT_REJECTED: 'creation_consent_rejected',
  
  // Pre-creation validation
  CREATION_VALIDATION_STARTED: 'creation_validation_started',
  CREATION_VALIDATION_SUCCESS: 'creation_validation_success',
  CREATION_VALIDATION_FAILED: 'creation_validation_failed',
  
  // Fee estimation
  FEE_ESTIMATION_STARTED: 'fee_estimation_started',
  FEE_ESTIMATION_COMPLETE: 'fee_estimation_complete',
  FEE_ESTIMATION_FAILED: 'fee_estimation_failed',
  
  // Transaction creation and submission
  TRANSACTION_BUILDING: 'transaction_building',
  TRANSACTION_BUILT: 'transaction_built',
  TRANSACTION_SIGNING: 'transaction_signing',
  TRANSACTION_SIGNED: 'transaction_signed',
  TRANSACTION_SUBMITTED: 'transaction_submitted',
  
  // Transaction confirmation
  CONFIRMATION_WAITING: 'confirmation_waiting',
  CONFIRMATION_RECEIVED: 'confirmation_received',
  CONFIRMATION_FAILED: 'confirmation_failed',
  
  // Post-creation verification
  VERIFICATION_STARTED: 'verification_started',
  VERIFICATION_SUCCESS: 'verification_success',
  VERIFICATION_FAILED: 'verification_failed',
  
  // Final states
  CREATION_SUCCESS: 'creation_success',
  CREATION_FAILED: 'creation_failed',
  
  // Error and retry events
  CREATION_RETRY: 'creation_retry',
  CREATION_TIMEOUT: 'creation_timeout',
  CREATION_CANCELLED: 'creation_cancelled'
};

/**
 * MLG Token Management Class
 * Handles all SPL token operations for the MLG token with real-time balance fetching
 */
export class MLGTokenManager {
  constructor(connection = null) {
    // Use optimized MLG token connection with enhanced settings
    this.connection = connection || createMLGTokenConnection(CURRENT_NETWORK);
    this.mintPublicKey = null;
    this.mintInfo = null;
    this.isInitialized = false;
    
    // RPC connection optimization for MLG token queries
    this.connectionPool = [];
    this.currentConnectionIndex = 0;
    this.connectionHealth = new Map();
    this.lastHealthCheck = 0;
    this.HEALTH_CHECK_INTERVAL = 60000; // 1 minute
    
    // Real-time balance fetching properties
    this.balanceCache = new Map();
    this.pollingIntervals = new Map();
    this.balanceListeners = new Map();
    this.batchQueue = new Map();
    this.batchTimeout = null;
    this.pollingErrors = new Map();
    this.lastBalanceUpdate = new Map();
    
    // Event system for balance changes
    this.eventListeners = new Map();
    
    // Wallet connection state
    this.connectedWallets = new Set();
    this.activeWallets = new Set();
    
    // Transaction history tracking
    this.transactionHistory = new Map(); // wallet -> transaction array
    this.transactionCache = new Map(); // signature -> parsed transaction
    this.pendingTransactions = new Map(); // signature -> monitoring data
    this.transactionFilters = new Map(); // wallet -> filter settings
    this.lastHistoryUpdate = new Map(); // wallet -> timestamp
    this.transactionEventListeners = new Map(); // event type -> listeners
    
    // Associated Token Account Creation tracking
    this.accountExistenceCache = new Map(); // wallet -> { exists: boolean, timestamp: number, address: string }
    this.accountCreationQueue = new Map(); // wallet -> creation process data
    this.accountCreationListeners = new Map(); // event type -> listeners
    this.creationFeeEstimates = new Map(); // wallet -> fee estimation cache
    this.accountVerificationCache = new Map(); // wallet -> verification results
    
    this._initializeConnectionPool();
    this._initializeBalanceSystem();
  }

  /**
   * Initialize the token manager with mint address validation
   * @param {string} mintAddress - The MLG token mint address
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(mintAddress = MLG_TOKEN_CONFIG.MINT_ADDRESS) {
    try {
      // Validate that we have a real mint address
      if (!mintAddress || mintAddress === 'MLGtokenMintAddressToBeDeployedLater') {
        throw new Error('MLG Token Manager: Invalid or missing mint address. Expected: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
      }

      // Validate and set mint address
      this.mintPublicKey = new PublicKey(mintAddress);
      
      // Fetch and validate mint information
      this.mintInfo = await getMint(
        this.connection,
        this.mintPublicKey,
        CONNECTION_CONFIG.commitment
      );

      // Validate token properties
      await this._validateTokenProperties();
      
      this.isInitialized = true;
      console.log('MLG Token Manager initialized successfully');
      console.log('Mint Address:', mintAddress);
      console.log('Decimals:', this.mintInfo.decimals);
      console.log('Supply:', this.mintInfo.supply.toString());
      
      return true;
    } catch (error) {
      console.error('Failed to initialize MLG Token Manager:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Discover MLG token by searching token metadata
   * @returns {Promise<string|null>} - Found mint address or null
   */
  async discoverMLGToken() {
    try {
      console.log('Searching for MLG token on Solana...');
      
      // Note: This is a basic discovery mechanism
      // In production, you would typically use token metadata programs
      // or token lists to find tokens by name/symbol
      
      const tokenListUrls = [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
      ];

      for (const url of tokenListUrls) {
        try {
          const response = await fetch(url);
          const tokenList = await response.json();
          
          const mlgToken = tokenList.tokens.find(token => 
            token.symbol === MLG_TOKEN_CONFIG.TOKEN_SYMBOL ||
            token.name.toLowerCase().includes('mlg')
          );

          if (mlgToken) {
            console.log('Found MLG token:', mlgToken);
            return mlgToken.address;
          }
        } catch (error) {
          console.warn('Failed to search token list:', url, error);
        }
      }

      console.log('MLG token not found in standard token lists');
      return null;
    } catch (error) {
      console.error('Token discovery failed:', error);
      return null;
    }
  }

  /**
   * Get user's MLG token balance
   * @param {string} walletAddress - User's wallet public key
   * @returns {Promise<{balance: number, raw: string, hasAccount: boolean}>}
   */
  async getTokenBalance(walletAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized. Call initialize() first.');
      }

      const walletPublicKey = new PublicKey(walletAddress);
      
      // Get associated token account address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.mintPublicKey,
        walletPublicKey
      );

      try {
        // Get token account info
        const tokenAccount = await getAccount(
          this.connection,
          associatedTokenAddress,
          CONNECTION_CONFIG.commitment
        );

        const rawBalance = tokenAccount.amount.toString();
        const balance = Number(rawBalance) / Math.pow(10, this.mintInfo.decimals);

        return {
          balance,
          raw: rawBalance,
          hasAccount: true,
          associatedTokenAddress: associatedTokenAddress.toString()
        };
      } catch (error) {
        // Account doesn't exist
        if (error.name === 'TokenAccountNotFoundError') {
          return {
            balance: 0,
            raw: '0',
            hasAccount: false,
            associatedTokenAddress: associatedTokenAddress.toString()
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to get token balance:', error);
      throw new Error(`Token balance fetch failed: ${error.message}`);
    }
  }

  /**
   * Create associated token account for user if it doesn't exist
   * @param {string} walletAddress - User's wallet public key
   * @param {Object} wallet - Wallet adapter instance
   * @returns {Promise<string>} - Transaction signature
   * @deprecated Use createAssociatedTokenAccountComprehensive for full feature support
   */
  async createAssociatedTokenAccount(walletAddress, wallet) {
    // Legacy wrapper - delegate to comprehensive method with basic options
    return await this.createAssociatedTokenAccountComprehensive(walletAddress, wallet, {
      showProgress: false,
      requireConfirmation: false,
      enableNotifications: false
    });
  }

  /**
   * Comprehensive Associated Token Account Creation for New MLG Token Users
   * Handles detection, validation, creation, and verification with full UX support
   * 
   * @param {string} walletAddress - User's wallet public key
   * @param {Object} wallet - Wallet adapter instance  
   * @param {Object} options - Creation options and UX settings
   * @returns {Promise<{success: boolean, signature?: string, account?: string, error?: string}>}
   */
  async createAssociatedTokenAccountComprehensive(walletAddress, wallet, options = {}) {
    const {
      // UX and progress options
      showProgress = ACCOUNT_CREATION_CONFIG.SHOW_PROGRESS_INDICATORS,
      requireConfirmation = ACCOUNT_CREATION_CONFIG.CONFIRM_BEFORE_CREATION,
      enableNotifications = ACCOUNT_CREATION_CONFIG.ENABLE_CREATION_NOTIFICATIONS,
      displayFeeBreakdown = ACCOUNT_CREATION_CONFIG.DISPLAY_FEE_BREAKDOWN,
      
      // Technical options
      simulateBeforeCreation = ACCOUNT_CREATION_CONFIG.SIMULATE_BEFORE_CREATION,
      verifyAfterCreation = ACCOUNT_CREATION_CONFIG.VERIFY_AFTER_CREATION,
      maxRetries = ACCOUNT_CREATION_CONFIG.MAX_CREATION_RETRIES,
      timeoutMs = ACCOUNT_CREATION_CONFIG.CREATION_TIMEOUT,
      
      // Event handlers for UI integration
      onProgress = null, // (step, message, data) => void
      onConfirmationNeeded = null, // (feeInfo) => Promise<boolean>
      onSuccess = null, // (result) => void
      onError = null // (error) => void
    } = options;

    // Initialize tracking
    const creationId = `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized');
      }

      // Step 1: Account Detection
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.ACCOUNT_DETECTION_STARTED, {
        walletAddress,
        creationId,
        timestamp: Date.now()
      });

      if (showProgress && onProgress) {
        onProgress('detection', 'Checking for existing token account...', { step: 1, total: 8 });
      }

      const accountExists = await this.detectAssociatedTokenAccount(walletAddress, { useCache: true });
      
      if (accountExists.exists) {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.ACCOUNT_EXISTS, {
          walletAddress,
          associatedTokenAddress: accountExists.address,
          creationId
        });
        
        return {
          success: true,
          alreadyExists: true,
          account: accountExists.address,
          message: ACCOUNT_CREATION_CONFIG.ERROR_MESSAGES.ACCOUNT_EXISTS
        };
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.ACCOUNT_NOT_FOUND, {
        walletAddress,
        associatedTokenAddress: accountExists.address,
        creationId
      });

      // Step 2: Pre-Creation Validation
      if (showProgress && onProgress) {
        onProgress('validation', 'Validating account creation requirements...', { step: 2, total: 8 });
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_VALIDATION_STARTED, {
        walletAddress,
        creationId
      });

      const validation = await this.validateAccountCreation(walletAddress);
      if (!validation.isValid) {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_VALIDATION_FAILED, {
          walletAddress,
          errors: validation.errors,
          creationId
        });

        const error = new Error(`Account creation validation failed: ${validation.errors.join(', ')}`);
        if (onError) onError(error);
        return {
          success: false,
          error: error.message,
          validationErrors: validation.errors
        };
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_VALIDATION_SUCCESS, {
        walletAddress,
        validation,
        creationId
      });

      // Step 3: Fee Estimation
      if (showProgress && onProgress) {
        onProgress('fees', 'Estimating transaction fees...', { step: 3, total: 8 });
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.FEE_ESTIMATION_STARTED, {
        walletAddress,
        creationId
      });

      const feeEstimation = await this.estimateAccountCreationFee(walletAddress, {
        includeBuffer: true,
        checkAffordability: true
      });

      if (!feeEstimation.canAfford) {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.FEE_ESTIMATION_FAILED, {
          walletAddress,
          error: ACCOUNT_CREATION_CONFIG.ERROR_MESSAGES.INSUFFICIENT_SOL_FOR_CREATION,
          feeInfo: feeEstimation,
          creationId
        });

        const error = new Error(ACCOUNT_CREATION_CONFIG.ERROR_MESSAGES.INSUFFICIENT_SOL_FOR_CREATION);
        if (onError) onError(error);
        return {
          success: false,
          error: error.message,
          feeEstimation
        };
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.FEE_ESTIMATION_COMPLETE, {
        walletAddress,
        feeInfo: feeEstimation,
        creationId
      });

      // Step 4: User Confirmation (if required)
      if (requireConfirmation) {
        if (showProgress && onProgress) {
          onProgress('confirmation', 'Requesting user confirmation...', { step: 4, total: 8 });
        }

        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_CONSENT_REQUESTED, {
          walletAddress,
          feeInfo: feeEstimation,
          displayFeeBreakdown,
          creationId
        });

        let userApproved = false;
        if (onConfirmationNeeded) {
          userApproved = await onConfirmationNeeded(feeEstimation);
        } else {
          // Default confirmation logic - auto-approve if no handler provided
          userApproved = true;
        }

        if (!userApproved) {
          this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_CONSENT_REJECTED, {
            walletAddress,
            creationId
          });

          return {
            success: false,
            cancelled: true,
            error: ACCOUNT_CREATION_CONFIG.ERROR_MESSAGES.USER_REJECTED
          };
        }

        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_CONSENT_GIVEN, {
          walletAddress,
          creationId
        });
      }

      // Step 5: Transaction Building
      if (showProgress && onProgress) {
        onProgress('building', 'Building transaction...', { step: 5, total: 8 });
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.TRANSACTION_BUILDING, {
        walletAddress,
        creationId
      });

      const transactionResult = await this._buildAccountCreationTransaction(walletAddress, {
        simulate: simulateBeforeCreation,
        creationId
      });

      if (!transactionResult.success) {
        const error = new Error(`Transaction building failed: ${transactionResult.error}`);
        if (onError) onError(error);
        return {
          success: false,
          error: error.message,
          buildError: transactionResult.error
        };
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.TRANSACTION_BUILT, {
        walletAddress,
        transactionSize: transactionResult.transaction.serialize().length,
        creationId
      });

      // Step 6: Transaction Signing and Submission
      if (showProgress && onProgress) {
        onProgress('submitting', 'Signing and submitting transaction...', { step: 6, total: 8 });
      }

      const submissionResult = await this._submitAccountCreationTransaction(
        walletAddress, 
        wallet, 
        transactionResult.transaction, 
        { creationId, maxRetries, timeoutMs }
      );

      if (!submissionResult.success) {
        const error = new Error(`Transaction submission failed: ${submissionResult.error}`);
        if (onError) onError(error);
        return {
          success: false,
          error: error.message,
          submissionError: submissionResult.error
        };
      }

      // Step 7: Transaction Confirmation
      if (showProgress && onProgress) {
        onProgress('confirming', 'Waiting for transaction confirmation...', { step: 7, total: 8 });
      }

      const confirmationResult = await this._confirmAccountCreation(
        submissionResult.signature,
        { creationId, timeoutMs }
      );

      if (!confirmationResult.success) {
        const error = new Error(`Transaction confirmation failed: ${confirmationResult.error}`);
        if (onError) onError(error);
        return {
          success: false,
          error: error.message,
          signature: submissionResult.signature,
          confirmationError: confirmationResult.error
        };
      }

      // Step 8: Post-Creation Verification
      if (verifyAfterCreation) {
        if (showProgress && onProgress) {
          onProgress('verifying', 'Verifying account creation...', { step: 8, total: 8 });
        }

        const verificationResult = await this._verifyAccountCreation(walletAddress, {
          expectedSignature: submissionResult.signature,
          creationId
        });

        if (!verificationResult.success) {
          // Account was created but verification failed - still return success but with warning
          console.warn('Account created but verification failed:', verificationResult.error);
        }
      }

      // Success - Update caches and emit final events
      await this._updateAccountCaches(walletAddress, accountExists.address, true);
      
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_SUCCESS, {
        walletAddress,
        signature: submissionResult.signature,
        associatedTokenAddress: accountExists.address,
        duration: Date.now() - startTime,
        creationId
      });

      const result = {
        success: true,
        signature: submissionResult.signature,
        account: accountExists.address,
        duration: Date.now() - startTime,
        feeUsed: feeEstimation.totalFee,
        message: ACCOUNT_CREATION_CONFIG.SUCCESS_MESSAGES.ACCOUNT_CREATED
      };

      if (onSuccess) onSuccess(result);
      
      // Auto-start balance polling if configured
      setTimeout(() => {
        this.startBalancePolling(walletAddress, {
          pollInterval: BALANCE_CONFIG.DEFAULT_POLL_INTERVAL,
          emitEvents: true
        });
      }, 2000);

      return result;

    } catch (error) {
      console.error('Comprehensive account creation failed:', error);
      
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_FAILED, {
        walletAddress,
        error: error.message,
        duration: Date.now() - startTime,
        creationId
      });

      if (onError) onError(error);
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    } finally {
      // Cleanup creation queue
      this.accountCreationQueue.delete(walletAddress);
    }
  }

  /**
   * Detect if associated token account exists for a wallet
   * @param {string} walletAddress - Wallet address to check
   * @param {Object} options - Detection options  
   * @returns {Promise<{exists: boolean, address: string, timestamp: number}>}
   */
  async detectAssociatedTokenAccount(walletAddress, options = {}) {
    const { useCache = ACCOUNT_CREATION_CONFIG.AUTO_DETECT_MISSING_ACCOUNTS } = options;
    
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.mintPublicKey,
        walletPublicKey
      );

      // Check cache first if enabled
      if (useCache && this.accountExistenceCache.has(walletAddress)) {
        const cached = this.accountExistenceCache.get(walletAddress);
        const cacheAge = Date.now() - cached.timestamp;
        
        if (cacheAge < ACCOUNT_CREATION_CONFIG.ACCOUNT_EXISTENCE_CACHE_DURATION) {
          return {
            exists: cached.exists,
            address: cached.address,
            timestamp: cached.timestamp,
            fromCache: true
          };
        }
      }

      // Check account existence
      const accountInfo = await this.connection.getAccountInfo(associatedTokenAddress);
      const exists = accountInfo !== null;
      const timestamp = Date.now();

      const result = {
        exists,
        address: associatedTokenAddress.toString(),
        timestamp
      };

      // Update cache
      if (useCache) {
        this.accountExistenceCache.set(walletAddress, result);
      }

      return result;
    } catch (error) {
      console.error('Failed to detect associated token account:', error);
      throw error;
    }
  }

  /**
   * Validate account creation requirements
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<{isValid: boolean, errors: Array, warnings: Array}>}
   */
  async validateAccountCreation(walletAddress) {
    const validation = {
      isValid: false,
      errors: [],
      warnings: [],
      checks: {
        walletValid: false,
        solBalance: false,
        networkConnection: false,
        mintInitialized: false
      }
    };

    try {
      // Check wallet address validity
      try {
        new PublicKey(walletAddress);
        validation.checks.walletValid = true;
      } catch {
        validation.errors.push('Invalid wallet address format');
        return validation;
      }

      // Check if token manager is initialized
      if (!this.isInitialized) {
        validation.errors.push('Token manager not initialized');
        return validation;
      }
      validation.checks.mintInitialized = true;

      // Check network connection
      try {
        await this.connection.getSlot();
        validation.checks.networkConnection = true;
      } catch (error) {
        validation.errors.push(`Network connection failed: ${error.message}`);
        return validation;
      }

      // Check SOL balance for fees
      const solBalance = await this.connection.getBalance(new PublicKey(walletAddress));
      const minRequiredLamports = 2_500_000; // ~0.0025 SOL minimum for account creation
      
      if (solBalance < minRequiredLamports) {
        validation.errors.push(
          `Insufficient SOL balance. Required: ~0.0025 SOL, Available: ${(solBalance / 1_000_000_000).toFixed(9)} SOL`
        );
      } else {
        validation.checks.solBalance = true;
      }

      // Warning if balance is low but sufficient
      const warningThreshold = 5_000_000; // ~0.005 SOL
      if (solBalance >= minRequiredLamports && solBalance < warningThreshold) {
        validation.warnings.push(
          `SOL balance is low (${(solBalance / 1_000_000_000).toFixed(9)} SOL). Consider adding more SOL for future transactions.`
        );
      }

      validation.isValid = validation.errors.length === 0;
      return validation;

    } catch (error) {
      console.error('Account creation validation failed:', error);
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Estimate fees for account creation
   * @param {string} walletAddress - Wallet address
   * @param {Object} options - Estimation options
   * @returns {Promise<Object>} Fee estimation details
   */
  async estimateAccountCreationFee(walletAddress, options = {}) {
    const {
      includeBuffer = true,
      checkAffordability = true,
      cacheResult = true
    } = options;

    try {
      // Check cache first
      if (cacheResult && this.creationFeeEstimates.has(walletAddress)) {
        const cached = this.creationFeeEstimates.get(walletAddress);
        const cacheAge = Date.now() - cached.timestamp;
        
        if (cacheAge < VALIDATION_CONFIG.FEE_CACHE_DURATION) {
          return { ...cached, fromCache: true };
        }
      }

      const walletPublicKey = new PublicKey(walletAddress);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.mintPublicKey,
        walletPublicKey
      );

      // Build test transaction for fee estimation
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          walletPublicKey,
          associatedTokenAddress,
          walletPublicKey,
          this.mintPublicKey
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      // Estimate fees
      const feeEstimate = await this.connection.getFeeForMessage(transaction.compileMessage());
      let baseFee = feeEstimate.value || 5_000; // Default 5000 lamports if estimation fails

      // Add buffer if requested
      let totalFee = baseFee;
      if (includeBuffer) {
        const buffer = Math.ceil(baseFee * (ACCOUNT_CREATION_CONFIG.FEE_BUFFER_MULTIPLIER - 1));
        totalFee += buffer;
      }

      // Check affordability
      let canAfford = true;
      let currentBalance = 0;
      let remainingAfterCreation = 0;

      if (checkAffordability) {
        currentBalance = await this.connection.getBalance(walletPublicKey);
        remainingAfterCreation = currentBalance - totalFee;
        
        const minSolAfter = ACCOUNT_CREATION_CONFIG.MIN_SOL_AFTER_CREATION * 1_000_000_000;
        canAfford = remainingAfterCreation >= minSolAfter;
      }

      const estimation = {
        baseFee,
        totalFee,
        baseFeeSOL: baseFee / 1_000_000_000,
        totalFeeSOL: totalFee / 1_000_000_000,
        bufferAmount: totalFee - baseFee,
        bufferMultiplier: ACCOUNT_CREATION_CONFIG.FEE_BUFFER_MULTIPLIER,
        currentBalanceSOL: currentBalance / 1_000_000_000,
        remainingAfterCreationSOL: remainingAfterCreation / 1_000_000_000,
        canAfford,
        timestamp: Date.now()
      };

      // Cache result
      if (cacheResult) {
        this.creationFeeEstimates.set(walletAddress, estimation);
      }

      return estimation;

    } catch (error) {
      console.error('Failed to estimate account creation fee:', error);
      throw error;
    }
  }

  /**
   * Build account creation transaction
   * @private
   */
  async _buildAccountCreationTransaction(walletAddress, options = {}) {
    const { simulate = true, creationId } = options;
    
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.mintPublicKey,
        walletPublicKey
      );

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          walletPublicKey,
          associatedTokenAddress,
          walletPublicKey,
          this.mintPublicKey
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      // Simulate if requested
      if (simulate) {
        const simulation = await this.connection.simulateTransaction(transaction);
        if (simulation.value.err) {
          return {
            success: false,
            error: `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
            simulation: simulation.value
          };
        }
      }

      return {
        success: true,
        transaction,
        associatedTokenAddress: associatedTokenAddress.toString()
      };

    } catch (error) {
      console.error('Failed to build account creation transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit account creation transaction with retries
   * @private
   */
  async _submitAccountCreationTransaction(walletAddress, wallet, transaction, options = {}) {
    const { creationId, maxRetries = ACCOUNT_CREATION_CONFIG.MAX_CREATION_RETRIES, timeoutMs } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.TRANSACTION_SIGNING, {
          walletAddress,
          attempt,
          maxRetries,
          creationId
        });

        // Sign transaction
        const signedTransaction = await wallet.signTransaction(transaction);
        
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.TRANSACTION_SIGNED, {
          walletAddress,
          attempt,
          creationId
        });

        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.TRANSACTION_SUBMITTED, {
          walletAddress,
          attempt,
          creationId
        });

        // Send transaction
        const signature = await this.connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: CONNECTION_CONFIG.preflightCommitment,
            maxRetries: 0 // We handle retries ourselves
          }
        );

        return {
          success: true,
          signature,
          attempt
        };

      } catch (error) {
        console.warn(`Account creation attempt ${attempt}/${maxRetries} failed:`, error);
        lastError = error;

        if (attempt < maxRetries) {
          this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CREATION_RETRY, {
            walletAddress,
            attempt,
            maxRetries,
            error: error.message,
            creationId
          });

          // Exponential backoff delay
          const delay = ACCOUNT_CREATION_CONFIG.RETRY_DELAY_BASE * Math.pow(ACCOUNT_CREATION_CONFIG.RETRY_DELAY_MULTIPLIER, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError.message}`,
      lastError
    };
  }

  /**
   * Confirm account creation transaction
   * @private
   */
  async _confirmAccountCreation(signature, options = {}) {
    const { creationId, timeoutMs = ACCOUNT_CREATION_CONFIG.CREATION_TIMEOUT } = options;
    
    try {
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CONFIRMATION_WAITING, {
        signature,
        timeoutMs,
        creationId
      });

      const confirmation = await Promise.race([
        this.connection.confirmTransaction(signature, CONNECTION_CONFIG.commitment),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Confirmation timeout')), timeoutMs)
        )
      ]);

      if (confirmation.value.err) {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CONFIRMATION_FAILED, {
          signature,
          error: confirmation.value.err,
          creationId
        });

        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
          confirmation
        };
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CONFIRMATION_RECEIVED, {
        signature,
        slot: confirmation.context.slot,
        creationId
      });

      return {
        success: true,
        confirmation,
        slot: confirmation.context.slot
      };

    } catch (error) {
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.CONFIRMATION_FAILED, {
        signature,
        error: error.message,
        creationId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify account was created successfully
   * @private
   */
  async _verifyAccountCreation(walletAddress, options = {}) {
    const { expectedSignature, creationId, maxAttempts = 3 } = options;
    
    try {
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.VERIFICATION_STARTED, {
        walletAddress,
        expectedSignature,
        creationId
      });

      const walletPublicKey = new PublicKey(walletAddress);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.mintPublicKey,
        walletPublicKey
      );

      // Verify account exists with retries
      let accountInfo = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        accountInfo = await this.connection.getAccountInfo(associatedTokenAddress);
        
        if (accountInfo) {
          break;
        }
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }

      if (!accountInfo) {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.VERIFICATION_FAILED, {
          walletAddress,
          error: 'Account not found after creation',
          creationId
        });

        return {
          success: false,
          error: 'Account verification failed - account not found'
        };
      }

      // Additional verifications
      const isTokenAccount = accountInfo.owner.equals(TOKEN_PROGRAM_ID);
      if (!isTokenAccount) {
        this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.VERIFICATION_FAILED, {
          walletAddress,
          error: 'Account owner is not Token Program',
          creationId
        });

        return {
          success: false,
          error: 'Account verification failed - invalid account owner'
        };
      }

      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.VERIFICATION_SUCCESS, {
        walletAddress,
        associatedTokenAddress: associatedTokenAddress.toString(),
        accountData: {
          lamports: accountInfo.lamports,
          dataLength: accountInfo.data.length,
          owner: accountInfo.owner.toString()
        },
        creationId
      });

      return {
        success: true,
        accountInfo,
        associatedTokenAddress: associatedTokenAddress.toString()
      };

    } catch (error) {
      console.error('Account verification failed:', error);
      
      this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.VERIFICATION_FAILED, {
        walletAddress,
        error: error.message,
        creationId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update account existence caches after creation
   * @private
   */
  async _updateAccountCaches(walletAddress, associatedTokenAddress, exists) {
    try {
      const timestamp = Date.now();
      
      // Update existence cache
      this.accountExistenceCache.set(walletAddress, {
        exists,
        address: associatedTokenAddress,
        timestamp
      });

      // Clear verification cache to force fresh verification
      this.accountVerificationCache.delete(walletAddress);

      // Clear fee estimation cache to get fresh estimates
      this.creationFeeEstimates.delete(walletAddress);

      // Update balance cache if account was created
      if (exists) {
        this.balanceCache.delete(walletAddress); // Force fresh balance fetch
        this.lastBalanceUpdate.delete(walletAddress);
      }

    } catch (error) {
      console.error('Failed to update account caches:', error);
    }
  }

  /**
   * Emit account creation events
   * @private
   */
  _emitAccountCreationEvent(eventType, data) {
    try {
      const listeners = this.accountCreationListeners.get(eventType) || new Set();
      
      const eventData = {
        eventType,
        timestamp: Date.now(),
        ...data
      };

      // Log important events for debugging
      if (ACCOUNT_CREATION_CONFIG.CREATION_AUDIT_LOGGING) {
        console.log(`Account Creation Event [${eventType}]:`, eventData);
      }

      // Emit to all registered listeners
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Error in account creation event listener for ${eventType}:`, error);
        }
      });

    } catch (error) {
      console.error('Failed to emit account creation event:', error);
    }
  }

  /**
   * Add listener for account creation events
   * @param {string} eventType - Event type to listen for
   * @param {function} listener - Event listener function
   * @returns {function} Unsubscribe function
   */
  addAccountCreationListener(eventType, listener) {
    if (!this.accountCreationListeners.has(eventType)) {
      this.accountCreationListeners.set(eventType, new Set());
    }
    
    this.accountCreationListeners.get(eventType).add(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.accountCreationListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.accountCreationListeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Remove all account creation event listeners
   */
  removeAllAccountCreationListeners() {
    this.accountCreationListeners.clear();
  }

  /**
   * Get account creation status and statistics
   * @returns {Object} Creation status and statistics
   */
  getAccountCreationStatus() {
    return {
      cacheStats: {
        existenceCache: this.accountExistenceCache.size,
        feeEstimateCache: this.creationFeeEstimates.size,
        verificationCache: this.accountVerificationCache.size
      },
      activeCreations: this.accountCreationQueue.size,
      eventListeners: Object.fromEntries(
        Array.from(this.accountCreationListeners.entries()).map(([eventType, listeners]) => 
          [eventType, listeners.size]
        )
      ),
      configuration: {
        autoDetect: ACCOUNT_CREATION_CONFIG.AUTO_DETECT_MISSING_ACCOUNTS,
        maxRetries: ACCOUNT_CREATION_CONFIG.MAX_CREATION_RETRIES,
        timeout: ACCOUNT_CREATION_CONFIG.CREATION_TIMEOUT,
        requireConsent: ACCOUNT_CREATION_CONFIG.REQUIRE_FEE_CONSENT
      }
    };
  }

  /**
   * Integration helper for UI components - Check if wallet needs account creation
   * @param {string} walletAddress - Wallet address to check
   * @param {Object} options - Check options
   * @returns {Promise<{needsCreation: boolean, canCreate: boolean, feeEstimate?: Object, error?: string}>}
   */
  async checkAccountCreationNeeded(walletAddress, options = {}) {
    const { estimateFees = true, useCache = true } = options;

    try {
      // Step 1: Check if account exists
      const accountStatus = await this.detectAssociatedTokenAccount(walletAddress, { useCache });
      
      if (accountStatus.exists) {
        return {
          needsCreation: false,
          canCreate: false,
          account: accountStatus.address,
          message: 'Token account already exists'
        };
      }

      // Step 2: Validate if creation is possible
      const validation = await this.validateAccountCreation(walletAddress);
      
      if (!validation.isValid) {
        return {
          needsCreation: true,
          canCreate: false,
          errors: validation.errors,
          warnings: validation.warnings,
          message: `Account creation blocked: ${validation.errors.join(', ')}`
        };
      }

      // Step 3: Estimate fees if requested
      let feeEstimate = null;
      if (estimateFees) {
        try {
          feeEstimate = await this.estimateAccountCreationFee(walletAddress, {
            includeBuffer: true,
            checkAffordability: true
          });
        } catch (error) {
          console.warn('Fee estimation failed during account creation check:', error);
          feeEstimate = { error: error.message };
        }
      }

      return {
        needsCreation: true,
        canCreate: validation.isValid && (feeEstimate?.canAfford !== false),
        account: accountStatus.address,
        feeEstimate,
        validation,
        message: validation.isValid ? 
          'Account creation available' : 
          `Account creation issues: ${validation.errors.join(', ')}`
      };

    } catch (error) {
      console.error('Error checking account creation status:', error);
      return {
        needsCreation: false,
        canCreate: false,
        error: error.message,
        message: `Check failed: ${error.message}`
      };
    }
  }

  /**
   * Integration helper for automatic account creation with UI hooks
   * @param {string} walletAddress - Wallet address
   * @param {Object} wallet - Wallet adapter instance
   * @param {Object} uiHandlers - UI callback handlers
   * @returns {Promise<{success: boolean, signature?: string, account?: string, error?: string}>}
   */
  async createAccountWithUI(walletAddress, wallet, uiHandlers = {}) {
    const {
      onProgressUpdate = null,       // (step, message, progress) => void
      onConfirmationNeeded = null,   // (feeInfo) => Promise<boolean>
      onSuccess = null,              // (result) => void
      onError = null,                // (error) => void
      onCancelled = null            // () => void
    } = uiHandlers;

    return await this.createAssociatedTokenAccountComprehensive(walletAddress, wallet, {
      showProgress: true,
      requireConfirmation: onConfirmationNeeded ? true : false,
      enableNotifications: true,
      displayFeeBreakdown: true,
      simulateBeforeCreation: true,
      verifyAfterCreation: true,
      
      onProgress: onProgressUpdate,
      onConfirmationNeeded,
      onSuccess: (result) => {
        if (onSuccess) onSuccess(result);
        
        // Auto-start balance polling for better UX
        setTimeout(() => {
          this.startBalancePolling(walletAddress, {
            pollInterval: BALANCE_CONFIG.DEFAULT_POLL_INTERVAL,
            emitEvents: true
          });
        }, 1000);
      },
      onError: (error) => {
        if (onError) onError(error);
      }
    }).catch(error => {
      // Handle cancellation or other errors
      if (error.message.includes('rejected') || error.message.includes('cancelled')) {
        if (onCancelled) onCancelled();
        return { success: false, cancelled: true, error: error.message };
      }
      
      if (onError) onError(error);
      return { success: false, error: error.message };
    });
  }

  /**
   * Bulk account creation check for multiple wallets
   * @param {Array<string>} walletAddresses - Array of wallet addresses
   * @param {Object} options - Bulk check options
   * @returns {Promise<Object>} Results for each wallet
   */
  async bulkCheckAccountCreation(walletAddresses, options = {}) {
    const { includeEstimates = false, maxConcurrent = 5 } = options;
    const results = {};

    // Process in batches to avoid overwhelming RPC
    for (let i = 0; i < walletAddresses.length; i += maxConcurrent) {
      const batch = walletAddresses.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (walletAddress) => {
        try {
          const result = await this.checkAccountCreationNeeded(walletAddress, {
            estimateFees: includeEstimates,
            useCache: true
          });
          return { walletAddress, ...result };
        } catch (error) {
          return { 
            walletAddress, 
            needsCreation: false, 
            canCreate: false, 
            error: error.message 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        results[result.walletAddress] = result;
      });
    }

    return {
      results,
      summary: {
        total: walletAddresses.length,
        needingCreation: Object.values(results).filter(r => r.needsCreation).length,
        canCreate: Object.values(results).filter(r => r.canCreate).length,
        hasErrors: Object.values(results).filter(r => r.error).length
      }
    };
  }

  /**
   * Daily Earning Configuration for MLG Token Community Actions
   * Implements community engagement rewards with anti-gaming measures
   */
  static DAILY_EARNING_CONFIG = {
    // Daily earning limits and allocations
    MAX_DAILY_EARNINGS: 10, // Maximum 10 MLG per day through community actions
    BASE_DAILY_ALLOCATION: 5, // Base earning potential before bonuses
    
    // Community action types and rewards
    ACTION_REWARDS: {
      DAILY_VOTING: 1, // 1 MLG for daily voting participation
      CONTENT_SUBMISSION: {
        LOW_QUALITY: 1,    // Basic content submission
        MEDIUM_QUALITY: 2, // Quality content submission  
        HIGH_QUALITY: 3,   // Exceptional content submission
        FEATURED: 5        // Featured/highlighted content
      },
      ACHIEVEMENT_UNLOCK: {
        BASIC: 1,          // Basic achievement unlock
        RARE: 2,           // Rare achievement unlock
        LEGENDARY: 3       // Legendary achievement unlock
      },
      STREAK_BONUSES: {
        WEEK_STREAK: 2,    // 7-day consecutive activity
        MONTH_STREAK: 5,   // 30-day consecutive activity
        MILESTONE: 10      // Special milestone achievements
      },
      CLAN_PARTICIPATION: {
        BASIC_MEMBER: 0.5, // Basic clan member bonus
        ACTIVE_MEMBER: 1,  // Active clan member bonus
        CLAN_OFFICER: 2,   // Clan officer bonus
        CLAN_LEADER: 3     // Clan leader bonus
      }
    },
    
    // Anti-gaming and validation measures
    ACTION_COOLDOWNS: {
      DAILY_VOTING: 24 * 60 * 60 * 1000, // 24 hours between voting rewards
      CONTENT_SUBMISSION: 4 * 60 * 60 * 1000, // 4 hours between content submissions
      ACHIEVEMENT_UNLOCK: 0, // No cooldown for achievements (natural rate limiting)
      STREAK_BONUSES: 24 * 60 * 60 * 1000, // 24 hours for streak calculations
      CLAN_PARTICIPATION: 24 * 60 * 60 * 1000 // 24 hours for clan bonuses
    },
    
    // Validation and security settings
    REQUIRE_WALLET_VERIFICATION: true,
    ENABLE_ANTI_SYBIL_CHECKS: true,
    MIN_ACCOUNT_AGE_HOURS: 24, // Minimum 24 hours old account to earn
    MAX_ACTIONS_PER_HOUR: 10, // Rate limiting per action type
    
    // Storage and tracking configuration
    EARNINGS_STORAGE_KEY: 'mlg_daily_earnings',
    ACTION_HISTORY_STORAGE_KEY: 'mlg_action_history',
    ACHIEVEMENT_STORAGE_KEY: 'mlg_achievements',
    STREAK_STORAGE_KEY: 'mlg_activity_streaks',
    
    // Daily reset and timing
    DAILY_RESET_HOUR: 0, // Reset at midnight UTC
    EARNINGS_HISTORY_DAYS: 30, // Keep 30 days of earning history
    
    // Community verification thresholds
    CONTENT_QUALITY_THRESHOLDS: {
      UPVOTES_FOR_MEDIUM: 3,   // 3+ upvotes for medium quality
      UPVOTES_FOR_HIGH: 10,    // 10+ upvotes for high quality
      UPVOTES_FOR_FEATURED: 25 // 25+ upvotes for featured content
    },
    
    // Bonus multipliers and special events
    WEEKEND_BONUS_MULTIPLIER: 1.2, // 20% bonus on weekends
    EVENT_BONUS_MULTIPLIER: 1.5,   // 50% bonus during special events
    ENABLE_SEASONAL_BONUSES: true,
    
    // Distribution mechanism
    AUTO_DISTRIBUTE_EARNINGS: true,
    BATCH_DISTRIBUTION_THRESHOLD: 1, // Distribute when 1+ MLG earned
    DISTRIBUTION_DELAY_MS: 5000, // 5 second delay before distribution
    
    // Audit and compliance
    ENABLE_EARNING_AUDIT_TRAIL: true,
    LOG_ALL_EARNING_ACTIONS: true,
    REQUIRE_ACTION_VERIFICATION: true
  };

  /**
   * Burn-to-Vote Configuration for MLG Token Voting System
   * Implements progressive pricing and daily limits with comprehensive security
   */
  static BURN_TO_VOTE_CONFIG = {
    // Progressive pricing: 1 MLG for 1st vote, 2 MLG for 2nd, etc.
    VOTE_COSTS: [0, 1, 2, 3, 4], // Index 0 unused, votes 1-4 cost 1, 2, 3, 4 MLG respectively
    MAX_DAILY_EXTRA_VOTES: 4, // Maximum 4 additional votes per day
    DAILY_RESET_HOUR: 0, // Reset at midnight UTC
    
    // Transaction validation and safety limits
    MAX_BURN_AMOUNT: 10, // Maximum 10 MLG per transaction for safety
    MIN_BURN_AMOUNT: 1, // Minimum 1 MLG per transaction
    MAX_SINGLE_VOTE_PURCHASE: 4, // Maximum votes purchasable in single transaction
    
    // Daily limits and validation storage
    DAILY_LIMIT_STORAGE_KEY: 'mlg_daily_burns',
    TRANSACTION_REPLAY_STORAGE_KEY: 'mlg_burn_transactions',
    AUDIT_TRAIL_STORAGE_KEY: 'mlg_burn_audit_trail',
    
    // Transaction timing and retry configuration
    TRANSACTION_TIMEOUT: 60000, // 1 minute timeout for signing
    CONFIRMATION_TIMEOUT: 30000, // 30 seconds confirmation timeout
    MAX_RETRIES: 3, // Maximum transaction retry attempts
    RETRY_DELAY_MS: 2000, // Base delay between retries
    
    // Security and audit features
    ENABLE_AUDIT_TRAIL: true,
    REQUIRE_TRANSACTION_SIMULATION: true,
    VALIDATE_REPLAY_PROTECTION: true,
    ENABLE_GAS_ESTIMATION: true,
    REQUIRE_USER_CONFIRMATION: true,
    
    // Network fee estimation (in SOL)
    ESTIMATED_BURN_FEE: 0.000005, // ~5000 lamports for burn transaction
    FEE_BUFFER_MULTIPLIER: 1.2 // 20% buffer for fee estimation
  };

  /**
   * Daily burn tracking for vote limits
   */
  _createBurnTracker() {
    return new (class DailyBurnTracker {
      constructor(config) {
        this.storageKey = config.DAILY_LIMIT_STORAGE_KEY;
        this.replayStorageKey = config.TRANSACTION_REPLAY_STORAGE_KEY;
        this.config = config;
      }

      /**
       * Get current day key for tracking
       */
      getCurrentDayKey() {
        const now = new Date();
        now.setUTCHours(this.config.DAILY_RESET_HOUR, 0, 0, 0);
        return now.toISOString().split('T')[0];
      }

      /**
       * Get daily burn data for wallet
       */
      getDailyBurnData(walletAddress) {
        try {
          const data = localStorage.getItem(this.storageKey);
          const dailyData = data ? JSON.parse(data) : {};
          const dayKey = this.getCurrentDayKey();
          
          return dailyData[dayKey]?.[walletAddress] || {
            votesUsed: 0,
            totalBurned: 0,
            transactions: []
          };
        } catch (error) {
          console.warn('Failed to get daily burn data:', error);
          return { votesUsed: 0, totalBurned: 0, transactions: [] };
        }
      }

      /**
       * Update daily burn data
       */
      updateDailyBurnData(walletAddress, burnAmount, votesGained, signature) {
        try {
          const data = localStorage.getItem(this.storageKey);
          const dailyData = data ? JSON.parse(data) : {};
          const dayKey = this.getCurrentDayKey();
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {};
          }
          
          if (!dailyData[dayKey][walletAddress]) {
            dailyData[dayKey][walletAddress] = {
              votesUsed: 0,
              totalBurned: 0,
              transactions: []
            };
          }
          
          const walletData = dailyData[dayKey][walletAddress];
          walletData.votesUsed += votesGained;
          walletData.totalBurned += burnAmount;
          walletData.transactions.push({
            signature,
            burnAmount,
            votesGained,
            timestamp: Date.now()
          });
          
          // Clean up old data (keep only last 7 days)
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          const cutoffKey = cutoffDate.toISOString().split('T')[0];
          
          Object.keys(dailyData).forEach(key => {
            if (key < cutoffKey) {
              delete dailyData[key];
            }
          });
          
          localStorage.setItem(this.storageKey, JSON.stringify(dailyData));
          return walletData;
        } catch (error) {
          console.error('Failed to update daily burn data:', error);
          throw new Error('Failed to update burn tracking data');
        }
      }

      /**
       * Check if transaction hash has been used (replay protection)
       */
      isTransactionUsed(transactionHash) {
        try {
          const data = localStorage.getItem(this.replayStorageKey);
          const replayData = data ? JSON.parse(data) : {};
          return replayData[transactionHash] ? true : false;
        } catch (error) {
          console.warn('Failed to check transaction replay:', error);
          return false;
        }
      }

      /**
       * Mark transaction as used for replay protection
       */
      markTransactionUsed(transactionHash, walletAddress, burnAmount) {
        try {
          const data = localStorage.getItem(this.replayStorageKey);
          const replayData = data ? JSON.parse(data) : {};
          
          replayData[transactionHash] = {
            walletAddress,
            burnAmount,
            timestamp: Date.now()
          };
          
          // Clean up old entries (keep only last 24 hours)
          const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
          Object.keys(replayData).forEach(hash => {
            if (replayData[hash].timestamp < cutoffTime) {
              delete replayData[hash];
            }
          });
          
          localStorage.setItem(this.replayStorageKey, JSON.stringify(replayData));
        } catch (error) {
          console.error('Failed to mark transaction as used:', error);
        }
      }

      /**
       * Get remaining votes for today
       */
      getRemainingVotes(walletAddress) {
        const dailyData = this.getDailyBurnData(walletAddress);
        return Math.max(0, this.config.MAX_DAILY_EXTRA_VOTES - dailyData.votesUsed);
      }

      /**
       * Calculate next vote cost
       */
      getNextVoteCost(walletAddress) {
        const dailyData = this.getDailyBurnData(walletAddress);
        const nextVoteIndex = dailyData.votesUsed + 1;
        
        if (nextVoteIndex > this.config.MAX_DAILY_EXTRA_VOTES) {
          return null; // No more votes available
        }
        
        return this.config.VOTE_COSTS[nextVoteIndex];
      }
    })(MLGTokenManager.BURN_TO_VOTE_CONFIG);
  }

  /**
   * Daily earning tracker for community actions
   */
  _createEarningTracker() {
    return new (class DailyEarningTracker {
      constructor(config) {
        this.storageKey = config.EARNINGS_STORAGE_KEY;
        this.actionHistoryKey = config.ACTION_HISTORY_STORAGE_KEY;
        this.achievementKey = config.ACHIEVEMENT_STORAGE_KEY;
        this.streakKey = config.STREAK_STORAGE_KEY;
        this.config = config;
      }

      /**
       * Get current day key for tracking
       */
      getCurrentDayKey() {
        const now = new Date();
        now.setUTCHours(this.config.DAILY_RESET_HOUR, 0, 0, 0);
        return now.toISOString().split('T')[0];
      }

      /**
       * Get daily earning data for wallet
       */
      getDailyEarningData(walletAddress) {
        try {
          const data = localStorage.getItem(this.storageKey);
          const dailyData = data ? JSON.parse(data) : {};
          const dayKey = this.getCurrentDayKey();
          
          return dailyData[dayKey]?.[walletAddress] || {
            totalEarned: 0,
            actionCount: 0,
            actions: [],
            lastActionTime: 0,
            streakData: {
              currentStreak: 0,
              longestStreak: 0,
              lastActivityDate: null
            }
          };
        } catch (error) {
          console.warn('Failed to get daily earning data:', error);
          return { totalEarned: 0, actionCount: 0, actions: [], lastActionTime: 0, streakData: { currentStreak: 0, longestStreak: 0, lastActivityDate: null } };
        }
      }

      /**
       * Get earning history for wallet (multiple days)
       */
      getEarningHistory(walletAddress, days = 7) {
        try {
          const data = localStorage.getItem(this.storageKey);
          const dailyData = data ? JSON.parse(data) : {};
          const history = [];
          
          for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setUTCHours(this.config.DAILY_RESET_HOUR, 0, 0, 0);
            const dayKey = date.toISOString().split('T')[0];
            
            const dayData = dailyData[dayKey]?.[walletAddress] || {
              totalEarned: 0,
              actionCount: 0,
              actions: []
            };
            
            history.unshift({
              date: dayKey,
              totalEarned: dayData.totalEarned,
              actionCount: dayData.actionCount,
              actions: dayData.actions
            });
          }
          
          return history;
        } catch (error) {
          console.warn('Failed to get earning history:', error);
          return [];
        }
      }

      /**
       * Check if action is allowed (cooldown and rate limiting)
       */
      canPerformAction(walletAddress, actionType) {
        try {
          const dailyData = this.getDailyEarningData(walletAddress);
          const now = Date.now();
          const cooldown = this.config.ACTION_COOLDOWNS[actionType] || 0;
          
          // Check rate limiting (actions per hour)
          const oneHourAgo = now - (60 * 60 * 1000);
          const recentActions = dailyData.actions.filter(action => 
            action.type === actionType && action.timestamp > oneHourAgo
          );
          
          if (recentActions.length >= this.config.MAX_ACTIONS_PER_HOUR) {
            return {
              allowed: false,
              reason: 'RATE_LIMITED',
              nextAllowedTime: recentActions[0].timestamp + (60 * 60 * 1000),
              actionsThisHour: recentActions.length,
              maxPerHour: this.config.MAX_ACTIONS_PER_HOUR
            };
          }

          // Check cooldown
          const lastAction = dailyData.actions
            .filter(action => action.type === actionType)
            .sort((a, b) => b.timestamp - a.timestamp)[0];

          if (lastAction && cooldown > 0) {
            const timeSinceLastAction = now - lastAction.timestamp;
            if (timeSinceLastAction < cooldown) {
              return {
                allowed: false,
                reason: 'COOLDOWN',
                nextAllowedTime: lastAction.timestamp + cooldown,
                remainingCooldown: cooldown - timeSinceLastAction
              };
            }
          }

          // Check daily earning limit
          if (dailyData.totalEarned >= this.config.MAX_DAILY_EARNINGS) {
            return {
              allowed: false,
              reason: 'DAILY_LIMIT_REACHED',
              dailyLimit: this.config.MAX_DAILY_EARNINGS,
              currentEarnings: dailyData.totalEarned
            };
          }

          return { allowed: true };
        } catch (error) {
          console.error('Failed to check action availability:', error);
          return { allowed: false, reason: 'ERROR', error: error.message };
        }
      }

      /**
       * Record earned tokens for community action
       */
      recordEarning(walletAddress, actionType, amount, metadata = {}) {
        try {
          const data = localStorage.getItem(this.storageKey);
          const dailyData = data ? JSON.parse(data) : {};
          const dayKey = this.getCurrentDayKey();
          const now = Date.now();
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {};
          }
          
          if (!dailyData[dayKey][walletAddress]) {
            dailyData[dayKey][walletAddress] = {
              totalEarned: 0,
              actionCount: 0,
              actions: [],
              lastActionTime: 0,
              streakData: {
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: null
              }
            };
          }
          
          const walletData = dailyData[dayKey][walletAddress];
          
          // Apply bonuses
          const bonusMultiplier = this._calculateBonusMultiplier(actionType, metadata);
          const finalAmount = Math.floor(amount * bonusMultiplier);
          
          // Ensure we don't exceed daily limits
          const remainingAllowance = this.config.MAX_DAILY_EARNINGS - walletData.totalEarned;
          const actualAmount = Math.min(finalAmount, remainingAllowance);
          
          // Record the earning
          walletData.totalEarned += actualAmount;
          walletData.actionCount += 1;
          walletData.lastActionTime = now;
          walletData.actions.push({
            id: `${actionType}_${now}_${Math.random().toString(36).substr(2, 9)}`,
            type: actionType,
            amount: actualAmount,
            originalAmount: amount,
            bonusMultiplier,
            timestamp: now,
            metadata: {
              ...metadata,
              dayKey,
              userAgent: navigator.userAgent.substr(0, 100) // Basic anti-gaming measure
            }
          });

          // Update streak data
          this._updateStreakData(walletData, dayKey);
          
          // Clean up old data
          this._cleanupOldData(dailyData);
          
          localStorage.setItem(this.storageKey, JSON.stringify(dailyData));
          
          return {
            success: true,
            earned: actualAmount,
            totalDailyEarned: walletData.totalEarned,
            remainingAllowance: this.config.MAX_DAILY_EARNINGS - walletData.totalEarned,
            bonusApplied: bonusMultiplier,
            actionId: walletData.actions[walletData.actions.length - 1].id,
            streakData: walletData.streakData
          };
        } catch (error) {
          console.error('Failed to record earning:', error);
          return { success: false, error: error.message };
        }
      }

      /**
       * Calculate bonus multipliers for actions
       */
      _calculateBonusMultiplier(actionType, metadata) {
        let multiplier = 1.0;
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        // Weekend bonus
        if (this.config.ENABLE_SEASONAL_BONUSES && (dayOfWeek === 0 || dayOfWeek === 6)) {
          multiplier *= this.config.WEEKEND_BONUS_MULTIPLIER;
        }
        
        // Event bonus
        if (metadata.isSpecialEvent && this.config.ENABLE_SEASONAL_BONUSES) {
          multiplier *= this.config.EVENT_BONUS_MULTIPLIER;
        }
        
        // Clan member bonus
        if (metadata.clanRole && this.config.ACTION_REWARDS.CLAN_PARTICIPATION[metadata.clanRole]) {
          const clanBonus = this.config.ACTION_REWARDS.CLAN_PARTICIPATION[metadata.clanRole];
          multiplier += (clanBonus / 10); // Convert to percentage bonus
        }
        
        // Quality-based bonuses for content
        if (actionType === 'CONTENT_SUBMISSION' && metadata.qualityScore) {
          const qualityMultiplier = Math.min(2.0, 1 + (metadata.qualityScore / 100));
          multiplier *= qualityMultiplier;
        }
        
        return multiplier;
      }

      /**
       * Update streak data for consecutive activity
       */
      _updateStreakData(walletData, currentDayKey) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setUTCHours(this.config.DAILY_RESET_HOUR, 0, 0, 0);
        const yesterdayKey = yesterday.toISOString().split('T')[0];
        
        if (walletData.streakData.lastActivityDate === yesterdayKey) {
          // Consecutive day
          walletData.streakData.currentStreak += 1;
        } else if (walletData.streakData.lastActivityDate !== currentDayKey) {
          // Broken streak or first activity
          walletData.streakData.currentStreak = 1;
        }
        
        // Update longest streak
        if (walletData.streakData.currentStreak > walletData.streakData.longestStreak) {
          walletData.streakData.longestStreak = walletData.streakData.currentStreak;
        }
        
        walletData.streakData.lastActivityDate = currentDayKey;
      }

      /**
       * Get available earning opportunities for wallet
       */
      getEarningOpportunities(walletAddress) {
        const dailyData = this.getDailyEarningData(walletAddress);
        const opportunities = [];
        
        // Daily voting
        const votingCheck = this.canPerformAction(walletAddress, 'DAILY_VOTING');
        if (votingCheck.allowed) {
          opportunities.push({
            type: 'DAILY_VOTING',
            reward: this.config.ACTION_REWARDS.DAILY_VOTING,
            description: 'Participate in daily voting',
            category: 'participation'
          });
        }
        
        // Content submission
        const contentCheck = this.canPerformAction(walletAddress, 'CONTENT_SUBMISSION');
        if (contentCheck.allowed) {
          opportunities.push({
            type: 'CONTENT_SUBMISSION',
            reward: `${this.config.ACTION_REWARDS.CONTENT_SUBMISSION.LOW_QUALITY}-${this.config.ACTION_REWARDS.CONTENT_SUBMISSION.FEATURED}`,
            description: 'Submit quality content (reward varies by quality)',
            category: 'content'
          });
        }
        
        // Streak bonuses
        if (dailyData.streakData.currentStreak >= 7) {
          opportunities.push({
            type: 'STREAK_BONUS',
            reward: this.config.ACTION_REWARDS.STREAK_BONUSES.WEEK_STREAK,
            description: '7-day activity streak bonus',
            category: 'achievement'
          });
        }
        
        return {
          opportunities,
          remainingAllowance: this.config.MAX_DAILY_EARNINGS - dailyData.totalEarned,
          dailyProgress: {
            earned: dailyData.totalEarned,
            limit: this.config.MAX_DAILY_EARNINGS,
            percentage: Math.round((dailyData.totalEarned / this.config.MAX_DAILY_EARNINGS) * 100)
          },
          streakInfo: dailyData.streakData
        };
      }

      /**
       * Clean up old data beyond retention period
       */
      _cleanupOldData(dailyData) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.EARNINGS_HISTORY_DAYS);
        const cutoffKey = cutoffDate.toISOString().split('T')[0];
        
        Object.keys(dailyData).forEach(key => {
          if (key < cutoffKey) {
            delete dailyData[key];
          }
        });
      }

      /**
       * Get earning statistics for wallet
       */
      getEarningStats(walletAddress, days = 30) {
        try {
          const history = this.getEarningHistory(walletAddress, days);
          const totalEarned = history.reduce((sum, day) => sum + day.totalEarned, 0);
          const totalActions = history.reduce((sum, day) => sum + day.actionCount, 0);
          const activeDays = history.filter(day => day.totalEarned > 0).length;
          const dailyData = this.getDailyEarningData(walletAddress);
          
          // Calculate action type breakdown
          const actionBreakdown = {};
          history.forEach(day => {
            day.actions.forEach(action => {
              if (!actionBreakdown[action.type]) {
                actionBreakdown[action.type] = { count: 0, earned: 0 };
              }
              actionBreakdown[action.type].count += 1;
              actionBreakdown[action.type].earned += action.amount;
            });
          });
          
          return {
            totalEarned,
            totalActions,
            activeDays,
            averageDaily: activeDays > 0 ? (totalEarned / activeDays) : 0,
            currentStreak: dailyData.streakData.currentStreak,
            longestStreak: dailyData.streakData.longestStreak,
            actionBreakdown,
            todayEarned: dailyData.totalEarned,
            todayRemaining: this.config.MAX_DAILY_EARNINGS - dailyData.totalEarned,
            participationRate: (activeDays / days) * 100
          };
        } catch (error) {
          console.error('Failed to get earning stats:', error);
          return null;
        }
      }
    })(MLGTokenManager.DAILY_EARNING_CONFIG);
  }

  /**
   * Burn MLG tokens for additional votes with comprehensive validation and security
   * @param {string} walletAddress - User's wallet public key
   * @param {Object} wallet - Wallet adapter instance
   * @param {number} amount - Amount of tokens to burn (in token units, not raw)
   * @param {Object} options - Burn options
   * @returns {Promise<{signature: string, burnedAmount: number, votesGained: number, auditTrail: Object}>}
   */
  async burnTokensForVotes(walletAddress, wallet, amount, options = {}) {
    const {
      simulateFirst = MLGTokenManager.BURN_TO_VOTE_CONFIG.REQUIRE_TRANSACTION_SIMULATION,
      skipValidation = false,
      maxVotesToPurchase = null
    } = options;

    const burnTracker = this._createBurnTracker();
    const auditTrail = {
      walletAddress,
      requestedBurnAmount: amount,
      timestamp: Date.now(),
      validationResults: {},
      transactionResults: {},
      error: null
    };

    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized');
      }

      // Comprehensive validation
      const validation = await this.validateBurnToVoteTransaction(
        walletAddress, 
        amount, 
        maxVotesToPurchase,
        { skipBalance: skipValidation }
      );
      
      auditTrail.validationResults = validation;

      if (!validation.isValid) {
        auditTrail.error = validation.errors.join('; ');
        throw new Error(validation.errors.join('; '));
      }

      const { votesToPurchase, actualCost } = validation;

      // Get wallet and token account info
      const walletPublicKey = new PublicKey(walletAddress);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.mintPublicKey,
        walletPublicKey
      );

      // Create burn transaction
      const transaction = new Transaction();
      const rawAmount = Math.floor(actualCost * Math.pow(10, this.mintInfo.decimals));
      
      // Add burn instruction
      transaction.add(
        createBurnInstruction(
          associatedTokenAddress, // token account
          this.mintPublicKey, // mint
          walletPublicKey, // owner
          BigInt(rawAmount) // amount to burn
        )
      );

      // Set recent blockhash and fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      // Simulate transaction if requested
      if (simulateFirst) {
        try {
          const simulation = await this.connection.simulateTransaction(transaction);
          if (simulation.value.err) {
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
          }
          auditTrail.transactionResults.simulation = {
            success: true,
            logs: simulation.value.logs
          };
        } catch (simError) {
          auditTrail.transactionResults.simulation = {
            success: false,
            error: simError.message
          };
          throw new Error(`Transaction simulation failed: ${simError.message}`);
        }
      }

      // Sign and send transaction with enhanced retry logic
      let signature;
      let attempts = 0;
      const maxAttempts = MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_RETRIES;
      const attemptResults = [];
      
      // Estimate gas cost for user confirmation with enhanced dynamic estimation
      const estimatedCost = await this.estimateTransactionCost('burn', { 
        walletAddress,
        includeBuffer: true 
      });
      auditTrail.transactionResults.estimatedCost = estimatedCost;

      while (attempts < maxAttempts) {
        const attemptStart = Date.now();
        try {
          // Sign transaction
          const signedTransaction = await wallet.signTransaction(transaction);
          
          // Send raw transaction
          signature = await this.connection.sendRawTransaction(
            signedTransaction.serialize(),
            {
              skipPreflight: false,
              preflightCommitment: MLG_TOKEN_CONFIG.BURN_CONFIG.PREFLIGHT_COMMITMENT,
              maxRetries: 0 // Handle retries manually
            }
          );

          // Confirm transaction with timeout
          const confirmation = await Promise.race([
            this.connection.confirmTransaction(
              signature,
              MLG_TOKEN_CONFIG.BURN_CONFIG.COMMITMENT
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Transaction confirmation timeout')), 
                MLGTokenManager.BURN_TO_VOTE_CONFIG.CONFIRMATION_TIMEOUT)
            )
          ]);

          attemptResults.push({
            attempt: attempts + 1,
            success: true,
            signature,
            duration: Date.now() - attemptStart
          });

          break; // Success - exit retry loop
          
        } catch (error) {
          attempts++;
          const duration = Date.now() - attemptStart;
          
          // Enhanced error classification
          const errorType = this._classifyBurnError(error);
          
          attemptResults.push({
            attempt: attempts,
            success: false,
            error: error.message,
            errorType,
            duration,
            isRetryable: errorType.retryable
          });

          if (attempts >= maxAttempts || !errorType.retryable) {
            auditTrail.transactionResults.attempts = attemptResults;
            throw new Error(`Burn transaction failed after ${attempts} attempts: ${error.message}`);
          }
          
          console.warn(`Burn transaction attempt ${attempts} failed (${errorType.type}), retrying...`, error);
          
          // Smart retry delay based on error type
          const baseDelay = MLGTokenManager.BURN_TO_VOTE_CONFIG.RETRY_DELAY_MS;
          const delay = errorType.type === 'network' ? 
            Math.min(baseDelay * Math.pow(2, attempts - 1), 10000) : baseDelay;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Refresh blockhash for retry
          try {
            const { blockhash: newBlockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = newBlockhash;
          } catch (refreshError) {
            console.warn('Failed to refresh blockhash for retry:', refreshError);
          }
        }
      }

      // Update daily burn tracking
      const dailyData = burnTracker.updateDailyBurnData(
        walletAddress, 
        actualCost, 
        votesToPurchase, 
        signature
      );

      // Mark transaction for replay protection
      if (MLGTokenManager.BURN_TO_VOTE_CONFIG.VALIDATE_REPLAY_PROTECTION) {
        const transactionHash = this._generateBurnTransactionHash(
          walletAddress, 
          actualCost, 
          auditTrail.timestamp
        );
        burnTracker.markTransactionUsed(transactionHash, walletAddress, actualCost);
      }
      
      // Store comprehensive audit trail if enabled
      if (MLGTokenManager.BURN_TO_VOTE_CONFIG.ENABLE_AUDIT_TRAIL) {
        this._storeAuditTrail(auditTrail);
      }

      // Complete audit trail
      auditTrail.transactionResults = {
        ...auditTrail.transactionResults,
        signature,
        actualBurnAmount: actualCost,
        votesGained: votesToPurchase,
        attempts: attemptResults,
        dailyData,
        success: true
      };

      console.log('Burn-to-vote transaction completed successfully:', {
        signature,
        walletAddress,
        burnAmount: actualCost,
        votesGained: votesToPurchase,
        dailyVotesUsed: dailyData.votesUsed,
        remainingVotes: MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES - dailyData.votesUsed
      });

      // Emit event for real-time updates if polling is active
      if (this.pollingIntervals.has(walletAddress)) {
        this._emitBalanceEvent('burn_completed', {
          walletAddress,
          burnAmount: actualCost,
          votesGained: votesToPurchase,
          signature,
          timestamp: Date.now()
        });
      }

      // Update transaction history with burn transaction
      this._addBurnTransactionToHistory(walletAddress, {
        signature,
        burnAmount: actualCost,
        votesGained: votesToPurchase,
        timestamp: Date.now(),
        success: true
      });

      return {
        signature,
        burnedAmount: actualCost,
        votesGained: votesToPurchase,
        rawAmount: rawAmount.toString(),
        dailyVotesUsed: dailyData.votesUsed,
        remainingVotes: MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES - dailyData.votesUsed,
        auditTrail: MLGTokenManager.BURN_TO_VOTE_CONFIG.ENABLE_AUDIT_TRAIL ? auditTrail : null,
        timestamp: Date.now()
      };

    } catch (error) {
      auditTrail.error = error.message;
      auditTrail.transactionResults.success = false;
      
      console.error('Burn-to-vote transaction failed:', {
        walletAddress,
        amount,
        error: error.message,
        auditTrail: MLGTokenManager.BURN_TO_VOTE_CONFIG.ENABLE_AUDIT_TRAIL ? auditTrail : null
      });
      
      // Record failed burn attempt in transaction history if signature exists
      if (signature) {
        this._addBurnTransactionToHistory(walletAddress, {
          signature,
          burnAmount: amount,
          votesGained: 0,
          timestamp: Date.now(),
          success: false,
          error: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Validate MLG token balance sufficiency for operations
   * @param {string} walletAddress - Wallet address to check
   * @param {number} requiredAmount - Required MLG tokens
   * @param {Object} options - Validation options
   * @returns {Promise<{isValid: boolean, balance: number, hasAccount: boolean, warnings: Array, errors: Array}>}
   */
  async validateMLGBalance(walletAddress, requiredAmount, options = {}) {
    const { includeWarnings = true } = options;
    
    const result = {
      isValid: false,
      balance: 0,
      hasAccount: false,
      warnings: [],
      errors: [],
      timestamp: Date.now()
    };
    
    try {
      const balanceInfo = await this.getTokenBalance(walletAddress);
      result.balance = balanceInfo.balance;
      result.hasAccount = balanceInfo.hasAccount;
      
      if (!balanceInfo.hasAccount) {
        result.errors.push(VALIDATION_CONFIG.ERROR_MESSAGES.NO_TOKEN_ACCOUNT);
        return result;
      }
      
      if (balanceInfo.balance < requiredAmount) {
        result.errors.push(
          `${VALIDATION_CONFIG.ERROR_MESSAGES.INSUFFICIENT_MLG}. Available: ${balanceInfo.balance} MLG, Required: ${requiredAmount} MLG`
        );
        return result;
      }
      
      // Add balance warnings if enabled
      if (includeWarnings) {
        if (balanceInfo.balance <= VALIDATION_CONFIG.MLG_CRITICAL_THRESHOLD) {
          result.warnings.push(`Critical: MLG balance is very low (${balanceInfo.balance} MLG)`);
        } else if (balanceInfo.balance <= VALIDATION_CONFIG.MLG_WARNING_THRESHOLD) {
          result.warnings.push(`Warning: MLG balance is low (${balanceInfo.balance} MLG)`);
        }
        
        // Check if this transaction would leave user with very low balance
        const remainingAfterTransaction = balanceInfo.balance - requiredAmount;
        if (remainingAfterTransaction <= VALIDATION_CONFIG.MLG_CRITICAL_THRESHOLD) {
          result.warnings.push(`This transaction will leave you with ${remainingAfterTransaction} MLG tokens`);
        }
      }
      
      result.isValid = true;
      return result;
      
    } catch (error) {
      console.error('MLG balance validation failed:', error);
      result.errors.push(`${VALIDATION_CONFIG.ERROR_MESSAGES.NETWORK_ERROR}: ${error.message}`);
      return result;
    }
  }
  
  /**
   * Validate SOL balance sufficiency for transaction fees
   * @param {string} walletAddress - Wallet address to check
   * @param {number} requiredLamports - Required lamports for fees
   * @param {Object} options - Validation options
   * @returns {Promise<{isValid: boolean, balance: number, lamports: number, warnings: Array, errors: Array}>}
   */
  async validateSOLBalance(walletAddress, requiredLamports, options = {}) {
    const { includeWarnings = true } = options;
    
    const result = {
      isValid: false,
      balance: 0,
      lamports: 0,
      warnings: [],
      errors: [],
      timestamp: Date.now()
    };
    
    try {
      const solBalance = await this.getSOLBalance(walletAddress);
      result.balance = solBalance.balance;
      result.lamports = solBalance.lamports;
      
      if (solBalance.lamports < requiredLamports) {
        const requiredSOL = requiredLamports / 1_000_000_000;
        result.errors.push(
          `${VALIDATION_CONFIG.ERROR_MESSAGES.INSUFFICIENT_SOL}. Available: ${solBalance.balance} SOL, Required: ${requiredSOL.toFixed(9)} SOL`
        );
        return result;
      }
      
      // Add balance warnings if enabled
      if (includeWarnings) {
        if (solBalance.balance <= VALIDATION_CONFIG.SOL_CRITICAL_THRESHOLD) {
          result.warnings.push(`Critical: SOL balance is very low (${solBalance.balance} SOL)`);
        } else if (solBalance.balance <= VALIDATION_CONFIG.SOL_WARNING_THRESHOLD) {
          result.warnings.push(`Warning: SOL balance is low (${solBalance.balance} SOL)`);
        }
        
        // Check if this transaction would leave user with very low SOL
        const remainingAfterTransaction = (solBalance.lamports - requiredLamports) / 1_000_000_000;
        if (remainingAfterTransaction <= VALIDATION_CONFIG.SOL_CRITICAL_THRESHOLD) {
          result.warnings.push(`This transaction will leave you with ${remainingAfterTransaction.toFixed(9)} SOL`);
        }
      }
      
      result.isValid = true;
      return result;
      
    } catch (error) {
      console.error('SOL balance validation failed:', error);
      result.errors.push(`${VALIDATION_CONFIG.ERROR_MESSAGES.NETWORK_ERROR}: ${error.message}`);
      return result;
    }
  }

  /**
   * Validate burn-to-vote transaction parameters and constraints with enhanced balance and fee checks
   * @param {string} walletAddress - User's wallet address
   * @param {number} burnAmount - Requested burn amount
   * @param {number} maxVotes - Maximum votes to purchase (optional)
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} - Validation result
   */
  async validateBurnToVoteTransaction(walletAddress, burnAmount, maxVotes = null, options = {}) {
    const { 
      skipBalance = false, 
      skipFeeEstimation = false,
      includeSimulation = VALIDATION_CONFIG.REQUIRE_SIMULATION 
    } = options;
    
    const burnTracker = this._createBurnTracker();
    const validationStart = Date.now();
    
    const validation = {
      isValid: false,
      canBurn: false,
      votesToPurchase: 0,
      actualCost: 0,
      remainingVotes: 0,
      nextVoteCost: null,
      errors: [],
      warnings: [],
      dailyData: null,
      balanceValidation: null,
      solBalanceValidation: null,
      feeEstimation: null,
      simulation: null,
      validationDuration: 0
    };
    
    try {
      // Wrap validation in timeout
      const validationPromise = (async () => {
        // Get daily burn data
        const dailyData = burnTracker.getDailyBurnData(walletAddress);
        validation.dailyData = dailyData;
        validation.remainingVotes = Math.max(0, MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES - dailyData.votesUsed);
        
        // Check daily vote limit
        if (validation.remainingVotes === 0) {
          validation.errors.push('Daily vote limit reached. Maximum 4 additional votes per day.');
          return validation;
        }
        
        // Validate burn amount constraints
        if (burnAmount <= 0) {
          validation.errors.push('Burn amount must be positive');
          return validation;
        }
        
        if (burnAmount < MLGTokenManager.BURN_TO_VOTE_CONFIG.MIN_BURN_AMOUNT) {
          validation.errors.push(`Minimum burn amount is ${MLGTokenManager.BURN_TO_VOTE_CONFIG.MIN_BURN_AMOUNT} MLG`);
          return validation;
        }
        
        if (burnAmount > MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_BURN_AMOUNT) {
          validation.errors.push(`Maximum burn amount is ${MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_BURN_AMOUNT} MLG per transaction`);
          return validation;
        }
        
        // Enhanced MLG balance validation
        if (!skipBalance) {
          const mlgValidation = await this.validateMLGBalance(walletAddress, burnAmount, { includeWarnings: true });
          validation.balanceValidation = mlgValidation;
          
          if (!mlgValidation.isValid) {
            validation.errors.push(...mlgValidation.errors);
            return validation;
          }
          
          validation.warnings.push(...mlgValidation.warnings);
        }
        
        // Calculate how many votes can be purchased with the burn amount
        let votesToPurchase = 0;
        let costSoFar = 0;
        let currentVoteIndex = dailyData.votesUsed + 1;
        
        // Apply max votes constraint if provided
        const effectiveMaxVotes = maxVotes ? Math.min(maxVotes, validation.remainingVotes) : validation.remainingVotes;
        
        while (votesToPurchase < effectiveMaxVotes && currentVoteIndex <= MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES) {
          const voteCost = MLGTokenManager.BURN_TO_VOTE_CONFIG.VOTE_COSTS[currentVoteIndex];
          
          if (costSoFar + voteCost <= burnAmount) {
            costSoFar += voteCost;
            votesToPurchase++;
            currentVoteIndex++;
          } else {
            break;
          }
        }
        
        if (votesToPurchase === 0) {
          const nextCost = burnTracker.getNextVoteCost(walletAddress);
          validation.errors.push(`Insufficient tokens for next vote. Required: ${nextCost} MLG`);
          return validation;
        }
        
        // Enhanced fee estimation and SOL balance validation
        if (!skipFeeEstimation) {
          try {
            const feeEstimation = await this.estimateTransactionCost('burn', { 
              walletAddress,
              includeBuffer: true 
            });
            validation.feeEstimation = feeEstimation;
            
            // Validate SOL balance for fees
            const solValidation = await this.validateSOLBalance(walletAddress, feeEstimation.lamports, { includeWarnings: true });
            validation.solBalanceValidation = solValidation;
            
            if (!solValidation.isValid) {
              validation.errors.push(...solValidation.errors);
              return validation;
            }
            
            validation.warnings.push(...solValidation.warnings);
            
          } catch (feeError) {
            console.error('Fee estimation failed during validation:', feeError);
            validation.errors.push(VALIDATION_CONFIG.ERROR_MESSAGES.FEE_ESTIMATION_FAILED);
            return validation;
          }
        }
        
        // Transaction simulation for additional validation
        if (includeSimulation) {
          try {
            const walletPublicKey = new PublicKey(walletAddress);
            const associatedTokenAddress = await getAssociatedTokenAddress(
              this.mintPublicKey,
              walletPublicKey
            );
            
            // Create simulation transaction
            const transaction = new Transaction();
            const rawAmount = Math.floor(costSoFar * Math.pow(10, this.mintInfo.decimals));
            
            transaction.add(
              createBurnInstruction(
                associatedTokenAddress,
                this.mintPublicKey,
                walletPublicKey,
                BigInt(rawAmount)
              )
            );
            
            // Set blockhash and fee payer for simulation
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletPublicKey;
            
            // Run simulation
            const simulation = await Promise.race([
              this.connection.simulateTransaction(transaction, {
                sigVerify: false,
                replaceRecentBlockhash: true
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Simulation timeout')), VALIDATION_CONFIG.FEE_SIMULATION_TIMEOUT)
              )
            ]);
            
            validation.simulation = {
              success: !simulation.value.err,
              err: simulation.value.err,
              logs: simulation.value.logs,
              fee: simulation.value.fee
            };
            
            if (simulation.value.err) {
              validation.errors.push(`${VALIDATION_CONFIG.ERROR_MESSAGES.SIMULATION_FAILED}: ${JSON.stringify(simulation.value.err)}`);
              return validation;
            }
            
          } catch (simError) {
            console.error('Transaction simulation failed during validation:', simError);
            validation.warnings.push(`Simulation warning: ${simError.message}`);
            // Don't fail validation due to simulation issues, just warn
          }
        }
        
        // Set validation results
        validation.isValid = true;
        validation.canBurn = true;
        validation.votesToPurchase = votesToPurchase;
        validation.actualCost = costSoFar;
        validation.nextVoteCost = currentVoteIndex <= MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES ? 
          MLGTokenManager.BURN_TO_VOTE_CONFIG.VOTE_COSTS[currentVoteIndex] : null;
        
        // Add warnings if burn amount exceeds optimal cost
        if (burnAmount > costSoFar) {
          const excess = burnAmount - costSoFar;
          validation.warnings.push(`Excess burn amount: ${excess} MLG will not be used. Optimal amount: ${costSoFar} MLG`);
        }
        
        return validation;
      })();
      
      // Apply validation timeout
      const result = await Promise.race([
        validationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(VALIDATION_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR)), VALIDATION_CONFIG.VALIDATION_TIMEOUT)
        )
      ]);
      
      result.validationDuration = Date.now() - validationStart;
      return result;

    } catch (error) {
      console.error('Burn-to-vote validation failed:', error);
      validation.errors.push(`Validation error: ${error.message}`);
      validation.validationDuration = Date.now() - validationStart;
      return validation;
    }
  }

  /**
   * Get comprehensive balance status with warnings and fee estimates
   * @param {string} walletAddress - Wallet address to check
   * @param {Object} options - Status options
   * @returns {Promise<{mlgBalance: Object, solBalance: Object, feeEstimate: Object, status: string, warnings: Array}>}
   */
  async getBalanceStatus(walletAddress, options = {}) {
    const { includeWarnings = true, estimateFees = true } = options;
    
    const status = {
      mlgBalance: null,
      solBalance: null,
      feeEstimate: null,
      status: 'unknown',
      warnings: [],
      errors: [],
      timestamp: Date.now()
    };
    
    try {
      // Get MLG balance
      const mlgBalance = await this.getTokenBalance(walletAddress);
      status.mlgBalance = mlgBalance;
      
      // Get SOL balance
      const solBalance = await this.getSOLBalance(walletAddress);
      status.solBalance = solBalance;
      
      // Get fee estimate if requested
      if (estimateFees) {
        try {
          const feeEstimate = await this.estimateTransactionCost('burn', { 
            walletAddress,
            includeBuffer: true 
          });
          status.feeEstimate = feeEstimate;
        } catch (feeError) {
          status.warnings.push('Unable to estimate transaction fees');
        }
      }
      
      // Determine overall status
      if (!mlgBalance.hasAccount) {
        status.status = 'no_token_account';
        status.errors.push('No MLG token account found');
      } else if (mlgBalance.balance <= VALIDATION_CONFIG.MLG_CRITICAL_THRESHOLD) {
        status.status = 'critical_low_mlg';
        status.warnings.push(`Critical: MLG balance is very low (${mlgBalance.balance} MLG)`);
      } else if (solBalance.balance <= VALIDATION_CONFIG.SOL_CRITICAL_THRESHOLD) {
        status.status = 'critical_low_sol';
        status.warnings.push(`Critical: SOL balance is very low (${solBalance.balance} SOL)`);
      } else if (mlgBalance.balance <= VALIDATION_CONFIG.MLG_WARNING_THRESHOLD) {
        status.status = 'low_mlg';
        status.warnings.push(`Warning: MLG balance is low (${mlgBalance.balance} MLG)`);
      } else if (solBalance.balance <= VALIDATION_CONFIG.SOL_WARNING_THRESHOLD) {
        status.status = 'low_sol';
        status.warnings.push(`Warning: SOL balance is low (${solBalance.balance} SOL)`);
      } else {
        status.status = 'healthy';
      }
      
      return status;
      
    } catch (error) {
      console.error('Balance status check failed:', error);
      status.status = 'error';
      status.errors.push(`Status check failed: ${error.message}`);
      return status;
    }
  }

  /**
   * Get burn-to-vote status for a wallet
   * @param {string} walletAddress - User's wallet address
   * @returns {Object} - Burn-to-vote status information
   */
  getBurnToVoteStatus(walletAddress) {
    const burnTracker = this._createBurnTracker();
    const dailyData = burnTracker.getDailyBurnData(walletAddress);
    
    return {
      dailyVotesUsed: dailyData.votesUsed,
      remainingVotes: burnTracker.getRemainingVotes(walletAddress),
      nextVoteCost: burnTracker.getNextVoteCost(walletAddress),
      totalBurnedToday: dailyData.totalBurned,
      transactionsToday: dailyData.transactions.length,
      voteCosts: MLGTokenManager.BURN_TO_VOTE_CONFIG.VOTE_COSTS.slice(1), // Remove index 0
      maxDailyVotes: MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES,
      resetTime: this._getNextResetTime()
    };
  }

  /**
   * Calculate total cost for purchasing multiple votes with enhanced breakdown
   * @param {string} walletAddress - User's wallet address
   * @param {number} votesToPurchase - Number of votes to purchase
   * @param {Object} options - Calculation options
   * @returns {Object} - Detailed cost calculation result
   */
  calculateBurnCostForVotes(walletAddress, votesToPurchase, options = {}) {
    const { includeNetworkFees = false, includeSavings = true } = options;
    const burnTracker = this._createBurnTracker();
    const dailyData = burnTracker.getDailyBurnData(walletAddress);
    const remainingVotes = burnTracker.getRemainingVotes(walletAddress);
    
    if (votesToPurchase > remainingVotes) {
      return {
        isValid: false,
        error: `Cannot purchase ${votesToPurchase} votes. Only ${remainingVotes} votes remaining today.`,
        remainingVotes,
        maxPurchasable: remainingVotes
      };
    }
    
    if (votesToPurchase > MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_SINGLE_VOTE_PURCHASE) {
      return {
        isValid: false,
        error: `Maximum ${MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_SINGLE_VOTE_PURCHASE} votes per transaction.`,
        maxAllowed: MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_SINGLE_VOTE_PURCHASE
      };
    }
    
    let totalCost = 0;
    const breakdown = [];
    const voteCostDetails = [];
    
    for (let i = 1; i <= votesToPurchase; i++) {
      const voteIndex = dailyData.votesUsed + i;
      const cost = MLGTokenManager.BURN_TO_VOTE_CONFIG.VOTE_COSTS[voteIndex];
      totalCost += cost;
      
      breakdown.push({ 
        voteNumber: i, 
        absoluteVoteNumber: voteIndex,
        cost,
        cumulativeCost: totalCost
      });
      
      voteCostDetails.push(`Vote ${voteIndex}: ${cost} MLG`);
    }
    
    const result = {
      isValid: true,
      totalCost,
      breakdown,
      votesToPurchase,
      remainingAfter: remainingVotes - votesToPurchase,
      costDetails: voteCostDetails.join(', '),
      dailyVotesUsed: dailyData.votesUsed,
      nextResetTime: this._getNextResetTime()
    };
    
    // Add network fee estimation if requested
    if (includeNetworkFees) {
      result.networkFee = {
        sol: MLGTokenManager.BURN_TO_VOTE_CONFIG.ESTIMATED_BURN_FEE,
        lamports: Math.floor(MLGTokenManager.BURN_TO_VOTE_CONFIG.ESTIMATED_BURN_FEE * 1_000_000_000)
      };
    }
    
    // Calculate savings compared to buying votes individually
    if (includeSavings && votesToPurchase > 1) {
      const individualTransactionCost = votesToPurchase * (includeNetworkFees ? 
        MLGTokenManager.BURN_TO_VOTE_CONFIG.ESTIMATED_BURN_FEE : 0);
      const batchTransactionCost = includeNetworkFees ? 
        MLGTokenManager.BURN_TO_VOTE_CONFIG.ESTIMATED_BURN_FEE : 0;
      
      if (includeNetworkFees) {
        result.networkFeeSavings = {
          individual: individualTransactionCost,
          batch: batchTransactionCost,
          savings: individualTransactionCost - batchTransactionCost,
          savingsSOL: individualTransactionCost - batchTransactionCost
        };
      }
    }
    
    return result;
  }

  /**
   * Get next daily reset time
   * @private
   */
  _getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(MLGTokenManager.BURN_TO_VOTE_CONFIG.DAILY_RESET_HOUR, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Classify burn transaction errors for intelligent retry logic
   * @private
   * @param {Error} error - Transaction error
   * @returns {Object} - Error classification
   */
  _classifyBurnError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('user rejected') || message.includes('user denied')) {
      return { type: 'user_rejection', retryable: false, severity: 'info' };
    }
    
    if (message.includes('insufficient') || message.includes('balance')) {
      return { type: 'insufficient_funds', retryable: false, severity: 'error' };
    }
    
    if (message.includes('network') || message.includes('rpc') || message.includes('timeout')) {
      return { type: 'network', retryable: true, severity: 'warning' };
    }
    
    if (message.includes('blockhash') || message.includes('recent')) {
      return { type: 'stale_blockhash', retryable: true, severity: 'info' };
    }
    
    if (message.includes('simulate') || message.includes('simulation')) {
      return { type: 'simulation_failed', retryable: false, severity: 'error' };
    }
    
    return { type: 'unknown', retryable: true, severity: 'warning' };
  }
  
  /**
   * Generate unique hash for burn transaction replay protection
   * @private
   * @param {string} walletAddress - User's wallet address
   * @param {number} burnAmount - Amount being burned
   * @param {number} timestamp - Transaction timestamp
   * @returns {string} - Unique transaction hash
   */
  _generateBurnTransactionHash(walletAddress, burnAmount, timestamp) {
    const data = `${walletAddress}-${burnAmount}-${timestamp}-MLG-BURN-V2`;
    // Simple hash for demonstration - in production use proper cryptographic hash
    return btoa(data).replace(/[+/=]/g, '').substring(0, 20);
  }
  
  /**
   * Store audit trail for burn transaction
   * @private
   * @param {Object} auditTrail - Complete audit trail data
   */
  _storeAuditTrail(auditTrail) {
    try {
      const storageKey = MLGTokenManager.BURN_TO_VOTE_CONFIG.AUDIT_TRAIL_STORAGE_KEY;
      const existingData = localStorage.getItem(storageKey);
      const auditData = existingData ? JSON.parse(existingData) : [];
      
      // Add new audit trail
      auditData.push({
        ...auditTrail,
        id: this._generateBurnTransactionHash(auditTrail.walletAddress, auditTrail.requestedBurnAmount, auditTrail.timestamp)
      });
      
      // Keep only last 100 entries to prevent storage bloat
      if (auditData.length > 100) {
        auditData.splice(0, auditData.length - 100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(auditData));
    } catch (error) {
      console.warn('Failed to store audit trail:', error);
    }
  }
  
  /**
   * Get audit trail for wallet address
   * @param {string} walletAddress - Wallet address to get audit trail for
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} - Audit trail entries
   */
  getBurnAuditTrail(walletAddress, limit = 10) {
    try {
      const storageKey = MLGTokenManager.BURN_TO_VOTE_CONFIG.AUDIT_TRAIL_STORAGE_KEY;
      const existingData = localStorage.getItem(storageKey);
      const auditData = existingData ? JSON.parse(existingData) : [];
      
      return auditData
        .filter(entry => entry.walletAddress === walletAddress)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.warn('Failed to get audit trail:', error);
      return [];
    }
  }
  
  /**
   * Legacy method for backward compatibility - now uses enhanced burn-to-vote system
   * @deprecated Use burnTokensForVotes instead
   */
  async burnTokens(walletAddress, wallet, amount) {
    console.warn('burnTokens() is deprecated. Use burnTokensForVotes() for enhanced functionality.');
    
    try {
      const result = await this.burnTokensForVotes(walletAddress, wallet, amount);
      return {
        signature: result.signature,
        burnedAmount: result.burnedAmount,
        rawAmount: result.rawAmount,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error('Legacy token burn failed:', error);
      throw error;
    }
  }

  /**
   * Get SOL balance for a wallet address
   * @param {string} walletAddress - Wallet public key string
   * @param {Object} options - Query options
   * @returns {Promise<{balance: number, lamports: number, hasBalance: boolean}>}
   */
  async getSOLBalance(walletAddress, options = {}) {
    const { commitment = 'confirmed' } = options;
    
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const lamports = await this.connection.getBalance(walletPublicKey, commitment);
      const sol = lamports / 1_000_000_000;
      
      return {
        balance: parseFloat(sol.toFixed(9)),
        lamports,
        hasBalance: lamports > 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      throw new Error(`SOL balance fetch failed: ${error.message}`);
    }
  }

  /**
   * Estimate transaction fees dynamically based on network conditions
   * @param {Transaction} transaction - The transaction to estimate fees for
   * @param {Object} options - Estimation options
   * @returns {Promise<{lamports: number, sol: number, breakdown: Object, networkCongestion: string}>}
   */
  async estimateTransactionFeeDynamic(transaction, options = {}) {
    const { includeBuffer = true, simulateTransaction = true } = options;
    const estimationStart = Date.now();
    
    try {
      let estimatedLamports = 5000; // Base fee
      let networkCongestion = 'low';
      const breakdown = { base: 5000 };
      
      // Get recent prioritization fees for dynamic estimation
      try {
        const recentFees = await this.connection.getRecentPrioritizationFees({
          lockedWritableAccounts: [this.mintPublicKey]
        });
        
        if (recentFees && recentFees.length > 0) {
          const avgFee = recentFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / recentFees.length;
          
          // Determine network congestion level
          if (avgFee > 10000) {
            networkCongestion = 'high';
            estimatedLamports += Math.floor(avgFee * 0.5);
            breakdown.congestionFee = Math.floor(avgFee * 0.5);
          } else if (avgFee > 1000) {
            networkCongestion = 'medium';
            estimatedLamports += Math.floor(avgFee * 0.3);
            breakdown.congestionFee = Math.floor(avgFee * 0.3);
          }
        }
      } catch (feeError) {
        console.warn('Failed to get prioritization fees, using base estimate:', feeError);
        breakdown.warning = 'Using fallback fee estimation';
      }
      
      // Simulate transaction to get accurate fee if requested
      if (simulateTransaction && transaction) {
        try {
          const simulation = await Promise.race([
            this.connection.simulateTransaction(transaction, {
              sigVerify: false,
              replaceRecentBlockhash: true
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Simulation timeout')), VALIDATION_CONFIG.FEE_SIMULATION_TIMEOUT)
            )
          ]);
          
          if (simulation.value && !simulation.value.err) {
            // Use simulated fee if available
            const simulatedFee = simulation.value.fee || estimatedLamports;
            if (simulatedFee > estimatedLamports) {
              breakdown.simulatedFee = simulatedFee;
              estimatedLamports = simulatedFee;
            }
          }
        } catch (simError) {
          console.warn('Transaction simulation failed for fee estimation:', simError);
          breakdown.simulationError = simError.message;
        }
      }
      
      // Apply buffer for fee fluctuation
      if (includeBuffer) {
        const bufferMultiplier = networkCongestion === 'high' ? 
          VALIDATION_CONFIG.NETWORK_CONGESTION_MULTIPLIER : 
          MLGTokenManager.BURN_TO_VOTE_CONFIG.FEE_BUFFER_MULTIPLIER;
        
        const buffer = Math.ceil(estimatedLamports * (bufferMultiplier - 1));
        estimatedLamports += buffer;
        breakdown.buffer = buffer;
        breakdown.bufferMultiplier = bufferMultiplier;
      }
      
      const sol = estimatedLamports / 1_000_000_000;
      
      return {
        lamports: estimatedLamports,
        sol: parseFloat(sol.toFixed(9)),
        breakdown,
        networkCongestion,
        estimationDuration: Date.now() - estimationStart,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Dynamic fee estimation failed:', error);
      return {
        lamports: 10000,
        sol: 0.00001,
        breakdown: { fallback: 10000, error: error.message },
        networkCongestion: 'unknown',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Estimate SOL cost for token operations with enhanced accuracy
   * @param {string} operation - Operation type ('burn', 'createAccount')
   * @param {Object} options - Estimation options
   * @returns {Promise<{lamports: number, sol: number, breakdown: Object}>}
   */
  async estimateTransactionCost(operation = 'burn', options = {}) {
    const { includeBuffer = true, walletAddress = null } = options;
    
    try {
      let estimatedLamports = 5000; // Base transaction fee
      const breakdown = { base: 5000 };
      
      // Create a mock transaction for more accurate estimation
      if (walletAddress && VALIDATION_CONFIG.DYNAMIC_FEE_ESTIMATION) {
        try {
          const transaction = new Transaction();
          const walletPublicKey = new PublicKey(walletAddress);
          
          // Add relevant instruction based on operation
          if (operation === 'burn' && this.mintPublicKey) {
            const associatedTokenAddress = await getAssociatedTokenAddress(
              this.mintPublicKey,
              walletPublicKey
            );
            
            // Add mock burn instruction for fee estimation
            transaction.add(
              createBurnInstruction(
                associatedTokenAddress,
                this.mintPublicKey,
                walletPublicKey,
                BigInt(1) // Minimal amount for estimation
              )
            );
          }
          
          // Set recent blockhash
          const { blockhash } = await this.connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = walletPublicKey;
          
          // Get dynamic fee estimation
          const dynamicEstimate = await this.estimateTransactionFeeDynamic(transaction, options);
          return dynamicEstimate;
          
        } catch (dynamicError) {
          console.warn('Dynamic fee estimation failed, using static estimation:', dynamicError);
        }
      }
      
      // Fallback to static estimation
      switch (operation) {
        case 'burn':
          estimatedLamports = 5000; // Simple burn instruction
          breakdown.burnInstruction = 0; // No additional cost for burn
          break;
        case 'createAccount':
          const rentExempt = 2039280; // Rent exemption for token account
          estimatedLamports = 5000 + rentExempt;
          breakdown.accountCreation = 5000;
          breakdown.rentExemption = rentExempt;
          break;
        case 'burnWithRetry':
          estimatedLamports = 5000 * MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_RETRIES;
          breakdown.maxRetries = MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_RETRIES;
          break;
        default:
          estimatedLamports = 10000; // Conservative estimate
          breakdown.conservative = 10000;
      }
      
      // Apply buffer for fee fluctuation
      if (includeBuffer) {
        const buffer = Math.ceil(estimatedLamports * (MLGTokenManager.BURN_TO_VOTE_CONFIG.FEE_BUFFER_MULTIPLIER - 1));
        estimatedLamports += buffer;
        breakdown.buffer = buffer;
      }
      
      const sol = estimatedLamports / 1_000_000_000;
      return {
        lamports: estimatedLamports,
        sol: parseFloat(sol.toFixed(9)),
        breakdown,
        operation,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to estimate transaction cost:', error);
      return { 
        lamports: 10000, 
        sol: 0.00001, 
        breakdown: { fallback: 10000 }, 
        error: error.message 
      };
    }
  }

  /**
   * Get token mint information
   * @returns {Object} - Token mint details
   */
  getTokenInfo() {
    if (!this.isInitialized || !this.mintInfo) {
      return null;
    }

    return {
      mintAddress: this.mintPublicKey.toString(),
      decimals: this.mintInfo.decimals,
      supply: this.mintInfo.supply.toString(),
      isInitialized: this.mintInfo.isInitialized,
      freezeAuthority: this.mintInfo.freezeAuthority?.toString() || null,
      mintAuthority: this.mintInfo.mintAuthority?.toString() || null
    };
  }

  // ===================================================================
  // DAILY EARNING SYSTEM - Community Action Rewards
  // ===================================================================

  /**
   * Earn MLG tokens through community actions with comprehensive validation
   * @param {string} walletAddress - User's wallet public key
   * @param {string} actionType - Type of community action (DAILY_VOTING, CONTENT_SUBMISSION, etc.)
   * @param {Object} actionData - Action-specific data and metadata
   * @param {Object} options - Earning options
   * @returns {Promise<{success: boolean, earned: number, details: Object}>}
   */
  async earnTokensForAction(walletAddress, actionType, actionData = {}, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized. Call initialize() first.');
      }

      // Validate wallet address
      const walletPublicKey = new PublicKey(walletAddress);
      
      const {
        simulateEarning = false,
        skipValidation = false,
        customReward = null
      } = options;

      const earningTracker = this._createEarningTracker();
      
      // Pre-validation checks
      if (!skipValidation) {
        const validation = await this.validateEarningAction(walletAddress, actionType, actionData);
        if (!validation.allowed) {
          return {
            success: false,
            error: validation.reason,
            details: validation,
            earned: 0
          };
        }
      }

      // Determine reward amount
      let rewardAmount = customReward;
      if (!rewardAmount) {
        rewardAmount = this._calculateActionReward(actionType, actionData);
      }

      if (rewardAmount <= 0) {
        return {
          success: false,
          error: 'No reward available for this action',
          earned: 0
        };
      }

      // Simulate earning if requested
      if (simulateEarning) {
        const simulationResult = this._simulateEarning(walletAddress, actionType, rewardAmount, actionData);
        return {
          success: true,
          earned: simulationResult.earned,
          simulation: true,
          details: simulationResult
        };
      }

      // Record the earning
      const earningResult = earningTracker.recordEarning(walletAddress, actionType, rewardAmount, {
        ...actionData,
        timestamp: Date.now(),
        walletAddress: walletAddress,
        ipHash: this._generateAnonymousHash(), // Anti-gaming measure
        actionId: `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      if (!earningResult.success) {
        throw new Error(earningResult.error);
      }

      // Auto-distribute if enabled and threshold met
      let distributionResult = null;
      if (MLGTokenManager.DAILY_EARNING_CONFIG.AUTO_DISTRIBUTE_EARNINGS && 
          earningResult.totalDailyEarned >= MLGTokenManager.DAILY_EARNING_CONFIG.BATCH_DISTRIBUTION_THRESHOLD) {
        
        // Add delay before distribution to prevent abuse
        if (MLGTokenManager.DAILY_EARNING_CONFIG.DISTRIBUTION_DELAY_MS > 0) {
          await new Promise(resolve => setTimeout(resolve, MLGTokenManager.DAILY_EARNING_CONFIG.DISTRIBUTION_DELAY_MS));
        }
        
        distributionResult = await this._processEarningDistribution(walletAddress, earningResult.totalDailyEarned);
      }

      // Log to audit trail
      if (MLGTokenManager.DAILY_EARNING_CONFIG.ENABLE_EARNING_AUDIT_TRAIL) {
        this._logEarningAudit(walletAddress, actionType, earningResult, distributionResult);
      }

      return {
        success: true,
        earned: earningResult.earned,
        totalDailyEarned: earningResult.totalDailyEarned,
        remainingAllowance: earningResult.remainingAllowance,
        bonusMultiplier: earningResult.bonusApplied,
        actionId: earningResult.actionId,
        streakData: earningResult.streakData,
        distributionResult,
        details: {
          actionType,
          originalReward: rewardAmount,
          finalReward: earningResult.earned,
          metadata: actionData
        }
      };

    } catch (error) {
      console.error('Failed to earn tokens for action:', error);
      return {
        success: false,
        error: error.message,
        earned: 0
      };
    }
  }

  /**
   * Validate if earning action is allowed with comprehensive checks
   * @param {string} walletAddress - User's wallet public key
   * @param {string} actionType - Type of community action
   * @param {Object} actionData - Action-specific validation data
   * @returns {Promise<Object>} - Validation result with detailed information
   */
  async validateEarningAction(walletAddress, actionType, actionData = {}) {
    try {
      const earningTracker = this._createEarningTracker();
      
      // Basic action availability check
      const availabilityCheck = earningTracker.canPerformAction(walletAddress, actionType);
      if (!availabilityCheck.allowed) {
        return availabilityCheck;
      }

      // Wallet verification checks
      if (MLGTokenManager.DAILY_EARNING_CONFIG.REQUIRE_WALLET_VERIFICATION) {
        const walletVerification = await this._verifyWalletEligibility(walletAddress);
        if (!walletVerification.eligible) {
          return {
            allowed: false,
            reason: 'WALLET_NOT_ELIGIBLE',
            details: walletVerification
          };
        }
      }

      // Anti-sybil checks
      if (MLGTokenManager.DAILY_EARNING_CONFIG.ENABLE_ANTI_SYBIL_CHECKS) {
        const sybilCheck = this._performAntiSybilCheck(walletAddress, actionType, actionData);
        if (!sybilCheck.passed) {
          return {
            allowed: false,
            reason: 'SYBIL_DETECTION',
            details: sybilCheck
          };
        }
      }

      // Action-specific validation
      const actionValidation = this._validateSpecificAction(actionType, actionData);
      if (!actionValidation.valid) {
        return {
          allowed: false,
          reason: 'ACTION_VALIDATION_FAILED',
          details: actionValidation
        };
      }

      // Calculate potential reward
      const potentialReward = this._calculateActionReward(actionType, actionData);
      const dailyData = earningTracker.getDailyEarningData(walletAddress);
      const finalReward = Math.min(potentialReward, MLGTokenManager.DAILY_EARNING_CONFIG.MAX_DAILY_EARNINGS - dailyData.totalEarned);

      return {
        allowed: true,
        potentialReward,
        finalReward,
        dailyProgress: {
          earned: dailyData.totalEarned,
          limit: MLGTokenManager.DAILY_EARNING_CONFIG.MAX_DAILY_EARNINGS,
          remaining: MLGTokenManager.DAILY_EARNING_CONFIG.MAX_DAILY_EARNINGS - dailyData.totalEarned
        },
        streakInfo: dailyData.streakData,
        nextActions: this._getRecommendedActions(walletAddress, dailyData)
      };

    } catch (error) {
      console.error('Failed to validate earning action:', error);
      return {
        allowed: false,
        reason: 'VALIDATION_ERROR',
        error: error.message
      };
    }
  }

  /**
   * Get earning opportunities and status for wallet
   * @param {string} walletAddress - User's wallet public key
   * @returns {Promise<Object>} - Earning opportunities and statistics
   */
  async getEarningOpportunities(walletAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized');
      }

      const earningTracker = this._createEarningTracker();
      const opportunities = earningTracker.getEarningOpportunities(walletAddress);
      const stats = earningTracker.getEarningStats(walletAddress, 30);
      const history = earningTracker.getEarningHistory(walletAddress, 7);

      // Add wallet balance context
      const balanceInfo = await this.getTokenBalance(walletAddress);

      return {
        ...opportunities,
        statistics: stats,
        recentHistory: history,
        walletBalance: {
          current: balanceInfo.balance,
          hasAccount: balanceInfo.hasAccount
        },
        configuration: {
          maxDailyEarnings: MLGTokenManager.DAILY_EARNING_CONFIG.MAX_DAILY_EARNINGS,
          actionRewards: MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS,
          cooldowns: MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_COOLDOWNS,
          bonusMultipliers: {
            weekend: MLGTokenManager.DAILY_EARNING_CONFIG.WEEKEND_BONUS_MULTIPLIER,
            event: MLGTokenManager.DAILY_EARNING_CONFIG.EVENT_BONUS_MULTIPLIER
          }
        },
        systemStatus: {
          autoDistribution: MLGTokenManager.DAILY_EARNING_CONFIG.AUTO_DISTRIBUTE_EARNINGS,
          auditTrailEnabled: MLGTokenManager.DAILY_EARNING_CONFIG.ENABLE_EARNING_AUDIT_TRAIL,
          antiSybilEnabled: MLGTokenManager.DAILY_EARNING_CONFIG.ENABLE_ANTI_SYBIL_CHECKS
        }
      };

    } catch (error) {
      console.error('Failed to get earning opportunities:', error);
      return {
        opportunities: [],
        error: error.message
      };
    }
  }

  /**
   * Get detailed earning statistics for wallet
   * @param {string} walletAddress - User's wallet public key
   * @param {number} days - Number of days to include in statistics
   * @returns {Promise<Object>} - Comprehensive earning statistics
   */
  async getEarningStatistics(walletAddress, days = 30) {
    try {
      const earningTracker = this._createEarningTracker();
      const stats = earningTracker.getEarningStats(walletAddress, days);
      const history = earningTracker.getEarningHistory(walletAddress, days);

      if (!stats) {
        return { error: 'Failed to retrieve earning statistics' };
      }

      // Calculate advanced metrics
      const advancedMetrics = this._calculateAdvancedEarningMetrics(history, stats);

      return {
        ...stats,
        ...advancedMetrics,
        period: {
          days,
          startDate: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        recommendations: this._generateEarningRecommendations(stats, history)
      };

    } catch (error) {
      console.error('Failed to get earning statistics:', error);
      return { error: error.message };
    }
  }

  /**
   * Process achievement unlock and award tokens
   * @param {string} walletAddress - User's wallet public key
   * @param {Object} achievement - Achievement data
   * @returns {Promise<Object>} - Achievement processing result
   */
  async processAchievementUnlock(walletAddress, achievement) {
    try {
      const { 
        achievementId, 
        achievementType = 'BASIC', 
        description, 
        metadata = {} 
      } = achievement;

      // Prevent duplicate achievement rewards
      if (this._hasAchievementBeenProcessed(walletAddress, achievementId)) {
        return {
          success: false,
          error: 'Achievement has already been processed',
          achievementId
        };
      }

      const actionType = 'ACHIEVEMENT_UNLOCK';
      const rewardAmount = MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS.ACHIEVEMENT_UNLOCK[achievementType] || 
                          MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS.ACHIEVEMENT_UNLOCK.BASIC;

      const result = await this.earnTokensForAction(walletAddress, actionType, {
        achievementId,
        achievementType,
        description,
        ...metadata
      });

      // Mark achievement as processed
      if (result.success) {
        this._markAchievementProcessed(walletAddress, achievementId, result);
      }

      return {
        ...result,
        achievementId,
        achievementType,
        rewardAmount
      };

    } catch (error) {
      console.error('Failed to process achievement unlock:', error);
      return {
        success: false,
        error: error.message,
        achievementId: achievement.achievementId
      };
    }
  }

  /**
   * Process streak bonus rewards
   * @param {string} walletAddress - User's wallet public key
   * @param {string} streakType - Type of streak (WEEK_STREAK, MONTH_STREAK, etc.)
   * @returns {Promise<Object>} - Streak processing result
   */
  async processStreakBonus(walletAddress, streakType) {
    try {
      const earningTracker = this._createEarningTracker();
      const dailyData = earningTracker.getDailyEarningData(walletAddress);
      
      // Validate streak eligibility
      const streakValidation = this._validateStreakBonus(dailyData.streakData, streakType);
      if (!streakValidation.eligible) {
        return {
          success: false,
          error: streakValidation.reason,
          currentStreak: dailyData.streakData.currentStreak
        };
      }

      const actionType = 'STREAK_BONUS';
      const rewardAmount = MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS.STREAK_BONUSES[streakType];

      const result = await this.earnTokensForAction(walletAddress, actionType, {
        streakType,
        currentStreak: dailyData.streakData.currentStreak,
        longestStreak: dailyData.streakData.longestStreak,
        rewardTier: streakType
      });

      return {
        ...result,
        streakType,
        currentStreak: dailyData.streakData.currentStreak,
        rewardAmount
      };

    } catch (error) {
      console.error('Failed to process streak bonus:', error);
      return {
        success: false,
        error: error.message,
        streakType
      };
    }
  }

  /**
   * Batch process multiple earning actions with optimization
   * @param {string} walletAddress - User's wallet public key
   * @param {Array} actions - Array of actions to process
   * @param {Object} options - Batch processing options
   * @returns {Promise<Object>} - Batch processing results
   */
  async batchProcessEarningActions(walletAddress, actions, options = {}) {
    try {
      const { 
        validateAll = true, 
        stopOnError = false,
        maxConcurrency = 3
      } = options;

      const results = [];
      const errors = [];
      let totalEarned = 0;

      // Pre-validate all actions if requested
      if (validateAll) {
        for (const action of actions) {
          const validation = await this.validateEarningAction(
            walletAddress, 
            action.actionType, 
            action.actionData || {}
          );
          
          if (!validation.allowed && stopOnError) {
            return {
              success: false,
              error: 'Batch validation failed',
              failedAction: action,
              validationResult: validation
            };
          }
        }
      }

      // Process actions with concurrency control
      const chunks = this._chunkArray(actions, maxConcurrency);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (action) => {
          try {
            const result = await this.earnTokensForAction(
              walletAddress,
              action.actionType,
              action.actionData || {},
              action.options || {}
            );
            
            if (result.success) {
              totalEarned += result.earned;
            }
            
            return { ...result, originalAction: action };
          } catch (error) {
            const errorResult = {
              success: false,
              error: error.message,
              originalAction: action
            };
            
            if (stopOnError) {
              throw error;
            }
            
            return errorResult;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
        
        // Track errors
        chunkResults.forEach(result => {
          if (!result.success) {
            errors.push(result);
          }
        });
      }

      return {
        success: errors.length === 0 || !stopOnError,
        results,
        totalEarned,
        successCount: results.filter(r => r.success).length,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Failed to batch process earning actions:', error);
      return {
        success: false,
        error: error.message,
        totalEarned: 0
      };
    }
  }

  /**
   * Validate connection and token properties
   * @private
   */
  async _validateTokenProperties() {
    if (!this.mintInfo) {
      throw new Error('Mint info not loaded');
    }

    // Validate decimals
    if (this.mintInfo.decimals !== MLG_TOKEN_CONFIG.EXPECTED_DECIMALS) {
      console.warn(`Token decimals (${this.mintInfo.decimals}) differ from expected (${MLG_TOKEN_CONFIG.EXPECTED_DECIMALS})`);
    }

    // Validate mint is initialized
    if (!this.mintInfo.isInitialized) {
      throw new Error('Token mint is not properly initialized');
    }

    console.log('Token validation passed');
  }

  /**
   * Initialize connection pool for optimized MLG token queries
   * @private
   */
  _initializeConnectionPool() {
    try {
      const endpoints = CONFIG_MLG.TRANSACTION_CONFIG.RPC_ENDPOINTS || [];
      
      // Create multiple connections for load balancing
      this.connectionPool = endpoints.map(endpoint => {
        try {
          return createMLGTokenConnection(CURRENT_NETWORK, { endpoint });
        } catch (error) {
          console.warn('Failed to create connection for endpoint:', endpoint, error);
          return null;
        }
      }).filter(Boolean);
      
      // If no custom endpoints, use default with multiple instances
      if (this.connectionPool.length === 0) {
        for (let i = 0; i < 3; i++) {
          this.connectionPool.push(createMLGTokenConnection(CURRENT_NETWORK));
        }
      }
      
      console.log(`MLG Token Manager: Initialized ${this.connectionPool.length} RPC connections`);
    } catch (error) {
      console.error('Failed to initialize connection pool:', error);
      this.connectionPool = [this.connection];
    }
  }

  /**
   * Get the next healthy connection from the pool
   * @returns {Connection} - Healthy RPC connection
   */
  async _getHealthyConnection() {
    const now = Date.now();
    
    // Perform health check if needed
    if (now - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
      await this._performHealthChecks();
      this.lastHealthCheck = now;
    }
    
    // Find healthy connection
    for (let i = 0; i < this.connectionPool.length; i++) {
      const connection = this.connectionPool[this.currentConnectionIndex];
      const isHealthy = this.connectionHealth.get(this.currentConnectionIndex);
      
      if (isHealthy !== false) {
        return connection;
      }
      
      // Move to next connection
      this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.connectionPool.length;
    }
    
    // Fallback to primary connection
    return this.connection;
  }

  /**
   * Perform health checks on all connections
   * @private
   */
  async _performHealthChecks() {
    const healthPromises = this.connectionPool.map(async (connection, index) => {
      try {
        const start = Date.now();
        const slot = await connection.getSlot('confirmed');
        const latency = Date.now() - start;
        
        this.connectionHealth.set(index, {
          healthy: true,
          latency,
          lastCheck: Date.now(),
          slot
        });
        
        return { index, healthy: true, latency };
      } catch (error) {
        this.connectionHealth.set(index, {
          healthy: false,
          error: error.message,
          lastCheck: Date.now()
        });
        
        return { index, healthy: false, error: error.message };
      }
    });
    
    const results = await Promise.allSettled(healthPromises);
    const healthyConnections = results.filter(r => r.status === 'fulfilled' && r.value.healthy).length;
    
    console.log(`Health check completed: ${healthyConnections}/${this.connectionPool.length} connections healthy`);
  }

  /**
   * Optimized token balance query with connection failover
   * @param {string} walletAddress - User's wallet public key
   * @returns {Promise<{balance: number, raw: string, hasAccount: boolean}>}
   */
  async getTokenBalanceOptimized(walletAddress) {
    let lastError;
    
    // Try up to 3 different connections
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const connection = await this._getHealthyConnection();
        return await this._getTokenBalanceWithConnection(walletAddress, connection);
      } catch (error) {
        lastError = error;
        console.warn(`Token balance attempt ${attempt + 1} failed:`, error.message);
        
        // Mark current connection as unhealthy
        this.connectionHealth.set(this.currentConnectionIndex, { healthy: false });
        this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.connectionPool.length;
      }
    }
    
    throw lastError || new Error('All connection attempts failed for token balance query');
  }

  /**
   * Internal method to get token balance with specific connection
   * @private
   */
  async _getTokenBalanceWithConnection(walletAddress, connection) {
    if (!this.isInitialized) {
      throw new Error('Token manager not initialized. Call initialize() first.');
    }

    const walletPublicKey = new PublicKey(walletAddress);
    
    // Get associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      this.mintPublicKey,
      walletPublicKey
    );

    try {
      // Get token account info with optimized connection
      const tokenAccount = await getAccount(
        connection,
        associatedTokenAddress,
        'confirmed' // Use confirmed for faster response
      );

      const rawBalance = tokenAccount.amount.toString();
      const balance = Number(rawBalance) / Math.pow(10, this.mintInfo.decimals);

      return {
        balance,
        raw: rawBalance,
        hasAccount: true,
        associatedTokenAddress: associatedTokenAddress.toString()
      };
    } catch (error) {
      // Account doesn't exist
      if (error.name === 'TokenAccountNotFoundError') {
        return {
          balance: 0,
          raw: '0',
          hasAccount: false,
          associatedTokenAddress: associatedTokenAddress.toString()
        };
      }
      throw error;
    }
  }

  /**
   * Check if connection is healthy
   * @returns {Promise<boolean>}
   */
  async isConnectionHealthy() {
    try {
      const connection = await this._getHealthyConnection();
      const version = await connection.getVersion();
      const slot = await connection.getSlot();
      return version && slot > 0;
    } catch (error) {
      console.error('Connection health check failed:', error);
      return false;
    }
  }

  /**
   * Verify MLG token contract deployment and properties
   * @returns {Promise<{isValid: boolean, tokenInfo: Object, error?: string}>}
   */
  async verifyMLGTokenContract() {
    try {
      const mintAddress = TOKEN_PROGRAMS.MLG_TOKEN_MINT;
      
      if (mintAddress !== '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL') {
        return {
          isValid: false,
          tokenInfo: null,
          error: 'Invalid MLG token mint address configured'
        };
      }

      // Initialize if not already done
      if (!this.isInitialized) {
        const initResult = await this.initialize(mintAddress);
        if (!initResult) {
          return {
            isValid: false,
            tokenInfo: null,
            error: 'Failed to initialize MLG token manager'
          };
        }
      }

      const tokenInfo = this.getTokenInfo();
      
      // Verify basic token properties
      const validationChecks = {
        hasValidMint: tokenInfo && tokenInfo.mintAddress === mintAddress,
        isInitialized: tokenInfo && tokenInfo.isInitialized,
        hasSupply: tokenInfo && tokenInfo.supply && tokenInfo.supply !== '0',
        hasCorrectDecimals: tokenInfo && tokenInfo.decimals === MLG_TOKEN_CONFIG.EXPECTED_DECIMALS
      };

      const isValid = Object.values(validationChecks).every(check => check);

      return {
        isValid,
        tokenInfo: {
          ...tokenInfo,
          validationChecks,
          verifiedAt: new Date().toISOString(),
          network: CURRENT_NETWORK
        },
        error: isValid ? null : 'Token validation failed'
      };
    } catch (error) {
      console.error('MLG token contract verification failed:', error);
      return {
        isValid: false,
        tokenInfo: null,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive token transaction history with tracking and categorization
   * @param {string} walletAddress - User's wallet public key
   * @param {Object} options - History options
   * @returns {Promise<Array>} - Comprehensive transaction history
   */
  async getTokenTransactionHistory(walletAddress, options = {}) {
    const {
      limit = TRANSACTION_HISTORY_CONFIG.DEFAULT_HISTORY_LIMIT,
      useCache = true,
      includeMetadata = true,
      categorize = true,
      sortBy = 'blockTime',
      sortOrder = 'desc',
      filters = {}
    } = options;

    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized');
      }

      // Check cache first
      if (useCache) {
        const cached = this._getTransactionHistoryFromCache(walletAddress, { limit, filters });
        if (cached && cached.length > 0) {
          return this._formatTransactionHistory(cached, { categorize, includeMetadata });
        }
      }

      // Fetch fresh transaction history
      const history = await this._fetchTransactionHistory(walletAddress, {
        limit,
        includeMetadata,
        categorize
      });

      // Apply filters
      const filteredHistory = this._applyTransactionFilters(history, filters);

      // Sort transactions
      const sortedHistory = this._sortTransactionHistory(filteredHistory, sortBy, sortOrder);

      // Update cache
      this._updateTransactionHistoryCache(walletAddress, history);

      return sortedHistory;
    } catch (error) {
      console.error('Failed to get token transaction history:', error);
      throw error;
    }
  }

  /**
   * Fetch comprehensive transaction history from blockchain
   * @private
   * @param {string} walletAddress - Wallet address
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} - Raw transaction history
   */
  async _fetchTransactionHistory(walletAddress, options = {}) {
    const {
      limit = TRANSACTION_HISTORY_CONFIG.DEFAULT_HISTORY_LIMIT,
      includeMetadata = true,
      categorize = true
    } = options;

    const walletPublicKey = new PublicKey(walletAddress);
    const associatedTokenAddress = await getAssociatedTokenAddress(
      this.mintPublicKey,
      walletPublicKey
    );

    // Get transaction signatures with enhanced parameters
    const signatureOptions = {
      limit: Math.min(limit, TRANSACTION_HISTORY_CONFIG.MAX_HISTORY_LIMIT),
      commitment: 'confirmed'
    };

    const signatures = await this.connection.getSignaturesForAddress(
      associatedTokenAddress,
      signatureOptions
    );

    const transactions = [];
    const batchSize = 10; // Process in batches to avoid rate limiting
    
    for (let i = 0; i < signatures.length; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);
      const batchPromises = batch.map(async (sigInfo) => {
        try {
          return await this._parseTransactionDetails(sigInfo, {
            walletAddress,
            associatedTokenAddress: associatedTokenAddress.toString(),
            includeMetadata,
            categorize
          });
        } catch (error) {
          console.warn('Failed to parse transaction:', sigInfo.signature, error);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          transactions.push(result.value);
        }
      });

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < signatures.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return transactions;
  }

  /**
   * Parse comprehensive transaction details with categorization
   * @private
   * @param {Object} sigInfo - Signature information
   * @param {Object} options - Parse options
   * @returns {Promise<Object>} - Parsed transaction details
   */
  async _parseTransactionDetails(sigInfo, options = {}) {
    const {
      walletAddress,
      associatedTokenAddress,
      includeMetadata = true,
      categorize = true
    } = options;

    // Check transaction cache first
    const cachedTx = this.transactionCache.get(sigInfo.signature);
    if (cachedTx && cachedTx.walletAddress === walletAddress) {
      return cachedTx;
    }

    // Fetch transaction details
    const tx = await this.connection.getTransaction(sigInfo.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });

    if (!tx || !tx.meta) {
      return null;
    }

    // Basic transaction info
    const parsedTx = {
      signature: sigInfo.signature,
      slot: sigInfo.slot,
      blockTime: sigInfo.blockTime,
      confirmationStatus: sigInfo.confirmationStatus || TRANSACTION_STATUS.CONFIRMED,
      success: tx.meta.err === null,
      fee: tx.meta.fee,
      walletAddress,
      associatedTokenAddress,
      timestamp: sigInfo.blockTime ? sigInfo.blockTime * 1000 : Date.now(),
      error: tx.meta.err
    };

    // Parse token balance changes
    const balanceChanges = this._parseTokenBalanceChanges(tx.meta, associatedTokenAddress);
    if (balanceChanges) {
      parsedTx.balanceChanges = balanceChanges;
      parsedTx.amount = Math.abs(balanceChanges.change);
      parsedTx.direction = balanceChanges.change > 0 ? 'in' : 'out';
    }

    // Parse instruction details
    if (includeMetadata && tx.transaction && tx.transaction.message) {
      const instructionDetails = this._parseInstructionDetails(
        tx.transaction.message,
        tx.meta,
        associatedTokenAddress
      );
      parsedTx.instructions = instructionDetails;
    }

    // Categorize transaction
    if (categorize) {
      parsedTx.category = this._categorizeTransaction(parsedTx);
      parsedTx.description = this._generateTransactionDescription(parsedTx);
    }

    // Add burn-to-vote specific data if applicable
    if (parsedTx.category === TRANSACTION_TYPES.BURN_TO_VOTE) {
      const burnData = this._extractBurnToVoteData(parsedTx);
      if (burnData) {
        parsedTx.burnToVoteData = burnData;
      }
    }

    // Cache the parsed transaction
    this.transactionCache.set(sigInfo.signature, parsedTx);

    return parsedTx;
  }

  /**
   * Parse instruction details from transaction message
   * @private
   * @param {Object} message - Transaction message
   * @param {Object} meta - Transaction metadata
   * @param {string} tokenAccountAddress - Token account address
   * @returns {Array} - Parsed instructions
   */
  _parseInstructionDetails(message, meta, tokenAccountAddress) {
    const instructions = [];

    if (message.instructions) {
      message.instructions.forEach((instruction, index) => {
        try {
          const programId = message.accountKeys[instruction.programIdIndex]?.toBase58();
          
          const parsedInstruction = {
            index,
            programId,
            accounts: instruction.accounts?.map(acc => message.accountKeys[acc]?.toBase58()) || [],
            data: instruction.data,
            parsed: null
          };

          // Try to parse known instruction types
          if (programId === TOKEN_PROGRAM_ID.toBase58()) {
            parsedInstruction.parsed = this._parseTokenInstruction(instruction, message, meta);
          }

          instructions.push(parsedInstruction);
        } catch (error) {
          console.warn('Failed to parse instruction:', error);
        }
      });
    }

    return instructions;
  }

  /**
   * Parse token program instructions
   * @private
   * @param {Object} instruction - Raw instruction
   * @param {Object} message - Transaction message
   * @param {Object} meta - Transaction metadata
   * @returns {Object} - Parsed token instruction
   */
  _parseTokenInstruction(instruction, message, meta) {
    try {
      const data = Buffer.from(instruction.data, 'base64');
      const instructionType = data[0];

      // Basic instruction type mapping
      const typeMap = {
        3: 'transfer',
        8: 'burn',
        12: 'transferChecked',
        15: 'burnChecked'
      };

      const instructionName = typeMap[instructionType] || 'unknown';
      const parsed = {
        type: instructionName,
        typeId: instructionType
      };

      // Parse amount for relevant instructions
      if ([3, 8, 12, 15].includes(instructionType)) {
        try {
          // Amount is typically at bytes 1-8 (little-endian u64)
          const amountBuffer = data.slice(1, 9);
          const amount = this._parseU64LittleEndian(amountBuffer);
          parsed.amount = amount.toString();
        } catch (error) {
          console.warn('Failed to parse instruction amount:', error);
        }
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to parse token instruction:', error);
      return { type: 'unknown', error: error.message };
    }
  }

  /**
   * Parse u64 little-endian from buffer
   * @private
   * @param {Buffer} buffer - Buffer to parse
   * @returns {BigInt} - Parsed number
   */
  _parseU64LittleEndian(buffer) {
    let result = 0n;
    for (let i = 0; i < 8; i++) {
      result += BigInt(buffer[i]) << (8n * BigInt(i));
    }
    return result;
  }

  /**
   * Categorize transaction based on its properties
   * @private
   * @param {Object} transaction - Parsed transaction
   * @returns {string} - Transaction category
   */
  _categorizeTransaction(transaction) {
    // Check for burn-to-vote transactions
    if (this._isBurnToVoteTransaction(transaction)) {
      return TRANSACTION_TYPES.BURN_TO_VOTE;
    }

    // Check for burn transactions
    if (transaction.instructions?.some(inst => 
      inst.parsed?.type && TRANSACTION_HISTORY_CONFIG.BURN_SIGNATURES.includes(inst.parsed.type)
    )) {
      return TRANSACTION_TYPES.BURN_TO_VOTE; // Most burns are likely for votes
    }

    // Check direction for transfers
    if (transaction.direction === 'in') {
      return TRANSACTION_TYPES.TRANSFER_IN;
    }
    
    if (transaction.direction === 'out') {
      return TRANSACTION_TYPES.TRANSFER_OUT;
    }

    // Check for mint/reward patterns
    if (transaction.amount > 0 && transaction.direction === 'in' && 
        transaction.instructions?.length === 1) {
      return TRANSACTION_TYPES.REWARD;
    }

    return TRANSACTION_TYPES.UNKNOWN;
  }

  /**
   * Check if transaction is a burn-to-vote transaction
   * @private
   * @param {Object} transaction - Parsed transaction
   * @returns {boolean} - Is burn-to-vote transaction
   */
  _isBurnToVoteTransaction(transaction) {
    // Check if this transaction signature exists in our burn audit trail
    if (MLGTokenManager.BURN_TO_VOTE_CONFIG.ENABLE_AUDIT_TRAIL) {
      const auditTrail = this.getBurnAuditTrail(transaction.walletAddress, 50);
      return auditTrail.some(entry => 
        entry.transactionResults?.signature === transaction.signature
      );
    }

    // Check daily burn data for transaction signature
    const burnTracker = this._createBurnTracker();
    const dailyData = burnTracker.getDailyBurnData(transaction.walletAddress);
    return dailyData.transactions?.some(tx => tx.signature === transaction.signature);
  }

  /**
   * Generate human-readable transaction description
   * @private
   * @param {Object} transaction - Parsed transaction
   * @returns {string} - Transaction description
   */
  _generateTransactionDescription(transaction) {
    const { category, amount, success, direction } = transaction;

    if (!success) {
      return 'Failed transaction';
    }

    switch (category) {
      case TRANSACTION_TYPES.BURN_TO_VOTE:
        const burnData = transaction.burnToVoteData;
        if (burnData) {
          return `Burned ${this._formatTokenAmount(amount)} MLG for ${burnData.votesGained} vote(s)`;
        }
        return `Burned ${this._formatTokenAmount(amount)} MLG tokens`;
        
      case TRANSACTION_TYPES.TRANSFER_IN:
        return `Received ${this._formatTokenAmount(amount)} MLG tokens`;
        
      case TRANSACTION_TYPES.TRANSFER_OUT:
        return `Sent ${this._formatTokenAmount(amount)} MLG tokens`;
        
      case TRANSACTION_TYPES.REWARD:
        return `Received ${this._formatTokenAmount(amount)} MLG reward`;
        
      default:
        if (direction === 'in') {
          return `Received ${this._formatTokenAmount(amount)} MLG tokens`;
        } else if (direction === 'out') {
          return `Sent ${this._formatTokenAmount(amount)} MLG tokens`;
        }
        return 'MLG token transaction';
    }
  }

  /**
   * Extract burn-to-vote specific data from transaction
   * @private
   * @param {Object} transaction - Parsed transaction
   * @returns {Object|null} - Burn-to-vote data
   */
  _extractBurnToVoteData(transaction) {
    try {
      const burnTracker = this._createBurnTracker();
      const dailyData = burnTracker.getDailyBurnData(transaction.walletAddress);
      
      const burnTransaction = dailyData.transactions?.find(tx => 
        tx.signature === transaction.signature
      );

      if (burnTransaction) {
        return {
          burnAmount: burnTransaction.burnAmount,
          votesGained: burnTransaction.votesGained,
          timestamp: burnTransaction.timestamp
        };
      }

      // Try to extract from audit trail
      const auditTrail = this.getBurnAuditTrail(transaction.walletAddress, 50);
      const auditEntry = auditTrail.find(entry => 
        entry.transactionResults?.signature === transaction.signature
      );

      if (auditEntry && auditEntry.transactionResults) {
        return {
          burnAmount: auditEntry.transactionResults.actualBurnAmount,
          votesGained: auditEntry.transactionResults.votesGained,
          timestamp: auditEntry.timestamp
        };
      }

      return null;
    } catch (error) {
      console.warn('Failed to extract burn-to-vote data:', error);
      return null;
    }
  }

  /**
   * Parse token balance changes from transaction metadata
   * @private
   */
  _parseTokenBalanceChanges(meta, tokenAccountAddress) {
    if (!meta.preTokenBalances || !meta.postTokenBalances) {
      return null;
    }

    const preBalance = meta.preTokenBalances.find(b => b.accountIndex !== undefined);
    const postBalance = meta.postTokenBalances.find(b => b.accountIndex !== undefined);

    if (!preBalance || !postBalance) {
      return null;
    }

    const preAmount = parseFloat(preBalance.uiTokenAmount.uiAmountString || '0');
    const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmountString || '0');
    const change = postAmount - preAmount;

    return {
      preBalance: preAmount,
      postBalance: postAmount,
      change,
      decimals: preBalance.uiTokenAmount.decimals
    };
  }

  /**
   * Get connection pool status
   * @returns {Object} - Connection pool health status
   */
  getConnectionPoolStatus() {
    const healthyConnections = Array.from(this.connectionHealth.values())
      .filter(health => health.healthy === true).length;
    
    return {
      totalConnections: this.connectionPool.length,
      healthyConnections,
      currentIndex: this.currentConnectionIndex,
      lastHealthCheck: this.lastHealthCheck,
      connectionHealth: Array.from(this.connectionHealth.entries()).map(([index, health]) => ({
        index,
        ...health
      }))
    };
  }

  /**
   * Initialize real-time balance system
   * @private
   */
  _initializeBalanceSystem() {
    // Set up cache cleanup interval
    setInterval(() => {
      this._cleanupBalanceCache();
    }, BALANCE_CONFIG.CACHE_DURATION * 2);
    
    // Set up batch processing
    setInterval(() => {
      this._processBatchQueue();
    }, BALANCE_CONFIG.BATCH_TIMEOUT);
  }

  /**
   * Start real-time balance polling for a wallet
   * @param {string} walletAddress - Wallet address to monitor
   * @param {Object} options - Polling options
   * @returns {Promise<string>} - Polling ID
   */
  async startBalancePolling(walletAddress, options = {}) {
    const {
      pollInterval = BALANCE_CONFIG.DEFAULT_POLL_INTERVAL,
      autoCreateAccount = true,
      emitEvents = true
    } = options;

    try {
      if (!this.isInitialized) {
        throw new Error('Token manager not initialized');
      }

      const pollingId = `${walletAddress}_${Date.now()}`;
      
      // Stop existing polling for this wallet
      await this.stopBalancePolling(walletAddress);
      
      // Add to connected wallets
      this.connectedWallets.add(walletAddress);
      
      // Reset error count
      this.pollingErrors.delete(walletAddress);
      
      // Get initial balance
      const initialBalance = await this.getTokenBalanceRealTime(walletAddress, {
        forceRefresh: true,
        createIfMissing: autoCreateAccount
      });
      
      // Start polling interval
      const intervalId = setInterval(async () => {
        try {
          const balance = await this.getTokenBalanceRealTime(walletAddress, {
            createIfMissing: autoCreateAccount
          });
          
          // Check for balance changes
          const lastBalance = this.lastBalanceUpdate.get(walletAddress);
          if (!lastBalance || lastBalance.balance !== balance.balance) {
            this.lastBalanceUpdate.set(walletAddress, balance);
            
            if (emitEvents) {
              this._emitBalanceEvent(BALANCE_EVENTS.BALANCE_UPDATED, {
                walletAddress,
                balance,
                previousBalance: lastBalance,
                timestamp: Date.now()
              });
            }
          }
          
          // Reset error count on success
          this.pollingErrors.delete(walletAddress);
          
        } catch (error) {
          console.error(`Balance polling error for ${walletAddress}:`, error);
          
          // Handle polling errors with backoff
          const errorCount = (this.pollingErrors.get(walletAddress) || 0) + 1;
          this.pollingErrors.set(walletAddress, errorCount);
          
          if (emitEvents) {
            this._emitBalanceEvent(BALANCE_EVENTS.BALANCE_ERROR, {
              walletAddress,
              error: error.message,
              errorCount,
              timestamp: Date.now()
            });
          }
          
          // Stop polling if too many errors
          if (errorCount >= BALANCE_CONFIG.MAX_POLLING_ERRORS) {
            console.warn(`Stopping balance polling for ${walletAddress} due to repeated errors`);
            await this.stopBalancePolling(walletAddress);
          }
        }
      }, pollInterval);
      
      this.pollingIntervals.set(walletAddress, {
        intervalId,
        pollingId,
        pollInterval,
        startTime: Date.now()
      });
      
      if (emitEvents) {
        this._emitBalanceEvent(BALANCE_EVENTS.POLLING_STARTED, {
          walletAddress,
          pollingId,
          pollInterval,
          initialBalance
        });
      }
      
      return pollingId;
    } catch (error) {
      console.error('Failed to start balance polling:', error);
      throw error;
    }
  }

  /**
   * Stop balance polling for a wallet
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<boolean>} - Success status
   */
  async stopBalancePolling(walletAddress) {
    try {
      const polling = this.pollingIntervals.get(walletAddress);
      
      if (polling) {
        clearInterval(polling.intervalId);
        this.pollingIntervals.delete(walletAddress);
        this.connectedWallets.delete(walletAddress);
        this.activeWallets.delete(walletAddress);
        
        this._emitBalanceEvent(BALANCE_EVENTS.POLLING_STOPPED, {
          walletAddress,
          pollingId: polling.pollingId,
          duration: Date.now() - polling.startTime
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to stop balance polling:', error);
      return false;
    }
  }

  /**
   * Get real-time token balance with caching and optimizations
   * @param {string} walletAddress - Wallet address
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Balance information with real-time data
   */
  async getTokenBalanceRealTime(walletAddress, options = {}) {
    const {
      forceRefresh = false,
      useCache = true,
      createIfMissing = false,
      priority = 'normal'
    } = options;

    try {
      // Check cache first
      if (useCache && !forceRefresh) {
        const cached = this._getFromBalanceCache(walletAddress);
        if (cached) {
          return {
            ...cached,
            cached: true,
            cacheAge: Date.now() - cached.timestamp
          };
        }
      }

      // Use optimized connection for high-priority requests
      const connection = priority === 'high' ? 
        await this._getHealthyConnection() : this.connection;

      // Get balance with enhanced error handling
      const balance = await this._fetchBalanceWithRetry(walletAddress, connection);
      
      // Handle account creation if needed
      if (!balance.hasAccount && createIfMissing) {
        this._emitBalanceEvent(BALANCE_EVENTS.ACCOUNT_CREATED, {
          walletAddress,
          associatedTokenAddress: balance.associatedTokenAddress,
          timestamp: Date.now()
        });
      }
      
      // Enhanced balance response
      const enhancedBalance = {
        ...balance,
        walletAddress,
        timestamp: Date.now(),
        cached: false,
        source: 'realtime',
        connection: connection === this.connection ? 'primary' : 'pool'
      };
      
      // Update cache
      this._updateBalanceCache(walletAddress, enhancedBalance);
      
      return enhancedBalance;
    } catch (error) {
      console.error('Real-time balance fetch failed:', error);
      
      // Try to return cached data on error
      const cached = this._getFromBalanceCache(walletAddress);
      if (cached) {
        return {
          ...cached,
          cached: true,
          error: error.message,
          cacheAge: Date.now() - cached.timestamp
        };
      }
      
      throw error;
    }
  }

  /**
   * Batch fetch balances for multiple wallets
   * @param {Array<string>} walletAddresses - Array of wallet addresses
   * @param {Object} options - Batch options
   * @returns {Promise<Map>} - Map of wallet addresses to balance data
   */
  async getBatchBalances(walletAddresses, options = {}) {
    const {
      useCache = true,
      forceRefresh = false,
      maxConcurrent = BALANCE_CONFIG.BATCH_SIZE
    } = options;

    const results = new Map();
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < walletAddresses.length; i += maxConcurrent) {
      batches.push(walletAddresses.slice(i, i + maxConcurrent));
    }
    
    // Process batches sequentially to avoid rate limiting
    for (const batch of batches) {
      const batchPromises = batch.map(async (walletAddress) => {
        try {
          const balance = await this.getTokenBalanceRealTime(walletAddress, {
            useCache,
            forceRefresh,
            priority: 'normal'
          });
          return [walletAddress, balance];
        } catch (error) {
          return [walletAddress, { error: error.message, walletAddress }];
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const [walletAddress, data] = result.value;
          results.set(walletAddress, data);
        }
      });
      
      // Add delay between batches to prevent rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Set wallet as active (faster polling)
   * @param {string} walletAddress - Wallet address
   */
  setWalletActive(walletAddress) {
    this.activeWallets.add(walletAddress);
    
    // Update polling interval if currently polling
    const polling = this.pollingIntervals.get(walletAddress);
    if (polling && polling.pollInterval > BALANCE_CONFIG.FAST_POLL_INTERVAL) {
      this.stopBalancePolling(walletAddress);
      this.startBalancePolling(walletAddress, {
        pollInterval: BALANCE_CONFIG.FAST_POLL_INTERVAL
      });
    }
  }

  /**
   * Set wallet as inactive (slower polling)
   * @param {string} walletAddress - Wallet address
   */
  setWalletInactive(walletAddress) {
    this.activeWallets.delete(walletAddress);
    
    // Update polling interval if currently polling
    const polling = this.pollingIntervals.get(walletAddress);
    if (polling && polling.pollInterval < BALANCE_CONFIG.SLOW_POLL_INTERVAL) {
      this.stopBalancePolling(walletAddress);
      this.startBalancePolling(walletAddress, {
        pollInterval: BALANCE_CONFIG.SLOW_POLL_INTERVAL
      });
    }
  }

  /**
   * Add event listener for balance changes
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   * @returns {string} - Listener ID
   */
  onBalanceChange(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Map());
    }
    
    const listenerId = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventListeners.get(eventType).set(listenerId, callback);
    
    return listenerId;
  }

  /**
   * Remove event listener
   * @param {string} listenerId - Listener ID
   */
  offBalanceChange(listenerId) {
    for (const [eventType, listeners] of this.eventListeners) {
      if (listeners.has(listenerId)) {
        listeners.delete(listenerId);
        return true;
      }
    }
    return false;
  }

  /**
   * Get current polling status
   * @returns {Object} - Polling status information
   */
  getPollingStatus() {
    const status = {
      totalWallets: this.connectedWallets.size,
      activePolling: this.pollingIntervals.size,
      activeWallets: this.activeWallets.size,
      cacheSize: this.balanceCache.size,
      pollingWallets: Array.from(this.pollingIntervals.entries()).map(([address, polling]) => ({
        address,
        pollingId: polling.pollingId,
        pollInterval: polling.pollInterval,
        uptime: Date.now() - polling.startTime,
        isActive: this.activeWallets.has(address),
        errorCount: this.pollingErrors.get(address) || 0
      })),
      eventListeners: Object.fromEntries(
        Array.from(this.eventListeners.entries()).map(([eventType, listeners]) => 
          [eventType, listeners.size]
        )
      )
    };
    
    return status;
  }

  /**
   * Stop all balance polling
   * @returns {Promise<number>} - Number of stopped polling sessions
   */
  async stopAllPolling() {
    const walletAddresses = Array.from(this.pollingIntervals.keys());
    
    const results = await Promise.allSettled(
      walletAddresses.map(address => this.stopBalancePolling(address))
    );
    
    return results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  }

  /**
   * Clear balance cache
   */
  clearBalanceCache() {
    this.balanceCache.clear();
    this.lastBalanceUpdate.clear();
  }

  /**
   * Fetch balance with retry logic
   * @private
   */
  async _fetchBalanceWithRetry(walletAddress, connection, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this._getTokenBalanceWithConnection(walletAddress, connection);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = Math.min(
            BALANCE_CONFIG.MIN_ERROR_BACKOFF * Math.pow(BALANCE_CONFIG.ERROR_BACKOFF_MULTIPLIER, attempt),
            BALANCE_CONFIG.MAX_ERROR_BACKOFF
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get balance from cache if valid
   * @private
   */
  _getFromBalanceCache(walletAddress) {
    const cached = this.balanceCache.get(walletAddress);
    
    if (cached && (Date.now() - cached.timestamp) < BALANCE_CONFIG.CACHE_DURATION) {
      return cached;
    }
    
    return null;
  }

  /**
   * Update balance cache
   * @private
   */
  _updateBalanceCache(walletAddress, balance) {
    // Limit cache size
    if (this.balanceCache.size >= BALANCE_CONFIG.MAX_CACHE_ENTRIES) {
      const oldestKey = this.balanceCache.keys().next().value;
      this.balanceCache.delete(oldestKey);
    }
    
    this.balanceCache.set(walletAddress, balance);
  }

  /**
   * Clean up old cache entries
   * @private
   */
  _cleanupBalanceCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, value] of this.balanceCache) {
      if ((now - value.timestamp) > BALANCE_CONFIG.CACHE_DURATION * 2) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.balanceCache.delete(key));
  }

  /**
   * Process batch queue
   * @private
   */
  _processBatchQueue() {
    if (this.batchQueue.size === 0) return;
    
    // Implementation would handle batched requests here
    // For now, just clear the queue
    this.batchQueue.clear();
  }

  /**
   * Emit balance change event
   * @private
   */
  _emitBalanceEvent(eventType, data) {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return;
    
    for (const [listenerId, callback] of listeners) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in balance event listener ${listenerId}:`, error);
      }
    }
  }

  /**
   * Handle wallet connection changes
   * @param {string} walletAddress - Newly connected wallet
   * @param {Object} walletAdapter - Wallet adapter instance
   */
  async handleWalletConnection(walletAddress, walletAdapter) {
    try {
      // Add to connected wallets
      this.connectedWallets.add(walletAddress);
      
      // Check if account exists and create if needed
      const balance = await this.getTokenBalanceRealTime(walletAddress, {
        forceRefresh: true
      });
      
      if (!balance.hasAccount) {
        console.log(`Associated token account not found for ${walletAddress}`);
        
        // Auto-detect and optionally create account if configured
        if (ACCOUNT_CREATION_CONFIG.AUTO_DETECT_MISSING_ACCOUNTS) {
          this._emitAccountCreationEvent(ACCOUNT_CREATION_EVENTS.ACCOUNT_NOT_FOUND, {
            walletAddress,
            associatedTokenAddress: balance.associatedTokenAddress,
            context: 'wallet_connection',
            timestamp: Date.now()
          });
          
          // Note: Actual account creation requires user wallet interaction
          // This event can be listened to by UI components to offer account creation
          console.log(`Account creation available for ${walletAddress}. Listen to ACCOUNT_NOT_FOUND event.`);
        }
      }
      
      this._emitBalanceEvent(BALANCE_EVENTS.CONNECTION_CHANGED, {
        walletAddress,
        connected: true,
        hasTokenAccount: balance.hasAccount,
        balance: balance.balance,
        timestamp: Date.now()
      });
      
      return balance;
    } catch (error) {
      console.error('Error handling wallet connection:', error);
      throw error;
    }
  }

  /**
   * Handle wallet disconnection
   * @param {string} walletAddress - Disconnected wallet
   */
  async handleWalletDisconnection(walletAddress) {
    try {
      // Stop polling
      await this.stopBalancePolling(walletAddress);
      
      // Remove from connected wallets
      this.connectedWallets.delete(walletAddress);
      this.activeWallets.delete(walletAddress);
      
      // Clear cache for this wallet
      this.balanceCache.delete(walletAddress);
      this.lastBalanceUpdate.delete(walletAddress);
      this.pollingErrors.delete(walletAddress);
      
      this._emitBalanceEvent(BALANCE_EVENTS.CONNECTION_CHANGED, {
        walletAddress,
        connected: false,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error handling wallet disconnection:', error);
      return false;
    }
  }

  /**
   * Create associated token account with real-time feedback
   * @param {string} walletAddress - User's wallet public key
   * @param {Object} wallet - Wallet adapter instance
   * @param {Object} options - Creation options
   * @returns {Promise<{success: boolean, signature?: string, error?: string}>} - Creation result
   * @deprecated Use createAssociatedTokenAccountComprehensive for full feature support
   */
  async createAssociatedTokenAccountRealTime(walletAddress, wallet, options = {}) {
    const {
      startPollingAfterCreation = true,
      pollInterval = BALANCE_CONFIG.DEFAULT_POLL_INTERVAL,
      enableProgress = true,
      requireConfirmation = false
    } = options;

    try {
      // Use the comprehensive method with real-time features enabled
      const result = await this.createAssociatedTokenAccountComprehensive(walletAddress, wallet, {
        showProgress: enableProgress,
        requireConfirmation,
        enableNotifications: true,
        displayFeeBreakdown: true,
        simulateBeforeCreation: true,
        verifyAfterCreation: true,
        
        // Progress handler for backwards compatibility
        onProgress: (step, message, data) => {
          // Emit balance events for backwards compatibility
          this._emitBalanceEvent(BALANCE_EVENTS.BALANCE_UPDATED, {
            walletAddress,
            step,
            message,
            progress: data,
            timestamp: Date.now()
          });
        },
        
        // Success handler
        onSuccess: (creationResult) => {
          if (startPollingAfterCreation) {
            setTimeout(() => {
              this.startBalancePolling(walletAddress, {
                pollInterval,
                emitEvents: true
              });
            }, 2000);
          }
        }
      });

      // For backwards compatibility - return signature directly on success
      if (result.success && !result.alreadyExists) {
        return result.signature;
      } else if (result.success && result.alreadyExists) {
        return null; // Account already existed
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to create associated token account with real-time features:', error);
      throw error;
    }
  }

  /**
   * Add burn transaction to history cache for immediate display
   * @private
   * @param {string} walletAddress - Wallet address
   * @param {Object} burnData - Burn transaction data
   */
  _addBurnTransactionToHistory(walletAddress, burnData) {
    try {
      const existing = this.transactionHistory.get(walletAddress) || [];
      
      const burnTransaction = {
        signature: burnData.signature,
        timestamp: burnData.timestamp,
        blockTime: Math.floor(burnData.timestamp / 1000),
        amount: burnData.burnAmount,
        success: burnData.success,
        category: TRANSACTION_TYPES.BURN_TO_VOTE,
        direction: 'out',
        description: burnData.success ? 
          `Burned ${this._formatTokenAmount(burnData.burnAmount)} MLG for ${burnData.votesGained} vote(s)` :
          `Failed burn transaction: ${burnData.error}`,
        burnToVoteData: {
          burnAmount: burnData.burnAmount,
          votesGained: burnData.votesGained,
          timestamp: burnData.timestamp
        },
        walletAddress,
        confirmationStatus: burnData.success ? 'confirmed' : 'failed',
        error: burnData.error || null,
        source: 'burn_to_vote_system'
      };

      // Add to beginning of history (most recent first)
      const updatedHistory = [burnTransaction, ...existing];
      
      // Limit history size
      if (updatedHistory.length > TRANSACTION_HISTORY_CONFIG.MAX_STORED_TRANSACTIONS) {
        updatedHistory.splice(TRANSACTION_HISTORY_CONFIG.MAX_STORED_TRANSACTIONS);
      }

      this.transactionHistory.set(walletAddress, updatedHistory);
      this.lastHistoryUpdate.set(walletAddress, Date.now());

      // Emit transaction event if listeners exist
      this._emitTransactionEvent('burn_transaction_added', {
        walletAddress,
        transaction: burnTransaction,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to add burn transaction to history:', error);
    }
  }

  /**
   * Get transaction history from cache
   * @private
   * @param {string} walletAddress - Wallet address
   * @param {Object} options - Cache options
   * @returns {Array|null} - Cached transactions or null
   */
  _getTransactionHistoryFromCache(walletAddress, options = {}) {
    const { limit, filters } = options;
    const cached = this.transactionHistory.get(walletAddress);
    
    if (!cached) return null;
    
    const cacheAge = Date.now() - (this.lastHistoryUpdate.get(walletAddress) || 0);
    if (cacheAge > TRANSACTION_HISTORY_CONFIG.CACHE_DURATION) {
      return null;
    }
    
    // Apply basic filtering if needed
    let filteredCache = cached;
    if (filters && Object.keys(filters).length > 0) {
      filteredCache = this._applyTransactionFilters(cached, filters);
    }
    
    return limit ? filteredCache.slice(0, limit) : filteredCache;
  }

  /**
   * Update transaction history cache
   * @private
   * @param {string} walletAddress - Wallet address
   * @param {Array} transactions - Transaction array
   */
  _updateTransactionHistoryCache(walletAddress, transactions) {
    // Merge with existing cache to avoid losing data
    const existing = this.transactionHistory.get(walletAddress) || [];
    const existingSignatures = new Set(existing.map(tx => tx.signature));
    
    // Add new transactions
    const newTransactions = transactions.filter(tx => !existingSignatures.has(tx.signature));
    const merged = [...newTransactions, ...existing];
    
    // Sort by timestamp and limit size
    const sorted = merged.sort((a, b) => 
      (b.timestamp || (b.blockTime * 1000)) - (a.timestamp || (a.blockTime * 1000))
    );
    
    const limited = sorted.slice(0, TRANSACTION_HISTORY_CONFIG.MAX_STORED_TRANSACTIONS);
    
    this.transactionHistory.set(walletAddress, limited);
    this.lastHistoryUpdate.set(walletAddress, Date.now());
  }

  // ===================================================================
  // PRIVATE EARNING SYSTEM HELPER METHODS
  // ===================================================================

  /**
   * Calculate reward amount for specific action type
   * @private
   */
  _calculateActionReward(actionType, actionData) {
    const rewards = MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS;
    
    switch (actionType) {
      case 'DAILY_VOTING':
        return rewards.DAILY_VOTING;
        
      case 'CONTENT_SUBMISSION':
        const quality = actionData.quality || 'LOW_QUALITY';
        return rewards.CONTENT_SUBMISSION[quality] || rewards.CONTENT_SUBMISSION.LOW_QUALITY;
        
      case 'ACHIEVEMENT_UNLOCK':
        const achievementType = actionData.achievementType || 'BASIC';
        return rewards.ACHIEVEMENT_UNLOCK[achievementType] || rewards.ACHIEVEMENT_UNLOCK.BASIC;
        
      case 'STREAK_BONUS':
        const streakType = actionData.streakType || 'WEEK_STREAK';
        return rewards.STREAK_BONUSES[streakType] || 0;
        
      case 'CLAN_PARTICIPATION':
        const clanRole = actionData.clanRole || 'BASIC_MEMBER';
        return rewards.CLAN_PARTICIPATION[clanRole] || 0;
        
      default:
        return 0;
    }
  }

  /**
   * Simulate earning without actually recording it
   * @private
   */
  _simulateEarning(walletAddress, actionType, rewardAmount, actionData) {
    const earningTracker = this._createEarningTracker();
    const dailyData = earningTracker.getDailyEarningData(walletAddress);
    
    // Calculate bonuses
    const bonusMultiplier = earningTracker._calculateBonusMultiplier(actionType, actionData);
    const finalAmount = Math.floor(rewardAmount * bonusMultiplier);
    
    // Check limits
    const remainingAllowance = MLGTokenManager.DAILY_EARNING_CONFIG.MAX_DAILY_EARNINGS - dailyData.totalEarned;
    const actualAmount = Math.min(finalAmount, remainingAllowance);
    
    return {
      earned: actualAmount,
      originalReward: rewardAmount,
      bonusMultiplier,
      remainingAllowance: remainingAllowance - actualAmount,
      wouldExceedLimit: finalAmount > remainingAllowance,
      currentDailyTotal: dailyData.totalEarned,
      projectedDailyTotal: dailyData.totalEarned + actualAmount
    };
  }

  /**
   * Verify wallet eligibility for earning rewards
   * @private
   */
  async _verifyWalletEligibility(walletAddress) {
    try {
      // Check if wallet has MLG token account (basic eligibility)
      const balanceInfo = await this.getTokenBalance(walletAddress);
      
      // Check account age (simulated - in production would check blockchain history)
      const accountAge = this._getWalletAccountAge(walletAddress);
      const minAge = MLGTokenManager.DAILY_EARNING_CONFIG.MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000;
      
      if (accountAge < minAge) {
        return {
          eligible: false,
          reason: 'ACCOUNT_TOO_NEW',
          accountAge: accountAge,
          minimumAge: minAge
        };
      }
      
      return {
        eligible: true,
        hasTokenAccount: balanceInfo.hasAccount,
        currentBalance: balanceInfo.balance,
        accountAge
      };
      
    } catch (error) {
      return {
        eligible: false,
        reason: 'VERIFICATION_ERROR',
        error: error.message
      };
    }
  }

  /**
   * Perform anti-sybil checks
   * @private
   */
  _performAntiSybilCheck(walletAddress, actionType, actionData) {
    try {
      // Basic fingerprinting to detect potential sybil attacks
      const fingerprint = this._generateWalletFingerprint(walletAddress, actionData);
      
      // Check for suspicious patterns
      const suspiciousPatterns = this._detectSuspiciousPatterns(walletAddress, actionType);
      
      if (suspiciousPatterns.length > 0) {
        return {
          passed: false,
          reason: 'SUSPICIOUS_ACTIVITY',
          patterns: suspiciousPatterns,
          fingerprint
        };
      }
      
      return {
        passed: true,
        fingerprint
      };
      
    } catch (error) {
      // Fail open but log the error
      console.warn('Anti-sybil check failed:', error);
      return {
        passed: true,
        error: error.message
      };
    }
  }

  /**
   * Validate specific action requirements
   * @private
   */
  _validateSpecificAction(actionType, actionData) {
    switch (actionType) {
      case 'DAILY_VOTING':
        return this._validateVotingAction(actionData);
        
      case 'CONTENT_SUBMISSION':
        return this._validateContentSubmission(actionData);
        
      case 'ACHIEVEMENT_UNLOCK':
        return this._validateAchievementUnlock(actionData);
        
      case 'STREAK_BONUS':
        return this._validateStreakBonus(actionData);
        
      default:
        return { valid: true };
    }
  }

  /**
   * Validate voting action
   * @private
   */
  _validateVotingAction(actionData) {
    if (!actionData.voteId && !actionData.proposalId) {
      return {
        valid: false,
        reason: 'MISSING_VOTE_REFERENCE',
        message: 'Voting action must reference a vote or proposal ID'
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate content submission
   * @private
   */
  _validateContentSubmission(actionData) {
    if (!actionData.contentId && !actionData.contentHash) {
      return {
        valid: false,
        reason: 'MISSING_CONTENT_REFERENCE',
        message: 'Content submission must have content ID or hash'
      };
    }
    
    // Quality validation
    const quality = actionData.quality || 'LOW_QUALITY';
    const validQualities = ['LOW_QUALITY', 'MEDIUM_QUALITY', 'HIGH_QUALITY', 'FEATURED'];
    
    if (!validQualities.includes(quality)) {
      return {
        valid: false,
        reason: 'INVALID_QUALITY_LEVEL',
        message: `Quality must be one of: ${validQualities.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate achievement unlock
   * @private
   */
  _validateAchievementUnlock(actionData) {
    if (!actionData.achievementId) {
      return {
        valid: false,
        reason: 'MISSING_ACHIEVEMENT_ID',
        message: 'Achievement unlock must have achievement ID'
      };
    }
    
    const achievementType = actionData.achievementType || 'BASIC';
    const validTypes = ['BASIC', 'RARE', 'LEGENDARY'];
    
    if (!validTypes.includes(achievementType)) {
      return {
        valid: false,
        reason: 'INVALID_ACHIEVEMENT_TYPE',
        message: `Achievement type must be one of: ${validTypes.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate streak bonus eligibility
   * @private
   */
  _validateStreakBonus(streakData, streakType) {
    if (!streakData || !streakData.currentStreak) {
      return {
        eligible: false,
        reason: 'NO_STREAK_DATA',
        message: 'No streak data available'
      };
    }
    
    const currentStreak = streakData.currentStreak;
    
    switch (streakType) {
      case 'WEEK_STREAK':
        if (currentStreak < 7) {
          return {
            eligible: false,
            reason: 'STREAK_TOO_SHORT',
            required: 7,
            current: currentStreak
          };
        }
        break;
        
      case 'MONTH_STREAK':
        if (currentStreak < 30) {
          return {
            eligible: false,
            reason: 'STREAK_TOO_SHORT',
            required: 30,
            current: currentStreak
          };
        }
        break;
        
      default:
        return {
          eligible: false,
          reason: 'UNKNOWN_STREAK_TYPE',
          streakType
        };
    }
    
    return { eligible: true };
  }

  /**
   * Process earning distribution (placeholder for actual token minting/distribution)
   * @private
   */
  async _processEarningDistribution(walletAddress, amount) {
    try {
      // In a real implementation, this would:
      // 1. Connect to a token minting program
      // 2. Create and sign a mint transaction
      // 3. Send MLG tokens to the wallet
      
      // For now, we'll simulate the distribution
      console.log(`Processing earning distribution: ${amount} MLG to ${walletAddress}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        distributed: amount,
        walletAddress,
        timestamp: Date.now(),
        transactionId: `earn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        note: 'SIMULATED_DISTRIBUTION - Replace with actual token minting in production'
      };
      
    } catch (error) {
      console.error('Failed to process earning distribution:', error);
      return {
        success: false,
        error: error.message,
        amount,
        walletAddress
      };
    }
  }

  /**
   * Log earning activity to audit trail
   * @private
   */
  _logEarningAudit(walletAddress, actionType, earningResult, distributionResult) {
    try {
      const auditEntry = {
        timestamp: Date.now(),
        walletAddress,
        actionType,
        earned: earningResult.earned,
        bonusMultiplier: earningResult.bonusApplied,
        actionId: earningResult.actionId,
        distributionResult,
        ipHash: this._generateAnonymousHash(),
        userAgent: navigator.userAgent.substr(0, 100)
      };
      
      const storageKey = MLGTokenManager.DAILY_EARNING_CONFIG.EARNINGS_STORAGE_KEY + '_audit';
      const existingAudit = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      existingAudit.push(auditEntry);
      
      // Keep only last 1000 entries
      if (existingAudit.length > 1000) {
        existingAudit.splice(0, existingAudit.length - 1000);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingAudit));
      
    } catch (error) {
      console.error('Failed to log earning audit:', error);
    }
  }

  /**
   * Generate anonymous hash for anti-gaming
   * @private
   */
  _generateAnonymousHash() {
    // Create a simple hash based on browser characteristics without identifying info
    const data = [
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      Date.now().toString().slice(-6) // Last 6 digits of timestamp for uniqueness
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get wallet account age (simulated)
   * @private
   */
  _getWalletAccountAge(walletAddress) {
    // In production, this would check blockchain history
    // For now, simulate based on storage
    const key = `wallet_age_${walletAddress}`;
    let storedAge = localStorage.getItem(key);
    
    if (!storedAge) {
      // First time seeing this wallet, record current time
      const now = Date.now();
      localStorage.setItem(key, now.toString());
      return 0;
    }
    
    return Date.now() - parseInt(storedAge);
  }

  /**
   * Generate wallet fingerprint for sybil detection
   * @private
   */
  _generateWalletFingerprint(walletAddress, actionData) {
    const characteristics = [
      walletAddress.slice(-8), // Last 8 chars of wallet
      actionData.timestamp || Date.now(),
      this._generateAnonymousHash()
    ];
    
    return characteristics.join('_');
  }

  /**
   * Detect suspicious activity patterns
   * @private
   */
  _detectSuspiciousPatterns(walletAddress, actionType) {
    const patterns = [];
    const earningTracker = this._createEarningTracker();
    const history = earningTracker.getEarningHistory(walletAddress, 1);
    
    if (history.length > 0) {
      const todayActions = history[0].actions || [];
      
      // Check for rapid-fire actions
      const recentActions = todayActions.filter(action => 
        Date.now() - action.timestamp < 60000 // Last minute
      );
      
      if (recentActions.length > 5) {
        patterns.push('RAPID_FIRE_ACTIONS');
      }
      
      // Check for identical metadata patterns
      const uniqueMetadata = new Set(
        todayActions.map(action => JSON.stringify(action.metadata))
      );
      
      if (todayActions.length > 3 && uniqueMetadata.size === 1) {
        patterns.push('IDENTICAL_METADATA');
      }
    }
    
    return patterns;
  }

  /**
   * Check if achievement has been processed
   * @private
   */
  _hasAchievementBeenProcessed(walletAddress, achievementId) {
    try {
      const key = MLGTokenManager.DAILY_EARNING_CONFIG.ACHIEVEMENT_STORAGE_KEY;
      const processed = JSON.parse(localStorage.getItem(key) || '{}');
      
      return processed[walletAddress] && processed[walletAddress].includes(achievementId);
    } catch (error) {
      console.error('Failed to check processed achievements:', error);
      return false;
    }
  }

  /**
   * Mark achievement as processed
   * @private
   */
  _markAchievementProcessed(walletAddress, achievementId, result) {
    try {
      const key = MLGTokenManager.DAILY_EARNING_CONFIG.ACHIEVEMENT_STORAGE_KEY;
      const processed = JSON.parse(localStorage.getItem(key) || '{}');
      
      if (!processed[walletAddress]) {
        processed[walletAddress] = [];
      }
      
      processed[walletAddress].push(achievementId);
      localStorage.setItem(key, JSON.stringify(processed));
      
    } catch (error) {
      console.error('Failed to mark achievement as processed:', error);
    }
  }

  /**
   * Get recommended actions for user
   * @private
   */
  _getRecommendedActions(walletAddress, dailyData) {
    const recommendations = [];
    const remaining = MLGTokenManager.DAILY_EARNING_CONFIG.MAX_DAILY_EARNINGS - dailyData.totalEarned;
    
    if (remaining > 0) {
      // Recommend daily voting if not done
      const hasVotedToday = dailyData.actions.some(action => action.type === 'DAILY_VOTING');
      if (!hasVotedToday) {
        recommendations.push({
          action: 'DAILY_VOTING',
          reward: MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS.DAILY_VOTING,
          priority: 'high'
        });
      }
      
      // Recommend content submission
      const contentActions = dailyData.actions.filter(action => action.type === 'CONTENT_SUBMISSION');
      if (contentActions.length < 2) {
        recommendations.push({
          action: 'CONTENT_SUBMISSION',
          reward: `${MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS.CONTENT_SUBMISSION.LOW_QUALITY}-${MLGTokenManager.DAILY_EARNING_CONFIG.ACTION_REWARDS.CONTENT_SUBMISSION.FEATURED}`,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Calculate advanced earning metrics
   * @private
   */
  _calculateAdvancedEarningMetrics(history, stats) {
    const recentDays = history.slice(-7);
    const weeklyTrend = recentDays.reduce((sum, day) => sum + day.totalEarned, 0);
    
    return {
      weeklyTrend,
      averageWeekly: weeklyTrend / 7,
      mostActiveDay: history.reduce((max, day) => 
        day.totalEarned > (max.totalEarned || 0) ? day : max, {}
      ),
      consistency: stats.participationRate > 70 ? 'high' : 
                   stats.participationRate > 40 ? 'medium' : 'low'
    };
  }

  /**
   * Generate earning recommendations
   * @private
   */
  _generateEarningRecommendations(stats, history) {
    const recommendations = [];
    
    if (stats.participationRate < 50) {
      recommendations.push({
        type: 'INCREASE_PARTICIPATION',
        message: 'Consider participating more regularly to maximize earnings',
        impact: 'high'
      });
    }
    
    if (stats.currentStreak < 7) {
      recommendations.push({
        type: 'BUILD_STREAK',
        message: 'Maintain daily activity to earn streak bonuses',
        impact: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Utility function to chunk array for batch processing
   * @private
   */
  _chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export configuration and events
export { BALANCE_CONFIG, BALANCE_EVENTS };

// Export earning system configurations and events
export const EARNING_EVENTS = {
  EARNING_RECORDED: 'earning_recorded',
  DAILY_LIMIT_REACHED: 'daily_limit_reached',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_PROCESSED: 'achievement_processed',
  EARNING_DISTRIBUTED: 'earning_distributed',
  BONUS_APPLIED: 'bonus_applied'
};

// Export earning configuration
export const DAILY_EARNING_CONFIG = MLGTokenManager.DAILY_EARNING_CONFIG;

// Export singleton instance with auto-initialization
export const mlgTokenManager = new MLGTokenManager();

// Auto-initialize with the real MLG token contract address
export async function initializeMLGTokenManager() {
  try {
    console.log('Initializing MLG Token Manager with contract address: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    
    const success = await mlgTokenManager.initialize('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    
    if (success) {
      // Verify the contract deployment
      const verification = await mlgTokenManager.verifyMLGTokenContract();
      
      if (verification.isValid) {
        console.log('MLG Token Manager successfully initialized and verified');
        console.log('Token Info:', verification.tokenInfo);
        return { success: true, tokenInfo: verification.tokenInfo };
      } else {
        console.warn('MLG Token Manager initialized but verification failed:', verification.error);
        return { success: false, error: verification.error };
      }
    } else {
      console.error('Failed to initialize MLG Token Manager');
      return { success: false, error: 'Initialization failed' };
    }
  } catch (error) {
    console.error('MLG Token Manager initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Convenient method to ensure manager is ready
export async function ensureMLGTokenManagerReady() {
  if (!mlgTokenManager.isInitialized) {
    return await initializeMLGTokenManager();
  }
  
  // Verify contract is still valid
  const verification = await mlgTokenManager.verifyMLGTokenContract();
  return { success: verification.isValid, tokenInfo: verification.tokenInfo, error: verification.error };
}

// Enhanced utility functions for external use with burn-to-vote support
export const MLGTokenUtils = {
  /**
   * Format token amount for display
   * @param {number} amount - Token amount
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted amount
   */
  formatTokenAmount(amount, decimals = 2) {
    if (amount === 0) return '0';
    if (amount < 0.01) return '<0.01';
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  },

  /**
   * Validate MLG token mint address
   * @param {string} address - Address to validate
   * @returns {boolean} - Is valid address
   */
  isValidMintAddress(address) {
    try {
      new PublicKey(address);
      // Verify it's the correct MLG token mint address
      return address === '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL';
    } catch {
      return false;
    }
  },

  /**
   * Calculate vote cost in MLG tokens
   * @param {number} additionalVotes - Number of additional votes
   * @returns {number} - Cost in MLG tokens
   */
  calculateVoteCost(additionalVotes) {
    // Progressive pricing: 1 MLG for first vote, 2 for second, etc.
    let totalCost = 0;
    for (let i = 1; i <= additionalVotes; i++) {
      totalCost += i;
    }
    return totalCost;
  },

  /**
   * Enhanced validation for burn-to-vote transactions with comprehensive checks
   * @param {number} burnAmount - Amount of tokens to burn
   * @param {number} currentBalance - User's current token balance
   * @param {number} dailyVotesUsed - Votes already used today
   * @param {Object} options - Additional validation options
   * @returns {Object} - Detailed validation result
   */
  validateBurnToVote(burnAmount, currentBalance, dailyVotesUsed = 0, options = {}) {
    const { 
      checkNetworkFees = true, 
      solBalance = 0,
      strictValidation = true 
    } = options;
    
    const maxDailyExtraVotes = MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES;
    const remainingVotes = Math.max(0, maxDailyExtraVotes - dailyVotesUsed);
    const errors = [];
    const warnings = [];
    
    // Daily vote limit validation
    if (remainingVotes === 0) {
      errors.push(`Daily vote limit reached. Maximum ${maxDailyExtraVotes} extra votes per day.`);
    }

    // Amount validation
    if (burnAmount <= 0) {
      errors.push('Burn amount must be positive');
    }
    
    if (burnAmount < MLGTokenManager.BURN_TO_VOTE_CONFIG.MIN_BURN_AMOUNT) {
      errors.push(`Minimum burn amount is ${MLGTokenManager.BURN_TO_VOTE_CONFIG.MIN_BURN_AMOUNT} MLG`);
    }
    
    if (burnAmount > MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_BURN_AMOUNT) {
      errors.push(`Maximum burn amount is ${MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_BURN_AMOUNT} MLG per transaction`);
    }

    // Balance validation
    if (burnAmount > currentBalance) {
      errors.push(`Insufficient MLG balance. Available: ${this.formatTokenAmount(currentBalance)}, Required: ${this.formatTokenAmount(burnAmount)}`);
    }
    
    // Network fee validation
    if (checkNetworkFees) {
      const estimatedFee = MLGTokenManager.BURN_TO_VOTE_CONFIG.ESTIMATED_BURN_FEE;
      if (solBalance < estimatedFee) {
        errors.push(`Insufficient SOL for transaction fees. Required: ${estimatedFee} SOL, Available: ${solBalance} SOL`);
      }
    }

    // Early exit if basic validation fails
    if (errors.length > 0) {
      return {
        isValid: false,
        canBurn: false,
        errors,
        warnings,
        remainingVotes,
        votesToPurchase: 0,
        actualCost: 0
      };
    }

    // Calculate vote purchase potential
    let votesToPurchase = 0;
    let costSoFar = 0;
    let currentVoteCost = dailyVotesUsed + 1;
    const voteCostBreakdown = [];

    while (costSoFar + currentVoteCost <= burnAmount && 
           votesToPurchase < remainingVotes && 
           currentVoteCost <= MLGTokenManager.BURN_TO_VOTE_CONFIG.VOTE_COSTS.length - 1) {
      costSoFar += currentVoteCost;
      votesToPurchase++;
      voteCostBreakdown.push({ voteNumber: votesToPurchase, cost: currentVoteCost });
      currentVoteCost++;
    }

    if (votesToPurchase === 0) {
      errors.push(`Insufficient tokens for next vote. Required: ${dailyVotesUsed + 1} MLG`);
    }
    
    // Add warnings for sub-optimal usage
    if (burnAmount > costSoFar && votesToPurchase > 0) {
      const excess = burnAmount - costSoFar;
      warnings.push(`Excess burn amount: ${this.formatTokenAmount(excess)} MLG will not be used. Optimal amount: ${this.formatTokenAmount(costSoFar)} MLG`);
    }

    const nextVoteCost = currentVoteCost <= MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_DAILY_EXTRA_VOTES ? 
      MLGTokenManager.BURN_TO_VOTE_CONFIG.VOTE_COSTS[currentVoteCost] : null;

    return {
      isValid: errors.length === 0,
      canBurn: errors.length === 0 && votesToPurchase > 0,
      votesToPurchase,
      actualCost: costSoFar,
      remainingVotes,
      nextVoteCost,
      voteCostBreakdown,
      errors,
      warnings,
      estimatedNetworkFee: checkNetworkFees ? MLGTokenManager.BURN_TO_VOTE_CONFIG.ESTIMATED_BURN_FEE : null,
      maxPossibleVotes: Math.min(remainingVotes, MLGTokenManager.BURN_TO_VOTE_CONFIG.MAX_SINGLE_VOTE_PURCHASE)
    };
  },
  
  /**
   * Format token amount for display
   * @param {number} amount - Token amount
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted amount
   */
  formatTokenAmount(amount, decimals = 2) {
    if (amount === 0) return '0';
    if (amount < 0.01) return '<0.01';
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  },

  /**
   * Verify MLG token contract address
   * @param {string} address - Address to verify
   * @returns {boolean} - Is the real MLG token
   */
  verifyMLGContract(address) {
    return address === '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL';
  },

  /**
   * Get burn transaction replay protection hash
   * @param {string} walletAddress - User's wallet address
   * @param {number} burnAmount - Amount being burned
   * @param {number} timestamp - Transaction timestamp
   * @returns {string} - Unique transaction hash for replay protection
   */
  generateBurnTransactionHash(walletAddress, burnAmount, timestamp) {
    const data = `${walletAddress}-${burnAmount}-${timestamp}-MLG-BURN`;
    // Simple hash for demonstration - in production use proper cryptographic hash
    return btoa(data).replace(/[+/=]/g, '').substring(0, 16);
  },

  /**
   * Validate transaction timestamp for burn operations
   * @param {number} timestamp - Transaction timestamp
   * @returns {Object} - Validation result
   */
  validateBurnTimestamp(timestamp) {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const age = now - timestamp;

    if (age > maxAge) {
      return {
        isValid: false,
        error: 'Transaction timestamp too old. Please refresh and try again.'
      };
    }

    if (timestamp > now + 60000) { // 1 minute future tolerance
      return {
        isValid: false,
        error: 'Transaction timestamp is in the future.'
      };
    }

    return {
      isValid: true,
      age: age
    };
  },

  /**
   * Calculate optimal burn amount for desired votes
   * @param {number} desiredVotes - Number of votes user wants
   * @param {number} dailyVotesUsed - Votes already used today
   * @returns {Object} - Optimal burn calculation
   */
  calculateOptimalBurnAmount(desiredVotes, dailyVotesUsed = 0) {
    const maxDailyVotes = 4; // From BURN_TO_VOTE_CONFIG
    const remainingVotes = Math.max(0, maxDailyVotes - dailyVotesUsed);
    const votesToCalculate = Math.min(desiredVotes, remainingVotes);
    
    if (votesToCalculate === 0) {
      return {
        isValid: false,
        error: 'No votes available for purchase today',
        remainingVotes: 0
      };
    }
    
    let totalCost = 0;
    const breakdown = [];
    
    for (let i = 1; i <= votesToCalculate; i++) {
      const voteIndex = dailyVotesUsed + i;
      const cost = voteIndex; // Progressive pricing: 1, 2, 3, 4 MLG
      totalCost += cost;
      breakdown.push({ voteNumber: i, cost });
    }
    
    return {
      isValid: true,
      optimalAmount: totalCost,
      votesToReceive: votesToCalculate,
      breakdown,
      remainingVotes: remainingVotes - votesToCalculate
    };
  },

  /**
   * Estimate total burn transaction cost including network fees
   * @param {number} burnAmount - MLG tokens to burn
   * @param {Object} options - Estimation options
   * @returns {Object} - Complete cost estimation
   */
  estimateBurnTransactionCost(burnAmount, options = {}) {
    const { 
      includeSolFees = true, 
      includeRetryBuffer = true,
      currentSolPrice = null 
    } = options;
    
    const result = {
      mlgTokenCost: burnAmount,
      solFees: 0,
      totalMlgCost: burnAmount
    };
    
    if (includeSolFees) {
      const baseFee = 0.000005; // ~5000 lamports
      const buffer = includeRetryBuffer ? 0.000010 : 0; // Buffer for retries
      result.solFees = baseFee + buffer;
      
      if (currentSolPrice) {
        result.solFeesUsd = (result.solFees * currentSolPrice).toFixed(6);
      }
    }
    
    return result;
  },

  /**
   * Format burn-to-vote status for display
   * @param {Object} status - Burn status from getBurnToVoteStatus
   * @returns {Object} - Formatted status for UI
   */
  formatBurnToVoteStatus(status) {
    const {
      dailyVotesUsed,
      remainingVotes,
      nextVoteCost,
      totalBurnedToday,
      maxDailyVotes,
      voteCosts
    } = status;
    
    return {
      summary: `${dailyVotesUsed}/${maxDailyVotes} extra votes used today`,
      remainingVotes: `${remainingVotes} votes remaining`,
      nextVoteCost: nextVoteCost ? `${nextVoteCost} MLG for next vote` : 'No more votes available',
      totalBurnedToday: `${totalBurnedToday} MLG burned today`,
      votePricing: voteCosts.map((cost, index) => `Vote ${index + 1}: ${cost} MLG`).join(', '),
      canPurchaseMore: remainingVotes > 0,
      dailyLimitReached: remainingVotes === 0
    };
  },

  /**
   * Validate wallet address for burn operations
   * @param {string} walletAddress - Wallet address to validate
   * @returns {Object} - Validation result
   */
  validateWalletAddress(walletAddress) {
    if (!walletAddress) {
      return {
        isValid: false,
        error: 'Wallet address is required'
      };
    }
    
    try {
      new PublicKey(walletAddress);
      return {
        isValid: true,
        address: walletAddress
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid wallet address format'
      };
    }
  },

  // ===================================================================
  // DAILY EARNING UTILITIES
  // ===================================================================

  /**
   * Format earning amount for display
   * @param {number} amount - Earning amount
   * @param {boolean} showDecimals - Whether to show decimal places
   * @returns {string} - Formatted earning amount
   */
  formatEarningAmount(amount, showDecimals = true) {
    if (amount === 0) return '0 MLG';
    if (amount < 0.01 && showDecimals) return '<0.01 MLG';
    
    const decimals = showDecimals ? 2 : 0;
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })} MLG`;
  },

  /**
   * Calculate earning progress percentage
   * @param {number} earned - Amount earned today
   * @param {number} dailyLimit - Daily earning limit
   * @returns {Object} - Progress information
   */
  calculateEarningProgress(earned, dailyLimit = 10) {
    const percentage = Math.round((earned / dailyLimit) * 100);
    const remaining = Math.max(0, dailyLimit - earned);
    
    return {
      percentage: Math.min(percentage, 100),
      earned,
      remaining,
      dailyLimit,
      isMaxed: earned >= dailyLimit,
      progressText: `${this.formatEarningAmount(earned)} / ${this.formatEarningAmount(dailyLimit)} (${percentage}%)`
    };
  },

  /**
   * Estimate time until next earning opportunity
   * @param {string} actionType - Type of community action
   * @param {number} lastActionTime - Timestamp of last action
   * @returns {Object} - Time estimation
   */
  estimateNextEarningTime(actionType, lastActionTime = 0) {
    const cooldowns = {
      'DAILY_VOTING': 24 * 60 * 60 * 1000, // 24 hours
      'CONTENT_SUBMISSION': 4 * 60 * 60 * 1000, // 4 hours
      'ACHIEVEMENT_UNLOCK': 0, // No cooldown
      'CLAN_PARTICIPATION': 24 * 60 * 60 * 1000 // 24 hours
    };

    const cooldown = cooldowns[actionType] || 0;
    if (cooldown === 0) {
      return {
        canEarnNow: true,
        message: 'Available now'
      };
    }

    const timeSinceLastAction = Date.now() - lastActionTime;
    const timeRemaining = Math.max(0, cooldown - timeSinceLastAction);

    if (timeRemaining === 0) {
      return {
        canEarnNow: true,
        message: 'Available now'
      };
    }

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

    return {
      canEarnNow: false,
      timeRemaining,
      message: hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`,
      nextAvailableTime: new Date(Date.now() + timeRemaining)
    };
  },

  /**
   * Validate earning action data
   * @param {string} actionType - Type of community action
   * @param {Object} actionData - Action data to validate
   * @returns {Object} - Validation result
   */
  validateEarningAction(actionType, actionData = {}) {
    const validActions = ['DAILY_VOTING', 'CONTENT_SUBMISSION', 'ACHIEVEMENT_UNLOCK', 'STREAK_BONUS', 'CLAN_PARTICIPATION'];
    
    if (!validActions.includes(actionType)) {
      return {
        isValid: false,
        error: `Invalid action type. Must be one of: ${validActions.join(', ')}`
      };
    }

    switch (actionType) {
      case 'DAILY_VOTING':
        if (!actionData.voteId && !actionData.proposalId) {
          return {
            isValid: false,
            error: 'Voting action must include voteId or proposalId'
          };
        }
        break;

      case 'CONTENT_SUBMISSION':
        if (!actionData.contentId && !actionData.contentHash) {
          return {
            isValid: false,
            error: 'Content submission must include contentId or contentHash'
          };
        }
        break;

      case 'ACHIEVEMENT_UNLOCK':
        if (!actionData.achievementId) {
          return {
            isValid: false,
            error: 'Achievement unlock must include achievementId'
          };
        }
        break;
    }

    return {
      isValid: true,
      actionType,
      actionData
    };
  },

  /**
   * Calculate potential earning for action
   * @param {string} actionType - Type of community action
   * @param {Object} actionData - Action metadata
   * @param {Object} bonusFactors - Bonus multipliers
   * @returns {Object} - Earning calculation
   */
  calculatePotentialEarning(actionType, actionData = {}, bonusFactors = {}) {
    const baseRewards = {
      'DAILY_VOTING': 1,
      'CONTENT_SUBMISSION': {
        'LOW_QUALITY': 1,
        'MEDIUM_QUALITY': 2,
        'HIGH_QUALITY': 3,
        'FEATURED': 5
      },
      'ACHIEVEMENT_UNLOCK': {
        'BASIC': 1,
        'RARE': 2,
        'LEGENDARY': 3
      },
      'STREAK_BONUS': {
        'WEEK_STREAK': 2,
        'MONTH_STREAK': 5,
        'MILESTONE': 10
      },
      'CLAN_PARTICIPATION': {
        'BASIC_MEMBER': 0.5,
        'ACTIVE_MEMBER': 1,
        'CLAN_OFFICER': 2,
        'CLAN_LEADER': 3
      }
    };

    let baseReward = 0;

    switch (actionType) {
      case 'DAILY_VOTING':
        baseReward = baseRewards[actionType];
        break;
      
      case 'CONTENT_SUBMISSION':
        const quality = actionData.quality || 'LOW_QUALITY';
        baseReward = baseRewards[actionType][quality] || baseRewards[actionType]['LOW_QUALITY'];
        break;
      
      case 'ACHIEVEMENT_UNLOCK':
        const achievementType = actionData.achievementType || 'BASIC';
        baseReward = baseRewards[actionType][achievementType] || baseRewards[actionType]['BASIC'];
        break;
      
      case 'STREAK_BONUS':
        const streakType = actionData.streakType || 'WEEK_STREAK';
        baseReward = baseRewards[actionType][streakType] || 0;
        break;
      
      case 'CLAN_PARTICIPATION':
        const clanRole = actionData.clanRole || 'BASIC_MEMBER';
        baseReward = baseRewards[actionType][clanRole] || 0;
        break;
      
      default:
        baseReward = 0;
    }

    // Apply bonus multipliers
    let totalMultiplier = 1.0;
    
    if (bonusFactors.weekendBonus && this.isWeekend()) {
      totalMultiplier *= 1.2; // 20% weekend bonus
    }
    
    if (bonusFactors.eventBonus) {
      totalMultiplier *= 1.5; // 50% event bonus
    }
    
    if (bonusFactors.clanBonus && actionData.clanRole) {
      const clanBonus = baseRewards['CLAN_PARTICIPATION'][actionData.clanRole] || 0;
      totalMultiplier += (clanBonus / 10); // Convert to percentage
    }

    const finalAmount = Math.floor(baseReward * totalMultiplier);

    return {
      baseReward,
      totalMultiplier,
      finalAmount,
      bonusesApplied: {
        weekend: bonusFactors.weekendBonus && this.isWeekend(),
        event: bonusFactors.eventBonus || false,
        clan: bonusFactors.clanBonus && actionData.clanRole
      }
    };
  },

  /**
   * Check if current time is weekend
   * @returns {boolean} - True if weekend
   */
  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  },

  /**
   * Format streak information for display
   * @param {Object} streakData - Streak information
   * @returns {Object} - Formatted streak display
   */
  formatStreakInfo(streakData) {
    const { currentStreak = 0, longestStreak = 0 } = streakData;
    
    let streakLevel = 'None';
    let nextMilestone = 7;
    let progress = 0;
    
    if (currentStreak >= 30) {
      streakLevel = 'Legendary';
      nextMilestone = Math.ceil(currentStreak / 30) * 30;
    } else if (currentStreak >= 7) {
      streakLevel = 'Weekly Champion';
      nextMilestone = 30;
    } else if (currentStreak >= 3) {
      streakLevel = 'Building';
      nextMilestone = 7;
    }
    
    if (nextMilestone > currentStreak) {
      progress = Math.round((currentStreak / nextMilestone) * 100);
    }

    return {
      currentStreak,
      longestStreak,
      streakLevel,
      nextMilestone,
      progress,
      daysToMilestone: nextMilestone - currentStreak,
      displayText: currentStreak > 0 ? 
        `${currentStreak} day streak (${streakLevel})` : 
        'No current streak'
    };
  },

  /**
   * Generate earning summary for display
   * @param {Object} earningStats - Earning statistics
   * @returns {Object} - Formatted summary
   */
  generateEarningSummary(earningStats) {
    const {
      totalEarned = 0,
      totalActions = 0,
      activeDays = 0,
      currentStreak = 0,
      participationRate = 0,
      todayEarned = 0,
      todayRemaining = 10
    } = earningStats;

    const engagement = participationRate > 70 ? 'High' : 
                     participationRate > 40 ? 'Medium' : 'Low';

    return {
      totalEarned: this.formatEarningAmount(totalEarned),
      todayProgress: this.calculateEarningProgress(todayEarned, todayEarned + todayRemaining),
      streakInfo: this.formatStreakInfo({ currentStreak }),
      engagement: {
        level: engagement,
        participationRate: `${Math.round(participationRate)}%`,
        activeDays
      },
      activity: {
        totalActions,
        averageDaily: activeDays > 0 ? Math.round(totalActions / activeDays) : 0
      },
      recommendations: this.generateEarningRecommendations(earningStats)
    };
  },

  /**
   * Generate earning recommendations
   * @param {Object} stats - Earning statistics
   * @returns {Array} - Recommended actions
   */
  generateEarningRecommendations(stats) {
    const recommendations = [];
    const { participationRate = 0, currentStreak = 0, todayRemaining = 0 } = stats;

    if (todayRemaining > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Complete today\'s earning opportunities',
        reward: `Up to ${this.formatEarningAmount(todayRemaining)} remaining`,
        icon: '🎯'
      });
    }

    if (participationRate < 50) {
      recommendations.push({
        priority: 'medium',
        action: 'Increase daily participation',
        reward: 'Boost your earning potential',
        icon: '📈'
      });
    }

    if (currentStreak < 7 && currentStreak > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Build your activity streak',
        reward: `${7 - currentStreak} days to weekly bonus`,
        icon: '🔥'
      });
    }

    if (currentStreak === 0) {
      recommendations.push({
        priority: 'low',
        action: 'Start an activity streak',
        reward: 'Unlock bonus earning opportunities',
        icon: '⭐'
      });
    }

    return recommendations;
  },

  /**
   * Validate earning distribution parameters
   * @param {string} walletAddress - Recipient wallet
   * @param {number} amount - Amount to distribute
   * @returns {Object} - Validation result
   */
  validateEarningDistribution(walletAddress, amount) {
    const walletValidation = this.validateWalletAddress(walletAddress);
    if (!walletValidation.isValid) {
      return walletValidation;
    }

    if (amount <= 0) {
      return {
        isValid: false,
        error: 'Distribution amount must be positive'
      };
    }

    if (amount > 10) {
      return {
        isValid: false,
        error: 'Distribution amount exceeds daily limit (10 MLG)'
      };
    }

    return {
      isValid: true,
      walletAddress,
      amount,
      formattedAmount: this.formatEarningAmount(amount)
    };
  }
};

/* ====================================================================
 * USAGE EXAMPLES FOR MLG TOKEN EARNING SYSTEM
 * ====================================================================
 * 
 * The MLG Token Manager now includes a comprehensive daily earning system
 * that allows users to earn MLG tokens through various community actions.
 * 
 * // 1. BASIC EARNING WORKFLOW
 * 
 * // Initialize the token manager
 * await initializeMLGTokenManager();
 * 
 * // Check earning opportunities for a wallet
 * const opportunities = await mlgTokenManager.getEarningOpportunities('wallet_address');
 * console.log('Available opportunities:', opportunities);
 * 
 * // Earn tokens for daily voting
 * const votingResult = await mlgTokenManager.earnTokensForAction(
 *   'wallet_address',
 *   'DAILY_VOTING',
 *   { voteId: 'vote_123', proposalId: 'prop_456' }
 * );
 * console.log('Voting reward:', votingResult);
 * 
 * // Earn tokens for content submission
 * const contentResult = await mlgTokenManager.earnTokensForAction(
 *   'wallet_address',
 *   'CONTENT_SUBMISSION',
 *   { 
 *     contentId: 'content_789',
 *     quality: 'HIGH_QUALITY',
 *     upvotes: 15,
 *     clanRole: 'ACTIVE_MEMBER'
 *   }
 * );
 * console.log('Content submission reward:', contentResult);
 * 
 * // 2. ACHIEVEMENT PROCESSING
 * 
 * // Process achievement unlock
 * const achievementResult = await mlgTokenManager.processAchievementUnlock(
 *   'wallet_address',
 *   {
 *     achievementId: 'first_vote',
 *     achievementType: 'BASIC',
 *     description: 'Cast your first vote'
 *   }
 * );
 * console.log('Achievement reward:', achievementResult);
 * 
 * // Process streak bonus
 * const streakResult = await mlgTokenManager.processStreakBonus(
 *   'wallet_address',
 *   'WEEK_STREAK'
 * );
 * console.log('Streak bonus:', streakResult);
 * 
 * // 3. BATCH PROCESSING
 * 
 * // Process multiple actions at once
 * const batchResult = await mlgTokenManager.batchProcessEarningActions(
 *   'wallet_address',
 *   [
 *     { 
 *       actionType: 'DAILY_VOTING', 
 *       actionData: { voteId: 'vote_123' } 
 *     },
 *     { 
 *       actionType: 'CONTENT_SUBMISSION', 
 *       actionData: { contentId: 'content_456', quality: 'MEDIUM_QUALITY' } 
 *     }
 *   ],
 *   { validateAll: true, stopOnError: false }
 * );
 * console.log('Batch processing results:', batchResult);
 * 
 * // 4. VALIDATION AND SIMULATION
 * 
 * // Validate if action is allowed
 * const validation = await mlgTokenManager.validateEarningAction(
 *   'wallet_address',
 *   'CONTENT_SUBMISSION',
 *   { contentId: 'test_content', quality: 'HIGH_QUALITY' }
 * );
 * console.log('Action validation:', validation);
 * 
 * // Simulate earning without recording
 * const simulation = await mlgTokenManager.earnTokensForAction(
 *   'wallet_address',
 *   'DAILY_VOTING',
 *   { voteId: 'test_vote' },
 *   { simulateEarning: true }
 * );
 * console.log('Earning simulation:', simulation);
 * 
 * // 5. STATISTICS AND PROGRESS TRACKING
 * 
 * // Get detailed earning statistics
 * const stats = await mlgTokenManager.getEarningStatistics('wallet_address', 30);
 * console.log('30-day earning stats:', stats);
 * 
 * // Use utility functions for display formatting
 * const progress = MLGTokenUtils.calculateEarningProgress(7.5, 10);
 * console.log('Daily progress:', progress.progressText);
 * 
 * const streakInfo = MLGTokenUtils.formatStreakInfo({ currentStreak: 12, longestStreak: 25 });
 * console.log('Streak display:', streakInfo.displayText);
 * 
 * // Calculate potential earning with bonuses
 * const potentialEarning = MLGTokenUtils.calculatePotentialEarning(
 *   'CONTENT_SUBMISSION',
 *   { quality: 'HIGH_QUALITY', clanRole: 'CLAN_OFFICER' },
 *   { weekendBonus: true, eventBonus: false, clanBonus: true }
 * );
 * console.log('Potential earning:', potentialEarning);
 * 
 * // 6. INTEGRATION WITH BURN-TO-VOTE SYSTEM
 * 
 * // Combined earning and voting workflow
 * const dailyStatus = await mlgTokenManager.getBurnToVoteStatus('wallet_address');
 * if (dailyStatus.remainingVotes > 0 && dailyStatus.canAffordVote) {
 *   // First earn through community action
 *   const earningResult = await mlgTokenManager.earnTokensForAction(
 *     'wallet_address',
 *     'DAILY_VOTING',
 *     { voteId: 'proposal_123' }
 *   );
 *   
 *   if (earningResult.success) {
 *     // Then purchase additional votes if desired
 *     const burnResult = await mlgTokenManager.burnTokensForVotes(
 *       'wallet_address',
 *       wallet,
 *       2 // Burn 2 MLG for 1 extra vote
 *     );
 *     console.log('Combined earning + voting:', { earningResult, burnResult });
 *   }
 * }
 * 
 * // 7. EARNING SYSTEM FEATURES SUMMARY
 * 
 * // Daily Earning Limits: 10 MLG per day maximum
 * // Action Types:
 * //   - DAILY_VOTING: 1 MLG per day
 * //   - CONTENT_SUBMISSION: 1-5 MLG based on quality
 * //   - ACHIEVEMENT_UNLOCK: 1-3 MLG based on rarity
 * //   - STREAK_BONUS: 2-10 MLG for consecutive activity
 * //   - CLAN_PARTICIPATION: 0.5-3 MLG based on role
 * 
 * // Anti-Gaming Measures:
 * //   - Rate limiting (max 10 actions per hour)
 * //   - Cooldown periods between actions
 * //   - Wallet verification requirements
 * //   - Anti-sybil detection
 * //   - Comprehensive audit trails
 * 
 * // Bonus Multipliers:
 * //   - Weekend bonus: +20%
 * //   - Special event bonus: +50%
 * //   - Clan member bonuses: Variable
 * //   - Quality-based bonuses for content
 * 
 * ====================================================================
 */

/**
 * Enhanced Balance Validation & Fee Estimation Utility Functions
 * 
 * These utility functions provide easy access to the enhanced validation capabilities
 */

/**
 * Quick balance and fee check for a wallet
 * @param {string} walletAddress - Wallet address to check
 * @returns {Promise<Object>} - Comprehensive balance and fee status
 */
export async function quickBalanceCheck(walletAddress) {
  const manager = new MLGTokenManager();
  await manager.initialize('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
  
  return await manager.getBalanceStatus(walletAddress, {
    includeWarnings: true,
    estimateFees: true
  });
}

/**
 * Validate a burn transaction before execution
 * @param {string} walletAddress - Wallet address
 * @param {number} burnAmount - Amount to burn
 * @returns {Promise<Object>} - Complete validation result
 */
export async function validateBurnTransaction(walletAddress, burnAmount) {
  const manager = new MLGTokenManager();
  await manager.initialize('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
  
  return await manager.validateBurnToVoteTransaction(walletAddress, burnAmount, null, {
    skipBalance: false,
    skipFeeEstimation: false,
    includeSimulation: true
  });
}

/**
 * Get current network fee estimates
 * @param {string} walletAddress - Wallet address for personalized estimates
 * @returns {Promise<Object>} - Fee estimation details
 */
export async function getCurrentFeeEstimates(walletAddress = null) {
  const manager = new MLGTokenManager();
  await manager.initialize('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
  
  const estimates = {
    static: await manager.estimateTransactionCost('burn', { walletAddress: null }),
    dynamic: walletAddress ? await manager.estimateTransactionCost('burn', { 
      walletAddress, 
      includeBuffer: true 
    }) : null
  };
  
  return estimates;
}

/**
 * Example usage and testing function
 */
export const BALANCE_VALIDATION_EXAMPLES = {
  // Example: Check if user can burn 5 MLG tokens
  async canBurn5MLG(walletAddress) {
    const manager = new MLGTokenManager();
    await manager.initialize('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    
    const validation = await manager.validateBurnToVoteTransaction(walletAddress, 5);
    return {
      canBurn: validation.isValid,
      votesGained: validation.votesToPurchase,
      warnings: validation.warnings,
      errors: validation.errors,
      feeInfo: validation.feeEstimation
    };
  },
  
  // Example: Get balance health status
  async getBalanceHealth(walletAddress) {
    const status = await quickBalanceCheck(walletAddress);
    return {
      isHealthy: status.status === 'healthy',
      mlgBalance: status.mlgBalance?.balance || 0,
      solBalance: status.solBalance?.balance || 0,
      warnings: status.warnings,
      estimatedFees: status.feeEstimate
    };
  },
  
  // Example: Estimate costs for different burn amounts
  async estimateBurnCosts(walletAddress, burnAmounts = [1, 2, 5, 10]) {
    const manager = new MLGTokenManager();
    await manager.initialize('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    
    const estimates = [];
    for (const amount of burnAmounts) {
      const validation = await manager.validateBurnToVoteTransaction(walletAddress, amount);
      estimates.push({
        burnAmount: amount,
        votesGained: validation.votesToPurchase,
        actualCost: validation.actualCost,
        networkFee: validation.feeEstimation,
        isValid: validation.isValid
      });
    }
    
    return estimates;
  }
};

/**
 * Configuration constants for easy access
 */
export const BALANCE_THRESHOLDS = {
  MLG_WARNING: VALIDATION_CONFIG.MLG_WARNING_THRESHOLD,
  MLG_CRITICAL: VALIDATION_CONFIG.MLG_CRITICAL_THRESHOLD,
  SOL_WARNING: VALIDATION_CONFIG.SOL_WARNING_THRESHOLD,
  SOL_CRITICAL: VALIDATION_CONFIG.SOL_CRITICAL_THRESHOLD
};

/**
 * Error message constants
 */
export const VALIDATION_ERRORS = VALIDATION_CONFIG.ERROR_MESSAGES;

/**
 * Associated Token Account Creation exports
 */
export { ACCOUNT_CREATION_EVENTS };
export { ACCOUNT_CREATION_CONFIG };

/**
 * Enhanced balance and account management exports - already exported above
 */

/**
 * ====================================================================
 */