# Content Moderation Queue - Technical Specifications
## MLG.clan Gaming Community Platform - Sub-task 4.9

### Document Overview
This document provides comprehensive technical specifications for implementing the content reporting and moderation queue system for MLG.clan, designed with authentic Xbox 360 dashboard aesthetics and gaming community focus.

---

## 1. COMPONENT ARCHITECTURE

### 1.1 Core Components Structure

```javascript
// Component hierarchy for moderation system
src/ui/components/moderation/
├── ModerationQueue.js              // Main queue dashboard
├── ContentReportModal.js           // Report submission interface
├── ModerationCard.js              // Individual content review card
├── BatchModerationToolbar.js      // Bulk action controls
├── ModerationAnalytics.js         // Statistics dashboard
├── AppealInterface.js             // Appeal submission & review
├── ModeratorRoleManager.js        // Role management interface
└── mobile/
    ├── MobileModerationQueue.js    // Mobile-optimized queue
    ├── SwipeActions.js             // Swipe gesture handler
    └── MobileReportModal.js        // Touch-optimized reporting
```

### 1.2 Integration Points

- **ContentModerationSystem** (from sub-task 4.6): Core moderation logic and blockchain integration
- **SolanaVotingSystem**: Vote submission and MLG token burning
- **PhantomWallet**: Transaction signing and user authentication
- **ContentValidator**: Content analysis and categorization
- **UserReputationSystem**: Role determination and vote weighting

---

## 2. CONTENT REPORTING INTERFACE

### 2.1 Report Modal Component

```javascript
// ContentReportModal.js - Gaming-focused reporting interface
export const ContentReportModal = ({ 
  contentId, 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState([]);
  
  const reportCategories = [
    {
      id: 'cheating',
      name: 'Cheating/Exploits',
      icon: '🎮',
      severity: 'HIGH',
      description: 'Content promoting cheats, hacks, or game exploits',
      examples: ['Aimbot tutorials', 'Wall hack guides', 'Game exploits']
    },
    {
      id: 'harassment',
      name: 'Harassment',
      icon: '💬',
      severity: 'CRITICAL',
      description: 'Toxic behavior, hate speech, or targeted harassment',
      examples: ['Hate speech', 'Targeted harassment', 'Doxxing attempts']
    },
    // Additional gaming-specific categories...
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="report-modal">
      <div className="modal-header">
        <h2 className="modal-title">🚨 Report Content</h2>
      </div>
      
      <div className="report-categories">
        {reportCategories.map(category => (
          <ReportCategoryButton
            key={category.id}
            category={category}
            selected={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
      </div>
      
      <DescriptionField
        value={description}
        onChange={setDescription}
        placeholder="Provide additional details about this violation..."
        maxLength={500}
      />
      
      <EvidenceUpload
        evidence={evidence}
        onChange={setEvidence}
        acceptedTypes={['image/*', '.jpg', '.png', '.gif']}
      />
      
      <SubmitActions
        onCancel={onClose}
        onSubmit={() => handleSubmit()}
        disabled={!selectedCategory || description.length < 10}
      />
    </Modal>
  );
};
```

### 2.2 Gaming-Specific Report Categories

| Category | Severity | Auto-Remove Threshold | Vote Cost | Gaming Context |
|----------|----------|----------------------|-----------|----------------|
| **Cheating/Exploits** | HIGH | 7 reports | 4 MLG | Aimbot, wall hacks, game exploits |
| **Harassment** | CRITICAL | 5 reports | 7 MLG | Hate speech, targeted harassment |
| **Inappropriate Content** | HIGH | 8 reports | 5 MLG | NSFW, violence, disturbing material |
| **Copyright Violation** | HIGH | 6 reports | 4 MLG | Stolen gameplay, unauthorized music |
| **Spam** | MEDIUM | 10 reports | 3 MLG | Promotional content, repetitive posts |
| **Misinformation** | MEDIUM | 8 reports | 4 MLG | False gaming advice, fake news |
| **Low Quality** | LOW | 15 reports | 2 MLG | Poor gameplay, clickbait content |

