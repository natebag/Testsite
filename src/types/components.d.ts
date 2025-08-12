/**
 * UI Component Type Definitions
 * 
 * Comprehensive TypeScript definitions for UI components,
 * including prop types, event handlers, and styling interfaces
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { ReactNode, CSSProperties, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// =============================================================================
// COMMON COMPONENT TYPES
// =============================================================================

/** Base props that all components can accept */
export interface BaseComponentProps {
  /** Component CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Component children */
  children?: ReactNode;
  /** Test identifier */
  'data-testid'?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Component ID */
  id?: string;
}

/** Size variants for components */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Color variants for components */
export type ComponentColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'neutral';

/** Loading state for components */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Component variant types */
export type ComponentVariant = 'filled' | 'outlined' | 'text' | 'ghost';

// =============================================================================
// BUTTON COMPONENT TYPES
// =============================================================================

export interface ButtonProps extends BaseComponentProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** Button variant */
  variant?: ComponentVariant;
  /** Button size */
  size?: ComponentSize;
  /** Button color */
  color?: ComponentColor;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Icon before text */
  startIcon?: ReactNode;
  /** Icon after text */
  endIcon?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

export interface XboxButtonProps extends ButtonProps {
  /** Xbox button style variant */
  xboxVariant?: 'a' | 'b' | 'x' | 'y' | 'menu' | 'view' | 'xbox';
  /** Glow effect */
  glow?: boolean;
  /** Sound effect on click */
  soundEffect?: boolean;
}

export interface BurnButtonProps extends ButtonProps {
  /** Amount to burn */
  burnAmount: number;
  /** Token symbol */
  tokenSymbol: string;
  /** Confirmation required */
  requireConfirmation?: boolean;
  /** Burn confirmation callback */
  onBurnConfirm?: (amount: number) => void;
  /** Show burn animation */
  showAnimation?: boolean;
}

export interface GamingButtonProps extends ButtonProps {
  /** Gaming theme */
  theme?: 'neon' | 'retro' | 'cyberpunk' | 'minimal';
  /** Button animation */
  animation?: 'pulse' | 'glow' | 'shake' | 'bounce';
  /** Achievement unlock sound */
  achievementSound?: boolean;
}

// =============================================================================
// INPUT COMPONENT TYPES
// =============================================================================

export interface InputProps extends BaseComponentProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size */
  size?: ComponentSize;
  /** Input variant */
  variant?: ComponentVariant;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Input label */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Input value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
}

export interface SearchInputProps extends InputProps {
  /** Search suggestions */
  suggestions?: string[];
  /** Show search suggestions */
  showSuggestions?: boolean;
  /** Search handler */
  onSearch?: (query: string) => void;
  /** Clear search */
  onClear?: () => void;
  /** Search loading */
  loading?: boolean;
}

export interface TokenInputProps extends InputProps {
  /** Token symbol */
  tokenSymbol: string;
  /** Token balance */
  balance?: number;
  /** Maximum amount */
  maxAmount?: number;
  /** Amount validation */
  validateAmount?: (amount: number) => boolean;
  /** Use max button */
  showMaxButton?: boolean;
  /** Token icon */
  tokenIcon?: ReactNode;
}

// =============================================================================
// CARD COMPONENT TYPES
// =============================================================================

export interface CardProps extends BaseComponentProps {
  /** Card variant */
  variant?: 'elevated' | 'outlined' | 'filled';
  /** Card padding */
  padding?: ComponentSize;
  /** Clickable card */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Hover effects */
  hover?: boolean;
  /** Card header */
  header?: ReactNode;
  /** Card footer */
  footer?: ReactNode;
}

export interface GamingCardProps extends CardProps {
  /** Gaming theme */
  theme?: 'xbox' | 'playstation' | 'nintendo' | 'pc';
  /** Card glow effect */
  glow?: boolean;
  /** Animated background */
  animatedBackground?: boolean;
  /** Achievement badge */
  achievementBadge?: ReactNode;
}

