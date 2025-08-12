/**
 * Voting System Type Definitions
 * 
 * Comprehensive TypeScript definitions for the MLG.clan voting system,
 * including burn-to-vote mechanics, voting state management, and leaderboards
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { PublicKey, Transaction } from '@solana/web3.js';

// =============================================================================
// CORE VOTING TYPES
// =============================================================================

export interface VotingState {
  /** Free votes remaining for today */
  dailyVotesRemaining: number;
  /** Total votes used today */
  totalVotesUsed: number;
  /** Available burn-to-vote count */
  burnVotesAvailable: number;
  /** Currently active vote sessions */
  activeVotes: ActiveVote[];
  /** Historical voting data */
  voteHistory: VoteHistory;
  /** Voting operation in progress */
  isVoting: boolean;
  /** Voting error message */
  error: string | null;
  /** Last daily reset timestamp */
  lastResetTime: Date | null;
  /** User voting statistics */
  statistics: VotingStatistics;
  /** Current voting session info */
  currentSession: VotingSession | null;
}

export interface ActiveVote {
  /** Unique vote identifier */
  voteId: string;
  /** Content being voted on */
  contentId: string;
  /** Vote type */
  voteType: VoteType;
  /** Tokens burned for this vote */
  tokensBurned: number;
  /** Vote timestamp */
  timestamp: number;
  /** Vote status */
  status: VoteStatus;
  /** Transaction signature */
  signature?: string;
  /** Vote weight/power */
  voteWeight: number;
  /** Expiration time (for pending votes) */
  expiresAt?: number;
}

export interface VoteHistory {
  /** Daily voting history */
  daily: DailyVoteRecord[];
  /** Weekly voting history */
  weekly: WeeklyVoteRecord[];
  /** Monthly voting history */
  monthly: MonthlyVoteRecord[];
  /** All-time statistics */
  allTime: AllTimeVoteRecord;
  /** Recent vote transactions */
  recentVotes: VoteRecord[];
}

export interface VotingStatistics {
  /** Total votes cast all time */
  totalVotesCast: number;
  /** Total tokens burned for voting */
  totalTokensBurned: number;
  /** Average vote weight */
  averageVoteWeight: number;
  /** Current voting streak */
  currentStreak: number;
  /** Longest voting streak */
  longestStreak: number;
  /** Voting accuracy rate */
  accuracyRate: number;
  /** Favorite vote type */
  favoriteVoteType: VoteType;
  /** Most voted content category */
  favoriteCategory: string;
}

export interface VotingSession {
  /** Session identifier */
  sessionId: string;
  /** Session start time */
  startTime: number;
  /** Votes cast in this session */
  votesCast: number;
  /** Tokens burned in this session */
  tokensBurned: number;
  /** Session status */
  status: 'active' | 'ended' | 'expired';
  /** Expected session end time */
  expectedEndTime?: number;
}

export type VoteType = 'up' | 'down' | 'burn' | 'super' | 'mega';

export type VoteStatus = 
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'cancelled';

// =============================================================================
// VOTE RECORD TYPES
// =============================================================================

export interface VoteRecord {
  /** Vote identifier */
  id: string;
  /** Content voted on */
  contentId: string;
  /** Content title */
  contentTitle: string;
  /** Content type */
  contentType: string;
  /** Vote type */
  voteType: VoteType;
  /** Tokens burned */
  tokensBurned: number;
  /** Vote weight */
  voteWeight: number;
  /** Vote timestamp */
  timestamp: number;
  /** Transaction signature */
  signature: string;
  /** Vote outcome (if applicable) */
  outcome?: VoteOutcome;
  /** Rewards earned */
  rewardsEarned: number;
}

export interface DailyVoteRecord {
  /** Date of voting */
  date: string;
  /** Total votes cast */
  totalVotes: number;
  /** Total tokens burned */
  tokensBurned: number;
  /** Free votes used */
  freeVotesUsed: number;
  /** Burn votes used */
  burnVotesUsed: number;
  /** Rewards earned */
  rewardsEarned: number;
  /** Vote breakdown by type */
  voteBreakdown: VoteTypeBreakdown;
}

