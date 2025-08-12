/**
 * MLG.clan Platform Type Definitions - Main Export Index
 * 
 * Central export hub for all TypeScript definitions in the MLG.clan platform.
 * Provides organized access to all type definitions for improved developer experience.
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

// =============================================================================
// CORE SYSTEM TYPES
// =============================================================================

// Wallet System Types
export * from './wallet';
export type {
  PhantomProvider,
  WalletState,
  WalletError,
  WalletErrorCode,
  ConnectionOptions,
  ConnectionResult,
  DisconnectionOptions,
  WalletEventType,
  WalletEventListener,
  IWalletManager
} from './wallet';

// Solana Blockchain Types
export * from './solana';
export type {
  SolanaConnectionConfig,
  SPLTokenConfig,
  TokenAccountInfo,
  MintInfo,
  TransactionBuilder,
  TransactionResult,
  VoteInstruction,
  VoteTransaction,
  MLGTokenConfig,
  BlockchainState
} from './solana';

// Voting System Types
export * from './voting';
export type {
  VotingState,
  ActiveVote,
  VoteHistory,
  VotingStatistics,
  BurnVoteConfig,
  BurnVoteTransaction,
  VotingLeaderboard,
  VotingRewards,
  VotingAnalytics,
  VotingEventType,
  VotingEventListener
} from './voting';

// Clan Management Types
export * from './clan';
export type {
  ClanState,
  Clan,
  ClanMember,
  ClanRole,
  ClanSettings,
  ClanStatistics,
  ClanInvitation,
  ClanPermissions,
  ClanAchievement,
  ClanTreasury,
  ClanLeaderboard,
  ClanActivity
} from './clan';

// State Management Types
export * from './state';
export type {
  AppState,
  UserState,
  SettingsState,
  UIState,
  ContentState,
  AnalyticsState,
  NotificationState,
  CacheState
} from './state';

// UI Component Types
export * from './components';
export type {
  BaseComponentProps,
  ComponentSize,
  ComponentColor,
  ComponentVariant,
  ButtonProps,
  XboxButtonProps,
  BurnButtonProps,
  GamingButtonProps,
  InputProps,
  SearchInputProps,
  TokenInputProps,
  CardProps,
  GamingCardProps,
  ModalProps,
  VoteConfirmationModalProps,
  WalletConnectionModalProps,
  FormProps,
  SelectProps,
  LoadingSpinnerProps,
  SkeletonLoaderProps,
  GamingLoadingProps
} from './components';

// =============================================================================
// COMMON UTILITY TYPES
// =============================================================================

/** Common timestamp type (Unix timestamp in milliseconds) */
export type Timestamp = number;

/** Common ID type (string identifier) */
export type ID = string;

/** Common amount type (number with decimal precision) */
export type Amount = number;

/** Common address type (blockchain address string) */
export type Address = string;

/** Common signature type (transaction signature string) */
export type Signature = string;

/** Common hash type (cryptographic hash string) */
export type Hash = string;

/** Common URL type (valid URL string) */
export type URL = string;

/** Common email type (valid email string) */
export type Email = string;

/** Promise-like type that can be awaited */
export type Awaitable<T> = T | Promise<T>;

/** Optional type helper */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Required type helper */
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Deep partial type helper */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Deep readonly type helper */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// =============================================================================
// ENVIRONMENT TYPES
// =============================================================================

/** Application environment types */
export type Environment = 'development' | 'staging' | 'production';

/** Network environment types */
export type NetworkEnvironment = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

/** Feature flag types */
export type FeatureFlag = 'enabled' | 'disabled' | 'beta';

