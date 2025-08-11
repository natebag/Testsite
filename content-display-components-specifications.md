# MLG.clan Content Display Components - Technical Specifications

## Sub-task 4.8: Build Content Display Components with Voting Integration

### Design System Foundation

#### Color Palette
```css
:root {
  --xbox-green: #10b981;
  --xbox-green-dark: #059669;
  --xbox-green-light: #34d399;
  --xbox-accent: #14532d;
  --burn-red: #dc2626;
  --burn-orange: #f59e0b;
  --vault-purple: #8b5cf6;
  --vault-blue: #3b82f6;
  --gold-primary: #fbbf24;
  --gold-secondary: #f59e0b;
  --tile-bg-primary: linear-gradient(135deg, #065f46, #064e3b);
  --tile-bg-secondary: linear-gradient(135deg, #111827, #1f2937);
  --tile-border: #10b981;
  --glass-bg: rgba(31, 41, 55, 0.8);
}
```

#### Typography Scale
- **Heading XL**: 30px, bold, line-height 1.2
- **Heading L**: 24px, bold, line-height 1.3
- **Heading M**: 20px, bold, line-height 1.4
- **Body L**: 18px, medium, line-height 1.5
- **Body M**: 16px, regular, line-height 1.5
- **Body S**: 14px, regular, line-height 1.4
- **Caption**: 12px, medium, line-height 1.3

#### Spacing System (8px Grid)
- **XS**: 4px
- **S**: 8px
- **M**: 16px
- **L**: 24px
- **XL**: 32px
- **2XL**: 48px
- **3XL**: 64px

---

## Component Specifications

### 1. Content Card Components

#### Small Content Cards (Grid View)
**Dimensions**: 280px × 420px
**Use Case**: Grid layouts, browse views, related content

**Structure**:
```
┌─────────────────────────────────┐
│ Video/Image Container (16:9)     │ 280×157px
│ ┌─TYPE─┐              [2:34]    │
│ │ CLIP │ [Play Button]          │
│ └──────┘                        │
├─────────────────────────────────┤
│ Content Info (24px padding)     │ 280×263px
│ • Title (2 lines max)           │
│ • Creator Badge                 │
│ • Vote Widget                   │
│   - Metrics Display             │
│   - Vote Buttons                │
└─────────────────────────────────┘
```

**Interactive States**:
- Default: 1px border, subtle shadow
- Hover: Scale 1.03, enhanced shadow, blade sweep
- Loading: Shimmer animation
- Error: Red border, error overlay

#### Medium Content Cards (List View)
**Dimensions**: Full width × 180px
**Use Case**: List views, search results, feeds

**Structure**:
```
┌──────────┬────────────────────────────────────────────────────────┐
│ Video    │ Content Information                                    │ 192×108px
│ Preview  │ • Title + Description                                  │
│ (16:9)   │ • Creator Badge + Timestamp                            │
│          │ • Metrics + Vote Widget                                │
└──────────┴────────────────────────────────────────────────────────┘
```

#### Large Content Cards (Featured/Masonry)
**Dimensions**: Variable (maintains aspect ratios)
**Use Case**: Featured content, masonry layouts

**Features**:
- Dynamic sizing based on content type
- Enhanced visual prominence
- Extended metadata display
- Premium vote options

### 2. Detailed Content View

#### Video Player Interface
**Dimensions**: Max 1200px × 675px (16:9)
**Features**:
- Custom video controls with Xbox aesthetic
- Gaming-specific features (clip timestamps, slow-mo)
- Overlay gradient for control visibility
- Full-screen support with custom UI

**Control Elements**:
- Play/Pause: 48px circular button
- Progress Bar: Custom styling with Xbox green
- Volume: Integrated with gaming audio settings
- Fullscreen: Custom Xbox-style expand icon
- Speed Controls: Gaming-optimized options (0.25x, 0.5x, 1x, 1.25x, 2x)

#### Content Information Panel
**Sections**:
1. **Header**: Title, description, type badge
2. **Creator**: Profile integration, stats, follow button
3. **Metadata**: Upload date, game, category, duration, tags
4. **Engagement**: Views, votes, shares, likes with real-time updates
5. **Actions**: Like, share, bookmark, report menu

### 3. Voting Widget Integration

#### Compact Vote Display
**Use Case**: Small cards, grid views
**Elements**:
- Vote count badges (Free votes, MLG votes)
- Quick vote buttons
- Real-time updates

```css
.vote-widget-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--glass-bg);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
```

#### Detailed Vote Panel
**Use Case**: Content detail views, full voting interface
**Features**:
- Vote statistics breakdown
- User voting status and remaining allocations
- Vote weight calculation with multipliers
- Progressive pricing display for MLG token votes
- Confirmation modals for high-value votes

