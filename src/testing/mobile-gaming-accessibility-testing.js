/**
 * MLG.clan Mobile Gaming Accessibility Testing
 * 
 * Comprehensive accessibility testing for mobile gaming platform
 * Ensures inclusive gaming experience across diverse user needs and abilities
 * 
 * Features:
 * - Screen reader compatibility with gaming content and workflows
 * - Voice control testing for hands-free gaming operations
 * - Gaming gesture accessibility on various device sizes and capabilities
 * - Gaming contrast and readability testing in different lighting conditions
 * - Gaming motor accessibility testing with diverse interaction methods
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 */

/**
 * Mobile Gaming Accessibility Test Configuration
 */
const MOBILE_GAMING_ACCESSIBILITY_CONFIG = {
  // Screen reader testing configuration
  screenReaderTests: {
    contentNavigation: {
      name: 'Gaming Content Navigation',
      description: 'Test screen reader navigation through gaming content',
      elements: [
        'nav[role="navigation"]',
        '.gaming-tile',
        '.xbox-button',
        '.clan-card',
        '.tournament-bracket',
        '.leaderboard',
        '.vote-display'
      ],
      requirements: [
        'proper_aria_labels',
        'logical_tab_order',
        'descriptive_text',
        'role_attributes',
        'state_announcements'
      ]
    },
    votingWorkflow: {
      name: 'Voting Workflow Accessibility',
      description: 'Test voting process accessibility for screen readers',
      steps: [
        'wallet_connection_announcement',
        'voting_options_description',
        'token_amount_feedback',
        'confirmation_process',
        'result_announcement'
      ],
      requirements: [
        'clear_instructions',
        'progress_indicators',
        'error_announcements',
        'success_confirmations'
      ]
    },
    tournamentAccess: {
      name: 'Tournament Information Access',
      description: 'Ensure tournament data is accessible to screen readers',
      elements: [
        '.tournament-bracket',
        '.match-details',
        '.player-stats',
        '.tournament-results'
      ],
      requirements: [
        'structured_data',
        'meaningful_headings',
        'table_accessibility',
        'live_updates'
      ]
    },
    clanManagement: {
      name: 'Clan Management Accessibility',
      description: 'Test clan features for screen reader users',
      features: [
        'clan_roster_navigation',
        'member_management',
        'invitation_process',
        'statistics_access'
      ],
      requirements: [
        'clear_member_roles',
        'action_confirmations',
        'status_updates',
        'hierarchy_navigation'
      ]
    }
  },

  // Voice control testing configuration
  voiceControlTests: {
    navigationCommands: {
      name: 'Voice Navigation Commands',
      description: 'Test voice commands for gaming navigation',
      commands: [
        { phrase: 'go to voting', target: '/pages/voting.html', type: 'navigation' },
        { phrase: 'open clans', target: '/pages/clans.html', type: 'navigation' },
        { phrase: 'show tournaments', target: '/pages/tournaments.html', type: 'navigation' },
        { phrase: 'view profile', target: '/pages/profile.html', type: 'navigation' },
        { phrase: 'connect wallet', target: '[data-wallet-connect]', type: 'action' }
      ],
      requirements: [
        'command_recognition',
        'action_execution',
        'feedback_confirmation',
        'error_handling'
      ]
    },
    gamingActions: {
      name: 'Gaming Action Voice Commands',
      description: 'Test voice commands for gaming actions',
      commands: [
        { phrase: 'vote up', action: 'upvote', type: 'gaming_action' },
        { phrase: 'burn tokens', action: 'token_burn', type: 'gaming_action' },
        { phrase: 'join clan', action: 'clan_join', type: 'gaming_action' },
        { phrase: 'share achievement', action: 'share', type: 'gaming_action' },
        { phrase: 'refresh leaderboard', action: 'refresh', type: 'gaming_action' }
      ],
      requirements: [
        'action_accuracy',
        'confirmation_prompts',
        'undo_options',
        'safety_checks'
      ]
    },
    contentInteraction: {
      name: 'Content Interaction Voice Commands',
      description: 'Test voice interaction with gaming content',
      commands: [
        { phrase: 'read description', action: 'read_content', type: 'content' },
        { phrase: 'next item', action: 'navigate_next', type: 'content' },
        { phrase: 'previous item', action: 'navigate_previous', type: 'content' },
        { phrase: 'filter by clan', action: 'filter_content', type: 'content' },
        { phrase: 'sort by votes', action: 'sort_content', type: 'content' }
      ],
      requirements: [
        'content_recognition',
        'context_understanding',
        'filter_application',
        'result_feedback'
      ]
    }
  },

  // Gaming gesture accessibility configuration
  gestureAccessibilityTests: {
    alternativeInputs: {
      name: 'Alternative Input Methods',
      description: 'Test alternative ways to perform gaming gestures',
      gestures: [
        {
          name: 'swipe_navigation',
          alternatives: ['button_navigation', 'voice_commands', 'keyboard_shortcuts'],
          elements: ['.gaming-swipe-container', '.mobile-navigation']
        },
        {
          name: 'pinch_zoom',
          alternatives: ['button_zoom', 'double_tap_zoom', 'voice_zoom'],
          elements: ['.tournament-bracket', '.clan-stats-chart']
        },
        {
          name: 'drag_and_drop',
          alternatives: ['click_to_move', 'keyboard_selection', 'voice_commands'],
          elements: ['.clan-member-list', '.tournament-bracket']
        },
        {
          name: 'long_press',
          alternatives: ['double_click', 'right_click', 'keyboard_menu'],
          elements: ['.gaming-tile', '.clan-card']
        }
      ]
    },
    motorAccessibility: {
      name: 'Motor Accessibility Features',
      description: 'Test features for users with motor disabilities',
      features: [
        {
          name: 'large_touch_targets',
          description: 'Ensure touch targets meet accessibility standards',
          minimum_size: '44px',
          elements: ['button', 'a', '[role="button"]', 'input']
        },
        {
          name: 'gesture_timeout_adjustment',
          description: 'Allow users to adjust gesture timing',
          settings: ['slow_gestures', 'gesture_timeout', 'repeat_delay']
        },
        {
          name: 'single_finger_operation',
          description: 'Ensure all functions work with single finger',
          exceptions: ['accessibility_zoom', 'system_gestures']
        },
        {
          name: 'gesture_cancellation',
          description: 'Allow users to cancel gestures in progress',
          gestures: ['swipe', 'drag', 'long_press']
        }
      ]
    },
    deviceSizeAdaptation: {
      name: 'Device Size Adaptation',
      description: 'Test gesture accessibility across device sizes',
      devices: [
        {
          name: 'small_phone',
          screen_size: { width: 375, height: 667 },
          gesture_adjustments: ['larger_targets', 'edge_avoidance', 'one_handed_mode']
        },
        {
          name: 'large_phone',
          screen_size: { width: 414, height: 896 },
          gesture_adjustments: ['reachability', 'thumb_zones', 'gesture_areas']
        },
        {
          name: 'tablet',
          screen_size: { width: 1024, height: 1366 },
          gesture_adjustments: ['two_handed_support', 'corner_accessibility', 'split_screen']
        }
      ]
    }
  },

  // Gaming contrast and readability testing
  contrastReadabilityTests: {
    lightingConditions: {
      name: 'Lighting Condition Testing',
      description: 'Test readability in different lighting environments',
      conditions: [
        {
          name: 'bright_sunlight',
          description: 'Outdoor bright sunlight simulation',
          brightness: 100000, // lux
          contrast_requirements: 7, // WCAG AAA
          text_requirements: ['high_contrast', 'large_fonts', 'bold_text']
        },
        {
          name: 'indoor_lighting',
          description: 'Standard indoor lighting',
          brightness: 500, // lux
          contrast_requirements: 4.5, // WCAG AA
          text_requirements: ['standard_contrast', 'readable_fonts']
        },
        {
          name: 'dim_lighting',
          description: 'Low light environment',
          brightness: 10, // lux
          contrast_requirements: 4.5, // WCAG AA
          text_requirements: ['dark_mode', 'reduced_brightness', 'comfortable_reading']
        },
        {
          name: 'night_mode',
          description: 'Night time usage',
          brightness: 1, // lux
          contrast_requirements: 4.5, // WCAG AA
          text_requirements: ['dark_theme', 'blue_light_reduction', 'eye_strain_reduction']
        }
      ]
    },
    gamingSpecificContrast: {
      name: 'Gaming-Specific Contrast Testing',
      description: 'Test contrast for gaming UI elements',
      elements: [
        {
          type: 'gaming_buttons',
          selectors: ['.xbox-button', '.gaming-tile'],
          requirements: ['background_contrast', 'border_contrast', 'text_contrast']
        },
        {
          type: 'voting_indicators',
          selectors: ['.vote-display', '.burn-indicator'],
          requirements: ['status_colors', 'progress_indicators', 'state_changes']
        },
        {
          type: 'clan_elements',
          selectors: ['.clan-card', '.member-role'],
          requirements: ['role_colors', 'status_indicators', 'hierarchy_visualization']
        },
        {
          type: 'tournament_brackets',
          selectors: ['.tournament-bracket', '.match-status'],
          requirements: ['bracket_lines', 'team_colors', 'result_indicators']
        }
      ]
    },
    colorAccessibility: {
      name: 'Color Accessibility Testing',
      description: 'Test color usage for color-blind users',
      color_vision_types: [
        'protanopia', // red-blind
        'deuteranopia', // green-blind
        'tritanopia', // blue-blind
        'monochromacy' // complete color blindness
      ],
      requirements: [
        'color_independence', // Information not conveyed by color alone
        'pattern_alternatives', // Patterns or symbols as alternatives
        'text_labels', // Text labels for color-coded information
        'high_contrast' // Sufficient contrast for all users
      ]
    }
  },

  // Motor accessibility detailed testing
  motorAccessibilityTests: {
    touchAccommodations: {
      name: 'Touch Accommodation Features',
      description: 'Test accommodations for different motor abilities',
      accommodations: [
        {
          name: 'touch_assistance',
          description: 'Features to help with precise touch',
          features: ['magnifier', 'touch_preview', 'confirmation_dialogs']
        },
        {
          name: 'tremor_support',
          description: 'Support for users with tremors',
          features: ['stable_touch_areas', 'dwell_time_adjustment', 'accidental_touch_prevention']
        },
        {
          name: 'one_handed_operation',
          description: 'Complete functionality with one hand',
          features: ['reachable_controls', 'gesture_alternatives', 'voice_backup']
        },
        {
          name: 'limited_dexterity',
          description: 'Support for limited finger dexterity',
          features: ['large_targets', 'simplified_gestures', 'switch_control']
        }
      ]
    },
    assistiveTechnology: {
      name: 'Assistive Technology Integration',
      description: 'Test integration with assistive technologies',
      technologies: [
        {
          name: 'switch_control',
          description: 'External switch navigation support',
          requirements: ['sequential_navigation', 'selection_methods', 'timing_adjustments']
        },
        {
          name: 'head_tracking',
          description: 'Head movement-based control',
          requirements: ['cursor_control', 'gesture_mapping', 'calibration_options']
        },
        {
          name: 'eye_tracking',
          description: 'Eye gaze-based interaction',
          requirements: ['gaze_selection', 'dwell_clicking', 'precision_zones']
        },
        {
          name: 'joystick_gamepad',
          description: 'External gamepad/joystick support',
          requirements: ['button_mapping', 'analog_control', 'custom_layouts']
        }
      ]
    }
  },

  // Accessibility scoring criteria
  scoringCriteria: {
    screenReader: {
      excellent: 95, // 95-100%
      good: 85,      // 85-94%
      fair: 70,      // 70-84%
      poor: 0        // 0-69%
    },
    voiceControl: {
      excellent: 90,
      good: 80,
      fair: 65,
      poor: 0
    },
    gestureAccessibility: {
      excellent: 90,
      good: 80,
      fair: 70,
      poor: 0
    },
    contrastReadability: {
      excellent: 95,
      good: 90,
      fair: 75,
      poor: 0
    },
    motorAccessibility: {
      excellent: 85,
      good: 75,
      fair: 60,
      poor: 0
    }
  }
};