### 2.3 Report Validation Logic

```javascript
// Report validation with gaming context
const validateReport = (reportData) => {
  const errors = [];
  
  // Gaming-specific validation rules
  if (reportData.category === 'cheating' && !reportData.evidence.length) {
    errors.push('Cheating reports require visual evidence');
  }
  
  if (reportData.category === 'harassment' && reportData.description.length < 20) {
    errors.push('Harassment reports need detailed description');
  }
  
  // Rate limiting for gaming community
  const userReportCount = getUserDailyReportCount(reportData.reporterId);
  const maxReports = getUserMaxDailyReports(reportData.reporterReputation);
  
  if (userReportCount >= maxReports) {
    errors.push(`Daily report limit reached (${maxReports})`);
  }
  
  return { isValid: errors.length === 0, errors };
};
```

---

## 3. MODERATION QUEUE DASHBOARD

### 3.1 Queue Management Interface

```javascript
// ModerationQueue.js - Main dashboard component
export const ModerationQueue = () => {
  const [queueItems, setQueueItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [filters, setFilters] = useState({
    severity: 'all',
    category: 'all',
    status: 'all',
    sortBy: 'priority'
  });
  
  const queueStats = useMemo(() => ({
    pending: queueItems.filter(item => item.status === 'reported').length,
    voting: queueItems.filter(item => item.status === 'voting_active').length,
    critical: queueItems.filter(item => item.severity === 'critical').length,
    appeals: queueItems.filter(item => item.status === 'appealed').length
  }), [queueItems]);

  return (
    <div className="moderation-queue">
      <QueueHeader 
        stats={queueStats}
        userRole={currentUser.role}
        voteWeight={currentUser.voteWeight}
      />
      
      <QueueFilters
        filters={filters}
        onFiltersChange={setfilters}
        availableCategories={REPORT_CATEGORIES}
      />
      
      {selectedItems.size > 0 && (
        <BatchModerationToolbar
          selectedCount={selectedItems.size}
          selectedItems={Array.from(selectedItems)}
          onBatchAction={handleBatchAction}
          onClearSelection={() => setSelectedItems(new Set())}
        />
      )}
      
      <QueueItemList
        items={filteredAndSortedItems}
        selectedItems={selectedItems}
        onItemSelect={handleItemSelect}
        onVote={handleVote}
        renderItem={({ item, isSelected, onSelect, onVote }) => (
          <ModerationCard
            key={item.id}
            content={item}
            isSelected={isSelected}
            onSelect={onSelect}
            onVote={onVote}
            userRole={currentUser.role}
            voteWeight={currentUser.voteWeight}
          />
        )}
      />
    </div>
  );
};
```

### 3.2 Content Review Card Component

```javascript
// ModerationCard.js - Individual content review interface
export const ModerationCard = ({ 
  content, 
  isSelected, 
  onSelect, 
  onVote,
  userRole,
  voteWeight 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  const severityClass = `severity-${content.severity}`;
  const statusIndicator = getStatusIndicator(content.status);
  
  const handleVote = async (voteType) => {
    setIsVoting(true);
    try {
      const result = await onVote(content.id, voteType);
      if (result.success) {
        showVoteSuccessAnimation();
      }
    } catch (error) {
      showVoteErrorMessage(error.message);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={`moderation-card ${severityClass}`}>
      <ModerationCardHeader
        content={content}
        isSelected={isSelected}
        onSelect={onSelect}
        statusIndicator={statusIndicator}
      />
      
      <ContentPreview
        content={content}
        showFull={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
      />
      
      {content.reportSummary && (
        <ReportSummary
          reports={content.reportSummary}
          primaryReason={content.primaryReason}
          evidence={content.evidence}
        />
      )}
      
      {content.votes && (
        <VotingProgress
          votes={content.votes}
          thresholds={content.votingThresholds}
          timeRemaining={content.votingTimeRemaining}
        />
      )}
      
      <ModerationActions
        contentId={content.id}
        userRole={userRole}
        voteWeight={voteWeight}
        onVote={handleVote}
        isVoting={isVoting}
        voteCosts={calculateVoteCosts(userRole)}
      />
    </div>
  );
};
```

