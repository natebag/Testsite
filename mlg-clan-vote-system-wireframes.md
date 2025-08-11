# MLG.clan Real-Time Vote Count Display System - Wireframes & Visual Specifications

## Executive Summary
This document provides comprehensive wireframes and visual specifications for implementing real-time vote count displays with Solana RPC polling integration for MLG.clan. The designs maintain the iconic Xbox 360 dashboard aesthetic while introducing modern voting mechanics including daily free votes, SPL token burn-to-vote, and reputation-weighted voting.

---

## 1. Design Principles & Visual Language

### Core Xbox 360 Design Elements
- **Primary Color**: Xbox Green (`#10b981`) for all voting actions
- **Background Gradients**: Dark theme with `bg-gradient-to-br from-gray-900 via-green-900 to-black`
- **Tile System**: Rounded corners (`rounded-lg`), padding (`p-6`), hover scaling effects
- **Typography**: Bold headings, clean sans-serif body text
- **Animations**: Smooth transitions (0.3s ease), pulse effects, scaling on hover
- **Glow Effects**: Subtle box-shadows with brand colors for active states

### Vote System Color Coding
- **Free Votes**: Blue accent (`#3b82f6`) - "everyday gaming" feel
- **MLG Token Votes**: Amber gradient (`#f59e0b` to `#d97706`) - "premium burn" feel
- **Vote Counts**: White text with subtle green glow for visibility
- **Disabled States**: Gray (`#6b7280`) with reduced opacity

---

## 2. Component Architecture

### 2.1 Vote Counter Component Variants

#### A. Compact Vote Display (for clip tiles)
```
┌─────────────────────────────────────┐
│ [Clip Content]                      │
│                                     │
│ ┌─── Vote Actions ───────────────┐  │
│ │ 👍 42  🔥 8  ❤️ 15            │  │
│ │ [Free] [MLG] [Like]            │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Visual Specifications:**
- Height: 40px
- Vote count badges: 24px height, 4px padding
- Button spacing: 8px gap between actions
- Font size: 14px for counts, 12px for buttons
- Real-time update: Smooth number increment animation (0.2s ease)

#### B. Detailed Vote Panel (for full-screen clip view)
```
┌──────────────────────────────────────────────┐
│ Vote Statistics                              │
│ ┌──────────┬──────────┬──────────────────┐   │
│ │   👍     │    🔥    │      ❤️         │   │
│ │   142    │    28    │      67          │   │
│ │ Standard │ MLG Burn │     Likes        │   │
│ └──────────┴──────────┴──────────────────┘   │
│                                              │
│ Your Vote Status: [Voted with MLG Token]    │
│ ┌────────────────────────────────────────┐   │
│ │ Vote Weight: 2.5x (Clan Officer)      │   │
│ │ Remaining Free Votes: 0/1             │   │
│ │ MLG Tokens: 45 tokens                 │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Visual Specifications:**
- Panel height: 160px
- Three-column grid layout with equal widths
- Large count display: 24px bold text with green glow
- Status indicators: 14px with appropriate color coding
- Vote weight multiplier: Prominent display with golden accent