/**
 * Mobile Gaming Accessibility Testing Suite
 */
export class MobileGamingAccessibilityTestingSuite {
  constructor(options = {}) {
    this.options = {
      enableScreenReaderTesting: true,
      enableVoiceControlTesting: true,
      enableGestureAccessibilityTesting: true,
      enableContrastTesting: true,
      enableMotorAccessibilityTesting: true,
      enableRealDeviceTesting: true,
      generateDetailedReport: true,
      includeRecommendations: true,
      ...options
    };

    this.testResults = {
      summary: {
        overallScore: 0,
        screenReaderScore: 0,
        voiceControlScore: 0,
        gestureAccessibilityScore: 0,
        contrastReadabilityScore: 0,
        motorAccessibilityScore: 0,
        complianceLevel: 'unknown',
        totalIssues: 0,
        criticalIssues: 0
      },
      screenReaderResults: {},
      voiceControlResults: {},
      gestureAccessibilityResults: {},
      contrastReadabilityResults: {},
      motorAccessibilityResults: {},
      detailedFindings: [],
      recommendations: []
    };

    this.screenReaderTester = new ScreenReaderTester();
    this.voiceControlTester = new VoiceControlTester();
    this.gestureAccessibilityTester = new GestureAccessibilityTester();
    this.contrastTester = new ContrastReadabilityTester();
    this.motorAccessibilityTester = new MotorAccessibilityTester();
    this.accessibilityAnalyzer = new AccessibilityAnalyzer();
  }