export interface GamingTileProps extends BaseComponentProps {
  /** Tile title */
  title: string;
  /** Tile description */
  description?: string;
  /** Tile icon */
  icon?: ReactNode;
  /** Tile image */
  image?: string;
  /** Tile selected state */
  selected?: boolean;
  /** Tile disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Tile size */
  size?: ComponentSize;
  /** Gaming theme */
  theme?: 'retro' | 'modern' | 'neon';
}

// =============================================================================
// MODAL COMPONENT TYPES
// =============================================================================

export interface ModalProps extends BaseComponentProps {
  /** Modal open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: ComponentSize | 'fullscreen';
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Modal footer */
  footer?: ReactNode;
  /** Disable scroll */
  disableScroll?: boolean;
}

export interface VoteConfirmationModalProps extends ModalProps {
  /** Vote type */
  voteType: 'up' | 'down' | 'burn';
  /** Content being voted on */
  contentTitle: string;
  /** Burn amount (if burn vote) */
  burnAmount?: number;
  /** Vote confirmation handler */
  onConfirm: () => void;
  /** Vote cancellation handler */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
}

export interface WalletConnectionModalProps extends ModalProps {
  /** Available wallets */
  availableWallets: WalletOption[];
  /** Wallet selection handler */
  onWalletSelect: (wallet: WalletOption) => void;
  /** Connection loading */
  connecting?: boolean;
  /** Connection error */
  error?: string;
}

export interface WalletOption {
  /** Wallet name */
  name: string;
  /** Wallet identifier */
  id: string;
  /** Wallet icon */
  icon: ReactNode;
  /** Wallet installed */
  installed: boolean;
  /** Download URL */
  downloadUrl?: string;
}

// =============================================================================
// FORM COMPONENT TYPES
// =============================================================================

export interface FormProps extends BaseComponentProps {
  /** Form submission handler */
  onSubmit: (data: any) => void;
  /** Form validation */
  validation?: FormValidation;
  /** Form loading */
  loading?: boolean;
  /** Form error */
  error?: string;
  /** Form success message */
  success?: string;
}

export interface FormValidation {
  /** Field validations */
  fields: Record<string, FieldValidation>;
  /** Form-level validation */
  form?: (data: any) => string | null;
}

export interface FieldValidation {
  /** Required field */
  required?: boolean;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Pattern validation */
  pattern?: RegExp;
  /** Custom validation */
  custom?: (value: any) => string | null;
}

export interface SelectProps extends BaseComponentProps {
  /** Select options */
  options: SelectOption[];
  /** Selected value */
  value?: string | string[];
  /** Change handler */
  onChange: (value: string | string[]) => void;
  /** Multiple selection */
  multiple?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Searchable options */
  searchable?: boolean;
  /** Clear button */
  clearable?: boolean;
}

export interface SelectOption {
  /** Option label */
  label: string;
  /** Option value */
  value: string;
  /** Option disabled */
  disabled?: boolean;
  /** Option icon */
  icon?: ReactNode;
  /** Option group */
  group?: string;
}

// =============================================================================
// LOADING COMPONENT TYPES
// =============================================================================

export interface LoadingSpinnerProps extends BaseComponentProps {
  /** Spinner size */
  size?: ComponentSize;
  /** Spinner color */
  color?: ComponentColor;
  /** Loading text */
  text?: string;
  /** Show text */
  showText?: boolean;
  /** Spinner variant */
  variant?: 'circular' | 'linear' | 'dots' | 'pulse';
}

export interface SkeletonLoaderProps extends BaseComponentProps {
  /** Skeleton width */
  width?: string | number;
  /** Skeleton height */
  height?: string | number;
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
  /** Number of lines (for text variant) */
  lines?: number;
}