#### C. Voting Interface Modal
```
┌─────────────────────────────────────────────┐
│ Cast Your Vote                              │
│ ┌─────────────────────────────────────────┐ │
│ │ FREE VOTE (1 remaining today)          │ │
│ │ [Cast Free Vote] ← Primary CTA         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ MLG TOKEN VOTE                          │ │
│ │ Cost: 1 token → 2.5x vote weight       │ │
│ │ Your balance: 45 MLG tokens            │ │
│ │ [Burn Token & Vote] ← Secondary CTA    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Vote Weight Breakdown                   │ │
│ │ Base weight: 1.0x                      │ │
│ │ Clan officer bonus: +0.8x              │ │
│ │ MLG token burn: +1.0x                  │ │
│ │ Total weight: 2.8x                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Visual Specifications:**
- Modal width: 480px, centered overlay
- Section spacing: 16px between vote options
- Primary CTA: Blue gradient with hover scale (1.05x)
- Secondary CTA: Amber gradient with burn glow animation
- Weight breakdown: Subtle background with detailed typography

---

## 3. Real-Time Update System

### 3.1 Polling Strategy
- **Update Frequency**: 5-second intervals for active content
- **Fallback Polling**: 15-second intervals for background content
- **Error Handling**: Exponential backoff on RPC failures
- **Connection Status**: Visual indicator for Solana network connectivity

### 3.2 Animation States

#### Vote Count Increment Animation
```css
@keyframes voteCountUp {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.vote-count-update {
  animation: voteCountUp 0.3s ease-out;
  color: #10b981;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}
```

#### Real-Time Connection Indicator
```
Network Status: ● Connected to Solana [Last update: 2s ago]
                ○ Connecting... [Retry attempt 1/3]
                ● Connection lost [Attempting reconnection]
```

**Visual Specifications:**
- Green dot: Active connection (`#10b981`)
- Yellow dot: Connecting state (`#f59e0b`)
- Red dot: Connection lost (`#ef4444`)
- Status text: 12px, right-aligned in header
- Pulse animation on connecting state

---

## 4. Content Type Integrations

### 4.1 Clip Vote Interface
**Location**: Vote Vault page, individual clip tiles
**Features**:
- Inline vote buttons with immediate visual feedback
- Vote count badge with real-time updates
- Progressive vote cost display (1 token, 2 tokens, 4 tokens...)
- User voting history indicator

```html
<div class="clip-vote-section">
  <div class="vote-counts-display">
    <span class="vote-badge standard-votes">👍 <span id="vote-count-${clipId}">142</span></span>
    <span class="vote-badge mlg-votes">🔥 <span id="mlg-count-${clipId}">28</span></span>
    <span class="vote-badge likes">❤️ <span id="like-count-${clipId}">67</span></span>
  </div>
  <div class="vote-actions">
    <button class="vote-btn free-vote" data-clip="${clipId}" data-type="free">
      Free Vote (${remainingFreeVotes} left)
    </button>
    <button class="vote-btn mlg-vote burn-effect" data-clip="${clipId}" data-type="mlg">
      MLG Vote (${tokenCost} tokens)
    </button>
  </div>
</div>
```

### 4.2 Tournament Bracket Voting
**Location**: Tournament hub page
**Features**:
- Head-to-head voting display
- Tournament progression visualization
- Bracket-wide vote tallies
- Sponsored voting multipliers

```
Tournament Bracket Vote Display:
┌────────────────────────────────────────────┐
│ SEMI-FINAL MATCH 1                        │
│ ┌──────────────┐ VS ┌──────────────┐      │
│ │ Player A     │    │ Player B     │      │
│ │ 342 votes    │    │ 278 votes    │      │
│ │ [Vote A]     │    │ [Vote B]     │      │
│ └──────────────┘    └──────────────┘      │
│ Time remaining: 2h 15m                     │
└────────────────────────────────────────────┘
```

### 4.3 Clan Activity Voting
**Location**: Clan management pages
**Features**:
- DAO-style proposal voting
- Officer election systems
- Clan treasury allocation votes
- Member kick/promotion votes

```
Clan Proposal Voting:
┌─────────────────────────────────────────────┐
│ Proposal: Update clan logo and colors      │
│ ┌─────────────────────────────────────────┐ │
│ │ 🟢 Yes: 15 votes (78%)                 │ │
│ │ 🔴 No:   4 votes (22%)                 │ │
│ │ ───────────────────────────────────────  │ │
│ │ Progress: ████████████████░░░░ 78%     │ │
│ └─────────────────────────────────────────┘ │
│ Voting ends in: 1d 6h 23m                  │
│ Your vote: [Yes] [No] [Abstain]            │
└─────────────────────────────────────────────┘
```

---

## 5. Mobile Responsive Specifications

### 5.1 Breakpoint Strategy
- **Mobile**: < 768px - Single column, stacked vote buttons
- **Tablet**: 768px - 1024px - Two column layout, condensed vote panels
- **Desktop**: > 1024px - Full three column layout with detailed panels

### 5.2 Mobile Vote Interface
```
Mobile Compact View:
┌─────────────────────┐
│ [Clip Preview]      │
│                     │
│ ┌─── Votes ───────┐ │
│ │ 👍142 🔥28 ❤️67 │ │
│ └─────────────────┘ │
│ [Free Vote]         │
│ [MLG Vote (1🔥)]    │
└─────────────────────┘
```

**Mobile Specifications:**
- Vote count badges: 32px height for touch targets
- Button spacing: 12px vertical gap
- Font size: 16px minimum for accessibility
- Touch feedback: 0.1s scale animation on tap

---

## 6. Accessibility & Performance

### 6.1 WCAG AA Compliance
- **Color Contrast**: All vote count text maintains 4.5:1 contrast ratio
- **Focus Indicators**: Clear 2px outline on keyboard focus
- **Screen Reader Labels**: Comprehensive ARIA labels for vote counts
- **Reduced Motion**: Respect `prefers-reduced-motion` for animations

### 6.2 Performance Optimization
- **Lazy Loading**: Vote counts load only for visible content
- **Debounced Updates**: Prevent excessive API calls during rapid updates
- **Local State Caching**: Cache vote states to reduce perceived loading
- **Progressive Enhancement**: Graceful degradation without JavaScript

### 6.3 ARIA Implementation
```html
<div class="vote-section" role="group" aria-label="Vote on this content">
  <div class="vote-counts" aria-live="polite">
    <span aria-label="142 standard votes">👍 142</span>
    <span aria-label="28 MLG token votes">🔥 28</span>
    <span aria-label="67 likes">❤️ 67</span>
  </div>
  <button aria-describedby="free-vote-help" class="vote-btn">
    Free Vote
  </button>
  <div id="free-vote-help" class="sr-only">
    Uses one of your daily free votes. You have 1 remaining today.
  </div>
</div>
```

---

## 7. Implementation Specifications

### 7.1 CSS Custom Properties
```css
:root {
  /* Vote System Colors */
  --vote-primary: #10b981;
  --vote-secondary: #3b82f6;
  --vote-burn: #f59e0b;
  --vote-disabled: #6b7280;
  
  /* Animation Timings */
  --vote-transition: 0.3s ease;
  --vote-update-animation: 0.2s ease-out;
  
  /* Spacing System */
  --vote-spacing-xs: 4px;
  --vote-spacing-sm: 8px;
  --vote-spacing-md: 16px;
  --vote-spacing-lg: 24px;
}
```

### 7.2 Component Classes
```css
.vote-count-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--vote-spacing-xs) var(--vote-spacing-sm);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid var(--vote-primary);
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  transition: var(--vote-transition);
}

.vote-btn {
  background: linear-gradient(45deg, var(--vote-secondary), #2563eb);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  padding: 10px 16px;
  transition: var(--vote-transition);
  position: relative;
  overflow: hidden;
}

.vote-btn:hover {
  transform: scale(1.05);
}

.vote-btn.mlg-vote {
  background: linear-gradient(45deg, var(--vote-burn), #d97706);
  animation: burn-glow 2s infinite;
}

@keyframes burn-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 20px rgba(217, 119, 6, 0.8); }
}
```

### 7.3 JavaScript Integration Points
```javascript
// Real-time vote updates
class VoteSystem {
  constructor() {
    this.solanaConnection = new Connection(SOLANA_RPC_URL);
    this.voteCache = new Map();
    this.pollInterval = 5000; // 5 seconds
  }

  async pollVoteUpdates(contentIds) {
    // Batch RPC calls for efficiency
    const signatures = await this.getVoteTransactions(contentIds);
    const updates = await this.processVoteSignatures(signatures);
    this.updateVoteDisplays(updates);
  }

  updateVoteDisplays(updates) {
    updates.forEach(({ contentId, voteCount, mlgCount }) => {
      const countElement = document.getElementById(`vote-count-${contentId}`);
      if (countElement && countElement.textContent !== voteCount.toString()) {
        this.animateCountUpdate(countElement, voteCount);
      }
    });
  }

  animateCountUpdate(element, newCount) {
    element.classList.add('vote-count-update');
    element.textContent = newCount;
    setTimeout(() => element.classList.remove('vote-count-update'), 300);
  }
}
```

---

## 8. Quality Assurance Checklist

### 8.1 Visual Design Verification
- [ ] Xbox 360 aesthetic maintained across all vote components
- [ ] Consistent spacing using 8px grid system
- [ ] Brand colors applied correctly with proper contrast ratios
- [ ] Hover states and transitions feel smooth and responsive
- [ ] Loading states provide clear feedback to users
- [ ] Error states are clearly differentiated and actionable

### 8.2 Functional Testing
- [ ] Real-time updates work reliably across different network conditions
- [ ] Vote weight calculations display correctly for different user types
- [ ] Daily limits are enforced and clearly communicated
- [ ] Token burn mechanics integrate smoothly with wallet connections
- [ ] Mobile responsive design maintains usability across screen sizes
- [ ] Accessibility features work with screen readers and keyboard navigation

### 8.3 Performance Validation
- [ ] RPC polling doesn't cause excessive network requests
- [ ] Vote count animations don't impact scroll performance
- [ ] Component rendering is efficient for large content lists
- [ ] Error recovery mechanisms work during network interruptions
- [ ] Cache invalidation prevents stale vote data display

---

## 9. Developer Handoff Notes

### 9.1 Implementation Priority
1. **Phase 1**: Basic vote count display with manual refresh
2. **Phase 2**: Real-time polling integration with Solana RPC
3. **Phase 3**: Advanced vote weight and burn mechanics
4. **Phase 4**: Mobile optimization and accessibility enhancements

### 9.2 External Dependencies
- Solana Web3.js library for RPC calls
- SPL Token program for burn transaction monitoring
- WebSocket connection for real-time updates (optional enhancement)
- Local storage for vote state caching

### 9.3 Configuration Requirements
```javascript
const VOTE_SYSTEM_CONFIG = {
  SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  POLL_INTERVAL: 5000, // milliseconds
  MAX_RETRY_ATTEMPTS: 3,
  VOTE_CACHE_DURATION: 30000, // 30 seconds
  MLG_TOKEN_MINT: 'YourMLGTokenMintAddress...',
  VOTE_PROGRAM_ID: 'YourVoteProgramID...'
};
```

This comprehensive specification provides all necessary details for implementing a production-ready real-time vote count display system that authentically captures the MLG.clan Xbox 360 aesthetic while providing modern voting functionality through Solana blockchain integration.