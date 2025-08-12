/**
 * Wallet Integration Type Definitions
 * 
 * Comprehensive TypeScript definitions for wallet operations,
 * Phantom wallet integration, and Solana blockchain interactions
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { PublicKey, Transaction, Connection } from '@solana/web3.js';

// =============================================================================
// PHANTOM WALLET TYPES
// =============================================================================

export interface PhantomProvider {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  autoApprove: boolean;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signAllTransactions<T extends Transaction>(transactions: T[]): Promise<T[]>;
  signTransaction<T extends Transaction>(transaction: T): Promise<T>;
  signMessage(message: Uint8Array, encoding?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array; publicKey: PublicKey }>;
  on(event: PhantomEvent, handler: (args: any) => void): void;
  removeListener(event: PhantomEvent, handler: (args: any) => void): void;
}

export type PhantomEvent = 
  | 'connect' 
  | 'disconnect' 
  | 'accountChanged'
  | 'chainChanged'
  | 'message';

export interface PhantomRequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
  }
}

// =============================================================================
// WALLET STATE TYPES
// =============================================================================

export interface WalletState {
  /** Whether wallet is currently connected */
  isConnected: boolean;
  /** Whether wallet connection is in progress */
  isConnecting: boolean;
  /** Wallet public key */
  publicKey: PublicKey | null;
  /** Wallet address as string */
  address: string | null;
  /** SOL balance in lamports */
  balance: number;
  /** MLG token balance */
  mlgBalance: number;
  /** Associated token accounts */
  tokenAccounts: Record<string, TokenAccount>;
  /** Current Solana network */
  network: SolanaNetwork;
  /** Recent transaction history */
  transactionHistory: TransactionHistory;
  /** Connection error if any */
  error: string | null;
  /** Last connection attempt timestamp */
  lastConnectionAttempt: number | null;
  /** Session persistence data */
  sessionData: WalletSessionData | null;
}

export interface TokenAccount {
  /** Token mint address */
  mint: string;
  /** Token account address */
  address: string;
  /** Token balance */
  amount: number;
  /** Token decimals */
  decimals: number;
  /** Token metadata */
  metadata?: TokenMetadata;
}

export interface TokenMetadata {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token logo URI */
  logo?: string;
  /** Token description */
  description?: string;
}

export interface TransactionHistory {
  /** List of recent transactions */
  transactions: WalletTransaction[];
  /** Last update timestamp */
  lastUpdated: number | null;
  /** Whether history is being fetched */
  isLoading: boolean;
}

export interface WalletTransaction {
  /** Transaction signature */
  signature: string;
  /** Transaction type */
  type: TransactionType;
  /** Block time */
  blockTime: number | null;
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction fee in lamports */
  fee: number;
  /** Transaction amount (if applicable) */
  amount?: number;
  /** Source address */
  from?: string;
  /** Destination address */
  to?: string;
  /** Transaction memo */
  memo?: string;
  /** Token information (for SPL token transfers) */
  tokenInfo?: TokenTransferInfo;
}

export interface TokenTransferInfo {
  /** Token mint address */
  mint: string;
  /** Token symbol */
  symbol: string;
  /** Number of decimals */
  decimals: number;
  /** Transfer amount */
  amount: number;
}

export type TransactionType = 
  | 'sol_transfer'
  | 'token_transfer'
  | 'vote_burn'
  | 'vote_cast'
  | 'program_instruction'
  | 'system_program'
  | 'unknown';

export type TransactionStatus = 
  | 'pending'
  | 'confirmed'
  | 'finalized'
  | 'failed'
  | 'cancelled';

export type SolanaNetwork = 
  | 'mainnet-beta'
  | 'testnet'
  | 'devnet'
  | 'localnet';

// =============================================================================
// SESSION MANAGEMENT TYPES
// =============================================================================

