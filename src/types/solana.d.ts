/**
 * Solana Blockchain Interaction Type Definitions
 * 
 * Comprehensive TypeScript definitions for Solana blockchain operations,
 * SPL token interactions, program instructions, and transaction handling
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  Connection, 
  Commitment,
  ConfirmOptions,
  SendOptions,
  Keypair,
  SystemProgram,
  TokenAmount,
  RpcResponseAndContext,
  AccountInfo,
  ParsedAccountData,
  SimulatedTransactionResponse,
  SignatureStatus,
  BlockheightBasedTransactionConfirmationStrategy,
  TransactionSignature
} from '@solana/web3.js';

import { Token, AccountLayout, MintLayout } from '@solana/spl-token';

// =============================================================================
// SOLANA CONNECTION TYPES
// =============================================================================

export interface SolanaConnectionConfig {
  /** RPC endpoint URL */
  endpoint: string;
  /** Backup RPC endpoints */
  backupEndpoints?: string[];
  /** Connection commitment level */
  commitment: Commitment;
  /** WebSocket endpoint */
  wsEndpoint?: string;
  /** HTTP headers for requests */
  httpHeaders?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to use WebSocket */
  disableRetryOnRateLimit?: boolean;
  /** Confirmed transaction timeout */
  confirmTransactionInitialTimeout?: number;
}

export interface SolanaNetworkInfo {
  /** Network name */
  name: string;
  /** Network identifier */
  network: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
  /** RPC endpoint */
  endpoint: string;
  /** Chain ID */
  chainId?: number;
  /** Network features */
  features: NetworkFeatures;
}

export interface NetworkFeatures {
  /** SPL token support */
  splTokens: boolean;
  /** NFT support */
  nfts: boolean;
  /** Program deployment */
  programDeployment: boolean;
  /** Metaplex support */
  metaplex: boolean;
}

// =============================================================================
// SPL TOKEN TYPES
// =============================================================================

export interface SPLTokenConfig {
  /** Token mint address */
  mint: PublicKey;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Token description */
  description?: string;
  /** Token image URI */
  image?: string;
  /** External URL */
  externalUrl?: string;
  /** Token program ID */
  programId?: PublicKey;
}

export interface TokenAccountInfo {
  /** Token account address */
  address: PublicKey;
  /** Token mint */
  mint: PublicKey;
  /** Account owner */
  owner: PublicKey;
  /** Token amount */
  amount: TokenAmount;
  /** Whether account is initialized */
  isInitialized: boolean;
  /** Whether account is frozen */
  isFrozen: boolean;
  /** Close authority */
  closeAuthority?: PublicKey;
  /** Delegate authority */
  delegate?: PublicKey;
  /** Delegated amount */
  delegatedAmount?: TokenAmount;
}

export interface MintInfo {
  /** Mint address */
  address: PublicKey;
  /** Mint authority */
  mintAuthority: PublicKey | null;
  /** Total supply */
  supply: TokenAmount;
  /** Decimals */
  decimals: number;
  /** Whether mint is initialized */
  isInitialized: boolean;
  /** Freeze authority */
  freezeAuthority: PublicKey | null;
}

export interface TokenTransfer {
  /** Source token account */
  source: PublicKey;
  /** Destination token account */
  destination: PublicKey;
  /** Transfer amount */
  amount: number;
  /** Token mint */
  mint: PublicKey;
  /** Transfer authority */
  authority: PublicKey;
  /** Multi-signature accounts */
  multiSigners?: Keypair[];
}