export interface WeeklyVoteRecord {
  /** Week identifier (YYYY-WW) */
  week: string;
  /** Week start date */
  startDate: string;
  /** Week end date */
  endDate: string;
  /** Total votes cast */
  totalVotes: number;
  /** Total tokens burned */
  tokensBurned: number;
  /** Daily averages */
  dailyAverages: {
    votes: number;
    tokensBurned: number;
    rewardsEarned: number;
  };
  /** Top voted content */
  topContent: ContentVoteSummary[];
  /** Voting streak days */
  streakDays: number;
}

export interface MonthlyVoteRecord {
  /** Month identifier (YYYY-MM) */
  month: string;
  /** Total votes cast */
  totalVotes: number;
  /** Total tokens burned */
  tokensBurned: number;
  /** Total rewards earned */
  rewardsEarned: number;
  /** Monthly ranking */
  ranking: number;
  /** Percentile ranking */
  percentile: number;
  /** Achievement milestones reached */
  milestonesReached: string[];
}

export interface AllTimeVoteRecord {
  /** Total votes cast */
  totalVotes: number;
  /** Total tokens burned */
  totalTokensBurned: number;
  /** Total rewards earned */
  totalRewardsEarned: number;
  /** Account creation date */
  accountCreated: string;
  /** First vote date */
  firstVote: string;
  /** Most recent vote date */
  lastVote: string;
  /** All-time ranking */
  globalRanking: number;
  /** Voting consistency score */
  consistencyScore: number;
}

export interface VoteTypeBreakdown {
  /** Upvotes cast */
  up: number;
  /** Downvotes cast */
  down: number;
  /** Burn votes cast */
  burn: number;
  /** Super votes cast */
  super: number;
  /** Mega votes cast */
  mega: number;
}

export interface ContentVoteSummary {
  /** Content identifier */
  contentId: string;
  /** Content title */
  title: string;
  /** Total votes received */
  totalVotes: number;
  /** Vote score */
  voteScore: number;
  /** Content ranking */
  ranking: number;
}

export type VoteOutcome = 'trending' | 'featured' | 'buried' | 'neutral';

// =============================================================================
// BURN-TO-VOTE TYPES
// =============================================================================

export interface BurnVoteConfig {
  /** Minimum burn amount */
  minimumBurn: number;
  /** Maximum burn amount per vote */
  maximumBurn: number;
  /** Base vote weight multiplier */
  baseMultiplier: number;
  /** Scaling factor for burn amount */
  scalingFactor: number;
  /** Maximum vote weight */
  maxVoteWeight: number;
  /** Burn-to-vote enabled */
  enabled: boolean;
  /** Daily burn limit */
  dailyBurnLimit: number;
  /** Cooldown period between burns */
  cooldownPeriod: number;
}

export interface BurnVoteTransaction {
  /** Vote details */
  vote: VoteData;
  /** Burn details */
  burn: BurnData;
  /** Transaction info */
  transaction: TransactionInfo;
  /** Confirmation status */
  confirmation: ConfirmationStatus;
}

export interface VoteData {
  /** Content being voted on */
  contentId: string;
  /** Vote type */
  voteType: VoteType;
  /** Calculated vote weight */
  voteWeight: number;
  /** User's wallet address */
  voterAddress: string;
  /** Vote timestamp */
  timestamp: number;
}

export interface BurnData {
  /** Amount of tokens to burn */
  burnAmount: number;
  /** Token mint address */
  tokenMint: string;
  /** User's token account */
  sourceAccount: string;
  /** Burn destination (null address) */
  burnDestination: string;
  /** Pre-burn balance */
  preBalance: number;
  /** Expected post-burn balance */
  expectedPostBalance: number;
}

export interface TransactionInfo {
  /** Transaction signature */
  signature: string;
  /** Recent blockhash used */
  blockhash: string;
  /** Transaction fee */
  fee: number;
  /** Compute units used */
  computeUnits?: number;
  /** Transaction build timestamp */
  buildTimestamp: number;
  /** Transaction send timestamp */
  sendTimestamp?: number;
}