export interface WalletSessionData {
  /** Session ID */
  sessionId: string;
  /** Wallet address */
  address: string;
  /** Session start time */
  startTime: number;
  /** Last activity time */
  lastActivity: number;
  /** Session expiry time */
  expiresAt: number;
  /** User preferences */
  preferences: WalletPreferences;
  /** Auto-reconnect enabled */
  autoReconnect: boolean;
}

export interface WalletPreferences {
  /** Auto-connect on page load */
  autoConnect: boolean;
  /** Default network preference */
  defaultNetwork: SolanaNetwork;
  /** Transaction confirmation level */
  confirmationLevel: 'processed' | 'confirmed' | 'finalized';
  /** Enable transaction notifications */
  notifications: boolean;
  /** Remember session across browser restarts */
  persistSession: boolean;
}

export interface SessionStorageKeys {
  WALLET_SESSION: 'mlg_clan_wallet_session';
  USER_PREFERENCES: 'mlg_clan_user_preferences';
  SESSION_ACTIVITY: 'mlg_clan_session_activity';
  CONNECTION_ATTEMPTS: 'mlg_clan_connection_attempts';
}

export interface SessionConfig {
  INACTIVITY_TIMEOUT: number;
  SESSION_REFRESH_INTERVAL: number;
  MAX_RECONNECTION_ATTEMPTS: number;
  RECONNECTION_DELAY: number;
  ACTIVITY_TRACKING_EVENTS: string[];
  SESSION_STORAGE_PREFIX: string;
}

// =============================================================================
// CONNECTION MANAGEMENT TYPES
// =============================================================================

export interface ConnectionOptions {
  /** Whether to only connect if wallet was previously connected */
  onlyIfTrusted?: boolean;
  /** Custom timeout for connection attempt */
  timeout?: number;
  /** Whether to show UI during connection */
  silent?: boolean;
  /** Network to connect to */
  network?: SolanaNetwork;
  /** Whether to persist session */
  persistSession?: boolean;
}

export interface ConnectionResult {
  /** Whether connection was successful */
  success: boolean;
  /** Wallet public key if connected */
  publicKey: PublicKey | null;
  /** Wallet address if connected */
  address: string | null;
  /** Error message if connection failed */
  error: string | null;
  /** Connection metadata */
  metadata: ConnectionMetadata;
}

export interface ConnectionMetadata {
  /** Connection attempt timestamp */
  timestamp: number;
  /** Connection method used */
  method: 'auto' | 'manual' | 'trusted';
  /** Time taken for connection */
  duration: number;
  /** Whether this was a reconnection */
  isReconnection: boolean;
}

export interface DisconnectionOptions {
  /** Reason for disconnection */
  reason?: string;
  /** Whether to clear user preferences */
  clearPreferences?: boolean;
  /** Whether to clear user data */
  clearUserData?: boolean;
  /** Whether disconnection is forced */
  forced?: boolean;
}

export type DisconnectionReason = 
  | 'user_requested'
  | 'session_expired'
  | 'account_changed'
  | 'network_changed'
  | 'suspicious_activity'
  | 'emergency'
  | 'cleanup'
  | 'reset';

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export interface WalletError extends Error {
  /** Error code for programmatic handling */
  code: WalletErrorCode;
  /** Original error if this wraps another error */
  originalError?: Error;
  /** Additional context data */
  context?: Record<string, any>;
  /** Suggested user action */
  userAction?: string;
  /** Whether error is retryable */
  retryable: boolean;
}

export type WalletErrorCode = 
  | 'WALLET_NOT_INSTALLED'
  | 'WALLET_NOT_AVAILABLE'
  | 'USER_REJECTED'
  | 'CONNECTION_FAILED'
  | 'TRANSACTION_FAILED'
  | 'INSUFFICIENT_FUNDS'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'INVALID_TRANSACTION'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'ACCOUNT_CHANGED'
  | 'UNKNOWN_ERROR';

export interface ErrorConfig {
  MAX_RETRY_ATTEMPTS: number;
  INITIAL_RETRY_DELAY: number;
  MAX_RETRY_DELAY: number;
  CONNECTION_TIMEOUT: number;
  RPC_TIMEOUT: number;
  VALIDATION_TIMEOUT: number;
  RATE_LIMIT_BACKOFF: number;
  HEALTH_CHECK_INTERVAL: number;
  BROWSER_COMPATIBILITY_CHECK: boolean;
}