### 3.3 Vote Progress Visualization

```javascript
// VotingProgress.js - Real-time vote tracking
export const VotingProgress = ({ votes, thresholds, timeRemaining }) => {
  const voteResults = useMemo(() => {
    const total = votes.length;
    const keepVotes = votes.filter(v => v.type === 'keep').length;
    const removeVotes = votes.filter(v => v.type === 'remove').length;
    const escalateVotes = votes.filter(v => v.type === 'escalate').length;
    
    return {
      total,
      keep: { count: keepVotes, percentage: (keepVotes / total) * 100 },
      remove: { count: removeVotes, percentage: (removeVotes / total) * 100 },
      escalate: { count: escalateVotes, percentage: (escalateVotes / total) * 100 }
    };
  }, [votes]);

  return (
    <div className="voting-progress">
      <div className="progress-header">
        <span className="progress-title">Community Votes</span>
        <div className="vote-meta">
          <span className="vote-count">{voteResults.total} total votes</span>
          {timeRemaining && (
            <span className="time-remaining">{formatTimeRemaining(timeRemaining)}</span>
          )}
        </div>
      </div>
      
      <div className="vote-bars">
        <VoteBar
          type="keep"
          count={voteResults.keep.count}
          percentage={voteResults.keep.percentage}
          threshold={thresholds.keepThreshold}
          color="var(--xbox-green)"
        />
        <VoteBar
          type="remove"
          count={voteResults.remove.count}
          percentage={voteResults.remove.percentage}
          threshold={thresholds.removeThreshold}
          color="var(--burn-red)"
        />
        <VoteBar
          type="escalate"
          count={voteResults.escalate.count}
          percentage={voteResults.escalate.percentage}
          threshold={thresholds.escalateThreshold}
          color="var(--vault-purple)"
        />
      </div>
    </div>
  );
};
```

---

## 4. BATCH MODERATION TOOLS

### 4.1 Batch Action Interface

```javascript
// BatchModerationToolbar.js - Efficient mass actions
export const BatchModerationToolbar = ({ 
  selectedCount, 
  selectedItems, 
  onBatchAction,
  onClearSelection 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Show/hide with smooth animation
  useEffect(() => {
    setIsVisible(selectedCount > 0);
  }, [selectedCount]);
  
  const batchStats = useMemo(() => {
    const severityCount = selectedItems.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {});
    
    const totalCost = calculateBatchActionCost(selectedItems, currentUser.role);
    
    return { severityCount, totalCost };
  }, [selectedItems]);

  const handleBatchAction = async (actionType) => {
    setProcessing(true);
    try {
      const result = await onBatchAction(actionType, selectedItems);
      if (result.success) {
        showBatchSuccessAnimation();
        onClearSelection();
      }
    } catch (error) {
      showBatchErrorMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`batch-action-bar ${isVisible ? 'active' : ''}`}>
      <div className="batch-summary">
        <span className="selected-count">{selectedCount} items selected</span>
        <div className="severity-breakdown">
          {Object.entries(batchStats.severityCount).map(([severity, count]) => (
            <span key={severity} className={`severity-badge severity-${severity}`}>
              {count} {severity}
            </span>
          ))}
        </div>
        <span className="total-cost">{batchStats.totalCost} MLG total</span>
      </div>
      
      <div className="batch-actions">
        <BatchActionButton
          action="keep"
          label="Approve All"
          cost={batchStats.totalCost * 0.5}
          disabled={processing}
          onClick={() => handleBatchAction('keep')}
        />
        <BatchActionButton
          action="remove"
          label="Remove All"
          cost={batchStats.totalCost}
          disabled={processing}
          onClick={() => handleBatchAction('remove')}
        />
        <BatchActionButton
          action="escalate"
          label="Escalate All"
          cost={batchStats.totalCost * 1.5}
          disabled={processing}
          onClick={() => handleBatchAction('escalate')}
        />
      </div>
      
      <button 
        className="clear-selection"
        onClick={onClearSelection}
        disabled={processing}
      >
        Clear Selection
      </button>
    </div>
  );
};
```

