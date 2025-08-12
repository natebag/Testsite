/**
 * Clan Management Type Definitions
 * 
 * Comprehensive TypeScript definitions for the MLG.clan clan system,
 * including clan management, member roles, achievements, and leaderboards
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

// =============================================================================
// CORE CLAN TYPES
// =============================================================================

export interface ClanState {
  /** Current user's clan */
  currentClan: Clan | null;
  /** List of clan members */
  membersList: ClanMember[];
  /** Clan statistics and metrics */
  clanStats: ClanStats;
  /** Pending clan invitations */
  invitations: ClanInvitation[];
  /** Available clans to join */
  availableClans: ClanSummary[];
  /** Clan data loading state */
  isLoading: boolean;
  /** Clan operation error */
  error: string | null;
  /** Clan leaderboard data */
  leaderboard: ClanLeaderboard;
  /** User's clan permissions */
  permissions: ClanPermissions;
  /** Clan activity feed */
  activityFeed: ClanActivity[];
}

export interface Clan {
  /** Unique clan identifier */
  id: string;
  /** Clan name */
  name: string;
  /** Clan tag/abbreviation */
  tag: string;
  /** Clan description */
  description: string;
  /** Clan logo/avatar URL */
  logo?: string;
  /** Clan banner image URL */
  banner?: string;
  /** Clan creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Clan founder */
  founder: ClanMember;
  /** Clan members */
  members: ClanMember[];
  /** Clan settings */
  settings: ClanSettings;
  /** Clan statistics */
  statistics: ClanStatistics;
  /** Clan achievements */
  achievements: ClanAchievement[];
  /** Clan status */
  status: ClanStatus;
  /** Clan tier/level */
  tier: ClanTier;
  /** Clan treasury */
  treasury: ClanTreasury;
  /** Clan social links */
  socialLinks?: ClanSocialLinks;
}

export interface ClanMember {
  /** User identifier */
  userId: string;
  /** Username */
  username: string;
  /** Display name */
  displayName?: string;
  /** User avatar URL */
  avatar?: string;
  /** Member role in clan */
  role: ClanRole;
  /** Date joined clan */
  joinedAt: number;
  /** Last active timestamp */
  lastActive: number;
  /** Member status */
  status: MemberStatus;
  /** Member contributions */
  contributions: MemberContributions;
  /** Member permissions */
  permissions: string[];
  /** Member tier within clan */
  tier: MemberTier;
  /** Member notes (for leadership) */
  notes?: string;
  /** Probation status */
  probation?: ProbationInfo;
}

export interface ClanRole {
  /** Role identifier */
  id: string;
  /** Role name */
  name: string;
  /** Role display name */
  displayName: string;
  /** Role description */
  description: string;
  /** Role color (hex) */
  color: string;
  /** Role permissions */
  permissions: ClanPermission[];
  /** Role priority/hierarchy */
  priority: number;
  /** Whether role can be assigned by other members */
  assignable: boolean;
  /** Maximum number of members with this role */
  maxMembers?: number;
}

export type ClanStatus = 
  | 'active'
  | 'inactive'
  | 'recruiting'
  | 'full'
  | 'private'
  | 'disbanded'
  | 'suspended';

export type MemberStatus = 
  | 'active'
  | 'inactive'
  | 'away'
  | 'banned'
  | 'left'
  | 'kicked'
  | 'probation';

export type ClanTier = 
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'legend';

export type MemberTier = 
  | 'recruit'
  | 'member'
  | 'veteran'
  | 'elite'
  | 'champion';

// =============================================================================
// CLAN SETTINGS AND CONFIGURATION
// =============================================================================

export interface ClanSettings {
  /** Whether clan is public */
  isPublic: boolean;
  /** Whether joining requires approval */
  requireApproval: boolean;
  /** Minimum token requirement to join */
  minimumTokens: number;
  /** Minimum level requirement */
  minimumLevel: number;
  /** Maximum number of members */
  maxMembers: number;
  /** Automatic kick settings */
  autoKick: AutoKickSettings;
  /** Clan privacy settings */
  privacy: ClanPrivacySettings;
  /** Clan moderation settings */
  moderation: ClanModerationSettings;
  /** Clan treasury settings */
  treasury: TreasurySettings;
}

export interface AutoKickSettings {
  /** Whether auto-kick is enabled */
  enabled: boolean;
  /** Days of inactivity before kick */
  inactivityDays: number;
  /** Minimum contribution threshold */
  minContribution: number;
  /** Grace period for new members */
  gracePeriodDays: number;
  /** Exempt roles from auto-kick */
  exemptRoles: string[];
}