export interface GamingLoadingProps extends LoadingSpinnerProps {
  /** Gaming theme */
  theme?: 'xbox' | 'retro' | 'cyberpunk';
  /** Loading animation */
  animation?: 'orbit' | 'matrix' | 'glitch' | 'pixel';
  /** Show progress percentage */
  showProgress?: boolean;
  /** Progress value (0-100) */
  progress?: number;
}

// =============================================================================
// NAVIGATION COMPONENT TYPES
// =============================================================================

export interface NavigationProps extends BaseComponentProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Current active item */
  activeItem?: string;
  /** Navigation orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Navigation variant */
  variant?: 'tabs' | 'pills' | 'underline' | 'sidebar';
  /** Item click handler */
  onItemClick?: (item: NavigationItem) => void;
}

export interface NavigationItem {
  /** Item identifier */
  id: string;
  /** Item label */
  label: string;
  /** Item icon */
  icon?: ReactNode;
  /** Item URL/path */
  href?: string;
  /** Item disabled */
  disabled?: boolean;
  /** Item badge */
  badge?: NavigationBadge;
  /** Sub-navigation items */
  children?: NavigationItem[];
}

export interface NavigationBadge {
  /** Badge content */
  content: string | number;
  /** Badge color */
  color?: ComponentColor;
  /** Badge variant */
  variant?: 'dot' | 'count' | 'text';
}

// =============================================================================
// GRID AND LAYOUT COMPONENT TYPES
// =============================================================================

export interface GridProps extends BaseComponentProps {
  /** Grid columns */
  columns?: number;
  /** Grid gap */
  gap?: ComponentSize;
  /** Responsive columns */
  responsiveColumns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Grid auto-fit */
  autoFit?: boolean;
  /** Grid auto-fill */
  autoFill?: boolean;
}

export interface ContainerProps extends BaseComponentProps {
  /** Container max width */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Container padding */
  padding?: ComponentSize;
  /** Container centered */
  centered?: boolean;
  /** Container fluid */
  fluid?: boolean;
}

// =============================================================================
// VOTING COMPONENT TYPES
// =============================================================================

export interface VoteDisplayProps extends BaseComponentProps {
  /** Content identifier */
  contentId: string;
  /** Current vote count */
  voteCount: number;
  /** User's vote */
  userVote?: 'up' | 'down' | 'burn' | null;
  /** Vote handler */
  onVote: (type: 'up' | 'down' | 'burn') => void;
  /** Disable voting */
  disabled?: boolean;
  /** Show vote breakdown */
  showBreakdown?: boolean;
  /** Compact display */
  compact?: boolean;
}

export interface BurnVoteConfirmationProps extends BaseComponentProps {
  /** Burn amount */
  burnAmount: number;
  /** Token symbol */
  tokenSymbol: string;
  /** User's current balance */
  balance: number;
  /** Vote weight calculation */
  voteWeight: number;
  /** Confirmation handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
}

export interface VotingInterfaceProps extends BaseComponentProps {
  /** Available vote types */
  voteTypes: VoteType[];
  /** Current vote state */
  currentVote?: VoteType;
  /** Vote handler */
  onVote: (type: VoteType) => void;
  /** Daily votes remaining */
  dailyVotesRemaining: number;
  /** User's token balance */
  tokenBalance: number;
  /** Voting disabled */
  disabled?: boolean;
}

export interface VoteType {
  /** Vote type identifier */
  id: string;
  /** Vote type label */
  label: string;
  /** Vote type icon */
  icon: ReactNode;
  /** Vote cost (0 for free votes) */
  cost: number;
  /** Vote weight multiplier */
  weight: number;
  /** Vote description */
  description?: string;
}

// =============================================================================
// CLAN COMPONENT TYPES
// =============================================================================