### 4.2 Smart Batch Processing

```javascript
// Intelligent batch action processing
const processBatchModerationAction = async (actionType, items, userRole) => {
  const results = [];
  const errors = [];
  
  // Group items by similarity for efficient processing
  const groupedItems = groupItemsByCategory(items);
  
  for (const [category, categoryItems] of Object.entries(groupedItems)) {
    try {
      // Parallel processing for items in same category
      const categoryResults = await Promise.allSettled(
        categoryItems.map(item => 
          processSingleModerationAction(actionType, item, userRole)
        )
      );
      
      categoryResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            itemId: categoryItems[index].id,
            success: true,
            data: result.value
          });
        } else {
          errors.push({
            itemId: categoryItems[index].id,
            error: result.reason.message
          });
        }
      });
      
    } catch (error) {
      // Handle category-level errors
      categoryItems.forEach(item => {
        errors.push({
          itemId: item.id,
          error: `Batch processing failed: ${error.message}`
        });
      });
    }
  }
  
  return {
    success: errors.length === 0,
    results,
    errors,
    summary: {
      processed: results.length,
      failed: errors.length,
      total: items.length
    }
  };
};
```

---

## 5. MODERATION ANALYTICS DASHBOARD

### 5.1 System Health Metrics

```javascript
// ModerationAnalytics.js - Community transparency dashboard
export const ModerationAnalytics = ({ timeframe = 'week' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const healthMetrics = useMemo(() => {
    if (!stats) return null;
    
    return {
      consensusRate: calculateConsensusRate(stats.votes),
      falsePositiveRate: calculateFalsePositiveRate(stats.appeals, stats.decisions),
      appealSuccessRate: calculateAppealSuccessRate(stats.appeals),
      averageResponseTime: calculateAverageResponseTime(stats.decisions),
      healthScore: calculateOverallHealthScore(stats)
    };
  }, [stats]);

  return (
    <div className="moderation-analytics">
      <AnalyticsHeader 
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />
      
      <div className="analytics-grid">
        <SystemHealthCard
          metrics={healthMetrics}
          loading={loading}
        />
        
        <CommunityActivityCard
          stats={stats}
          loading={loading}
        />
        
        <CategoryDistributionChart
          data={stats?.categoryBreakdown}
          loading={loading}
        />
        
        <ModeratorPerformanceCard
          moderators={stats?.topModerators}
          loading={loading}
        />
      </div>
      
      <TransparencyReport
        data={stats}
        onExport={handleExportReport}
      />
    </div>
  );
};
```

### 5.2 Real-time Statistics Updates

```javascript
// Real-time analytics with WebSocket integration
const useRealTimeModerationStats = (timeframe) => {
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(WS_MODERATION_STATS_URL);
    
    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'moderation_stats',
        timeframe
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'stats_update':
          setStats(prevStats => ({
            ...prevStats,
            ...data.payload
          }));
          break;
          
        case 'vote_cast':
          updateVoteStats(data.payload);
          break;
          
        case 'decision_made':
          updateDecisionStats(data.payload);
          break;
          
        default:
          console.log('Unknown stats message type:', data.type);
      }
    };
    
    ws.onclose = () => {
      setConnected(false);
      // Implement reconnection logic
    };
    
    return () => {
      ws.close();
    };
  }, [timeframe]);
  
  return { stats, connected };
};
```

