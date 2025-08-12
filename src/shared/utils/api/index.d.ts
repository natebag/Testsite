/**
 * MLG.clan API Type Definitions
 * 
 * TypeScript definitions for the MLG.clan API client and related utilities.
 * Provides comprehensive type safety for all API operations.
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

// =============================================================================
// API CLIENT TYPES
// =============================================================================

/**
 * Configuration options for MLGApiClient
 */
export interface MLGApiClientOptions {
  /** Base URL for API requests */
  baseURL?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base retry delay in milliseconds */
  retryDelay?: number;
  /** Backoff multiplier for retries */
  backoffMultiplier?: number;
  /** Cache timeout in milliseconds */
  cacheTimeout?: number;
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data: T;
  /** Error message if request failed */
  error?: string;
  /** Additional response metadata */
  metadata?: {
    timestamp: number;
    requestId: string;
    cached?: boolean;
    source?: string;
  };
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  /** Request body data */
  data?: any;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Whether to use cache for GET requests */
  cache?: boolean;
  /** Fallback data on error */
  fallback?: any;
  /** Request timeout override */
  timeout?: number;
  /** Retry configuration override */
  retry?: {
    attempts: number;
    delay: number;
  };
}

// =============================================================================
// AUTHENTICATION API TYPES
// =============================================================================

export interface LoginCredentials {
  /** Username or email */
  identifier: string;
  /** User password */
  password: string;
  /** Remember me flag */
  rememberMe?: boolean;
  /** Two-factor authentication code */
  twoFactorCode?: string;
}

export interface LoginResponse {
  /** Access token */
  accessToken: string;
  /** Refresh token */
  refreshToken: string;
  /** Token expiration time */
  expiresIn: number;
  /** User profile data */
  user: UserProfile;
}

export interface RefreshTokenRequest {
  /** Refresh token */
  refreshToken: string;
}

export interface WalletConnectionRequest {
  /** Wallet public key */
  publicKey: string;
  /** Wallet signature */
  signature: string;
  /** Signed message */
  message: string;
  /** Wallet provider */
  provider: string;
}

// =============================================================================
// USER API TYPES
// =============================================================================