export interface ClanPrivacySettings {
  /** Show member list publicly */
  showMembers: boolean;
  /** Show clan statistics publicly */
  showStats: boolean;
  /** Show clan activity publicly */
  showActivity: boolean;
  /** Allow external invitations */
  allowExternalInvites: boolean;
}

export interface ClanModerationSettings {
  /** Content moderation level */
  moderationLevel: 'low' | 'medium' | 'high' | 'strict';
  /** Automatic content filtering */
  autoFilter: boolean;
  /** Member reporting system */
  allowReports: boolean;
  /** Probation system enabled */
  probationEnabled: boolean;
  /** Default probation duration */
  defaultProbationDays: number;
}

export interface TreasurySettings {
  /** Treasury management enabled */
  enabled: boolean;
  /** Member contribution requirements */
  contributionRequired: boolean;
  /** Minimum contribution amount */
  minContribution: number;
  /** Treasury distribution method */
  distributionMethod: 'equal' | 'contribution' | 'rank' | 'custom';
  /** Distribution frequency */
  distributionFrequency: 'daily' | 'weekly' | 'monthly';
}

// =============================================================================
// CLAN STATISTICS AND METRICS
// =============================================================================

export interface ClanStats {
  /** Total number of members */
  totalMembers: number;
  /** Total votes cast by clan */
  totalVotes: number;
  /** Average member contribution */
  averageContribution: number;
  /** Clan ranking */
  ranking: number;
  /** Weekly activity score */
  weeklyActivity: number;
  /** Monthly activity score */
  monthlyActivity: number;
  /** Clan growth rate */
  growthRate: number;
}

export interface ClanStatistics {
  /** Member statistics */
  members: MemberStatistics;
  /** Activity statistics */
  activity: ActivityStatistics;
  /** Performance statistics */
  performance: PerformanceStatistics;
  /** Competition statistics */
  competitions: CompetitionStatistics;
  /** Treasury statistics */
  treasury: TreasuryStatistics;
}

export interface MemberStatistics {
  /** Total members */
  total: number;
  /** Active members (last 7 days) */
  active: number;
  /** New members this month */
  newThisMonth: number;
  /** Members who left this month */
  leftThisMonth: number;
  /** Average member tenure */
  averageTenure: number;
  /** Member retention rate */
  retentionRate: number;
  /** Members by tier breakdown */
  tierBreakdown: Record<MemberTier, number>;
  /** Members by role breakdown */
  roleBreakdown: Record<string, number>;
}

export interface ActivityStatistics {
  /** Total clan votes */
  totalVotes: number;
  /** Votes this week */
  votesThisWeek: number;
  /** Votes this month */
  votesThisMonth: number;
  /** Total tokens burned */
  totalTokensBurned: number;
  /** Average votes per member */
  avgVotesPerMember: number;
  /** Activity score */
  activityScore: number;
  /** Peak activity hours */
  peakHours: number[];
  /** Daily activity trends */
  dailyTrends: DailyActivityTrend[];
}

export interface PerformanceStatistics {
  /** Overall clan score */
  overallScore: number;
  /** Ranking position */
  ranking: number;
  /** Percentile ranking */
  percentile: number;
  /** Score change this week */
  weeklyChange: number;
  /** Score change this month */
  monthlyChange: number;
  /** Best historical ranking */
  bestRanking: number;
  /** Performance trend */
  trend: 'up' | 'down' | 'stable';
}

export interface CompetitionStatistics {
  /** Tournaments participated */
  tournamentsParticipated: number;
  /** Tournaments won */
  tournamentsWon: number;
  /** Win rate */
  winRate: number;
  /** Current tournament streak */
  currentStreak: number;
  /** Best tournament streak */
  bestStreak: number;
  /** Total prize money won */
  totalPrizesWon: number;
  /** Upcoming tournaments */
  upcomingTournaments: TournamentInfo[];
}

export interface TreasuryStatistics {
  /** Total treasury value */
  totalValue: number;
  /** Member contributions */
  totalContributions: number;
  /** Distributions made */
  totalDistributions: number;
  /** Treasury growth rate */
  growthRate: number;
  /** Next distribution date */
  nextDistribution: string;
  /** Top contributors */
  topContributors: ContributorInfo[];
}

export interface DailyActivityTrend {
  /** Date */
  date: string;
  /** Activity score */
  score: number;
  /** Vote count */
  votes: number;
  /** Active members */
  activeMembers: number;
}

