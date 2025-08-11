/**
 * MLG.clan Mobile App Type Definitions
 */

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  walletAddress?: string;
  profilePicture?: string;
  clan?: Clan;
  achievements: Achievement[];
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalVotes: number;
  tokensEarned: number;
  contentSubmitted: number;
  clanRank: number;
  level: number;
  experience: number;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'dark' | 'light';
  language: string;
  autoSync: boolean;
}

export interface NotificationPreferences {
  governance: boolean;
  clanActivities: boolean;
  tournaments: boolean;
  achievements: boolean;
  marketing: boolean;
}

// Clan Types
export interface Clan {
  id: string;
  name: string;
  description: string;
  logo?: string;
  members: ClanMember[];
  achievements: Achievement[];
  stats: ClanStats;
  settings: ClanSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ClanMember {
  userId: string;
  username: string;
  role: ClanRole;
  joinedAt: string;
  contribution: number;
}

export interface ClanRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface ClanStats {
  totalMembers: number;
  totalVotes: number;
  averageContribution: number;
  rank: number;
}

export interface ClanSettings {
  isPublic: boolean;
  requireApproval: boolean;
  minimumTokens: number;
}

// Content Types
export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  author: User;
  clan?: Clan;
  votes: Vote[];
  comments: Comment[];
  tags: string[];
  metadata: ContentMetadata;
  createdAt: string;
  updatedAt: string;
}

export type ContentType = 'video' | 'image' | 'text' | 'audio' | 'stream';

export interface ContentMetadata {
  duration?: number;
  resolution?: string;
  fileSize?: number;
  platform?: string;
  originalUrl?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  parentId?: string;
  replies: Comment[];
  votes: Vote[];
  createdAt: string;
}

// Voting Types
export interface Vote {
  id: string;
  userId: string;
  contentId: string;
  type: VoteType;
  tokensSpent: number;
  signature: string;
  blockchainTxId?: string;
  createdAt: string;
}

export type VoteType = 'up' | 'down' | 'burn';

export interface VotingProposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  options: ProposalOption[];
  creator: User;
  clan?: Clan;
  votes: ProposalVote[];
  status: ProposalStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export type ProposalType = 'governance' | 'clan-rule' | 'member-action' | 'treasury';
export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'expired';

export interface ProposalOption {
  id: string;
  text: string;
  votes: number;
  tokenWeight: number;
}

export interface ProposalVote {
  id: string;
  userId: string;
  optionId: string;
  tokensSpent: number;
  signature: string;
  createdAt: string;
}

// Wallet Types
export interface Wallet {
  address: string;
  balance: number;
  tokens: Token[];
  transactions: Transaction[];
  isConnected: boolean;
  provider: WalletProvider;
}

export type WalletProvider = 'phantom' | 'solflare' | 'metamask';

export interface Token {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logo?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  token: string;
  to?: string;
  from?: string;
  status: TransactionStatus;
  signature: string;
  blockTime?: number;
  fee?: number;
  memo?: string;
  createdAt: string;
}

export type TransactionType = 'vote' | 'burn' | 'transfer' | 'stake' | 'reward';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  unlockedAt?: string;
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementRequirement {
  type: string;
  value: number;
  description: string;
}

export interface AchievementReward {
  type: 'tokens' | 'badge' | 'privilege';
  value: number;
  description: string;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Main: undefined;
  ClanDetails: {clanId: string};
  ContentDetails: {contentId: string};
  Profile: {userId?: string};
  Wallet: undefined;
  Voting: undefined;
  ProposalDetails: {proposalId: string};
  Settings: undefined;
  Camera: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Clans: undefined;
  Content: undefined;
  Voting: undefined;
  Profile: undefined;
};

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'governance_proposal' 
  | 'clan_invitation' 
  | 'content_featured' 
  | 'achievement_unlocked' 
  | 'tournament_reminder'
  | 'vote_reminder'
  | 'clan_announcement';

// Sync Types
export interface SyncState {
  lastSync: string;
  isOnline: boolean;
  pendingActions: PendingAction[];
  conflicts: SyncConflict[];
}

export interface PendingAction {
  id: string;
  type: ActionType;
  data: any;
  timestamp: string;
  retries: number;
}

export type ActionType = 'vote' | 'comment' | 'content_submit' | 'clan_join' | 'proposal_create';

export interface SyncConflict {
  id: string;
  type: string;
  localData: any;
  serverData: any;
  timestamp: string;
}

// Performance Types
export interface PerformanceMetrics {
  appStartTime: number;
  memoryUsage: number;
  batteryLevel: number;
  networkLatency: number;
  renderTime: number;
  crashCount: number;
}

// Error Types
export interface AppError {
  id: string;
  message: string;
  stack?: string;
  context: string;
  timestamp: string;
  userId?: string;
  deviceInfo: any;
}