export interface ClanManagementProps extends BaseComponentProps {
  /** Current clan data */
  clan?: ClanData;
  /** User permissions */
  permissions: ClanPermissions;
  /** Clan members */
  members: ClanMember[];
  /** Member action handler */
  onMemberAction: (action: MemberAction, member: ClanMember) => void;
  /** Settings change handler */
  onSettingsChange: (settings: ClanSettings) => void;
}

export interface ClanLeaderboardProps extends BaseComponentProps {
  /** Leaderboard entries */
  entries: LeaderboardEntry[];
  /** User's current rank */
  userRank?: number;
  /** Leaderboard type */
  type: 'overall' | 'weekly' | 'monthly';
  /** Show user rank */
  showUserRank?: boolean;
  /** Compact display */
  compact?: boolean;
}

export interface ClanInvitationProps extends BaseComponentProps {
  /** Invitation data */
  invitation: ClanInvitation;
  /** Accept handler */
  onAccept: () => void;
  /** Decline handler */
  onDecline: () => void;
  /** Loading state */
  loading?: boolean;
}

export interface ClanData {
  /** Clan identifier */
  id: string;
  /** Clan name */
  name: string;
  /** Clan tag */
  tag: string;
  /** Clan description */
  description: string;
  /** Clan logo */
  logo?: string;
  /** Member count */
  memberCount: number;
  /** Clan rank */
  rank: number;
  /** Clan statistics */
  stats: ClanStats;
}

export interface ClanMember {
  /** Member identifier */
  id: string;
  /** Member username */
  username: string;
  /** Member role */
  role: string;
  /** Join date */
  joinDate: string;
  /** Last active */
  lastActive: string;
  /** Member status */
  status: 'active' | 'inactive' | 'banned';
}

export interface ClanPermissions {
  /** Can invite members */
  canInvite: boolean;
  /** Can kick members */
  canKick: boolean;
  /** Can promote members */
  canPromote: boolean;
  /** Can modify settings */
  canModifySettings: boolean;
  /** Can access treasury */
  canAccessTreasury: boolean;
}

export interface ClanSettings {
  /** Clan is public */
  isPublic: boolean;
  /** Requires approval to join */
  requiresApproval: boolean;
  /** Minimum tokens to join */
  minimumTokens: number;
  /** Maximum members */
  maxMembers: number;
}

export interface ClanStats {
  /** Total votes */
  totalVotes: number;
  /** Average contribution */
  avgContribution: number;
  /** Weekly activity */
  weeklyActivity: number;
  /** Clan ranking */
  ranking: number;
}

export interface LeaderboardEntry {
  /** Entry rank */
  rank: number;
  /** Entry identifier */
  id: string;
  /** Entry name */
  name: string;
  /** Entry score */
  score: number;
  /** Entry change */
  change: number;
  /** Additional data */
  data?: any;
}

export interface ClanInvitation {
  /** Invitation ID */
  id: string;
  /** Clan name */
  clanName: string;
  /** Inviter name */
  inviter: string;
  /** Invitation message */
  message?: string;
  /** Expiration date */
  expiresAt: string;
}

export type MemberAction = 
  | 'promote' 
  | 'demote' 
  | 'kick' 
  | 'ban' 
  | 'unban'
  | 'view_profile';

// =============================================================================
// CONTENT COMPONENT TYPES
// =============================================================================

export interface ContentSubmissionFormProps extends BaseComponentProps {
  /** Submission handler */
  onSubmit: (content: ContentSubmission) => void;
  /** Supported content types */
  supportedTypes: ContentType[];
  /** Maximum file size */
  maxFileSize: number;
  /** Form loading */
  loading?: boolean;
  /** Form error */
  error?: string;
}