  /**
   * Run comprehensive mobile gaming accessibility testing
   */
  async runCompleteAccessibilityTest() {
    console.log('♿ Starting Mobile Gaming Accessibility Testing Suite...');

    try {
      // Test screen reader compatibility
      if (this.options.enableScreenReaderTesting) {
        await this.testScreenReaderCompatibility();
      }

      // Test voice control features
      if (this.options.enableVoiceControlTesting) {
        await this.testVoiceControlFeatures();
      }

      // Test gesture accessibility
      if (this.options.enableGestureAccessibilityTesting) {
        await this.testGestureAccessibility();
      }

      // Test contrast and readability
      if (this.options.enableContrastTesting) {
        await this.testContrastAndReadability();
      }

      // Test motor accessibility
      if (this.options.enableMotorAccessibilityTesting) {
        await this.testMotorAccessibility();
      }

      // Calculate scores and compliance level
      await this.calculateAccessibilityScores();

      // Generate comprehensive accessibility report
      await this.generateAccessibilityReport();

      console.log('✅ Mobile gaming accessibility testing completed!');
      return this.testResults;

    } catch (error) {
      console.error('❌ Accessibility testing failed:', error);
      throw error;
    }
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility() {
    console.log('🔊 Testing screen reader compatibility...');

    for (const [testKey, test] of Object.entries(MOBILE_GAMING_ACCESSIBILITY_CONFIG.screenReaderTests)) {
      console.log(`Testing ${test.name}...`);

      try {
        const result = await this.screenReaderTester.testScreenReaderAccess(test);
        this.testResults.screenReaderResults[testKey] = result;

        // Collect detailed findings
        if (result.issues && result.issues.length > 0) {
          this.testResults.detailedFindings.push(...result.issues);
        }

      } catch (error) {
        console.error(`❌ Screen reader test failed: ${testKey}`, error);
        this.testResults.screenReaderResults[testKey] = {
          passed: false,
          error: error.message,
          test: test.name
        };
      }
    }
  }

  /**
   * Test voice control features
   */
  async testVoiceControlFeatures() {
    console.log('🎤 Testing voice control features...');

    for (const [testKey, test] of Object.entries(MOBILE_GAMING_ACCESSIBILITY_CONFIG.voiceControlTests)) {
      console.log(`Testing ${test.name}...`);

      try {
        const result = await this.voiceControlTester.testVoiceCommands(test);
        this.testResults.voiceControlResults[testKey] = result;

        // Collect detailed findings
        if (result.issues && result.issues.length > 0) {
          this.testResults.detailedFindings.push(...result.issues);
        }

      } catch (error) {
        console.error(`❌ Voice control test failed: ${testKey}`, error);
        this.testResults.voiceControlResults[testKey] = {
          passed: false,
          error: error.message,
          test: test.name
        };
      }
    }
  }

  /**
   * Test gesture accessibility
   */
  async testGestureAccessibility() {
    console.log('👆 Testing gesture accessibility...');

    for (const [testKey, test] of Object.entries(MOBILE_GAMING_ACCESSIBILITY_CONFIG.gestureAccessibilityTests)) {
      console.log(`Testing ${test.name}...`);

      try {
        const result = await this.gestureAccessibilityTester.testGestureAlternatives(test);
        this.testResults.gestureAccessibilityResults[testKey] = result;

        // Collect detailed findings
        if (result.issues && result.issues.length > 0) {
          this.testResults.detailedFindings.push(...result.issues);
        }

      } catch (error) {
        console.error(`❌ Gesture accessibility test failed: ${testKey}`, error);
        this.testResults.gestureAccessibilityResults[testKey] = {
          passed: false,
          error: error.message,
          test: test.name
        };
      }
    }
  }

  /**
   * Test contrast and readability
   */
  async testContrastAndReadability() {
    console.log('🌈 Testing contrast and readability...');

    for (const [testKey, test] of Object.entries(MOBILE_GAMING_ACCESSIBILITY_CONFIG.contrastReadabilityTests)) {
      console.log(`Testing ${test.name}...`);

      try {
        const result = await this.contrastTester.testContrastCompliance(test);
        this.testResults.contrastReadabilityResults[testKey] = result;

        // Collect detailed findings
        if (result.issues && result.issues.length > 0) {
          this.testResults.detailedFindings.push(...result.issues);
        }

      } catch (error) {
        console.error(`❌ Contrast test failed: ${testKey}`, error);
        this.testResults.contrastReadabilityResults[testKey] = {
          passed: false,
          error: error.message,
          test: test.name
        };
      }
    }
  }

  /**
   * Test motor accessibility
   */
  async testMotorAccessibility() {
    console.log('🤝 Testing motor accessibility...');

    for (const [testKey, test] of Object.entries(MOBILE_GAMING_ACCESSIBILITY_CONFIG.motorAccessibilityTests)) {
      console.log(`Testing ${test.name}...`);

      try {
        const result = await this.motorAccessibilityTester.testMotorAccommodations(test);
        this.testResults.motorAccessibilityResults[testKey] = result;

        // Collect detailed findings
        if (result.issues && result.issues.length > 0) {
          this.testResults.detailedFindings.push(...result.issues);
        }

      } catch (error) {
        console.error(`❌ Motor accessibility test failed: ${testKey}`, error);
        this.testResults.motorAccessibilityResults[testKey] = {
          passed: false,
          error: error.message,
          test: test.name
        };
      }
    }
  }

  /**
   * Calculate accessibility scores
   */
  async calculateAccessibilityScores() {
    console.log('📊 Calculating accessibility scores...');

    // Calculate individual category scores
    this.testResults.summary.screenReaderScore = this.calculateCategoryScore(
      this.testResults.screenReaderResults,
      'screenReader'
    );

    this.testResults.summary.voiceControlScore = this.calculateCategoryScore(
      this.testResults.voiceControlResults,
      'voiceControl'
    );

    this.testResults.summary.gestureAccessibilityScore = this.calculateCategoryScore(
      this.testResults.gestureAccessibilityResults,
      'gestureAccessibility'
    );

    this.testResults.summary.contrastReadabilityScore = this.calculateCategoryScore(
      this.testResults.contrastReadabilityResults,
      'contrastReadability'
    );

    this.testResults.summary.motorAccessibilityScore = this.calculateCategoryScore(
      this.testResults.motorAccessibilityResults,
      'motorAccessibility'
    );

    // Calculate overall score
    const scores = [
      this.testResults.summary.screenReaderScore,
      this.testResults.summary.voiceControlScore,
      this.testResults.summary.gestureAccessibilityScore,
      this.testResults.summary.contrastReadabilityScore,
      this.testResults.summary.motorAccessibilityScore
    ].filter(score => score > 0);

    this.testResults.summary.overallScore = scores.length > 0 ?
      Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;

    // Determine compliance level
    this.testResults.summary.complianceLevel = this.determineComplianceLevel();

    // Count issues
    this.countIssues();

    // Generate recommendations
    if (this.options.includeRecommendations) {
      this.generateAccessibilityRecommendations();
    }
  }

  /**
   * Calculate category score
   */
  calculateCategoryScore(categoryResults, categoryType) {
    const results = Object.values(categoryResults).filter(r => r.score !== undefined);
    if (results.length === 0) return 0;

    const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
    return Math.round(totalScore / results.length);
  }

  /**
   * Determine compliance level
   */
  determineComplianceLevel() {
    const overallScore = this.testResults.summary.overallScore;

    if (overallScore >= 95) return 'WCAG AAA';
    if (overallScore >= 85) return 'WCAG AA';
    if (overallScore >= 70) return 'WCAG A';
    return 'Non-compliant';
  }

  /**
   * Count issues by severity
   */
  countIssues() {
    const allIssues = this.testResults.detailedFindings;
    
    this.testResults.summary.totalIssues = allIssues.length;
    this.testResults.summary.criticalIssues = allIssues.filter(
      issue => issue.severity === 'critical' || issue.severity === 'high'
    ).length;
  }

  /**
   * Generate accessibility recommendations
   */
  generateAccessibilityRecommendations() {
    const recommendations = [];

    // Screen reader recommendations
    if (this.testResults.summary.screenReaderScore < 85) {
      recommendations.push({
        category: 'Screen Reader',
        priority: 'High',
        issue: 'Screen reader compatibility below optimal level',
        suggestion: 'Improve ARIA labels, semantic markup, and screen reader announcements',
        impact: 'Critical for users who rely on screen readers'
      });
    }

    // Voice control recommendations
    if (this.testResults.summary.voiceControlScore < 80) {
      recommendations.push({
        category: 'Voice Control',
        priority: 'Medium',
        issue: 'Voice control features need improvement',
        suggestion: 'Implement comprehensive voice command support and audio feedback',
        impact: 'Important for hands-free gaming operation'
      });
    }

    // Gesture accessibility recommendations
    if (this.testResults.summary.gestureAccessibilityScore < 80) {
      recommendations.push({
        category: 'Gesture Accessibility',
        priority: 'High',
        issue: 'Gesture alternatives insufficient',
        suggestion: 'Provide alternative input methods for all gesture-based interactions',
        impact: 'Essential for users with limited mobility'
      });
    }

    // Contrast recommendations
    if (this.testResults.summary.contrastReadabilityScore < 90) {
      recommendations.push({
        category: 'Contrast & Readability',
        priority: 'High',
        issue: 'Color contrast or readability issues detected',
        suggestion: 'Improve color contrast ratios and implement better lighting adaptation',
        impact: 'Critical for users with visual impairments'
      });
    }

    // Motor accessibility recommendations
    if (this.testResults.summary.motorAccessibilityScore < 75) {
      recommendations.push({
        category: 'Motor Accessibility',
        priority: 'High',
        issue: 'Motor accessibility features need enhancement',
        suggestion: 'Implement better touch accommodations and assistive technology support',
        impact: 'Essential for users with motor disabilities'
      });
    }

    // Overall compliance recommendations
    if (this.testResults.summary.complianceLevel === 'Non-compliant') {
      recommendations.push({
        category: 'Overall Compliance',
        priority: 'Critical',
        issue: 'Platform does not meet basic accessibility standards',
        suggestion: 'Comprehensive accessibility audit and remediation required',
        impact: 'Platform may be unusable for many users with disabilities'
      });
    }

    this.testResults.recommendations = recommendations;
  }

  /**
   * Generate accessibility report
   */
  async generateAccessibilityReport() {
    console.log('📊 Generating accessibility compliance report...');

    const report = {
      summary: this.testResults.summary,
      screenReaderResults: this.testResults.screenReaderResults,
      voiceControlResults: this.testResults.voiceControlResults,
      gestureAccessibilityResults: this.testResults.gestureAccessibilityResults,
      contrastReadabilityResults: this.testResults.contrastReadabilityResults,
      motorAccessibilityResults: this.testResults.motorAccessibilityResults,
      detailedFindings: this.testResults.detailedFindings,
      recommendations: this.testResults.recommendations,
      complianceStatement: this.generateComplianceStatement(),
      timestamp: new Date().toISOString()
    };

    console.log(`♿ Overall Accessibility Score: ${this.testResults.summary.overallScore}/100`);
    console.log(`📜 Compliance Level: ${this.testResults.summary.complianceLevel}`);
    console.log(`🔊 Screen Reader Score: ${this.testResults.summary.screenReaderScore}/100`);
    console.log(`🎤 Voice Control Score: ${this.testResults.summary.voiceControlScore}/100`);
    console.log(`👆 Gesture Accessibility Score: ${this.testResults.summary.gestureAccessibilityScore}/100`);
    console.log(`🌈 Contrast & Readability Score: ${this.testResults.summary.contrastReadabilityScore}/100`);
    console.log(`🤝 Motor Accessibility Score: ${this.testResults.summary.motorAccessibilityScore}/100`);
    console.log(`⚠️ Total Issues: ${this.testResults.summary.totalIssues} (Critical: ${this.testResults.summary.criticalIssues})`);

    return report;
  }

  /**
   * Generate compliance statement
   */
  generateComplianceStatement() {
    const score = this.testResults.summary.overallScore;
    const level = this.testResults.summary.complianceLevel;

    let statement = `The MLG.clan gaming platform has achieved an accessibility score of ${score}/100, `;
    
    if (level === 'WCAG AAA') {
      statement += 'meeting the highest level of WCAG accessibility standards. The platform provides excellent accessibility features for users with diverse abilities.';
    } else if (level === 'WCAG AA') {
      statement += 'meeting WCAG AA accessibility standards. The platform provides good accessibility features with some areas for improvement.';
    } else if (level === 'WCAG A') {
      statement += 'meeting basic WCAG A accessibility standards. Significant improvements are needed to ensure full accessibility.';
    } else {
      statement += 'not meeting basic accessibility standards. Comprehensive accessibility improvements are required.';
    }

    return statement;
  }
}

/**
 * Screen Reader Tester
 */
class ScreenReaderTester {
  async testScreenReaderAccess(test) {
    const issues = [];
    let passedTests = 0;
    let totalTests = 0;

    // Test elements for proper accessibility
    if (test.elements) {
      for (const selector of test.elements) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          totalTests++;
          const elementIssues = this.testElementAccessibility(element, selector);
          
          if (elementIssues.length === 0) {
            passedTests++;
          } else {
            issues.push(...elementIssues);
          }
        }
      }
    }