export interface ConfirmationStatus {
  /** Confirmation level */
  level: 'processed' | 'confirmed' | 'finalized';
  /** Confirmation timestamp */
  confirmedAt?: number;
  /** Block height */
  blockHeight?: number;
  /** Confirmation count */
  confirmations?: number;
  /** Whether transaction succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// VOTING LEADERBOARD TYPES
// =============================================================================

export interface VotingLeaderboard {
  /** Current period leaderboard */
  current: LeaderboardEntry[];
  /** Previous period leaderboard */
  previous: LeaderboardEntry[];
  /** User's current ranking */
  userRank: UserRanking | null;
  /** Leaderboard metadata */
  metadata: LeaderboardMetadata;
  /** Last update timestamp */
  lastUpdated: number;
}

export interface LeaderboardEntry {
  /** Entry rank/position */
  rank: number;
  /** User identifier */
  userId: string;
  /** Username */
  username: string;
  /** User's wallet address */
  walletAddress: string;
  /** Total votes cast */
  totalVotes: number;
  /** Total tokens burned */
  tokensBurned: number;
  /** Vote score */
  voteScore: number;
  /** Voting streak */
  streak: number;
  /** User avatar/profile picture */
  avatar?: string;
  /** Clan affiliation */
  clan?: {
    id: string;
    name: string;
    tag: string;
  };
  /** Achievement badges */
  badges: string[];
  /** Change from previous period */
  rankChange: number;
}

export interface UserRanking {
  /** Current rank */
  currentRank: number;
  /** Previous rank */
  previousRank: number;
  /** Rank change */
  rankChange: number;
  /** Percentile */
  percentile: number;
  /** Distance to next rank */
  distanceToNext: RankDistance;
  /** Distance to previous rank */
  distanceToPrevious: RankDistance;
}

export interface RankDistance {
  /** Votes needed/lost */
  votes: number;
  /** Tokens needed/lost */
  tokens: number;
  /** Score difference */
  scoreDifference: number;
}

export interface LeaderboardMetadata {
  /** Leaderboard period type */
  periodType: 'daily' | 'weekly' | 'monthly' | 'alltime';
  /** Period identifier */
  periodId: string;
  /** Period start date */
  periodStart: string;
  /** Period end date */
  periodEnd: string;
  /** Total participants */
  totalParticipants: number;
  /** Minimum votes to qualify */
  qualificationThreshold: number;
  /** Leaderboard categories */
  categories: LeaderboardCategory[];
}

export interface LeaderboardCategory {
  /** Category identifier */
  id: string;
  /** Category name */
  name: string;
  /** Category description */
  description: string;
  /** Sorting criteria */
  sortBy: 'votes' | 'tokens' | 'score' | 'streak';
  /** Minimum qualification */
  minQualification: number;
}

// =============================================================================
// VOTING REWARDS TYPES
// =============================================================================

export interface VotingRewards {
  /** Daily reward pool */
  dailyPool: RewardPool;
  /** Weekly reward pool */
  weeklyPool: RewardPool;
  /** Monthly reward pool */
  monthlyPool: RewardPool;
  /** User's earned rewards */
  userRewards: UserRewards;
  /** Reward distribution schedule */
  distributionSchedule: RewardDistribution[];
}

export interface RewardPool {
  /** Total pool size */
  totalPool: number;
  /** Remaining pool */
  remainingPool: number;
  /** Pool distribution method */
  distributionMethod: 'proportional' | 'tiered' | 'fixed';
  /** Minimum participants for distribution */
  minParticipants: number;
  /** Pool status */
  status: 'active' | 'distributing' | 'completed';
  /** Distribution date */
  distributionDate: string;
}

export interface UserRewards {
  /** Pending rewards */
  pending: number;
  /** Claimed rewards */
  claimed: number;
  /** Total earned */
  totalEarned: number;
  /** Reward history */
  history: RewardRecord[];
  /** Next claim date */
  nextClaimDate?: string;
  /** Claim requirements */
  claimRequirements?: ClaimRequirement[];
}

export interface RewardRecord {
  /** Reward identifier */
  id: string;
  /** Reward type */
  type: 'daily' | 'weekly' | 'monthly' | 'bonus' | 'achievement';
  /** Reward amount */
  amount: number;
  /** Earning criteria */
  criteria: string;
  /** Date earned */
  dateEarned: string;
  /** Date claimed */
  dateClaimed?: string;
  /** Reward status */
  status: 'pending' | 'claimed' | 'expired';
}