// =============================================================================
// WALLET MANAGER INTERFACE
// =============================================================================

export interface IWalletManager {
  // Connection Management
  connect(options?: ConnectionOptions): Promise<ConnectionResult>;
  disconnect(options?: DisconnectionOptions): Promise<void>;
  disconnectUser(): Promise<void>;
  emergencyDisconnect(reason: string): Promise<void>;
  cleanDisconnect(): Promise<void>;
  resetWallet(): Promise<void>;
  logout(): Promise<void>;

  // State Management
  getState(): WalletState;
  isConnected(): boolean;
  getAddress(): string | null;
  getPublicKey(): PublicKey | null;
  getBalance(): Promise<number>;
  getMLGBalance(): Promise<number>;

  // Transaction Management
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  sendTransaction(transaction: Transaction): Promise<string>;
  signMessage(message: string | Uint8Array): Promise<{ signature: Uint8Array; publicKey: PublicKey }>;

  // Session Management
  initializeSession(): Promise<void>;
  refreshSession(): Promise<void>;
  validateSession(): boolean;
  trackActivity(): void;
  clearSession(): void;

  // Event Handling
  on(event: WalletEventType, listener: WalletEventListener): void;
  off(event: WalletEventType, listener: WalletEventListener): void;
  emit(event: WalletEventType, data: any): void;

  // Utility Methods
  detectWallets(): Promise<WalletInfo[]>;
  validateNetwork(): Promise<boolean>;
  estimateTransactionFee(transaction: Transaction): Promise<number>;
}

export type WalletEventType = 
  | 'connect'
  | 'disconnect' 
  | 'accountChanged'
  | 'networkChanged'
  | 'balanceUpdated'
  | 'transactionSent'
  | 'transactionConfirmed'
  | 'error'
  | 'sessionExpired';

export type WalletEventListener = (data: any) => void;

export interface WalletInfo {
  /** Wallet name */
  name: string;
  /** Wallet identifier */
  identifier: string;
  /** Whether wallet is installed */
  isInstalled: boolean;
  /** Whether wallet is available */
  isAvailable: boolean;
  /** Wallet icon URL */
  icon?: string;
  /** Wallet download URL */
  downloadUrl?: string;
}

// =============================================================================
// NETWORK VALIDATION TYPES
// =============================================================================

export interface NetworkValidationResult {
  /** Whether network is valid */
  isValid: boolean;
  /** Current network */
  currentNetwork: SolanaNetwork;
  /** Expected network */
  expectedNetwork: SolanaNetwork;
  /** Validation error if any */
  error: string | null;
  /** Network health status */
  healthStatus: NetworkHealthStatus;
}

export interface NetworkHealthStatus {
  /** Whether network is healthy */
  isHealthy: boolean;
  /** Network latency in ms */
  latency: number;
  /** Last successful RPC call timestamp */
  lastSuccessfulCall: number;
  /** Number of failed calls in sequence */
  consecutiveFailures: number;
}

export interface SolanaRPCConfig {
  /** Primary RPC endpoint */
  endpoint: string;
  /** Backup RPC endpoints */
  backupEndpoints: string[];
  /** Request timeout */
  timeout: number;
  /** Maximum retries */
  maxRetries: number;
  /** Retry delay */
  retryDelay: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Awaitable<T> = T | Promise<T>;

export type WalletAdapter = PhantomProvider;

export interface WalletCapabilities {
  /** Can sign transactions */
  canSignTransactions: boolean;
  /** Can sign messages */
  canSignMessages: boolean;
  /** Supports multiple transactions */
  supportsMultipleTransactions: boolean;
  /** Supports account change detection */
  supportsAccountChange: boolean;
  /** Supports network change detection */
  supportsNetworkChange: boolean;
}

export default WalletState;