/** Configuration environment */
export interface EnvironmentConfig {
  /** Current environment */
  environment: Environment;
  /** API base URL */
  apiUrl: string;
  /** WebSocket URL */
  wsUrl: string;
  /** Solana network */
  solanaNetwork: NetworkEnvironment;
  /** Feature flags */
  features: Record<string, FeatureFlag>;
  /** Debug mode enabled */
  debug: boolean;
  /** Analytics enabled */
  analytics: boolean;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/** Base error interface */
export interface BaseError extends Error {
  /** Error code for programmatic handling */
  code: string;
  /** Error context data */
  context?: Record<string, any>;
  /** Original error if wrapped */
  originalError?: Error;
  /** Timestamp when error occurred */
  timestamp: number;
}

/** API error types */
export interface ApiError extends BaseError {
  /** HTTP status code */
  status: number;
  /** API endpoint that failed */
  endpoint: string;
  /** Request method */
  method: string;
}

/** Validation error types */
export interface ValidationError extends BaseError {
  /** Field that failed validation */
  field: string;
  /** Validation rule that failed */
  rule: string;
  /** Expected value or format */
  expected: string;
  /** Actual value received */
  actual: any;
}

/** Network error types */
export interface NetworkError extends BaseError {
  /** Network timeout occurred */
  timeout: boolean;
  /** Connection refused */
  refused: boolean;
  /** DNS resolution failed */
  dnsError: boolean;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/** Base event interface */
export interface BaseEvent {
  /** Event type identifier */
  type: string;
  /** Event timestamp */
  timestamp: number;
  /** Event source */
  source: string;
  /** Event data */
  data: any;
  /** Event metadata */
  metadata?: Record<string, any>;
}

/** System event types */
export type SystemEventType = 
  | 'app_initialized'
  | 'app_destroyed'
  | 'route_changed'
  | 'theme_changed'
  | 'language_changed'
  | 'connection_status_changed';

/** User event types */
export type UserEventType = 
  | 'user_logged_in'
  | 'user_logged_out'
  | 'profile_updated'
  | 'preferences_changed'
  | 'achievement_unlocked';

/** Event handler type */
export type EventHandler<T = any> = (event: T) => void;

/** Event emitter interface */
export interface EventEmitter {
  /** Add event listener */
  on(event: string, handler: EventHandler): void;
  /** Remove event listener */
  off(event: string, handler: EventHandler): void;
  /** Emit event */
  emit(event: string, data: any): void;
  /** Remove all listeners */
  removeAllListeners(): void;
}

// =============================================================================
// DATA VALIDATION TYPES
// =============================================================================

/** Validation result */
export interface ValidationResult {
  /** Validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Field-specific errors */
  fieldErrors: Record<string, string[]>;
}

/** Validator function type */
export type Validator<T = any> = (value: T) => ValidationResult;

/** Schema validation interface */
export interface Schema {
  /** Field validators */
  fields: Record<string, Validator>;
  /** Form-level validator */
  form?: Validator;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/** Client configuration */
export interface ClientConfig {
  /** API configuration */
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  /** Wallet configuration */
  wallet: {
    autoConnect: boolean;
    networks: string[];
  };
  /** Cache configuration */
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  /** UI configuration */
  ui: {
    theme: string;
    animations: boolean;
    reducedMotion: boolean;
  };
}

/** Server configuration */
export interface ServerConfig {
  /** Server port */
  port: number;
  /** Database configuration */
  database: {
    url: string;
    poolSize: number;
  };
  /** Redis configuration */
  redis: {
    url: string;
    prefix: string;
  };
  /** JWT configuration */
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

// =============================================================================
// TESTING TYPES
// =============================================================================

/** Mock function type */
export type MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

/** Test suite configuration */
export interface TestConfig {
  /** Test environment */
  environment: 'jsdom' | 'node';
  /** Setup files */
  setupFiles: string[];
  /** Test timeout */
  timeout: number;
  /** Coverage configuration */
  coverage: {
    enabled: boolean;
    threshold: number;
  };
}

/** Test utility types */
export interface TestUtils {
  /** Render component for testing */
  render: (component: React.ComponentType) => any;
  /** Fire DOM events */
  fireEvent: any;
  /** Wait for element */
  waitFor: (callback: () => void) => Promise<void>;
  /** Query selectors */
  screen: any;
}

// =============================================================================
// PERFORMANCE TYPES
// =============================================================================

/** Performance metrics */
export interface PerformanceMetric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Metric unit */
  unit: string;
  /** Metric timestamp */
  timestamp: number;
}

/** Performance monitoring configuration */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  /** Sampling rate */
  sampleRate: number;
  /** Metrics to collect */
  metrics: string[];
  /** Performance budget */
  budget: Record<string, number>;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

/** Analytics event */
export interface AnalyticsEvent {
  /** Event name */
  name: string;
  /** Event properties */
  properties: Record<string, any>;
  /** User ID */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Event timestamp */
  timestamp: number;
}

/** Analytics configuration */
export interface AnalyticsConfig {
  /** Analytics enabled */
  enabled: boolean;
  /** Tracking ID */
  trackingId: string;
  /** Debug mode */
  debug: boolean;
  /** Auto-track page views */
  autoTrack: boolean;
}

// =============================================================================
// EXPORTS
// =============================================================================

/** Default export combines all main types */
export default {
  // Core types
  AppState,
  WalletState,
  VotingState,
  ClanState,
  
  // Utility types
  Timestamp,
  ID,
  Amount,
  Address,
  Signature,
  Hash,
  URL,
  Email,
  Awaitable,
  Optional,
  Required,
  DeepPartial,
  DeepReadonly,
  
  // Configuration types
  EnvironmentConfig,
  ClientConfig,
  ServerConfig,
  
  // Error types
  BaseError,
  ApiError,
  ValidationError,
  NetworkError,
  
  // Event types
  BaseEvent,
  SystemEventType,
  UserEventType,
  EventHandler,
  EventEmitter,
  
  // Validation types
  ValidationResult,
  Validator,
  Schema,
  
  // Testing types
  MockFunction,
  TestConfig,
  TestUtils,
  
  // Performance types
  PerformanceMetric,
  PerformanceConfig,
  
  // Analytics types
  AnalyticsEvent,
  AnalyticsConfig
} as const;