export interface RewardDistribution {
  /** Distribution identifier */
  id: string;
  /** Distribution period */
  period: string;
  /** Distribution date */
  date: string;
  /** Total amount distributed */
  totalDistributed: number;
  /** Number of recipients */
  recipients: number;
  /** Distribution status */
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
}

export interface ClaimRequirement {
  /** Requirement type */
  type: 'min_votes' | 'min_tokens' | 'streak' | 'verification';
  /** Required value */
  value: number;
  /** Requirement description */
  description: string;
  /** Whether requirement is met */
  isMet: boolean;
}

// =============================================================================
// VOTING ANALYTICS TYPES
// =============================================================================

export interface VotingAnalytics {
  /** Platform-wide voting statistics */
  platformStats: PlatformVotingStats;
  /** Content voting trends */
  contentTrends: ContentVotingTrends;
  /** User behavior analytics */
  userBehavior: UserVotingBehavior;
  /** Token economics data */
  tokenEconomics: VotingTokenEconomics;
}

export interface PlatformVotingStats {
  /** Total votes cast today */
  totalVotesToday: number;
  /** Total votes cast this week */
  totalVotesWeek: number;
  /** Total votes cast this month */
  totalVotesMonth: number;
  /** Total votes all time */
  totalVotesAllTime: number;
  /** Active voters today */
  activeVotersToday: number;
  /** Vote velocity (votes per hour) */
  voteVelocity: number;
  /** Average vote weight */
  averageVoteWeight: number;
}

export interface ContentVotingTrends {
  /** Trending content by votes */
  trendingByVotes: TrendingContent[];
  /** Trending content by burn amount */
  trendingByBurn: TrendingContent[];
  /** Content categories by popularity */
  popularCategories: CategoryStats[];
  /** Vote distribution across content types */
  typeDistribution: ContentTypeStats[];
}

export interface TrendingContent {
  /** Content identifier */
  contentId: string;
  /** Content title */
  title: string;
  /** Content type */
  type: string;
  /** Total votes */
  votes: number;
  /** Total tokens burned */
  tokensBurned: number;
  /** Vote score */
  score: number;
  /** Trend momentum */
  momentum: number;
}

export interface CategoryStats {
  /** Category name */
  category: string;
  /** Total votes in category */
  totalVotes: number;
  /** Average vote weight */
  averageWeight: number;
  /** Content count */
  contentCount: number;
  /** Category growth rate */
  growthRate: number;
}

export interface ContentTypeStats {
  /** Content type */
  type: string;
  /** Vote count */
  votes: number;
  /** Percentage of total votes */
  percentage: number;
  /** Average tokens burned per vote */
  avgTokensPerVote: number;
}

export interface UserVotingBehavior {
  /** Peak voting hours */
  peakHours: number[];
  /** Average session duration */
  avgSessionDuration: number;
  /** Vote-to-burn ratio */
  voteBurnRatio: number;
  /** User retention rate */
  retentionRate: number;
  /** Repeat voter percentage */
  repeatVoterPercentage: number;
}

export interface VotingTokenEconomics {
  /** Total tokens burned for voting */
  totalTokensBurned: number;
  /** Average burn per vote */
  averageBurnPerVote: number;
  /** Token burn velocity */
  burnVelocity: number;
  /** Deflation rate from burns */
  deflationRate: number;
  /** Token utility score */
  utilityScore: number;
}

// =============================================================================
// VOTING EVENTS TYPES
// =============================================================================

export type VotingEventType = 
  | 'vote_cast'
  | 'vote_confirmed'
  | 'vote_failed'
  | 'daily_reset'
  | 'reward_earned'
  | 'leaderboard_updated'
  | 'burn_completed'
  | 'streak_milestone'
  | 'rank_changed';

export interface VotingEvent {
  /** Event type */
  type: VotingEventType;
  /** Event data */
  data: any;
  /** Event timestamp */
  timestamp: number;
  /** Event source */
  source: 'user' | 'system' | 'blockchain';
}

export type VotingEventListener = (event: VotingEvent) => void;

// =============================================================================
// EXPORT TYPES
// =============================================================================

export default VotingState;