export interface TokenBurn {
  /** Token account to burn from */
  account: PublicKey;
  /** Token mint */
  mint: PublicKey;
  /** Burn amount */
  amount: number;
  /** Burn authority */
  authority: PublicKey;
  /** Multi-signature accounts */
  multiSigners?: Keypair[];
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface TransactionBuilder {
  /** Add instruction to transaction */
  addInstruction(instruction: TransactionInstruction): TransactionBuilder;
  /** Add multiple instructions */
  addInstructions(instructions: TransactionInstruction[]): TransactionBuilder;
  /** Set recent blockhash */
  setRecentBlockhash(blockhash: string): TransactionBuilder;
  /** Set fee payer */
  setFeePayer(feePayer: PublicKey): TransactionBuilder;
  /** Build final transaction */
  build(): Transaction;
}

export interface TransactionMetadata {
  /** Transaction signature */
  signature: string;
  /** Block height */
  slot: number;
  /** Block time */
  blockTime: number | null;
  /** Transaction fee */
  fee: number;
  /** Compute units consumed */
  computeUnitsConsumed?: number;
  /** Log messages */
  logMessages: string[];
  /** Pre-transaction balances */
  preBalances: number[];
  /** Post-transaction balances */
  postBalances: number[];
  /** Pre-transaction token balances */
  preTokenBalances?: TokenBalance[];
  /** Post-transaction token balances */
  postTokenBalances?: TokenBalance[];
}

export interface TokenBalance {
  /** Account index */
  accountIndex: number;
  /** Token mint */
  mint: string;
  /** UI token amount */
  uiTokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
    uiAmountString: string;
  };
  /** Account owner */
  owner?: string;
  /** Program ID */
  programId?: string;
}

export interface TransactionOptions extends SendOptions {
  /** Skip preflight checks */
  skipPreflight?: boolean;
  /** Preflight commitment level */
  preflightCommitment?: Commitment;
  /** Max retries */
  maxRetries?: number;
  /** Min context slot */
  minContextSlot?: number;
}

export interface TransactionResult {
  /** Transaction signature */
  signature: string;
  /** Whether transaction was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Transaction metadata */
  metadata?: TransactionMetadata;
  /** Confirmation status */
  confirmationStatus: TransactionConfirmationStatus;
}

export type TransactionConfirmationStatus = 
  | 'processed'
  | 'confirmed'
  | 'finalized'
  | 'failed'
  | 'timeout';

// =============================================================================
// PROGRAM INSTRUCTION TYPES
// =============================================================================

export interface ProgramInstructionData {
  /** Instruction identifier */
  instruction: number;
  /** Instruction data buffer */
  data: Buffer;
  /** Accounts required for instruction */
  accounts: AccountMeta[];
  /** Program ID */
  programId: PublicKey;
}

export interface AccountMeta {
  /** Account public key */
  pubkey: PublicKey;
  /** Whether account is signer */
  isSigner: boolean;
  /** Whether account is writable */
  isWritable: boolean;
}

export interface CustomProgramInstruction {
  /** Instruction name */
  name: string;
  /** Instruction accounts */
  accounts: InstructionAccount[];
  /** Instruction data schema */
  dataSchema?: InstructionDataSchema;
  /** Instruction handler */
  handler: (accounts: PublicKey[], data: Buffer) => TransactionInstruction;
}

export interface InstructionAccount {
  /** Account name */
  name: string;
  /** Whether account is required */
  isRequired: boolean;
  /** Whether account must be signer */
  isSigner: boolean;
  /** Whether account is writable */
  isWritable: boolean;
  /** Account validation function */
  validate?: (pubkey: PublicKey) => boolean;
}

export interface InstructionDataSchema {
  /** Data fields */
  fields: InstructionField[];
  /** Data serialization format */
  format: 'borsh' | 'json' | 'custom';
}

export interface InstructionField {
  /** Field name */
  name: string;
  /** Field type */
  type: 'u8' | 'u16' | 'u32' | 'u64' | 'string' | 'pubkey' | 'bool' | 'array';
  /** Field description */
  description?: string;
  /** Whether field is optional */
  optional?: boolean;
}

// =============================================================================
// ACCOUNT MANAGEMENT TYPES
// =============================================================================

export interface AccountQuery {
  /** Account filters */
  filters?: AccountFilter[];
  /** Data size filter */
  dataSize?: number;
  /** Commitment level */
  commitment?: Commitment;
  /** Encoding for account data */
  encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
  /** Min context slot */
  minContextSlot?: number;
}