export interface ContentDisplayProps extends BaseComponentProps {
  /** Content item */
  content: ContentItem;
  /** Display variant */
  variant?: 'card' | 'list' | 'full';
  /** Show vote controls */
  showVotes?: boolean;
  /** Show metadata */
  showMetadata?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export interface ContentSortingProps extends BaseComponentProps {
  /** Sort options */
  sortOptions: SortOption[];
  /** Current sort */
  currentSort: string;
  /** Sort change handler */
  onSortChange: (sort: string) => void;
  /** Filter options */
  filterOptions?: FilterOption[];
  /** Current filters */
  currentFilters?: string[];
  /** Filter change handler */
  onFilterChange?: (filters: string[]) => void;
}

export interface ContentSubmission {
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Content type */
  type: ContentType;
  /** Content file */
  file?: File;
  /** Content URL */
  url?: string;
  /** Content tags */
  tags: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface ContentItem {
  /** Content ID */
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
  /** Author information */
  author: ContentAuthor;
  /** Created timestamp */
  createdAt: string;
  /** Vote statistics */
  voteStats: ContentVoteStats;
  /** Content tags */
  tags: string[];
}

export interface ContentAuthor {
  /** Author ID */
  id: string;
  /** Author username */
  username: string;
  /** Author avatar */
  avatar?: string;
  /** Author verified */
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

export type ContentType = 'video' | 'image' | 'text' | 'audio' | 'stream';

export interface SortOption {
  /** Sort option value */
  value: string;
  /** Sort option label */
  label: string;
  /** Sort option icon */
  icon?: ReactNode;
}

export interface FilterOption {
  /** Filter option value */
  value: string;
  /** Filter option label */
  label: string;
  /** Filter option count */
  count?: number;
}

// =============================================================================
// WALLET COMPONENT TYPES
// =============================================================================

export interface WalletUIProps extends BaseComponentProps {
  /** Wallet connection state */
  connected: boolean;
  /** Wallet address */
  address?: string;
  /** Wallet balance */
  balance: number;
  /** MLG token balance */
  mlgBalance: number;
  /** Connection handler */
  onConnect: () => void;
  /** Disconnection handler */
  onDisconnect: () => void;
  /** Compact display */
  compact?: boolean;
}

export interface TransactionConfirmationProps extends BaseComponentProps {
  /** Transaction details */
  transaction: TransactionDetails;
  /** Confirmation handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
  /** Estimated fee */
  estimatedFee?: number;
}

export interface MLGTokenUIProps extends BaseComponentProps {
  /** Token balance */
  balance: number;
  /** Token price */
  price?: number;
  /** Price change */
  priceChange?: number;
  /** Show price chart */
  showChart?: boolean;
  /** Token actions */
  actions?: TokenAction[];
}

export interface TransactionDetails {
  /** Transaction type */
  type: string;
  /** Transaction amount */
  amount: number;
  /** Token symbol */
  tokenSymbol: string;
  /** Recipient */
  recipient?: string;
  /** Transaction memo */
  memo?: string;
  /** Additional data */
  data?: Record<string, any>;
}

export interface TokenAction {
  /** Action label */
  label: string;
  /** Action handler */
  handler: () => void;
  /** Action icon */
  icon?: ReactNode;
  /** Action disabled */
  disabled?: boolean;
}

// =============================================================================
// UTILITY COMPONENT TYPES
// =============================================================================

export interface TooltipProps extends BaseComponentProps {
  /** Tooltip content */
  content: ReactNode;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Show tooltip */
  show?: boolean;
  /** Trigger element */
  trigger?: 'hover' | 'click' | 'focus';
  /** Delay before showing */
  delay?: number;
}

export interface AlertProps extends BaseComponentProps {
  /** Alert type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Alert title */
  title?: string;
  /** Alert message */
  message: string;
  /** Dismissible alert */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon */
  customIcon?: ReactNode;
}

export interface BadgeProps extends BaseComponentProps {
  /** Badge content */
  content: ReactNode;
  /** Badge color */
  color?: ComponentColor;
  /** Badge variant */
  variant?: 'dot' | 'count' | 'text';
  /** Badge position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Maximum count to display */
  max?: number;
  /** Show zero count */
  showZero?: boolean;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export default BaseComponentProps;