export interface TournamentInfo {
  /** Tournament ID */
  id: string;
  /** Tournament name */
  name: string;
  /** Start date */
  startDate: string;
  /** Entry fee */
  entryFee: number;
  /** Prize pool */
  prizePool: number;
  /** Max participants */
  maxParticipants: number;
  /** Tournament type */
  type: string;
}

export interface ContributorInfo {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** Contribution amount */
  amount: number;
  /** Contribution percentage */
  percentage: number;
}

// =============================================================================
// CLAN INVITATIONS AND MEMBERSHIP
// =============================================================================

export interface ClanInvitation {
  /** Invitation identifier */
  id: string;
  /** Clan information */
  clan: ClanSummary;
  /** Invited user */
  invitedUser: string;
  /** Inviter information */
  inviter: InviterInfo;
  /** Invitation message */
  message?: string;
  /** Invitation timestamp */
  createdAt: number;
  /** Expiration timestamp */
  expiresAt: number;
  /** Invitation status */
  status: InvitationStatus;
  /** Response timestamp */
  respondedAt?: number;
  /** Response message */
  responseMessage?: string;
}

export interface ClanSummary {
  /** Clan identifier */
  id: string;
  /** Clan name */
  name: string;
  /** Clan tag */
  tag: string;
  /** Clan logo URL */
  logo?: string;
  /** Member count */
  memberCount: number;
  /** Clan tier */
  tier: ClanTier;
  /** Clan ranking */
  ranking: number;
  /** Whether clan is recruiting */
  recruiting: boolean;
  /** Join requirements */
  requirements: JoinRequirements;
  /** Clan description snippet */
  description?: string;
}

export interface InviterInfo {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** User role in clan */
  role: string;
  /** User avatar */
  avatar?: string;
}

export interface JoinRequirements {
  /** Minimum token balance */
  minTokens: number;
  /** Minimum level */
  minLevel: number;
  /** Minimum vote count */
  minVotes: number;
  /** Approval required */
  requiresApproval: boolean;
  /** Additional custom requirements */
  customRequirements?: string[];
}

export type InvitationStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

// =============================================================================
// CLAN PERMISSIONS AND ROLES
// =============================================================================

export interface ClanPermissions {
  /** User's permissions in clan */
  userPermissions: string[];
  /** Available actions user can perform */
  availableActions: ClanAction[];
  /** Role-based permissions */
  rolePermissions: Record<string, string[]>;
  /** Can perform admin actions */
  isAdmin: boolean;
  /** Can perform moderator actions */
  isModerator: boolean;
  /** Can manage members */
  canManageMembers: boolean;
  /** Can modify clan settings */
  canModifySettings: boolean;
  /** Can access treasury */
  canAccessTreasury: boolean;
}

export interface ClanPermission {
  /** Permission identifier */
  id: string;
  /** Permission name */
  name: string;
  /** Permission description */
  description: string;
  /** Permission category */
  category: PermissionCategory;
  /** Whether permission is dangerous */
  isDangerous: boolean;
  /** Required minimum role */
  minRole?: string;
}

export type PermissionCategory = 
  | 'general'
  | 'members'
  | 'settings'
  | 'treasury'
  | 'moderation'
  | 'admin';

export type ClanAction = 
  | 'invite_member'
  | 'kick_member'
  | 'ban_member'
  | 'promote_member'
  | 'demote_member'
  | 'edit_settings'
  | 'manage_treasury'
  | 'create_tournament'
  | 'delete_clan'
  | 'transfer_leadership'
  | 'moderate_content'
  | 'view_logs';

export interface MemberContributions {
  /** Total contribution score */
  totalScore: number;
  /** Votes contributed */
  votes: number;
  /** Tokens contributed */
  tokens: number;
  /** Content submitted */
  content: number;
  /** Members recruited */
  recruits: number;
  /** Tournaments won */
  tournaments: number;
  /** Leadership activities */
  leadership: number;
  /** Weekly contribution */
  thisWeek: number;
  /** Monthly contribution */
  thisMonth: number;
}

export interface ProbationInfo {
  /** Probation start date */
  startDate: number;
  /** Probation end date */
  endDate: number;
  /** Reason for probation */
  reason: string;
  /** Assigned by user */
  assignedBy: string;
  /** Probation restrictions */
  restrictions: string[];
  /** Progress towards removal */
  progress: number;
}

// =============================================================================
// CLAN ACHIEVEMENTS AND PROGRESSION
// =============================================================================