---

## 6. APPEAL PROCESS INTERFACE

### 6.1 Appeal Submission Component

```javascript
// AppealInterface.js - Content appeal and review system
export const AppealSubmissionForm = ({ removedContent, onSubmit }) => {
  const [appealType, setAppealType] = useState('');
  const [evidence, setEvidence] = useState('');
  const [stakeConfirmed, setStakeConfirmed] = useState(false);
  
  const appealTypes = [
    {
      id: 'false_positive',
      name: 'False Positive',
      description: 'Content was incorrectly removed',
      stakeCost: 5
    },
    {
      id: 'insufficient_evidence',
      name: 'Insufficient Evidence',
      description: 'Report lacked sufficient evidence',
      stakeCost: 5
    },
    {
      id: 'policy_misapplication',
      name: 'Policy Misapplication',
      description: 'Moderation policy was misapplied',
      stakeCost: 5
    },
    {
      id: 'technical_error',
      name: 'Technical Error',
      description: 'System error in voting process',
      stakeCost: 3
    }
  ];

  const selectedAppealType = appealTypes.find(type => type.id === appealType);
  const timeRemaining = calculateAppealTimeRemaining(removedContent.removedAt);

  return (
    <div className="appeal-submission-form">
      <AppealHeader
        content={removedContent}
        timeRemaining={timeRemaining}
      />
      
      <AppealTypeSelector
        types={appealTypes}
        selected={appealType}
        onChange={setAppealType}
      />
      
      <EvidenceTextArea
        value={evidence}
        onChange={setEvidence}
        placeholder="Provide detailed explanation and evidence for your appeal..."
        minLength={50}
        maxLength={2000}
      />
      
      <StakeConfirmation
        amount={selectedAppealType?.stakeCost}
        confirmed={stakeConfirmed}
        onChange={setStakeConfirmed}
      />
      
      <AppealSubmitActions
        disabled={!appealType || evidence.length < 50 || !stakeConfirmed}
        onSubmit={() => onSubmit({
          appealType,
          evidence,
          stakeCost: selectedAppealType.stakeCost
        })}
      />
    </div>
  );
};
```

### 6.2 Appeal Review Interface

```javascript
// Appeal review component for community moderators
export const AppealReviewInterface = ({ appeal, onVote }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [showEvidence, setShowEvidence] = useState(true);
  
  const originalDecision = appeal.originalDecision;
  const appealDetails = appeal.appealDetails;

  return (
    <div className="appeal-review-interface">
      <AppealOverview
        appeal={appeal}
        originalDecision={originalDecision}
      />
      
      <div className="review-comparison">
        <OriginalDecisionCard
          decision={originalDecision}
          voteBreakdown={originalDecision.voteBreakdown}
        />
        
        <AppealArgumentCard
          argument={appealDetails.evidence}
          appealType={appealDetails.type}
          submittedBy={appeal.appellant}
        />
      </div>
      
      {showEvidence && (
        <EvidencePanel
          originalEvidence={originalDecision.evidence}
          appealEvidence={appealDetails.evidence}
          onToggle={() => setShowEvidence(false)}
        />
      )}
      
      <ReviewNotesSection
        notes={reviewNotes}
        onChange={setReviewNotes}
        placeholder="Add notes about your review decision..."
      />
      
      <AppealVotingActions
        onVote={(voteType) => onVote(appeal.id, voteType, reviewNotes)}
        voteCosts={{
          uphold: 5,
          reject: 5
        }}
      />
    </div>
  );
};
```

---

## 7. MOBILE OPTIMIZATION

### 7.1 Mobile-First Responsive Design