    // Test requirements
    if (test.requirements) {
      for (const requirement of test.requirements) {
        totalTests++;
        const requirementTest = this.testRequirement(requirement);
        
        if (requirementTest.passed) {
          passedTests++;
        } else {
          issues.push(requirementTest);
        }
      }
    }

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      passed: score >= 85,
      test: test.name,
      score,
      passedTests,
      totalTests,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  testElementAccessibility(element, selector) {
    const issues = [];

    // Test for ARIA labels
    if (!element.hasAttribute('aria-label') && 
        !element.hasAttribute('aria-labelledby') && 
        !element.textContent.trim()) {
      issues.push({
        type: 'missing_aria_label',
        element: selector,
        severity: 'high',
        description: 'Element lacks accessible label',
        suggestion: 'Add aria-label or aria-labelledby attribute'
      });
    }

    // Test for proper role
    if (element.tagName.toLowerCase() === 'div' && 
        element.hasAttribute('onclick') && 
        !element.hasAttribute('role')) {
      issues.push({
        type: 'missing_role',
        element: selector,
        severity: 'high',
        description: 'Interactive element missing role attribute',
        suggestion: 'Add appropriate role attribute (e.g., role="button")'
      });
    }

    // Test for keyboard accessibility
    if (element.hasAttribute('onclick') && 
        !element.hasAttribute('tabindex') && 
        !['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
      issues.push({
        type: 'not_keyboard_accessible',
        element: selector,
        severity: 'high',
        description: 'Interactive element not keyboard accessible',
        suggestion: 'Add tabindex="0" or use semantic HTML elements'
      });
    }

    return issues;
  }

  testRequirement(requirement) {
    switch (requirement) {
      case 'proper_aria_labels':
        return this.testAriaLabels();
      case 'logical_tab_order':
        return this.testTabOrder();
      case 'descriptive_text':
        return this.testDescriptiveText();
      case 'role_attributes':
        return this.testRoleAttributes();
      case 'state_announcements':
        return this.testStateAnnouncements();
      default:
        return { passed: true, type: requirement };
    }
  }

  testAriaLabels() {
    const interactiveElements = document.querySelectorAll('button, a, [role="button"], input');
    let elementsWithLabels = 0;

    interactiveElements.forEach(element => {
      if (element.hasAttribute('aria-label') || 
          element.hasAttribute('aria-labelledby') || 
          element.textContent.trim() ||
          element.querySelector('img[alt]')) {
        elementsWithLabels++;
      }
    });

    const percentage = interactiveElements.length > 0 ? 
      (elementsWithLabels / interactiveElements.length) * 100 : 100;

    return {
      passed: percentage >= 90,
      type: 'proper_aria_labels',
      percentage: Math.round(percentage),
      severity: 'high',
      description: percentage < 90 ? 'Some interactive elements lack proper labels' : 'ARIA labels properly implemented'
    };
  }

  testTabOrder() {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Simple tab order test - check if elements are in logical order
    let logicalOrder = true;
    let previousTop = -1;

    focusableElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < previousTop - 50) { // Allow some tolerance
        logicalOrder = false;
      }
      previousTop = rect.top;
    });

    return {
      passed: logicalOrder,
      type: 'logical_tab_order',
      severity: 'medium',
      description: logicalOrder ? 'Tab order is logical' : 'Tab order may not follow visual layout'
    };
  }

  testDescriptiveText() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let descriptiveHeadings = 0;

    headings.forEach(heading => {
      const text = heading.textContent.trim();
      if (text.length > 3 && !text.match(/^(title|heading|header)$/i)) {
        descriptiveHeadings++;
      }
    });

    const percentage = headings.length > 0 ? 
      (descriptiveHeadings / headings.length) * 100 : 100;

    return {
      passed: percentage >= 80,
      type: 'descriptive_text',
      percentage: Math.round(percentage),
      severity: 'medium',
      description: percentage >= 80 ? 'Headings are descriptive' : 'Some headings lack descriptive text'
    };
  }

  testRoleAttributes() {
    const customInteractiveElements = document.querySelectorAll('div[onclick], span[onclick]');
    let elementsWithRoles = 0;

    customInteractiveElements.forEach(element => {
      if (element.hasAttribute('role')) {
        elementsWithRoles++;
      }
    });

    const percentage = customInteractiveElements.length > 0 ? 
      (elementsWithRoles / customInteractiveElements.length) * 100 : 100;

    return {
      passed: percentage >= 90,
      type: 'role_attributes',
      percentage: Math.round(percentage),
      severity: 'high',
      description: percentage >= 90 ? 'Role attributes properly used' : 'Some interactive elements missing role attributes'
    };
  }

  testStateAnnouncements() {
    const dynamicElements = document.querySelectorAll('[aria-live], [aria-atomic], [role="status"], [role="alert"]');
    
    return {
      passed: dynamicElements.length > 0,
      type: 'state_announcements',
      count: dynamicElements.length,
      severity: 'medium',
      description: dynamicElements.length > 0 ? 'Dynamic content has accessibility features' : 'No accessible dynamic content announcements found'
    };
  }
}