export interface AccountFilter {
  /** Filter type */
  type: 'memcmp' | 'dataSize';
  /** Memory compare filter */
  memcmp?: {
    offset: number;
    bytes: string;
    encoding?: 'base58' | 'base64';
  };
  /** Data size filter */
  dataSize?: number;
}

export interface AccountSubscription {
  /** Subscription ID */
  id: number;
  /** Account being watched */
  account: PublicKey;
  /** Subscription callback */
  callback: (accountInfo: AccountInfo<Buffer>, context: { slot: number }) => void;
  /** Subscription commitment */
  commitment?: Commitment;
  /** Encoding for account data */
  encoding?: 'base64' | 'jsonParsed';
}

export interface ProgramAccountInfo {
  /** Account public key */
  pubkey: PublicKey;
  /** Account info */
  account: AccountInfo<Buffer | ParsedAccountData>;
}

// =============================================================================
// MLG TOKEN SPECIFIC TYPES
// =============================================================================

export interface MLGTokenConfig extends SPLTokenConfig {
  /** MLG-specific token features */
  features: MLGTokenFeatures;
  /** Burn-to-vote configuration */
  burnToVote: BurnToVoteConfig;
  /** Reward distribution settings */
  rewards: RewardConfig;
}

export interface MLGTokenFeatures {
  /** Support for burning tokens */
  burnable: boolean;
  /** Support for token rewards */
  rewardable: boolean;
  /** Support for staking */
  stakeable: boolean;
  /** Support for governance voting */
  governance: boolean;
}

export interface BurnToVoteConfig {
  /** Minimum burn amount for vote */
  minimumBurn: number;
  /** Maximum burn amount per vote */
  maximumBurn: number;
  /** Vote weight multiplier */
  voteMultiplier: number;
  /** Burn destination (null address) */
  burnDestination: PublicKey;
  /** Whether burning is enabled */
  enabled: boolean;
}

export interface RewardConfig {
  /** Base reward amount */
  baseReward: number;
  /** Reward decay rate */
  decayRate: number;
  /** Maximum daily rewards */
  dailyLimit: number;
  /** Reward distribution program */
  rewardProgram?: PublicKey;
}

export interface MLGTokenAccount extends TokenAccountInfo {
  /** MLG-specific account data */
  mlgData: MLGAccountData;
}

export interface MLGAccountData {
  /** Total tokens burned by this account */
  totalBurned: number;
  /** Total votes cast */
  totalVotes: number;
  /** Last voting timestamp */
  lastVoteTime: number;
  /** Accumulated rewards */
  accumulatedRewards: number;
  /** Account tier/level */
  tier: number;
}

// =============================================================================
// VOTING SYSTEM TYPES
// =============================================================================

export interface VoteInstruction {
  /** Content being voted on */
  contentId: string;
  /** Vote type */
  voteType: 'up' | 'down' | 'burn';
  /** Amount to burn (for burn votes) */
  burnAmount?: number;
  /** Voter's token account */
  voterAccount: PublicKey;
  /** Vote destination account */
  voteAccount: PublicKey;
  /** MLG token mint */
  tokenMint: PublicKey;
}

export interface VoteTransaction {
  /** Voting instruction */
  voteInstruction: VoteInstruction;
  /** Associated token burn (if applicable) */
  burnInstruction?: TokenBurn;
  /** Transaction signers */
  signers: Keypair[];
  /** Additional instructions */
  additionalInstructions?: TransactionInstruction[];
}

export interface VoteResult {
  /** Transaction signature */
  signature: string;
  /** Vote details */
  voteDetails: VoteDetails;
  /** Burn details (if applicable) */
  burnDetails?: BurnDetails;
  /** Transaction success */
  success: boolean;
  /** Error message */
  error?: string;
}

