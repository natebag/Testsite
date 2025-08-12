/**
 * State Management Type Definitions
 * 
 * Comprehensive TypeScript definitions for the MLG.clan state management system,
 * including Redux-style state, actions, reducers, and middleware
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { WalletState } from './wallet';
import { VotingState } from './voting';
import { ClanState } from './clan';

// =============================================================================
// CORE STATE TYPES
// =============================================================================

/**
 * Main application state structure
 */
export interface AppState {
  /** Wallet connection and authentication state */
  wallet: WalletState;
  /** Voting system state */
  voting: VotingState;
  /** Clan management state */
  clan: ClanState;
  /** User profile and preferences state */
  user: UserState;
  /** Application settings state */
  settings: SettingsState;
  /** UI state (modals, loading, etc.) */
  ui: UIState;
  /** Content management state */
  content: ContentState;
  /** Analytics and metrics state */
  analytics: AnalyticsState;
  /** Notification system state */
  notifications: NotificationState;
  /** Cache management state */
  cache: CacheState;
}

export interface UserState {
  /** User profile data */
  profile: UserProfile | null;
  /** User preferences and settings */
  preferences: UserPreferences;
  /** User achievements and badges */
  achievements: UserAchievement[];
  /** User statistics and metrics */
  stats: UserStatistics;
  /** User notifications */
  notifications: UserNotification[];
  /** Profile loading state */
  isLoading: boolean;
  /** Profile error message */
  error: string | null;
  /** Last login timestamp */
  lastLogin: Date | null;
  /** Authentication status */
  authStatus: AuthenticationStatus;
  /** User session information */
  session: UserSession | null;
}

export interface SettingsState {
  /** UI theme (dark, light, xbox) */
  theme: ThemeType;
  /** Selected language */
  language: string;
  /** Notification preferences */
  notifications: NotificationPreferences;
  /** Privacy settings */
  privacy: PrivacySettings;
  /** Performance preferences */
  performance: PerformanceSettings;
  /** Auto-connect wallet setting */
  autoConnect: boolean;
  /** Default Solana network */
  defaultNetwork: string;
  /** Advanced settings */
  advanced: AdvancedSettings;
}

export interface UIState {
  /** Modal visibility state */
  modals: ModalState;
  /** Global loading states */
  loading: LoadingState;
  /** Active alert messages */
  alerts: AlertMessage[];
  /** Navigation state */
  navigation: NavigationState;
  /** Sidebar visibility */
  sidebarOpen: boolean;
  /** Current page identifier */
  currentPage: string;
  /** Layout configuration */
  layout: LayoutState;
  /** Theme state */
  theme: ThemeState;
}

export interface ContentState {
  /** All content items */
  items: ContentItem[];
  /** Trending content */
  trending: ContentItem[];
  /** User's submitted content */
  userContent: ContentItem[];
  /** Content filters */
  filters: ContentFilters;
  /** Content loading state */
  isLoading: boolean;
  /** Content error state */
  error: string | null;
  /** Content search state */
  search: ContentSearchState;
  /** Content moderation state */
  moderation: ContentModerationState;
}

export interface AnalyticsState {
  /** User analytics data */
  userAnalytics: UserAnalytics;
  /** Platform analytics data */
  platformAnalytics: PlatformAnalytics;
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
  /** Analytics loading state */
  isLoading: boolean;
  /** Analytics error state */
  error: string | null;
  /** Last update timestamp */
  lastUpdated: number | null;
}

export interface NotificationState {
  /** All notifications */
  notifications: Notification[];
  /** Unread notification count */
  unreadCount: number;
  /** Notification preferences */
  preferences: NotificationPreferences;
  /** Push notification settings */
  pushSettings: PushNotificationSettings;
  /** Notification history */
  history: NotificationHistory[];
  /** System notifications */
  system: SystemNotification[];
}

export interface CacheState {
  /** Cache entries */
  entries: Map<string, CacheEntry>;
  /** Cache statistics */
  stats: CacheStatistics;
  /** Cache configuration */
  config: CacheConfiguration;
  /** Cache cleanup status */
  cleanup: CacheCleanupStatus;
}

// =============================================================================
// USER STATE TYPES
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
  /** User bio/description */
  bio?: string;
  /** User location */
  location?: string;
  /** User website */
  website?: string;
  /** Social media links */
  socialLinks: SocialLinks;
  /** Account creation date */
  createdAt: number;
  /** Last profile update */
  updatedAt: number;
  /** Account verification status */
  verified: boolean;
  /** User tier/level */
  tier: UserTier;
}