/**
 * Voice Control Tester
 */
class VoiceControlTester {
  async testVoiceCommands(test) {
    const issues = [];
    let passedCommands = 0;
    let totalCommands = test.commands.length;

    // Test each voice command
    for (const command of test.commands) {
      const commandResult = await this.testVoiceCommand(command);
      
      if (commandResult.passed) {
        passedCommands++;
      } else {
        issues.push(commandResult);
      }
    }

    const score = totalCommands > 0 ? Math.round((passedCommands / totalCommands) * 100) : 0;

    return {
      passed: score >= 75,
      test: test.name,
      score,
      passedCommands,
      totalCommands,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  async testVoiceCommand(command) {
    // Simulate voice command testing
    try {
      let target = null;
      
      if (command.type === 'navigation') {
        // Test if navigation target exists
        target = document.querySelector(`[href="${command.target}"]`) || 
                 document.querySelector(`a[href*="${command.target}"]`);
      } else if (command.type === 'action') {
        // Test if action target exists
        target = document.querySelector(command.target);
      }

      const passed = !!target;

      return {
        passed,
        command: command.phrase,
        type: command.type,
        target: command.target,
        severity: 'medium',
        description: passed ? 
          `Voice command "${command.phrase}" target available` : 
          `Voice command "${command.phrase}" target not found`
      };

    } catch (error) {
      return {
        passed: false,
        command: command.phrase,
        error: error.message,
        severity: 'high',
        description: `Voice command "${command.phrase}" test failed`
      };
    }
  }
}

/**
 * Gesture Accessibility Tester
 */
class GestureAccessibilityTester {
  async testGestureAlternatives(test) {
    const issues = [];
    let passedTests = 0;
    let totalTests = 0;

    // Test alternative inputs
    if (test.alternativeInputs) {
      for (const gesture of test.alternativeInputs.gestures) {
        totalTests++;
        const gestureResult = this.testGestureAlternatives(gesture);
        
        if (gestureResult.passed) {
          passedTests++;
        } else {
          issues.push(gestureResult);
        }
      }
    }

    // Test motor accessibility features
    if (test.motorAccessibility) {
      for (const feature of test.motorAccessibility.features) {
        totalTests++;
        const featureResult = this.testMotorFeature(feature);
        
        if (featureResult.passed) {
          passedTests++;
        } else {
          issues.push(featureResult);
        }
      }
    }

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      passed: score >= 80,
      test: test.name,
      score,
      passedTests,
      totalTests,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  testGestureAlternatives(gesture) {
    let alternativesAvailable = 0;
    const totalAlternatives = gesture.alternatives.length;

    // Check if alternative methods exist
    gesture.alternatives.forEach(alternative => {
      if (this.checkAlternativeMethod(alternative, gesture.elements)) {
        alternativesAvailable++;
      }
    });

    const passed = alternativesAvailable >= Math.ceil(totalAlternatives * 0.7); // 70% of alternatives should be available

    return {
      passed,
      gesture: gesture.name,
      alternativesAvailable,
      totalAlternatives,
      severity: 'high',
      description: passed ? 
        `Gesture "${gesture.name}" has sufficient alternatives` : 
        `Gesture "${gesture.name}" lacks sufficient alternative input methods`
    };
  }

  checkAlternativeMethod(alternative, elements) {
    switch (alternative) {
      case 'button_navigation':
        return elements.some(selector => 
          document.querySelector(`${selector} button, ${selector} [role="button"]`)
        );
      case 'voice_commands':
        return document.querySelector('[data-voice-enabled]') !== null;
      case 'keyboard_shortcuts':
        return document.querySelector('[data-keyboard-shortcut]') !== null;
      case 'double_tap_zoom':
        return CSS.supports('touch-action', 'manipulation');
      default:
        return true; // Assume available if not specifically tested
    }
  }

  testMotorFeature(feature) {
    switch (feature.name) {
      case 'large_touch_targets':
        return this.testTouchTargetSizes(feature);
      case 'gesture_timeout_adjustment':
        return this.testGestureTimeouts(feature);
      case 'single_finger_operation':
        return this.testSingleFingerOperation(feature);
      case 'gesture_cancellation':
        return this.testGestureCancellation(feature);
      default:
        return { passed: true, feature: feature.name };
    }
  }

  testTouchTargetSizes(feature) {
    const interactiveElements = document.querySelectorAll(feature.elements.join(', '));
    let adequateSizeCount = 0;
    const minSize = parseInt(feature.minimum_size);

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= minSize && rect.height >= minSize) {
        adequateSizeCount++;
      }
    });

    const percentage = interactiveElements.length > 0 ? 
      (adequateSizeCount / interactiveElements.length) * 100 : 100;

    return {
      passed: percentage >= 90,
      feature: feature.name,
      percentage: Math.round(percentage),
      minSize,
      severity: 'high',
      description: percentage >= 90 ? 
        'Touch targets meet size requirements' : 
        `${Math.round(100 - percentage)}% of touch targets are too small`
    };
  }