```javascript
// Mobile-optimized moderation queue
export const MobileModerationQueue = () => {
  const [swipeActions, setSwipeActions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSwipeAction = useCallback(async (itemId, action) => {
    setIsLoading(true);
    try {
      await performModerationAction(itemId, action);
      showSwipeSuccessMessage(action);
    } catch (error) {
      showSwipeErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="mobile-moderation-queue">
      <MobileQueueHeader />
      
      <SwipeableList
        items={queueItems}
        onSwipeLeft={(item) => handleSwipeAction(item.id, 'remove')}
        onSwipeRight={(item) => handleSwipeAction(item.id, 'keep')}
        onSwipeUp={(item) => showDetailModal(item)}
        renderItem={(item) => (
          <MobileContentCard
            key={item.id}
            content={item}
            onVote={handleQuickVote}
            onSelect={handleItemSelect}
          />
        )}
      />
      
      <MobileQuickActions
        selectedCount={selectedItems.size}
        onBatchAction={handleMobileBatchAction}
      />
    </div>
  );
};
```

### 7.2 Swipe Gesture Implementation

```javascript
// SwipeActions.js - Touch gesture handling
export const useSwipeActions = (onSwipeLeft, onSwipeRight, onSwipeUp) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [deltaX, setDeltaX] = useState(0);
  const [deltaY, setDeltaY] = useState(0);
  
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    setDeltaX(currentX - startX);
    setDeltaY(currentY - startY);
  };
  
  const handleTouchEnd = () => {
    const swipeThreshold = 100;
    const verticalThreshold = 80;
    
    // Horizontal swipes
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < verticalThreshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    // Vertical swipe up
    else if (deltaY < -verticalThreshold && Math.abs(deltaX) < swipeThreshold) {
      onSwipeUp?.();
    }
    
    // Reset deltas
    setDeltaX(0);
    setDeltaY(0);
  };
  
  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    swipeState: { deltaX, deltaY }
  };
};
```

### 7.3 Mobile Performance Optimization

```javascript
// Mobile-specific performance optimizations
const mobileOptimizations = {
  // Virtual scrolling for large lists
  virtualScrolling: {
    itemHeight: 120,
    overscan: 5,
    threshold: 50
  },
  
  // Image lazy loading
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1
  },
  
  // Touch response optimization
  touchOptimization: {
    touchAction: 'manipulation',
    userSelect: 'none',
    tapHighlightColor: 'transparent'
  },
  
  // Reduced motion for better performance
  reducedMotion: {
    respectUserPreference: true,
    fallbackAnimations: 'fade'
  }
};
```

---

## 8. ACCESSIBILITY COMPLIANCE

### 8.1 WCAG AA Standards

```javascript
// Accessibility configuration
const accessibilityConfig = {
  colorContrast: {
    normalText: 4.5, // Minimum ratio for normal text
    largeText: 3.0,  // Minimum ratio for large text
    graphical: 3.0   // Minimum ratio for graphical elements
  },
  
  keyboardNavigation: {
    focusVisible: '2px solid var(--xbox-green)',
    skipLinks: true,
    ariaLabels: true,
    roleAttributes: true
  },
  
  screenReaderSupport: {
    liveRegions: ['vote-updates', 'moderation-alerts'],
    alternativeText: true,
    semanticStructure: true,
    statusAnnouncements: true
  }
};
```

### 8.2 Screen Reader Optimizations

```javascript
// Screen reader friendly component structure
export const AccessibleModerationCard = ({ content, ...props }) => {
  const ariaLabel = useMemo(() => {
    return [
      `${content.severity} severity`,
      content.category,
      `reported ${formatTimeAgo(content.reportedAt)}`,
      `${content.reportCount} reports`,
      content.status === 'voting_active' ? 'voting in progress' : content.status
    ].join(', ');
  }, [content]);

  return (
    <div
      role="article"
      aria-label={ariaLabel}
      className="moderation-card"
      tabIndex={0}
      onKeyPress={handleKeyPress}
    >
      <div aria-live="polite" id={`vote-count-${content.id}`}>
        Current votes: {content.voteCount}
      </div>
      
      <div className="sr-only">
        {/* Screen reader only content */}
        Content type: {content.type}
        Severity level: {content.severity}
        Primary violation: {content.primaryViolation}
        Time until voting closes: {formatTimeRemaining(content.votingDeadline)}
      </div>
      
      {/* Visible content continues... */}
    </div>
  );
};
```