#### Vote Button States
```css
/* Default State */
.vote-button {
  background: var(--tile-bg-primary);
  border: 2px solid var(--xbox-green);
  border-radius: 8px;
  padding: 12px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover State */
.vote-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  border-color: var(--xbox-green-light);
}

/* Active/Voted State */
.vote-button.voted {
  background: var(--xbox-green);
  color: #000;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
}

/* Burn Vote Button */
.burn-vote-button {
  background: linear-gradient(45deg, var(--burn-red), var(--burn-orange));
  animation: burn-pulse 3s infinite;
}
```

### 4. Creator Profile Integration

#### Creator Badge Component
**Elements**:
- Profile avatar (32px × 32px, rounded)
- Username with verification status
- Creator tier indicators
- Hover state shows mini profile

**Integration Points**:
- Content cards (small version)
- Detailed views (expanded version)
- Creator pages (full profile)
- Follow/subscribe functionality

### 5. Content Gallery Layouts

#### Masonry Gallery
**Implementation**: CSS Grid with `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
**Features**:
- Dynamic column count based on viewport
- Maintains aspect ratios
- Optimized for content discovery
- Infinite scroll with intersection observer

#### Grid Gallery
**Implementation**: Fixed grid with consistent card sizes
**Breakpoints**:
- Mobile: 1 column
- Tablet: 2-3 columns
- Desktop: 4+ columns

#### List Gallery
**Implementation**: Single column with horizontal cards
**Features**:
- Detailed metadata display
- Extended descriptions
- Enhanced voting interface

### 6. Mobile Optimizations

#### Touch Targets
- Minimum 44px × 44px for all interactive elements
- Increased spacing between touch elements
- Swipe gestures for navigation

#### Mobile-Specific Features
- Simplified voting interface
- Collapsed metadata by default
- Thumb-friendly control placement
- Reduced animation complexity

#### Responsive Breakpoints
```css
/* Mobile First Approach */
.content-grid {
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 32px;
  }
}
```

---

## Animation Specifications

### Xbox Blade Transitions
```css
@keyframes blade-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}

.xbox-blade:hover::before {
  animation: blade-sweep 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Content Card Hover Effects
```css
.content-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 
    0 16px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(16, 185, 129, 0.2);
}
```

### Vote Animation Feedback
```css
@keyframes vote-increment {
  0% { transform: scale(1) translateY(0); opacity: 1; }
  50% { transform: scale(1.2) translateY(-10px); opacity: 0.8; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes burn-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.4); }
  50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.6); }
}
```

### Loading States
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-shimmer {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

---

## Accessibility Implementation

### ARIA Labels and Roles
```html
<!-- Content Card -->
<article role="article" aria-labelledby="content-title-123">
  <h3 id="content-title-123">Content Title</h3>
  
  <!-- Vote Widget -->
  <div role="group" aria-label="Vote on this content">
    <div aria-live="polite" aria-label="Vote counts">
      <span aria-label="142 standard votes">👍 142</span>
      <span aria-label="28 MLG token votes">🔥 28</span>
    </div>
    
    <button 
      aria-describedby="free-vote-help"
      aria-pressed="false">
      Free Vote
    </button>
    
    <div id="free-vote-help" class="sr-only">
      Uses one of your daily free votes. You have 1 remaining today.
    </div>
  </div>
</article>
```

### Keyboard Navigation
- **Tab Order**: Logical flow through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and overlays
- **Arrow Keys**: Navigate through grid layouts

### Screen Reader Support
- **Live Regions**: For vote count updates
- **Descriptive Labels**: For all interactive elements
- **Status Announcements**: For voting results
- **Hidden Help Text**: Context for complex interactions

### Focus Management
```css
.focus-visible {
  outline: 2px solid var(--xbox-green);
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .content-card {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Optimizations

### Image Loading Strategy
```javascript
// Lazy loading with Intersection Observer
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('loading');
      observer.unobserve(img);
    }
  });
});

// Progressive image loading
function loadProgressiveImage(src, placeholder) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}
```

### Virtual Scrolling for Large Lists
```javascript
class VirtualScrollList {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.totalItems = 0;
    
    this.setupScrollListener();
  }
  
  updateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    this.visibleStart = Math.floor(scrollTop / this.itemHeight);
    this.visibleEnd = Math.min(
      this.totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / this.itemHeight)
    );
    
    this.renderVisibleItems();
  }
}
```

### Bundle Optimization
- **Code Splitting**: Separate bundles for different content types
- **Tree Shaking**: Remove unused CSS and JavaScript
- **Compression**: Gzip/Brotli for all assets
- **Critical CSS**: Inline above-the-fold styles

---

## Integration Requirements

### MLG Token Voting Integration
```javascript
// Vote submission with optimistic updates
async function submitVote(contentId, voteType, tokenAmount = 0) {
  // Optimistic UI update
  updateVoteCountOptimistic(contentId, voteType);
  
  try {
    const result = await votingSystem.castVote(contentId, {
      type: voteType,
      amount: tokenAmount,
      userAddress: wallet.publicKey
    });
    
    // Confirm the update
    updateVoteCountConfirmed(contentId, result);
    
  } catch (error) {
    // Rollback optimistic update
    rollbackVoteCount(contentId, voteType);
    showErrorMessage('Vote failed: ' + error.message);
  }
}
```

### Real-time Updates
```javascript
// WebSocket connection for live vote updates
const voteUpdateSocket = new WebSocket('wss://api.mlg.clan/votes');