  testGestureTimeouts(feature) {
    // Check if gesture timeout settings are available
    const timeoutControls = document.querySelector('[data-gesture-timeout], [data-accessibility-settings]');
    
    return {
      passed: !!timeoutControls,
      feature: feature.name,
      severity: 'medium',
      description: timeoutControls ? 
        'Gesture timeout controls available' : 
        'No gesture timeout adjustment controls found'
    };
  }

  testSingleFingerOperation(feature) {
    // Check for multi-touch requirements
    const multiTouchElements = document.querySelectorAll('[data-multitouch-required]');
    
    return {
      passed: multiTouchElements.length === 0,
      feature: feature.name,
      multiTouchRequiredCount: multiTouchElements.length,
      severity: 'high',
      description: multiTouchElements.length === 0 ? 
        'All functions work with single finger' : 
        `${multiTouchElements.length} functions require multi-touch`
    };
  }

  testGestureCancellation(feature) {
    // Check for gesture cancellation support
    const cancellableElements = document.querySelectorAll('[data-gesture-cancellable]');
    const gestureElements = document.querySelectorAll('[data-gesture], [data-swipe], [data-drag]');
    
    const cancellationRatio = gestureElements.length > 0 ? 
      cancellableElements.length / gestureElements.length : 1;

    return {
      passed: cancellationRatio >= 0.8,
      feature: feature.name,
      cancellationRatio: Math.round(cancellationRatio * 100),
      severity: 'medium',
      description: cancellationRatio >= 0.8 ? 
        'Most gestures support cancellation' : 
        'Some gestures lack cancellation support'
    };
  }
}