export interface UserProfile {
  /** User identifier */
  id: string;
  /** Username */
  username: string;
  /** Display name */
  displayName: string;
  /** Email address */
  email: string;
  /** Profile avatar URL */
  avatar?: string;
  /** Profile banner URL */
  banner?: string;
  /** User bio */
  bio?: string;
  /** User location */
  location?: string;
  /** User website */
  website?: string;
  /** Account creation date */
  createdAt: string;
  /** Last profile update */
  updatedAt: string;
  /** Account verification status */
  verified: boolean;
  /** User tier */
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface UserProfileUpdateRequest {
  /** Updated display name */
  displayName?: string;
  /** Updated bio */
  bio?: string;
  /** Updated location */
  location?: string;
  /** Updated website */
  website?: string;
  /** Avatar file upload */
  avatar?: File;
  /** Banner file upload */
  banner?: File;
}

export interface UserStatistics {
  /** Total votes cast */
  totalVotes: number;
  /** Total tokens earned */
  tokensEarned: number;
  /** Content submitted count */
  contentSubmitted: number;
  /** Clan rank */
  clanRank: number;
  /** User level */
  level: number;
  /** Experience points */
  experience: number;
  /** Voting accuracy */
  votingAccuracy: number;
  /** Participation score */
  participationScore: number;
  /** Social score */
  socialScore: number;
}

export interface UserPreferences {
  /** Notification preferences */
  notifications: {
    votes: boolean;
    clan: boolean;
    achievements: boolean;
    system: boolean;
  };
  /** Privacy preferences */
  privacy: {
    showProfile: boolean;
    showStats: boolean;
    allowInvitations: boolean;
  };
  /** UI preferences */
  ui: {
    theme: 'dark' | 'light' | 'xbox';
    language: string;
    animations: boolean;
  };
}

// =============================================================================
// CONTENT API TYPES
// =============================================================================

export interface ContentSubmissionRequest {
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Content type */
  type: 'video' | 'image' | 'text' | 'audio' | 'stream';
  /** Content URL or file */
  content: string | File;
  /** Content thumbnail */
  thumbnail?: File;
  /** Content tags */
  tags: string[];
  /** Content category */
  category: string;
  /** Content metadata */
  metadata?: Record<string, any>;
}

export interface ContentItem {
  /** Content identifier */
  id: string;
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Content type */
  type: string;
  /** Content URL */
  url: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Content author */
  author: {
    id: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
  /** Creation timestamp */
  createdAt: string;
  /** Content tags */
  tags: string[];
  /** Vote statistics */
  voteStats: {
    total: number;
    up: number;
    down: number;
    burn: number;
    score: number;
  };
  /** Content status */
  status: 'published' | 'pending' | 'rejected' | 'removed';
}

export interface ContentSearchRequest {
  /** Search query */
  query?: string;
  /** Content type filter */
  type?: string;
  /** Category filter */
  category?: string;
  /** Tags filter */
  tags?: string[];
  /** Sort option */
  sortBy?: 'recent' | 'popular' | 'trending' | 'votes';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Date range filter */
  dateFrom?: string;
  /** Date range filter */
  dateTo?: string;
}

export interface ContentListResponse {
  /** Content items */
  items: ContentItem[];
  /** Total count */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Whether there are more items */
  hasMore: boolean;
}

// =============================================================================
// VOTING API TYPES
// =============================================================================

export interface VoteCastRequest {
  /** Content identifier */
  contentId: string;
  /** Vote type */
  voteType: 'up' | 'down' | 'burn';
  /** Tokens to burn (for burn votes) */
  tokensBurned?: number;
  /** Voting signature */
  signature?: string;
}

export interface VoteCastResponse {
  /** Vote identifier */
  voteId: string;
  /** Updated vote statistics */
  voteStats: {
    total: number;
    up: number;
    down: number;
    burn: number;
    score: number;
  };
  /** User's remaining votes */
  remainingVotes: number;
  /** Transaction signature (for burn votes) */
  transactionSignature?: string;
}

export interface VotingHistoryRequest {
  /** User identifier (optional, defaults to current user) */
  userId?: string;
  /** History period */
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}

export interface VotingHistoryResponse {
  /** Vote records */
  votes: Array<{
    id: string;
    contentId: string;
    contentTitle: string;
    voteType: string;
    tokensBurned: number;
    timestamp: string;
    signature?: string;
  }>;
  /** Total votes count */
  total: number;
  /** Summary statistics */
  summary: {
    totalVotes: number;
    totalTokensBurned: number;
    averageVoteWeight: number;
    favoriteVoteType: string;
  };
}

export interface VotingLeaderboardRequest {
  /** Leaderboard type */
  type?: 'overall' | 'weekly' | 'monthly';
  /** Result limit */
  limit?: number;
  /** Include user rank */
  includeUserRank?: boolean;
}

export interface VotingLeaderboardResponse {
  /** Leaderboard entries */
  entries: Array<{
    rank: number;
    userId: string;
    username: string;
    avatar?: string;
    totalVotes: number;
    tokensBurned: number;
    voteScore: number;
    change: number;
  }>;
  /** User's current rank */
  userRank?: {
    rank: number;
    totalVotes: number;
    tokensBurned: number;
    voteScore: number;
  };
  /** Last update timestamp */
  lastUpdated: string;
}

// =============================================================================
// CLAN API TYPES
// =============================================================================

export interface ClanCreateRequest {
  /** Clan name */
  name: string;
  /** Clan tag */
  tag: string;
  /** Clan description */
  description: string;
  /** Clan logo file */
  logo?: File;
  /** Clan settings */
  settings: {
    isPublic: boolean;
    requireApproval: boolean;
    minimumTokens: number;
    maxMembers: number;
  };
}

export interface ClanJoinRequest {
  /** Clan identifier */
  clanId: string;
  /** Join message */
  message?: string;
}

export interface ClanInviteRequest {
  /** Clan identifier */
  clanId: string;
  /** User identifier to invite */
  userId: string;
  /** Invitation message */
  message?: string;
}

export interface ClanMemberActionRequest {
  /** Clan identifier */
  clanId: string;
  /** Member user identifier */
  userId: string;
  /** Action to perform */
  action: 'promote' | 'demote' | 'kick' | 'ban' | 'unban';
  /** New role (for promote/demote) */
  newRole?: string;
  /** Action reason */
  reason?: string;
}

export interface ClanSettingsUpdateRequest {
  /** Clan identifier */
  clanId: string;
  /** Updated settings */
  settings: {
    isPublic?: boolean;
    requireApproval?: boolean;
    minimumTokens?: number;
    maxMembers?: number;
    description?: string;
  };
}

export interface ClanListResponse {
  /** Clan summaries */
  clans: Array<{
    id: string;
    name: string;
    tag: string;
    logo?: string;
    memberCount: number;
    rank: number;
    isPublic: boolean;
    recruiting: boolean;
  }>;
  /** Total clans count */
  total: number;
  /** Pagination info */
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// =============================================================================
// WEB3 API TYPES
// =============================================================================

export interface Web3ConnectionRequest {
  /** Wallet public key */
  publicKey: string;
  /** Wallet provider */
  provider: string;
  /** Connection signature */
  signature: string;
  /** Signed message */
  message: string;
}

export interface Web3BalanceRequest {
  /** Wallet address */
  address: string;
  /** Token mint addresses */
  tokens?: string[];
}

export interface Web3BalanceResponse {
  /** SOL balance in lamports */
  solBalance: number;
  /** Token balances */
  tokenBalances: Array<{
    mint: string;
    symbol: string;
    balance: number;
    decimals: number;
  }>;
  /** Last update timestamp */
  lastUpdated: string;
}

export interface Web3TransactionRequest {
  /** Transaction type */
  type: 'vote_burn' | 'token_transfer' | 'custom';
  /** Transaction data */
  data: {
    amount?: number;
    recipient?: string;
    memo?: string;
    [key: string]: any;
  };
}

export interface Web3TransactionResponse {
  /** Transaction signature */
  signature: string;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Block hash */
  blockHash?: string;
  /** Confirmation count */
  confirmations: number;
  /** Transaction fee */
  fee: number;
}

// =============================================================================
// SYSTEM API TYPES
// =============================================================================

export interface SystemStatusResponse {
  /** System status */
  status: 'operational' | 'degraded' | 'down';
  /** System uptime */
  uptime: string;
  /** Service statuses */
  services: {
    api: 'operational' | 'degraded' | 'down';
    database: 'operational' | 'degraded' | 'down';
    blockchain: 'operational' | 'degraded' | 'down';
    cache: 'operational' | 'degraded' | 'down';
  };
  /** Last health check */
  lastCheck: string;
}

export interface SystemHealthResponse {
  /** Health status */
  healthy: boolean;
  /** Response time */
  responseTime: number;
  /** Active connections */
  connections: number;
  /** Memory usage */
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  /** Database status */
  database: {
    connected: boolean;
    poolSize: number;
    activeConnections: number;
  };
}

export interface SystemAnalyticsResponse {
  /** User statistics */
  users: {
    total: number;
    online: number;
    new: number;
  };
  /** Content statistics */
  content: {
    total: number;
    submissions: number;
    approved: number;
  };
  /** Voting statistics */
  voting: {
    total: number;
    today: number;
    tokensBurned: number;
  };
  /** Performance metrics */
  performance: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface ApiError extends Error {
  /** HTTP status code */
  status: number;
  /** Error code */
  code: string;
  /** API endpoint */
  endpoint: string;
  /** Request method */
  method: string;
  /** Error details */
  details?: any;
  /** Request ID */
  requestId?: string;
}

export interface ValidationError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Rejected value */
  value: any;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  /** Data items */
  data: T[];
  /** Pagination metadata */
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/** Timestamped entity */
export interface TimestampedEntity {
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/** Entity with soft delete */
export interface SoftDeletableEntity extends TimestampedEntity {
  /** Deletion timestamp */
  deletedAt?: string;
}

// =============================================================================
// MAIN API CLIENT INTERFACE
// =============================================================================

export interface IMLGApiClient {
  // Authentication methods
  login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>>;
  logout(): Promise<ApiResponse<void>>;
  refreshToken(request: RefreshTokenRequest): Promise<ApiResponse<LoginResponse>>;
  connectWallet(request: WalletConnectionRequest): Promise<ApiResponse<any>>;