export interface UserPreferences {
  /** Notification preferences */
  notifications: boolean;
  /** Dark mode preference */
  darkMode: boolean;
  /** Auto-connect wallet */
  autoConnect: boolean;
  /** Preferred language */
  language: string;
  /** Timezone */
  timezone: string;
  /** Content filters */
  contentFilters: string[];
  /** Privacy preferences */
  privacy: UserPrivacyPreferences;
  /** Accessibility settings */
  accessibility: AccessibilitySettings;
}

export interface UserAchievement {
  /** Achievement identifier */
  id: string;
  /** Achievement name */
  name: string;
  /** Achievement description */
  description: string;
  /** Achievement icon */
  icon: string;
  /** Achievement category */
  category: string;
  /** Achievement rarity */
  rarity: AchievementRarity;
  /** Date unlocked */
  unlockedAt: number;
  /** Achievement progress */
  progress: number;
  /** Whether achievement is visible */
  visible: boolean;
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

export interface UserNotification {
  /** Notification identifier */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification timestamp */
  timestamp: number;
  /** Whether notification is read */
  read: boolean;
  /** Notification action data */
  actionData?: any;
  /** Notification priority */
  priority: NotificationPriority;
}

export interface UserSession {
  /** Session identifier */
  sessionId: string;
  /** Session start time */
  startTime: number;
  /** Last activity time */
  lastActivity: number;
  /** Session device information */
  device: DeviceInfo;
  /** Session location */
  location?: LocationInfo;
  /** Session duration */
  duration: number;
}

export type AuthenticationStatus = 
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'error'
  | 'expired';

export type ThemeType = 'dark' | 'light' | 'xbox' | 'auto';

export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type NotificationType = 
  | 'system'
  | 'vote'
  | 'clan'
  | 'achievement'
  | 'social'
  | 'tournament';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// =============================================================================
// SETTINGS STATE TYPES
// =============================================================================

export interface NotificationPreferences {
  /** Vote-related notifications */
  votes: boolean;
  /** Clan-related notifications */
  clan: boolean;
  /** Achievement notifications */
  achievements: boolean;
  /** System notifications */
  system: boolean;
  /** Marketing notifications */
  marketing: boolean;
  /** Push notifications enabled */
  push: boolean;
  /** Email notifications enabled */
  email: boolean;
  /** SMS notifications enabled */
  sms: boolean;
}

export interface PrivacySettings {
  /** Show profile publicly */
  showProfile: boolean;
  /** Show statistics publicly */
  showStats: boolean;
  /** Allow clan invitations */
  allowInvitations: boolean;
  /** Show online status */
  showOnlineStatus: boolean;
  /** Allow direct messages */
  allowDirectMessages: boolean;
  /** Data sharing preferences */
  dataSharing: DataSharingSettings;
}

export interface PerformanceSettings {
  /** Enable animations */
  animations: boolean;
  /** Auto-refresh data */
  autoRefresh: boolean;
  /** Cache enabled */
  cacheEnabled: boolean;
  /** Reduce motion */
  reduceMotion: boolean;
  /** High contrast mode */
  highContrast: boolean;
  /** Data saver mode */
  dataSaver: boolean;
}

export interface AdvancedSettings {
  /** Developer mode */
  developerMode: boolean;
  /** Debug logging */
  debugLogging: boolean;
  /** Experimental features */
  experimentalFeatures: boolean;
  /** Custom RPC endpoint */
  customRpcEndpoint?: string;
  /** Advanced caching options */
  advancedCaching: AdvancedCachingOptions;
}

export interface DataSharingSettings {
  /** Allow analytics */
  analytics: boolean;
  /** Allow performance monitoring */
  performance: boolean;
  /** Allow crash reporting */
  crashReporting: boolean;
  /** Allow usage statistics */
  usageStats: boolean;
}

export interface AdvancedCachingOptions {
  /** Cache size limit (MB) */
  sizeLimit: number;
  /** Cache TTL (minutes) */
  ttl: number;
  /** Preload data */
  preload: boolean;
  /** Compress cached data */
  compression: boolean;
}

export interface AccessibilitySettings {
  /** Screen reader support */
  screenReader: boolean;
  /** Keyboard navigation */
  keyboardNavigation: boolean;
  /** Focus indicators */
  focusIndicators: boolean;
  /** Text scaling */
  textScaling: number;
  /** High contrast */
  highContrast: boolean;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface ModalState {
  /** Wallet connection modal */
  walletConnect: boolean;
  /** Clan invitation modal */
  clanInvite: boolean;
  /** Vote confirmation modal */
  voteConfirm: boolean;
  /** Settings modal */
  settings: boolean;
  /** Profile edit modal */
  profileEdit: boolean;
  /** Achievement modal */
  achievement: boolean;
  /** Custom modals */
  custom: Record<string, boolean>;
}

export interface LoadingState {
  /** Global loading indicator */
  global: boolean;
  /** Wallet operations loading */
  wallet: boolean;
  /** Voting operations loading */
  voting: boolean;
  /** Clan operations loading */
  clan: boolean;
  /** Content loading */
  content: boolean;
  /** User profile loading */
  user: boolean;
  /** Custom loading states */
  custom: Record<string, boolean>;
}

export interface AlertMessage {
  /** Alert identifier */
  id: string;
  /** Alert type */
  type: AlertType;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Alert timestamp */
  timestamp: number;
  /** Alert duration (ms) */
  duration: number;
  /** Whether alert is dismissible */
  dismissible: boolean;
  /** Alert actions */
  actions?: AlertAction[];
}

export interface NavigationState {
  /** Previous page */
  previousPage: string | null;
  /** Current page */
  currentPage: string;
  /** Navigation history */
  history: string[];
  /** Breadcrumb trail */
  breadcrumbs: Breadcrumb[];
  /** Navigation loading */
  isLoading: boolean;
}

export interface LayoutState {
  /** Sidebar collapsed */
  sidebarCollapsed: boolean;
  /** Content area width */
  contentWidth: number;
  /** Layout mode */
  mode: LayoutMode;
  /** Mobile layout */
  mobile: boolean;
  /** Responsive breakpoint */
  breakpoint: ResponsiveBreakpoint;
}

export interface ThemeState {
  /** Current theme */
  current: ThemeType;
  /** Available themes */
  available: ThemeOption[];
  /** Theme preferences */
  preferences: ThemePreferences;
  /** Custom theme data */
  custom?: CustomThemeData;
}

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export type LayoutMode = 'normal' | 'compact' | 'expanded';

export type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface AlertAction {
  /** Action label */
  label: string;
  /** Action handler */
  handler: () => void;
  /** Action style */
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Breadcrumb {
  /** Breadcrumb label */
  label: string;
  /** Breadcrumb path */
  path: string;
  /** Whether breadcrumb is current */
  current: boolean;
}

export interface ThemeOption {
  /** Theme identifier */
  id: string;
  /** Theme name */
  name: string;
  /** Theme description */
  description: string;
  /** Theme preview */
  preview?: string;
}

export interface ThemePreferences {
  /** Auto-switch based on time */
  autoSwitch: boolean;
  /** Light theme hours */
  lightHours: [number, number];
  /** Dark theme hours */
  darkHours: [number, number];
  /** Follow system theme */
  followSystem: boolean;
}

export interface CustomThemeData {
  /** Theme colors */
  colors: Record<string, string>;
  /** Theme typography */
  typography: Record<string, any>;
  /** Theme spacing */
  spacing: Record<string, number>;
  /** Theme components */
  components: Record<string, any>;
}

// =============================================================================
// CONTENT STATE TYPES
// =============================================================================

export interface ContentItem {
  /** Content identifier */
  id: string;
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Content type */
  type: ContentType;
  /** Content URL */
  url: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Content author */
  author: ContentAuthor;
  /** Creation timestamp */
  createdAt: number;
  /** Content tags */
  tags: string[];
  /** Vote statistics */
  voteStats: ContentVoteStats;
  /** Content status */
  status: ContentStatus;
  /** Content metadata */
  metadata: ContentMetadata;
}

export interface ContentFilters {
  /** Content type filter */
  type?: ContentType;
  /** Tag filters */
  tags: string[];
  /** Date range filter */
  dateRange?: DateRange;
  /** Sort order */
  sortBy: ContentSortOption;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Search query */
  query?: string;
}

export interface ContentSearchState {
  /** Search query */
  query: string;
  /** Search results */
  results: ContentItem[];
  /** Search filters */
  filters: ContentFilters;
  /** Search suggestions */
  suggestions: string[];
  /** Search loading */
  isLoading: boolean;
  /** Search history */
  history: string[];
}

export interface ContentModerationState {
  /** Pending moderation queue */
  pending: ContentItem[];
  /** Moderation decisions */
  decisions: ModerationDecision[];
  /** Moderation flags */
  flags: ContentFlag[];
  /** Auto-moderation settings */
  autoModeration: AutoModerationSettings;
}

export type ContentType = 'video' | 'image' | 'text' | 'audio' | 'stream';

export type ContentStatus = 'draft' | 'published' | 'moderated' | 'flagged' | 'removed';

export type ContentSortOption = 'recent' | 'popular' | 'trending' | 'votes' | 'author';

export interface ContentAuthor {
  /** Author identifier */
  id: string;
  /** Author username */
  username: string;
  /** Author avatar */
  avatar?: string;
  /** Author verified status */
  verified: boolean;
}

export interface ContentVoteStats {
  /** Total votes */
  total: number;
  /** Upvotes */
  up: number;
  /** Downvotes */
  down: number;
  /** Burn votes */
  burn: number;
  /** Vote score */
  score: number;
}

export interface ContentMetadata {
  /** File size in bytes */
  fileSize?: number;
  /** Duration in seconds */
  duration?: number;
  /** Resolution */
  resolution?: string;
  /** Encoding format */
  format?: string;
  /** Custom metadata */
  custom?: Record<string, any>;
}

export interface DateRange {
  /** Start date */
  start: Date;
  /** End date */
  end: Date;
}

export interface ModerationDecision {
  /** Decision identifier */
  id: string;
  /** Content identifier */
  contentId: string;
  /** Moderator identifier */
  moderatorId: string;
  /** Decision type */
  decision: 'approve' | 'reject' | 'flag';
  /** Decision reason */
  reason: string;
  /** Decision timestamp */
  timestamp: number;
}

export interface ContentFlag {
  /** Flag identifier */
  id: string;
  /** Content identifier */
  contentId: string;
  /** Flag reason */
  reason: string;
  /** Flag reporter */
  reporterId: string;
  /** Flag timestamp */
  timestamp: number;
  /** Flag status */
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface AutoModerationSettings {
  /** Enable auto-moderation */
  enabled: boolean;
  /** Spam detection */
  spamDetection: boolean;
  /** Content filtering */
  contentFiltering: boolean;
  /** Profanity filter */
  profanityFilter: boolean;
  /** Custom filter rules */
  customRules: string[];
}

// =============================================================================
// ANALYTICS STATE TYPES
// =============================================================================

export interface UserAnalytics {
  /** Page views */
  pageViews: number;
  /** Session duration */
  sessionDuration: number;
  /** Actions performed */
  actions: ActionAnalytics[];
  /** User journey */
  journey: UserJourney[];
  /** Engagement metrics */
  engagement: EngagementMetrics;
}

export interface PlatformAnalytics {
  /** Active users */
  activeUsers: number;
  /** Total users */
  totalUsers: number;
  /** Content statistics */
  content: ContentAnalytics;
  /** Voting statistics */
  voting: VotingAnalytics;
  /** Performance metrics */
  performance: PlatformPerformanceMetrics;
}

export interface PerformanceMetrics {
  /** Page load times */
  pageLoadTimes: number[];
  /** API response times */
  apiResponseTimes: number[];
  /** Error rates */
  errorRates: ErrorRateMetrics;
  /** Resource usage */
  resourceUsage: ResourceUsageMetrics;
}

export interface ActionAnalytics {
  /** Action type */
  type: string;
  /** Action count */
  count: number;
  /** Last performed */
  lastPerformed: number;
  /** Average duration */
  averageDuration: number;
}

export interface UserJourney {
  /** Step in journey */
  step: string;
  /** Timestamp */
  timestamp: number;
  /** Step duration */
  duration: number;
  /** Additional data */
  data?: any;
}

export interface EngagementMetrics {
  /** Time on site */
  timeOnSite: number;
  /** Pages per session */
  pagesPerSession: number;
  /** Bounce rate */
  bounceRate: number;
  /** Return visitor */
  returnVisitor: boolean;
}

export interface ContentAnalytics {
  /** Total content items */
  total: number;
  /** Content by type */
  byType: Record<string, number>;
  /** Most popular content */
  popular: string[];
  /** Content engagement */
  engagement: ContentEngagementMetrics;
}

export interface VotingAnalytics {
  /** Total votes */
  totalVotes: number;
  /** Votes by type */
  byType: Record<string, number>;
  /** Vote trends */
  trends: VoteTrend[];
  /** Top voters */
  topVoters: string[];
}

export interface ErrorRateMetrics {
  /** Client errors */
  client: number;
  /** Server errors */
  server: number;
  /** Network errors */
  network: number;
  /** Overall error rate */
  overall: number;
}

export interface ResourceUsageMetrics {
  /** Memory usage */
  memory: number;
  /** CPU usage */
  cpu: number;
  /** Network usage */
  network: number;
  /** Storage usage */
  storage: number;
}

export interface ContentEngagementMetrics {
  /** Average views per content */
  avgViews: number;
  /** Average votes per content */
  avgVotes: number;
  /** Content retention rate */
  retentionRate: number;
}

export interface VoteTrend {
  /** Time period */
  period: string;
  /** Vote count */
  count: number;
  /** Trend direction */
  direction: 'up' | 'down' | 'stable';
}

export interface PlatformPerformanceMetrics {
  /** Uptime percentage */
  uptime: number;
  /** Average response time */
  responseTime: number;
  /** Throughput */
  throughput: number;
  /** Concurrent users */
  concurrentUsers: number;
}

// =============================================================================
// CACHE STATE TYPES
// =============================================================================

export interface CacheEntry {
  /** Cache key */
  key: string;
  /** Cached data */
  data: any;
  /** Expiration timestamp */
  expiresAt: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessed: number;
  /** Access count */
  accessCount: number;
  /** Entry size in bytes */
  size: number;
}

export interface CacheStatistics {
  /** Total entries */
  totalEntries: number;
  /** Cache hit rate */
  hitRate: number;
  /** Cache miss rate */
  missRate: number;
  /** Total cache size */
  totalSize: number;
  /** Average entry size */
  averageEntrySize: number;
  /** Most accessed entries */
  mostAccessed: string[];
}

export interface CacheConfiguration {
  /** Maximum cache size */
  maxSize: number;
  /** Default TTL */
  defaultTtl: number;
  /** Cleanup interval */
  cleanupInterval: number;
  /** Compression enabled */
  compressionEnabled: boolean;
  /** Cache strategies */
  strategies: CacheStrategy[];
}

export interface CacheCleanupStatus {
  /** Last cleanup timestamp */
  lastCleanup: number;
  /** Next scheduled cleanup */
  nextCleanup: number;
  /** Cleanup in progress */
  inProgress: boolean;
  /** Entries cleaned in last run */
  entriesCleaned: number;
}

export interface CacheStrategy {
  /** Strategy name */
  name: string;
  /** Strategy pattern */
  pattern: string;
  /** Strategy TTL */
  ttl: number;
  /** Strategy enabled */
  enabled: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface SocialLinks {
  /** Twitter handle */
  twitter?: string;
  /** Discord username */
  discord?: string;
  /** Twitch channel */
  twitch?: string;
  /** YouTube channel */
  youtube?: string;
  /** Custom links */
  custom?: CustomSocialLink[];
}

export interface CustomSocialLink {
  /** Link name */
  name: string;
  /** Link URL */
  url: string;
  /** Link icon */
  icon?: string;
}

export interface UserPrivacyPreferences {
  /** Profile visibility */
  profileVisibility: 'public' | 'clan' | 'friends' | 'private';
  /** Show online status */
  showOnlineStatus: boolean;
  /** Show activity */
  showActivity: boolean;
  /** Allow search */
  allowSearch: boolean;
}

export interface DeviceInfo {
  /** Device type */
  type: 'desktop' | 'mobile' | 'tablet';
  /** Operating system */
  os: string;
  /** Browser information */
  browser: string;
  /** Screen resolution */
  resolution: string;
}

export interface LocationInfo {
  /** Country */
  country: string;
  /** City */
  city?: string;
  /** Timezone */
  timezone: string;
}

export interface PushNotificationSettings {
  /** Push notifications enabled */
  enabled: boolean;
  /** Notification token */
  token?: string;
  /** Subscribed topics */
  topics: string[];
  /** Quiet hours */
  quietHours?: [number, number];
}

export interface NotificationHistory {
  /** Notification ID */
  id: string;
  /** Date sent */
  dateSent: number;
  /** Date read */
  dateRead?: number;
  /** Notification type */
  type: string;
  /** Notification title */
  title: string;
}

export interface SystemNotification {
  /** Notification ID */
  id: string;
  /** Notification message */
  message: string;
  /** Notification level */
  level: 'info' | 'warning' | 'error';
  /** Show to all users */
  global: boolean;
  /** Start time */
  startTime: number;
  /** End time */
  endTime?: number;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export default AppState;