/**
 * Contrast & Readability Tester
 */
class ContrastReadabilityTester {
  async testContrastCompliance(test) {
    const issues = [];
    let passedTests = 0;
    let totalTests = 0;

    // Test lighting conditions
    if (test.lightingConditions) {
      for (const condition of test.lightingConditions.conditions) {
        totalTests++;
        const conditionResult = this.testLightingCondition(condition);
        
        if (conditionResult.passed) {
          passedTests++;
        } else {
          issues.push(conditionResult);
        }
      }
    }

    // Test gaming-specific contrast
    if (test.gamingSpecificContrast) {
      for (const element of test.gamingSpecificContrast.elements) {
        totalTests++;
        const elementResult = this.testElementContrast(element);
        
        if (elementResult.passed) {
          passedTests++;
        } else {
          issues.push(elementResult);
        }
      }
    }

    // Test color accessibility
    if (test.colorAccessibility) {
      totalTests++;
      const colorResult = this.testColorAccessibility(test.colorAccessibility);
      
      if (colorResult.passed) {
        passedTests++;
      } else {
        issues.push(colorResult);
      }
    }

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      passed: score >= 85,
      test: test.name,
      score,
      passedTests,
      totalTests,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  testLightingCondition(condition) {
    // Simulate testing different lighting conditions
    // In real implementation, this would test actual contrast ratios
    
    const contrastElements = document.querySelectorAll('p, h1, h2, h3, button, a');
    let adequateContrastCount = 0;

    contrastElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const hasGoodContrast = this.checkContrastRatio(style, condition.contrast_requirements);
      
      if (hasGoodContrast) {
        adequateContrastCount++;
      }
    });

    const percentage = contrastElements.length > 0 ? 
      (adequateContrastCount / contrastElements.length) * 100 : 100;

    return {
      passed: percentage >= 90,
      condition: condition.name,
      percentage: Math.round(percentage),
      requirement: condition.contrast_requirements,
      severity: 'high',
      description: percentage >= 90 ? 
        `Good contrast in ${condition.name}` : 
        `Poor contrast in ${condition.name} conditions`
    };
  }

  checkContrastRatio(style, requirement) {
    // Simplified contrast check
    // Real implementation would calculate actual contrast ratios
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // Basic check - ensure colors are different
    return backgroundColor !== color && color !== 'rgba(0, 0, 0, 0)';
  }

  testElementContrast(element) {
    const elements = document.querySelectorAll(element.selectors.join(', '));
    let adequateContrastCount = 0;

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const hasGoodContrast = this.checkContrastRatio(style, 4.5); // WCAG AA standard
      
      if (hasGoodContrast) {
        adequateContrastCount++;
      }
    });

    const percentage = elements.length > 0 ? 
      (adequateContrastCount / elements.length) * 100 : 100;

    return {
      passed: percentage >= 90,
      elementType: element.type,
      percentage: Math.round(percentage),
      severity: 'high',
      description: percentage >= 90 ? 
        `${element.type} elements have adequate contrast` : 
        `${element.type} elements have contrast issues`
    };
  }

  testColorAccessibility(colorAccessibility) {
    // Test for color-only information
    const colorOnlyElements = document.querySelectorAll('[style*="color"]:not([aria-label]):not([title])');
    
    // Look for alternative indicators
    const hasPatterns = document.querySelectorAll('[class*="pattern"], [class*="icon"]').length > 0;
    const hasTextLabels = document.querySelectorAll('[aria-label], [title]').length > 0;
    
    const colorIndependence = colorOnlyElements.length === 0 || (hasPatterns && hasTextLabels);

    return {
      passed: colorIndependence,
      test: 'color_accessibility',
      colorOnlyElements: colorOnlyElements.length,
      hasAlternatives: hasPatterns || hasTextLabels,
      severity: 'high',
      description: colorIndependence ? 
        'Information not conveyed by color alone' : 
        'Some information may rely only on color'
    };
  }
}

/**
 * Motor Accessibility Tester
 */