export interface VoteDetails {
  /** Content ID */
  contentId: string;
  /** Voter address */
  voter: string;
  /** Vote type */
  voteType: string;
  /** Vote timestamp */
  timestamp: number;
  /** Vote weight */
  weight: number;
}

export interface BurnDetails {
  /** Amount burned */
  amount: number;
  /** Burn transaction signature */
  burnSignature: string;
  /** Pre-burn balance */
  preBalance: number;
  /** Post-burn balance */
  postBalance: number;
}

// =============================================================================
// BLOCKCHAIN STATE TYPES
// =============================================================================

export interface BlockchainState {
  /** Current slot */
  slot: number;
  /** Recent blockhash */
  blockhash: string;
  /** Blockhash valid until */
  blockhashValidUntil: number;
  /** Network epoch */
  epoch: number;
  /** Epoch progress */
  epochProgress: number;
  /** Transaction count */
  transactionCount: number;
  /** Health status */
  health: BlockchainHealth;
}

export interface BlockchainHealth {
  /** Network is healthy */
  isHealthy: boolean;
  /** Last health check */
  lastCheck: number;
  /** RPC latency */
  latency: number;
  /** Recent errors */
  recentErrors: string[];
  /** Uptime percentage */
  uptime: number;
}

export interface SlotInfo {
  /** Slot number */
  slot: number;
  /** Parent slot */
  parent: number;
  /** Root slot */
  root: number;
}

export interface EpochInfo {
  /** Current epoch */
  epoch: number;
  /** Slot index within epoch */
  slotIndex: number;
  /** Total slots in epoch */
  slotsInEpoch: number;
  /** Absolute slot */
  absoluteSlot: number;
  /** Block height */
  blockHeight?: number;
  /** Transaction count */
  transactionCount?: number;
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export interface SolanaError extends Error {
  /** Error code */
  code: SolanaErrorCode;
  /** Transaction logs */
  logs?: string[];
  /** Program error info */
  programError?: ProgramError;
}

export type SolanaErrorCode = 
  | 'TRANSACTION_FAILED'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_ACCOUNT'
  | 'INVALID_INSTRUCTION'
  | 'PROGRAM_ERROR'
  | 'NETWORK_ERROR'
  | 'RPC_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SIGNATURE_VERIFICATION_FAILED'
  | 'BLOCKHASH_EXPIRED'
  | 'ACCOUNT_NOT_FOUND'
  | 'TOKEN_ACCOUNT_NOT_FOUND'
  | 'INSUFFICIENT_TOKEN_BALANCE'
  | 'TOKEN_MINT_MISMATCH'
  | 'UNAUTHORIZED_TRANSACTION';

export interface ProgramError {
  /** Program ID that caused error */
  programId: PublicKey;
  /** Error code from program */
  errorCode: number;
  /** Error message */
  message: string;
  /** Instruction index that failed */
  instructionIndex: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface SolanaUtils {
  /** Convert lamports to SOL */
  lamportsToSol(lamports: number): number;
  /** Convert SOL to lamports */
  solToLamports(sol: number): number;
  /** Validate public key */
  isValidPublicKey(key: string): boolean;
  /** Generate keypair */
  generateKeypair(): Keypair;
  /** Derive associated token address */
  getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey>;
  /** Estimate transaction fee */
  estimateTransactionFee(transaction: Transaction, connection: Connection): Promise<number>;
}

export interface BlockchainMonitor {
  /** Monitor account changes */
  monitorAccount(account: PublicKey, callback: (info: AccountInfo<Buffer>) => void): number;
  /** Monitor program account changes */
  monitorProgramAccounts(programId: PublicKey, callback: (accounts: ProgramAccountInfo[]) => void): number;
  /** Stop monitoring */
  stopMonitoring(subscriptionId: number): void;
  /** Get current blockchain state */
  getBlockchainState(): Promise<BlockchainState>;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  TokenAmount,
  AccountInfo,
  Commitment,
  SendOptions,
  ConfirmOptions
};

export default SolanaConnectionConfig;