  // User methods
  getUserProfile(): Promise<ApiResponse<UserProfile>>;
  updateProfile(request: UserProfileUpdateRequest): Promise<ApiResponse<UserProfile>>;
  getUserStats(): Promise<ApiResponse<UserStatistics>>;
  getUserPreferences(): Promise<ApiResponse<UserPreferences>>;
  updatePreferences(preferences: UserPreferences): Promise<ApiResponse<UserPreferences>>;

  // Content methods
  submitContent(request: ContentSubmissionRequest): Promise<ApiResponse<ContentItem>>;
  getContent(id: string): Promise<ApiResponse<ContentItem>>;
  listContent(request?: ContentSearchRequest): Promise<ApiResponse<ContentListResponse>>;
  getTrendingContent(): Promise<ApiResponse<ContentItem[]>>;
  searchContent(request: ContentSearchRequest): Promise<ApiResponse<ContentListResponse>>;

  // Voting methods
  castVote(request: VoteCastRequest): Promise<ApiResponse<VoteCastResponse>>;
  getVotingHistory(request?: VotingHistoryRequest): Promise<ApiResponse<VotingHistoryResponse>>;
  getVotingLeaderboard(request?: VotingLeaderboardRequest): Promise<ApiResponse<VotingLeaderboardResponse>>;
  getVotingStats(): Promise<ApiResponse<any>>;