export interface ClanAchievement {
  /** Achievement identifier */
  id: string;
  /** Achievement name */
  name: string;
  /** Achievement description */
  description: string;
  /** Achievement icon */
  icon: string;
  /** Achievement category */
  category: AchievementCategory;
  /** Achievement rarity */
  rarity: AchievementRarity;
  /** Unlock requirements */
  requirements: AchievementRequirement[];
  /** Achievement rewards */
  rewards: AchievementReward[];
  /** Date unlocked */
  unlockedAt?: number;
  /** Progress towards achievement */
  progress: AchievementProgress;
  /** Whether achievement is repeatable */
  repeatable: boolean;
}

export type AchievementCategory = 
  | 'membership'
  | 'activity'
  | 'competition'
  | 'leadership'
  | 'treasury'
  | 'social'
  | 'special';

export type AchievementRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface AchievementRequirement {
  /** Requirement type */
  type: string;
  /** Required value */
  value: number;
  /** Current progress */
  current: number;
  /** Requirement description */
  description: string;
  /** Whether requirement is met */
  completed: boolean;
}

export interface AchievementReward {
  /** Reward type */
  type: 'tokens' | 'badge' | 'title' | 'privilege' | 'cosmetic';
  /** Reward amount/identifier */
  value: string | number;
  /** Reward description */
  description: string;
}

export interface AchievementProgress {
  /** Overall progress percentage */
  percentage: number;
  /** Current step */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Next milestone */
  nextMilestone?: AchievementRequirement;
}

// =============================================================================
// CLAN TREASURY AND ECONOMICS
// =============================================================================

export interface ClanTreasury {
  /** Total treasury balance */
  balance: number;
  /** Treasury tokens by type */
  tokenBalances: Record<string, number>;
  /** Treasury transactions */
  transactions: TreasuryTransaction[];
  /** Distribution history */
  distributions: TreasuryDistribution[];
  /** Treasury settings */
  settings: TreasurySettings;
  /** Treasury permissions */
  permissions: TreasuryPermissions;
  /** Pending proposals */
  proposals: TreasuryProposal[];
}

export interface TreasuryTransaction {
  /** Transaction ID */
  id: string;
  /** Transaction type */
  type: TreasuryTransactionType;
  /** Transaction amount */
  amount: number;
  /** Token type */
  tokenType: string;
  /** Transaction description */
  description: string;
  /** User who initiated */
  initiatedBy: string;
  /** Transaction timestamp */
  timestamp: number;
  /** Blockchain signature */
  signature?: string;
  /** Transaction status */
  status: 'pending' | 'completed' | 'failed';
}

export interface TreasuryDistribution {
  /** Distribution ID */
  id: string;
  /** Distribution amount */
  totalAmount: number;
  /** Token type */
  tokenType: string;
  /** Distribution method */
  method: string;
  /** Number of recipients */
  recipients: number;
  /** Distribution date */
  date: number;
  /** Initiated by */
  initiatedBy: string;
  /** Distribution details */
  details: DistributionDetail[];
}

export interface TreasuryProposal {
  /** Proposal ID */
  id: string;
  /** Proposal title */
  title: string;
  /** Proposal description */
  description: string;
  /** Proposed amount */
  amount: number;
  /** Token type */
  tokenType: string;
  /** Proposal type */
  type: ProposalType;
  /** Proposed by */
  proposedBy: string;
  /** Proposal timestamp */
  createdAt: number;
  /** Voting deadline */
  votingDeadline: number;
  /** Votes for */
  votesFor: number;
  /** Votes against */
  votesAgainst: number;
  /** Proposal status */
  status: ProposalStatus;
}

export type TreasuryTransactionType = 
  | 'contribution'
  | 'distribution'
  | 'expense'
  | 'prize'
  | 'penalty'
  | 'bonus';

export type ProposalType = 
  | 'distribution'
  | 'expense'
  | 'investment'
  | 'donation'
  | 'prize_pool';

export type ProposalStatus = 
  | 'active'
  | 'passed'
  | 'rejected'
  | 'expired'
  | 'executed';

export interface DistributionDetail {
  /** Recipient user ID */
  userId: string;
  /** Amount received */
  amount: number;
  /** Distribution reason */
  reason: string;
}

export interface TreasuryPermissions {
  /** Can view treasury */
  canView: boolean;
  /** Can contribute to treasury */
  canContribute: boolean;
  /** Can create proposals */
  canPropose: boolean;
  /** Can vote on proposals */
  canVote: boolean;
  /** Can execute distributions */
  canDistribute: boolean;
  /** Can manage treasury settings */
  canManage: boolean;
}

// =============================================================================
// CLAN LEADERBOARDS AND RANKINGS
// =============================================================================