---

## 9. INTEGRATION SPECIFICATIONS

### 9.1 ContentModerationSystem Integration

```javascript
// Integration with existing moderation system from sub-task 4.6
import { contentModerationSystem } from '../../content/content-moderation.js';

export const ModerationQueueService = {
  // Initialize with existing moderation system
  async initialize(wallet) {
    return await contentModerationSystem.initialize(wallet);
  },
  
  // Report content using existing system
  async reportContent(contentId, reportData) {
    return await contentModerationSystem.reportContent(contentId, reportData);
  },
  
  // Vote on moderation using existing MLG token burning
  async voteOnModeration(contentId, voteType, voteData) {
    return await contentModerationSystem.voteOnModeration(contentId, voteType, voteData);
  },
  
  // Appeal decision using existing system
  async appealDecision(contentId, appealData) {
    return await contentModerationSystem.appealModerationDecision(contentId, appealData);
  },
  
  // Get statistics using existing system
  async getStatistics(timeframe) {
    return await contentModerationSystem.getModerationStatistics(timeframe);
  },
  
  // Get user profile using existing system
  async getUserProfile(walletAddress) {
    return await contentModerationSystem.getUserModerationProfile(walletAddress);
  }
};
```

### 9.2 Real-time Updates Integration

```javascript
// WebSocket integration for real-time moderation updates
export const ModerationWebSocketService = {
  connection: null,
  subscribers: new Map(),
  
  connect(walletAddress) {
    this.connection = new WebSocket(`${WS_BASE_URL}/moderation`);
    
    this.connection.onopen = () => {
      this.send({
        type: 'authenticate',
        walletAddress,
        subscriptions: ['queue-updates', 'vote-updates', 'decision-alerts']
      });
    };
    
    this.connection.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  },
  
  handleMessage(message) {
    const { type, payload } = message;
    const subscribers = this.subscribers.get(type) || [];
    
    subscribers.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('WebSocket subscriber error:', error);
      }
    });
  },
  
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(callback);
    
    return () => {
      const callbacks = this.subscribers.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  },
  
  send(message) {
    if (this.connection?.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(message));
    }
  }
};
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Loading Strategies

```javascript
// Optimized loading for moderation queue
const loadingStrategies = {
  // Initial load with pagination
  initialLoad: {
    pageSize: 20,
    priority: ['critical', 'high', 'medium', 'low'],
    preloadNext: true
  },
  
  // Virtual scrolling for large lists
  virtualScrolling: {
    itemHeight: 200,
    bufferSize: 5,
    scrollThreshold: 0.8
  },
  
  // Image optimization
  images: {
    lazyLoading: true,
    placeholders: true,
    compression: 'webp',
    sizes: {
      thumbnail: '150x150',
      preview: '400x300',
      full: '800x600'
    }
  },
  
  // Data caching
  caching: {
    userProfiles: '5 minutes',
    moderationStats: '1 minute',
    voteResults: '30 seconds',
    contentMetadata: '10 minutes'
  }
};
```

### 10.2 Bundle Splitting Strategy

```javascript
// Code splitting for moderation components
const moderationChunks = {
  // Core moderation queue (always loaded)
  core: [
    'ModerationQueue',
    'ModerationCard',
    'ContentReportModal'
  ],
  
  // Analytics dashboard (lazy loaded)
  analytics: [
    'ModerationAnalytics',
    'SystemHealthCard',
    'CategoryDistributionChart'
  ],
  
  // Advanced features (lazy loaded)
  advanced: [
    'BatchModerationToolbar',
    'AppealInterface',
    'ModeratorRoleManager'
  ],
  
  // Mobile-specific (conditional loading)
  mobile: [
    'MobileModerationQueue',
    'SwipeActions',
    'MobileReportModal'
  ]
};
```

---

## 11. TESTING SPECIFICATIONS

### 11.1 Component Testing Requirements

```javascript
// Test specifications for moderation components
describe('Content Moderation Queue', () => {
  describe('Report Submission', () => {
    it('should validate gaming-specific violation categories', () => {
      // Test cheating category requires evidence
      // Test harassment category requires detailed description
      // Test rate limiting for community protection
    });
    
    it('should integrate with MLG token system for reporting costs', () => {
      // Test stake requirements for different report types
      // Test reputation-based cost adjustments
      // Test token burn verification
    });
  });
  
  describe('Moderation Voting', () => {
    it('should calculate vote weights based on user reputation', () => {
      // Test expert reviewer 3.0x weight
      // Test community moderator 2.0x weight
      // Test trusted member 1.5x weight
    });
    
    it('should handle batch voting operations', () => {
      // Test bulk approve/remove actions
      // Test transaction batching for efficiency
      // Test error handling for partial failures
    });
  });
  
  describe('Mobile Interface', () => {
    it('should support swipe gestures for quick actions', () => {
      // Test swipe right for approve
      // Test swipe left for remove
      // Test swipe up for details
    });
    
    it('should optimize performance for mobile devices', () => {
      // Test virtual scrolling
      // Test image lazy loading
      // Test reduced animation for performance
    });
  });
});
```

### 11.2 Integration Testing

```javascript
// Integration test specifications
describe('Moderation System Integration', () => {
  it('should integrate with ContentModerationSystem from sub-task 4.6', async () => {
    const moderationSystem = new ContentModerationSystem();
    await moderationSystem.initialize(mockWallet);
    
    // Test report submission
    const reportResult = await moderationSystem.reportContent('content-123', {
      category: 'CHEATING',
      reason: 'Aimbot tutorial',
      description: 'Video shows clear aimbot usage with tutorial',
      reporterWallet: mockWallet.publicKey.toString()
    });
    
    expect(reportResult.success).toBe(true);
  });
  
  it('should integrate with existing voting and token systems', async () => {
    // Test MLG token burning for votes
    // Test wallet integration for transactions
    // Test real-time vote updates
  });
});
```

---

## 12. DEPLOYMENT SPECIFICATIONS

### 12.1 Environment Configuration

```javascript
// Environment-specific configurations
const deploymentConfig = {
  development: {
    api: {
      baseUrl: 'http://localhost:3000',
      websocket: 'ws://localhost:3001'
    },
    blockchain: {
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com'
    },
    features: {
      mockData: true,
      debugLogging: true,
      hotReload: true
    }
  },
  
  production: {
    api: {
      baseUrl: 'https://api.mlg-clan.com',
      websocket: 'wss://ws.mlg-clan.com'
    },
    blockchain: {
      network: 'mainnet-beta',
      rpcUrl: 'https://api.mainnet-beta.solana.com'
    },
    features: {
      mockData: false,
      debugLogging: false,
      analytics: true,
      errorReporting: true
    }
  }
};
```

### 12.2 Build Optimization

```javascript
// Webpack configuration for moderation components
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        moderation: {
          name: 'moderation',
          test: /[\\/]moderation[\\/]/,
          priority: 10
        },
        analytics: {
          name: 'analytics',
          test: /[\\/]analytics[\\/]/,
          priority: 5
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@moderation': path.resolve(__dirname, 'src/ui/components/moderation'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  }
};
```

---

This comprehensive technical specification provides all the necessary details for implementing the content reporting and moderation queue system for MLG.clan, maintaining the authentic Xbox 360 dashboard aesthetic while delivering a professional gaming community moderation platform.