  // Clan methods
  createClan(request: ClanCreateRequest): Promise<ApiResponse<any>>;
  joinClan(request: ClanJoinRequest): Promise<ApiResponse<any>>;
  leaveClan(clanId: string): Promise<ApiResponse<any>>;
  getClans(): Promise<ApiResponse<ClanListResponse>>;
  getClan(id: string): Promise<ApiResponse<any>>;
  inviteToClan(request: ClanInviteRequest): Promise<ApiResponse<any>>;
  manageClanMember(request: ClanMemberActionRequest): Promise<ApiResponse<any>>;
  updateClanSettings(request: ClanSettingsUpdateRequest): Promise<ApiResponse<any>>;

  // Web3 methods
  connectWeb3(request: Web3ConnectionRequest): Promise<ApiResponse<any>>;
  disconnectWeb3(): Promise<ApiResponse<any>>;
  getWalletBalance(request: Web3BalanceRequest): Promise<ApiResponse<Web3BalanceResponse>>;
  submitTransaction(request: Web3TransactionRequest): Promise<ApiResponse<Web3TransactionResponse>>;

  // System methods
  getSystemStatus(): Promise<ApiResponse<SystemStatusResponse>>;
  getSystemHealth(): Promise<ApiResponse<SystemHealthResponse>>;
  getAnalytics(): Promise<ApiResponse<SystemAnalyticsResponse>>;

  // Utility methods
  request(method: string, endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse>;
  clearCache(): void;
  subscribe(endpoint: string, callback: (data: any) => void): void;
  unsubscribe(endpoint: string, callback: (data: any) => void): void;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

declare const MLGApiClient: {
  new (options?: MLGApiClientOptions): IMLGApiClient;
};

export { MLGApiClient };
export default MLGApiClient;