export interface ClanLeaderboard {
  /** Global clan rankings */
  global: ClanRanking[];
  /** Regional clan rankings */
  regional?: ClanRanking[];
  /** User's clan current ranking */
  userClanRank: ClanRankingEntry | null;
  /** Leaderboard metadata */
  metadata: LeaderboardMetadata;
  /** Last update timestamp */
  lastUpdated: number;
  /** Ranking history */
  history: RankingHistory[];
}

export interface ClanRanking {
  /** Clan ranking entry */
  entries: ClanRankingEntry[];
  /** Leaderboard type */
  type: LeaderboardType;
  /** Time period */
  period: TimePeriod;
  /** Total clans ranked */
  totalClans: number;
}

export interface ClanRankingEntry {
  /** Ranking position */
  rank: number;
  /** Clan information */
  clan: ClanSummary;
  /** Ranking score */
  score: number;
  /** Score breakdown */
  scoreBreakdown: ScoreBreakdown;
  /** Rank change from previous period */
  rankChange: number;
  /** Score change from previous period */
  scoreChange: number;
  /** Trending direction */
  trend: 'up' | 'down' | 'stable';
}

export interface ScoreBreakdown {
  /** Activity score component */
  activity: number;
  /** Member quality score */
  memberQuality: number;
  /** Competition performance */
  competition: number;
  /** Treasury management */
  treasury: number;
  /** Social engagement */
  social: number;
  /** Leadership quality */
  leadership: number;
}

export interface LeaderboardMetadata {
  /** Leaderboard season */
  season: string;
  /** Season start date */
  seasonStart: string;
  /** Season end date */
  seasonEnd: string;
  /** Update frequency */
  updateFrequency: string;
  /** Calculation method */
  calculationMethod: string;
}

export interface RankingHistory {
  /** Period identifier */
  period: string;
  /** Ranking position */
  rank: number;
  /** Score achieved */
  score: number;
  /** Period start date */
  startDate: string;
  /** Period end date */
  endDate: string;
}

export type LeaderboardType = 
  | 'overall'
  | 'activity'
  | 'growth'
  | 'competition'
  | 'treasury';

export type TimePeriod = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'seasonal'
  | 'alltime';

// =============================================================================
// CLAN ACTIVITY AND SOCIAL FEATURES
// =============================================================================

export interface ClanActivity {
  /** Activity ID */
  id: string;
  /** Activity type */
  type: ActivityType;
  /** Activity timestamp */
  timestamp: number;
  /** User who performed activity */
  user: ActivityUser;
  /** Activity data */
  data: ActivityData;
  /** Activity visibility */
  visibility: 'public' | 'clan' | 'leadership';
  /** Activity importance */
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActivityUser {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** User avatar */
  avatar?: string;
  /** User role */
  role: string;
}

export interface ActivityData {
  /** Activity description */
  description: string;
  /** Additional context data */
  context?: Record<string, any>;
  /** Related entities */
  relatedEntities?: string[];
  /** Activity metadata */
  metadata?: Record<string, any>;
}

export type ActivityType = 
  | 'member_joined'
  | 'member_left'
  | 'member_promoted'
  | 'member_demoted'
  | 'member_kicked'
  | 'role_created'
  | 'role_modified'
  | 'settings_changed'
  | 'achievement_unlocked'
  | 'tournament_won'
  | 'treasury_contribution'
  | 'treasury_distribution'
  | 'leadership_change'
  | 'clan_renamed'
  | 'milestone_reached';

export interface ClanSocialLinks {
  /** Discord server */
  discord?: string;
  /** Twitch channel */
  twitch?: string;
  /** YouTube channel */
  youtube?: string;
  /** Twitter account */
  twitter?: string;
  /** Website URL */
  website?: string;
  /** Custom social links */
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

// =============================================================================
// CLAN EVENTS AND NOTIFICATIONS
// =============================================================================

export type ClanEventType = 
  | 'member_activity'
  | 'role_change'
  | 'settings_update'
  | 'treasury_change'
  | 'achievement_unlock'
  | 'invitation_sent'
  | 'invitation_response'
  | 'tournament_result'
  | 'leaderboard_update';

export interface ClanEvent {
  /** Event type */
  type: ClanEventType;
  /** Event data */
  data: any;
  /** Event timestamp */
  timestamp: number;
  /** Event source */
  source: 'user' | 'system' | 'external';
  /** Event clan */
  clanId: string;
}

export type ClanEventListener = (event: ClanEvent) => void;

// =============================================================================
// EXPORT TYPES
// =============================================================================

export default ClanState;