voteUpdateSocket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  updateVoteDisplays([update]);
};

// Fallback polling for reliability
setInterval(async () => {
  const visibleContent = getVisibleContentIds();
  const updates = await fetchVoteUpdates(visibleContent);
  updateVoteDisplays(updates);
}, 5000);
```

### Content Moderation Integration
```javascript
// Report content functionality
function reportContent(contentId, reason) {
  return moderationAPI.reportContent({
    contentId,
    reason,
    reporterAddress: wallet.publicKey,
    timestamp: Date.now()
  });
}

// Hide moderated content
function applyContentModeration(contentList, moderationData) {
  return contentList.filter(content => 
    !moderationData.hiddenContent.includes(content.id)
  );
}
```

---

## Testing Specifications

### Unit Tests
```javascript
describe('ContentCard Component', () => {
  it('should render with correct props', () => {
    const props = {
      title: 'Test Content',
      creator: 'TestUser',
      voteCount: 100,
      type: 'clip'
    };
    
    const component = render(<ContentCard {...props} />);
    expect(component.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('should handle vote button clicks', async () => {
    const mockVote = jest.fn();
    const component = render(<ContentCard onVote={mockVote} />);
    
    fireEvent.click(component.getByText('Free Vote'));
    expect(mockVote).toHaveBeenCalled();
  });
});
```

### Integration Tests
```javascript
describe('Voting Integration', () => {
  it('should update vote counts in real-time', async () => {
    const contentId = 'test-content-123';
    const initialCount = 100;
    
    const component = render(<ContentCard id={contentId} voteCount={initialCount} />);
    
    // Simulate vote update from WebSocket
    mockWebSocket.emit('voteUpdate', {
      contentId,
      newCount: initialCount + 1
    });
    
    await waitFor(() => {
      expect(component.getByText('101')).toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests
```javascript
import { axe } from 'jest-axe';

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const component = render(<ContentCard />);
    const results = await axe(component.container);
    expect(results).toHaveNoViolations();
  });
  
  it('should support keyboard navigation', () => {
    const component = render(<ContentCard />);
    const voteButton = component.getByText('Free Vote');
    
    voteButton.focus();
    expect(document.activeElement).toBe(voteButton);
    
    fireEvent.keyDown(voteButton, { key: 'Enter' });
    // Assert vote action was triggered
  });
});
```

### Performance Tests
```javascript
describe('Performance', () => {
  it('should lazy load images efficiently', () => {
    const observer = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: observer,
      disconnect: jest.fn()
    }));
    
    render(<ContentCard imageUrl="test.jpg" />);
    expect(observer).toHaveBeenCalled();
  });
  
  it('should handle large content lists without performance degradation', () => {
    const largeContentList = Array.from({ length: 1000 }, (_, i) => ({
      id: `content-${i}`,
      title: `Content ${i}`
    }));
    
    const startTime = performance.now();
    render(<ContentGrid content={largeContentList} />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Should render in <100ms
  });
});
```

---

## Browser Support

### Target Browsers
- **Chrome**: 88+ (95% of users)
- **Firefox**: 85+ (JavaScript features, CSS Grid)
- **Safari**: 14+ (iOS compatibility)
- **Edge**: 88+ (Windows integration)

### Polyfills Required
```javascript
// For older browser support
import 'core-js/features/map';
import 'core-js/features/set';
import 'core-js/features/promise';
import 'core-js/features/intersection-observer';
import 'core-js/features/resize-observer';
```

### Feature Detection
```javascript
// Graceful degradation for unsupported features
const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

const supportsIntersectionObserver = 'IntersectionObserver' in window;

// Use appropriate image format
const getOptimalImageFormat = () => {
  return supportsWebP() ? 'webp' : 'jpg';
};
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All components pass unit tests
- [ ] Accessibility audit completed (axe-core)
- [ ] Performance benchmarks met
- [ ] Cross-browser testing completed
- [ ] Mobile testing on actual devices
- [ ] Integration tests with voting system pass
- [ ] Content moderation integration working
- [ ] Real-time updates functioning properly

### Production Monitoring
- [ ] Performance metrics tracking
- [ ] Error logging and monitoring
- [ ] User engagement analytics
- [ ] Accessibility monitoring
- [ ] Core Web Vitals tracking

### Success Metrics
- **Loading Performance**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Engagement**: Vote participation rate > 15%
- **Accessibility**: Zero critical WCAG violations
- **User Experience**: Task completion rate > 90%
- **Technical**: 99.9% uptime, error rate < 0.1%

---

This comprehensive specification document provides all the technical details needed for the ui-production-builder to implement production-ready content display components that authentically capture the Xbox 360 dashboard aesthetic while integrating seamlessly with the MLG.clan voting system and platform features.