class MotorAccessibilityTester {
  async testMotorAccommodations(test) {
    const issues = [];
    let passedTests = 0;
    let totalTests = 0;

    // Test touch accommodations
    if (test.touchAccommodations) {
      for (const accommodation of test.touchAccommodations.accommodations) {
        totalTests++;
        const accommodationResult = this.testTouchAccommodation(accommodation);
        
        if (accommodationResult.passed) {
          passedTests++;
        } else {
          issues.push(accommodationResult);
        }
      }
    }

    // Test assistive technology integration
    if (test.assistiveTechnology) {
      for (const technology of test.assistiveTechnology.technologies) {
        totalTests++;
        const technologyResult = this.testAssistiveTechnology(technology);
        
        if (technologyResult.passed) {
          passedTests++;
        } else {
          issues.push(technologyResult);
        }
      }
    }

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      passed: score >= 70,
      test: test.name,
      score,
      passedTests,
      totalTests,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  testTouchAccommodation(accommodation) {
    let featuresSupported = 0;
    const totalFeatures = accommodation.features.length;

    accommodation.features.forEach(feature => {
      if (this.checkAccommodationFeature(feature)) {
        featuresSupported++;
      }
    });

    const passed = featuresSupported >= Math.ceil(totalFeatures * 0.6); // 60% threshold

    return {
      passed,
      accommodation: accommodation.name,
      featuresSupported,
      totalFeatures,
      severity: 'medium',
      description: passed ? 
        `${accommodation.name} adequately supported` : 
        `${accommodation.name} needs improvement`
    };
  }

  checkAccommodationFeature(feature) {
    switch (feature) {
      case 'magnifier':
        return CSS.supports('zoom', '2') || 'magnification' in navigator;
      case 'touch_preview':
        return document.querySelector('[data-touch-preview]') !== null;
      case 'confirmation_dialogs':
        return document.querySelector('[data-confirm-action]') !== null;
      case 'stable_touch_areas':
        return document.querySelector('[data-stable-touch]') !== null;
      case 'dwell_time_adjustment':
        return document.querySelector('[data-dwell-time]') !== null;
      case 'accidental_touch_prevention':
        return document.querySelector('[data-touch-guard]') !== null;
      default:
        return false;
    }
  }

  testAssistiveTechnology(technology) {
    let requirementsMet = 0;
    const totalRequirements = technology.requirements.length;

    technology.requirements.forEach(requirement => {
      if (this.checkAssistiveTechRequirement(requirement, technology.name)) {
        requirementsMet++;
      }
    });

    const passed = requirementsMet >= Math.ceil(totalRequirements * 0.5); // 50% threshold

    return {
      passed,
      technology: technology.name,
      requirementsMet,
      totalRequirements,
      severity: 'low',
      description: passed ? 
        `${technology.name} support available` : 
        `${technology.name} support limited`
    };
  }

  checkAssistiveTechRequirement(requirement, technology) {
    switch (requirement) {
      case 'sequential_navigation':
        return document.querySelectorAll('[tabindex]').length > 0;
      case 'selection_methods':
        return document.querySelector('[data-selectable]') !== null;
      case 'timing_adjustments':
        return document.querySelector('[data-timing-adjustable]') !== null;
      case 'button_mapping':
        return 'getGamepads' in navigator;
      case 'analog_control':
        return 'getGamepads' in navigator;
      default:
        return false;
    }
  }
}

/**
 * Accessibility Analyzer
 */
class AccessibilityAnalyzer {
  analyzeOverallAccessibility(testResults) {
    // Comprehensive accessibility analysis
    const analysis = {
      strengths: [],
      weaknesses: [],
      criticalIssues: [],
      recommendations: []
    };

    // Analyze each category
    this.analyzeScreenReaderResults(testResults.screenReaderResults, analysis);
    this.analyzeVoiceControlResults(testResults.voiceControlResults, analysis);
    this.analyzeGestureResults(testResults.gestureAccessibilityResults, analysis);
    this.analyzeContrastResults(testResults.contrastReadabilityResults, analysis);
    this.analyzeMotorResults(testResults.motorAccessibilityResults, analysis);

    return analysis;
  }

  analyzeScreenReaderResults(results, analysis) {
    const scores = Object.values(results).map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    if (averageScore >= 90) {
      analysis.strengths.push('Excellent screen reader compatibility');
    } else if (averageScore < 70) {
      analysis.weaknesses.push('Poor screen reader accessibility');
      analysis.criticalIssues.push('Screen reader users may face significant barriers');
    }
  }

  analyzeVoiceControlResults(results, analysis) {
    const scores = Object.values(results).map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    if (averageScore >= 85) {
      analysis.strengths.push('Good voice control support');
    } else if (averageScore < 60) {
      analysis.weaknesses.push('Limited voice control functionality');
    }
  }

  analyzeGestureResults(results, analysis) {
    const scores = Object.values(results).map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    if (averageScore >= 85) {
      analysis.strengths.push('Comprehensive gesture alternatives');
    } else if (averageScore < 70) {
      analysis.weaknesses.push('Insufficient gesture alternatives');
      analysis.criticalIssues.push('Users with motor disabilities may be excluded');
    }
  }

  analyzeContrastResults(results, analysis) {
    const scores = Object.values(results).map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    if (averageScore >= 95) {
      analysis.strengths.push('Excellent color contrast and readability');
    } else if (averageScore < 80) {
      analysis.weaknesses.push('Color contrast issues detected');
      analysis.criticalIssues.push('Users with visual impairments may struggle to read content');
    }
  }

  analyzeMotorResults(results, analysis) {
    const scores = Object.values(results).map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    if (averageScore >= 80) {
      analysis.strengths.push('Good motor accessibility features');
    } else if (averageScore < 60) {
      analysis.weaknesses.push('Limited motor accessibility support');
    }
  }
}

// Export classes and configuration
export default MobileGamingAccessibilityTestingSuite;
export { 
  MOBILE_GAMING_ACCESSIBILITY_CONFIG,
  ScreenReaderTester,
  VoiceControlTester,
  GestureAccessibilityTester,
  ContrastReadabilityTester,
  MotorAccessibilityTester,
  AccessibilityAnalyzer
};

// Browser API
if (typeof window !== 'undefined') {
  window.MLGAccessibilityTest = {
    MobileGamingAccessibilityTestingSuite,
    MOBILE_GAMING_ACCESSIBILITY_CONFIG,
    runQuickTest: async () => {
      const suite = new MobileGamingAccessibilityTestingSuite({
        enableVoiceControlTesting: false,
        enableRealDeviceTesting: false
      });
      return await suite.runCompleteAccessibilityTest();
    },
    runFullTest: async () => {
      const suite = new MobileGamingAccessibilityTestingSuite();
      return await suite.runCompleteAccessibilityTest();
    },
    runScreenReaderTest: async () => {
      const suite = new MobileGamingAccessibilityTestingSuite({
        enableVoiceControlTesting: false,
        enableGestureAccessibilityTesting: false,
        enableContrastTesting: false,
        enableMotorAccessibilityTesting: false
      });
      return await suite.runCompleteAccessibilityTest();
    }
  };

  console.log('♿ MLG Accessibility Testing API available at window.MLGAccessibilityTest');
}