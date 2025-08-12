/**
 * MLG.clan Shared UI Component Library
 * 
 * This module exports all reusable UI components for the MLG gaming platform.
 * Components follow Xbox 360 aesthetic with gaming-themed styling.
 * 
 * @module MLGUIComponents
 * @version 1.0.0
 */

// Base UI Components
export { default as Button } from './Button.js';
export { default as Card } from './Card.js';
export { default as Modal } from './Modal.js';
export { default as Input } from './Input.js';
export { default as Select } from './Select.js';
export { default as Checkbox } from './Checkbox.js';
export { default as Radio } from './Radio.js';
export { default as Badge } from './Badge.js';
export { default as Avatar } from './Avatar.js';
export { default as Progress } from './Progress.js';

// Gaming-themed Components
export { default as GamingTile } from './GamingTile.js';
export { default as XboxButton } from './XboxButton.js';
export { default as ScoreCard } from './ScoreCard.js';
export { default as LeaderboardItem } from './LeaderboardItem.js';
export { default as TokenDisplay } from './TokenDisplay.js';
export { default as VotingCard } from './VotingCard.js';
export { default as ClanCard } from './ClanCard.js';

// Layout Components
export { default as Container } from './Container.js';
export { default as Grid } from './Grid.js';
export { default as Stack } from './Stack.js';
export { default as Flex } from './Flex.js';
export { default as Spacer } from './Spacer.js';

// Loading & Transition Components
export { default as LoadingSpinner } from './LoadingSpinner.js';
export { default as SkeletonLoader } from './SkeletonLoader.js';
export { default as PageTransition } from './PageTransition.js';
export { default as FadeIn } from './FadeIn.js';
export { default as SlideIn } from './SlideIn.js';

// Form Components
export { default as Form } from './Form.js';
export { default as FormField } from './FormField.js';
export { default as FormGroup } from './FormGroup.js';
export { default as FormError } from './FormError.js';
export { default as FormSuccess } from './FormSuccess.js';

// Specialized Gaming Components
export { default as BurnButton } from './BurnButton.js';
export { default as WalletDisplay } from './WalletDisplay.js';
export { default as NotificationToast } from './NotificationToast.js';
export { default as TournamentBracket } from './TournamentBracket.js';
export { default as MatchCard } from './MatchCard.js';

// Component Constants and Utilities
export { COMPONENT_VARIANTS, COMPONENT_SIZES, GAMING_COLORS } from './constants.js';
export { createComponent, combineClasses, getResponsiveClasses } from './utils.js';