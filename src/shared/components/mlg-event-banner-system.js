/**
 * MLG Event Banner System
 * 
 * Professional MLG-branded event banners and tournament displays that create
 * excitement and clear communication for all platform events. Features dynamic
 * content, countdown timers, live status indicators, and comprehensive tournament
 * bracket displays with Xbox 360 retro gaming aesthetic.
 * 
 * Features:
 * - Dynamic MLG-branded event banners
 * - Tournament bracket displays with live updates
 * - Event countdown timers with gaming effects
 * - Live tournament status indicators
 * - Event registration and announcement banners
 * - Achievement/reward announcements
 * - Community event highlights
 * - Responsive design for all devices
 * - Real-time event status updates
 * - Professional gaming tournament branding
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.3 - Create MLG branded event banners and tournament displays
 */

import { EventEmitter } from 'events';
import { MLGBrandingSystem } from './mlg-branding-system.js';

/**
 * MLG Event Banner Configuration
 */
const MLG_EVENT_CONFIG = {
  // Event Types
  EVENT_TYPES: {
    tournament: 'tournament',
    match: 'match',
    announcement: 'announcement',
    registration: 'registration',
    leaderboard: 'leaderboard',
    achievement: 'achievement',
    community: 'community',
    special: 'special'
  },
  
  // Event Status
  EVENT_STATUS: {
    upcoming: 'upcoming',
    live: 'live',
    completed: 'completed',
    cancelled: 'cancelled',
    registration_open: 'registration_open',
    registration_closed: 'registration_closed'
  },
  
  // Tournament Phases
  TOURNAMENT_PHASES: {
    registration: 'registration',
    group_stage: 'group_stage',
    quarterfinals: 'quarterfinals',
    semifinals: 'semifinals',
    finals: 'finals',
    completed: 'completed'
  },
  
  // Visual Configuration
  BANNER_STYLES: {
    primary: {
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      border: '2px solid #00ff88',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 255, 136, 0.2)',
      overflow: 'hidden',
      position: 'relative'
    },
    tournament: {
      background: 'linear-gradient(135deg, #1a1a2e 0%, #8b5cf6 10%, #1a1a2e 100%)',
      border: '2px solid #8b5cf6',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.3)'
    },
    live: {
      background: 'linear-gradient(135deg, #ef4444 0%, #ff8800 50%, #ef4444 100%)',
      border: '2px solid #ff4444',
      animation: 'mlg-live-pulse 2s infinite alternate',
      boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
    },
    announcement: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
      border: '2px solid #fbbf24',
      color: '#0a0a0f'
    }
  },
  
  // Animation Settings
  ANIMATIONS: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    pulse: {
      duration: '2s',
      intensity: 'infinite alternate'
    },
    countdown: {
      duration: '1s',
      easing: 'ease-in-out'
    }
  },
  
  // Tournament Bracket Configuration
  BRACKET_CONFIG: {
    maxRounds: 7,
    matchHeight: 60,
    matchSpacing: 20,
    roundSpacing: 200,
    colors: {
      upcoming: '#6b7280',
      live: '#ef4444',
      completed: '#00ff88',
      bye: '#374151'
    }
  }
};

/**
 * MLG Event Banner System Class
 */
class MLGEventBannerSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...MLG_EVENT_CONFIG, ...options };
    this.brandingSystem = new MLGBrandingSystem();
    this.cache = new Map();
    this.timers = new Map();
    this.liveEvents = new Set();
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.createEventBanner = this.createEventBanner.bind(this);
    this.createTournamentDisplay = this.createTournamentDisplay.bind(this);
    this.createCountdownTimer = this.createCountdownTimer.bind(this);
    this.createLiveIndicator = this.createLiveIndicator.bind(this);
    this.updateEventStatus = this.updateEventStatus.bind(this);
    
    this.logger.info('🏆 MLG Event Banner System initialized');
  }

  /**
   * Initialize the event banner system
   */
  async initialize() {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Event Banner System...');
      
      // Initialize branding system
      await this.brandingSystem.initialize();
      
      // Inject global CSS styles
      await this.injectGlobalStyles();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start live event monitoring
      this.startLiveEventMonitoring();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Event Banner System initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize MLG Event Banner System:', error);
      throw error;
    }
  }

  /**
   * Create an event banner
   * @param {Object} eventData - Event information
   * @param {Object} options - Banner options
   * @returns {HTMLElement} Event banner element
   */
  createEventBanner(eventData = {}, options = {}) {
    try {
      const {
        type = 'announcement',
        status = 'upcoming',
        title = 'MLG Event',
        subtitle = '',
        description = '',
        startTime = null,
        endTime = null,
        participants = 0,
        maxParticipants = 0,
        prize = '',
        image = '',
        actions = [],
        className = ''
      } = eventData;

      const {
        size = 'medium',
        showCountdown = true,
        showParticipants = true,
        showActions = true,
        animated = true,
        expandable = false
      } = options;

      const banner = document.createElement('div');
      banner.className = `mlg-event-banner mlg-event-${type} mlg-status-${status} ${className}`;
      banner.setAttribute('data-event-id', eventData.id || `event-${Date.now()}`);
      
      // Apply banner styling
      this.applyBannerStyling(banner, type, status, { size, animated });

      // Create banner content
      const content = this.createBannerContent(eventData, options);
      banner.appendChild(content);

      // Add live indicator if event is live
      if (status === 'live') {
        const liveIndicator = this.createLiveIndicator();
        banner.appendChild(liveIndicator);
        this.liveEvents.add(banner);
      }

      // Add countdown timer if event has start time
      if (startTime && showCountdown && status === 'upcoming') {
        const countdown = this.createCountdownTimer(startTime, banner);
        content.appendChild(countdown);
      }

      // Cache banner for updates
      this.cache.set(banner, { eventData, options });
      
      this.logger.debug(`🎯 Created ${type} event banner for: ${title}`);
      return banner;
    } catch (error) {
      this.logger.error('❌ Error creating event banner:', error);
      return this.createFallbackBanner(eventData);
    }
  }

  /**
   * Create banner content
   * @param {Object} eventData - Event data
   * @param {Object} options - Content options
   * @returns {HTMLElement} Banner content element
   */
  createBannerContent(eventData, options) {
    const {
      type,
      title,
      subtitle,
      description,
      participants = 0,
      maxParticipants = 0,
      prize = '',
      image = '',
      actions = []
    } = eventData;

    const {
      showParticipants = true,
      showActions = true,
      expandable = false
    } = options;

    const content = document.createElement('div');
    content.className = 'mlg-banner-content';

    // Create header section
    const header = this.createBannerHeader(eventData);
    content.appendChild(header);

    // Create main content section
    const main = document.createElement('div');
    main.className = 'mlg-banner-main';

    // Add image if provided
    if (image) {
      const imageElement = document.createElement('div');
      imageElement.className = 'mlg-banner-image';
      imageElement.style.backgroundImage = `url(${image})`;
      main.appendChild(imageElement);
    }

    // Add content text
    const textContent = document.createElement('div');
    textContent.className = 'mlg-banner-text';
    
    if (description) {
      const descElement = document.createElement('p');
      descElement.className = 'mlg-banner-description';
      descElement.textContent = description;
      textContent.appendChild(descElement);
    }

    main.appendChild(textContent);
    content.appendChild(main);

    // Create info section
    const info = this.createBannerInfo(eventData, { showParticipants });
    content.appendChild(info);

    // Create actions section
    if (showActions && actions.length > 0) {
      const actionsSection = this.createBannerActions(actions);
      content.appendChild(actionsSection);
    }

    return content;
  }

  /**
   * Create banner header
   * @param {Object} eventData - Event data
   * @returns {HTMLElement} Header element
   */
  createBannerHeader(eventData) {
    const { type, title, subtitle, status } = eventData;

    const header = document.createElement('div');
    header.className = 'mlg-banner-header';

    // Add MLG branding
    const branding = this.brandingSystem.createBrandBadge({
      size: 'medium',
      animated: status === 'live',
      variant: type === 'tournament' ? 'primary' : 'secondary'
    });
    header.appendChild(branding);

    // Add title and subtitle
    const titleSection = document.createElement('div');
    titleSection.className = 'mlg-banner-titles';

    const titleElement = document.createElement('h2');
    titleElement.className = 'mlg-banner-title';
    titleElement.textContent = title;
    titleSection.appendChild(titleElement);

    if (subtitle) {
      const subtitleElement = document.createElement('p');
      subtitleElement.className = 'mlg-banner-subtitle';
      subtitleElement.textContent = subtitle;
      titleSection.appendChild(subtitleElement);
    }

    header.appendChild(titleSection);

    // Add event type indicator
    const typeIndicator = document.createElement('div');
    typeIndicator.className = `mlg-event-type mlg-type-${type}`;
    typeIndicator.textContent = this.getEventTypeLabel(type);
    header.appendChild(typeIndicator);

    return header;
  }

  /**
   * Create banner info section
   * @param {Object} eventData - Event data
   * @param {Object} options - Info options
   * @returns {HTMLElement} Info element
   */
  createBannerInfo(eventData, options) {
    const {
      participants = 0,
      maxParticipants = 0,
      prize = '',
      startTime = null,
      endTime = null,
      status
    } = eventData;

    const { showParticipants = true } = options;

    const info = document.createElement('div');
    info.className = 'mlg-banner-info';

    // Participants info
    if (showParticipants && maxParticipants > 0) {
      const participantsInfo = document.createElement('div');
      participantsInfo.className = 'mlg-info-item mlg-participants';
      
      const icon = document.createElement('span');
      icon.className = 'mlg-info-icon';
      icon.textContent = '👥';
      
      const text = document.createElement('span');
      text.className = 'mlg-info-text';
      text.textContent = `${participants}/${maxParticipants} Players`;
      
      participantsInfo.appendChild(icon);
      participantsInfo.appendChild(text);
      info.appendChild(participantsInfo);
    }

    // Prize info
    if (prize) {
      const prizeInfo = document.createElement('div');
      prizeInfo.className = 'mlg-info-item mlg-prize';
      
      const icon = document.createElement('span');
      icon.className = 'mlg-info-icon';
      icon.textContent = '🏆';
      
      const text = document.createElement('span');
      text.className = 'mlg-info-text';
      text.textContent = prize;
      
      prizeInfo.appendChild(icon);
      prizeInfo.appendChild(text);
      info.appendChild(prizeInfo);
    }

    // Time info
    if (startTime) {
      const timeInfo = document.createElement('div');
      timeInfo.className = 'mlg-info-item mlg-time';
      
      const icon = document.createElement('span');
      icon.className = 'mlg-info-icon';
      icon.textContent = status === 'live' ? '🔴' : '📅';
      
      const text = document.createElement('span');
      text.className = 'mlg-info-text';
      text.textContent = this.formatEventTime(startTime, status);
      
      timeInfo.appendChild(icon);
      timeInfo.appendChild(text);
      info.appendChild(timeInfo);
    }

    return info;
  }

  /**
   * Create banner actions section
   * @param {Array} actions - Action buttons
   * @returns {HTMLElement} Actions element
   */
  createBannerActions(actions) {
    const actionsSection = document.createElement('div');
    actionsSection.className = 'mlg-banner-actions';

    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = `mlg-action-button mlg-action-${action.variant || 'primary'}`;
      button.textContent = action.label;
      
      if (action.onClick) {
        button.addEventListener('click', action.onClick);
      }
      
      if (action.disabled) {
        button.disabled = true;
      }
      
      actionsSection.appendChild(button);
    });

    return actionsSection;
  }

  /**
   * Create tournament display
   * @param {Object} tournamentData - Tournament information
   * @param {Object} options - Display options
   * @returns {HTMLElement} Tournament display element
   */
  createTournamentDisplay(tournamentData = {}, options = {}) {
    try {
      const {
        name = 'MLG Tournament',
        phase = 'registration',
        brackets = [],
        matches = [],
        participants = [],
        startTime = null,
        endTime = null,
        prize = '',
        status = 'upcoming'
      } = tournamentData;

      const {
        showBracket = true,
        showMatches = true,
        showLeaderboard = true,
        compact = false
      } = options;

      const tournament = document.createElement('div');
      tournament.className = `mlg-tournament-display mlg-phase-${phase} ${compact ? 'mlg-compact' : ''}`;
      tournament.setAttribute('data-tournament-id', tournamentData.id || `tournament-${Date.now()}`);
      
      // Apply tournament styling
      this.applyTournamentStyling(tournament, phase, status);

      // Create tournament header
      const header = this.createTournamentHeader(tournamentData);
      tournament.appendChild(header);

      // Create tournament content based on phase
      const content = this.createTournamentContent(tournamentData, options);
      tournament.appendChild(content);

      // Cache tournament for updates
      this.cache.set(tournament, { tournamentData, options });
      
      this.logger.debug(`🏆 Created tournament display for: ${name}`);
      return tournament;
    } catch (error) {
      this.logger.error('❌ Error creating tournament display:', error);
      return this.createFallbackTournament(tournamentData);
    }
  }

  /**
   * Create tournament header
   * @param {Object} tournamentData - Tournament data
   * @returns {HTMLElement} Tournament header element
   */
  createTournamentHeader(tournamentData) {
    const {
      name,
      phase,
      participants = [],
      prize,
      status,
      startTime
    } = tournamentData;

    const header = document.createElement('div');
    header.className = 'mlg-tournament-header';

    // Create title section
    const titleSection = document.createElement('div');
    titleSection.className = 'mlg-tournament-title-section';

    // Add MLG branding
    const branding = this.brandingSystem.createBrandingElement('tournament', {
      showIcon: true,
      showText: true,
      animated: status === 'live'
    });
    titleSection.appendChild(branding);

    const titleInfo = document.createElement('div');
    titleInfo.className = 'mlg-tournament-title-info';

    const title = document.createElement('h1');
    title.className = 'mlg-tournament-title';
    title.textContent = name;
    titleInfo.appendChild(title);

    const phaseLabel = document.createElement('p');
    phaseLabel.className = 'mlg-tournament-phase';
    phaseLabel.textContent = this.getPhaseLabel(phase);
    titleInfo.appendChild(phaseLabel);

    titleSection.appendChild(titleInfo);
    header.appendChild(titleSection);

    // Create status section
    const statusSection = document.createElement('div');
    statusSection.className = 'mlg-tournament-status';

    // Add live indicator if tournament is live
    if (status === 'live') {
      const liveIndicator = this.createLiveIndicator();
      statusSection.appendChild(liveIndicator);
    }

    // Add participant count
    const participantCount = document.createElement('div');
    participantCount.className = 'mlg-participant-count';
    participantCount.innerHTML = `
      <span class="mlg-count-icon">👥</span>
      <span class="mlg-count-text">${participants.length} Players</span>
    `;
    statusSection.appendChild(participantCount);

    // Add prize pool
    if (prize) {
      const prizePool = document.createElement('div');
      prizePool.className = 'mlg-prize-pool';
      prizePool.innerHTML = `
        <span class="mlg-prize-icon">🏆</span>
        <span class="mlg-prize-text">${prize}</span>
      `;
      statusSection.appendChild(prizePool);
    }

    header.appendChild(statusSection);

    return header;
  }

  /**
   * Create tournament content
   * @param {Object} tournamentData - Tournament data
   * @param {Object} options - Content options
   * @returns {HTMLElement} Tournament content element
   */
  createTournamentContent(tournamentData, options) {
    const {
      phase,
      brackets = [],
      matches = [],
      participants = []
    } = tournamentData;

    const {
      showBracket = true,
      showMatches = true,
      showLeaderboard = true
    } = options;

    const content = document.createElement('div');
    content.className = 'mlg-tournament-content';

    // Registration phase content
    if (phase === 'registration') {
      const registrationContent = this.createRegistrationContent(tournamentData);
      content.appendChild(registrationContent);
    }
    // Active tournament phases
    else if (['group_stage', 'quarterfinals', 'semifinals', 'finals'].includes(phase)) {
      if (showBracket && brackets.length > 0) {
        const bracketDisplay = this.createBracketDisplay(brackets);
        content.appendChild(bracketDisplay);
      }

      if (showMatches && matches.length > 0) {
        const matchesDisplay = this.createMatchesDisplay(matches);
        content.appendChild(matchesDisplay);
      }
    }
    // Completed tournament
    else if (phase === 'completed') {
      if (showLeaderboard) {
        const leaderboard = this.createTournamentLeaderboard(participants);
        content.appendChild(leaderboard);
      }
    }

    return content;
  }

  /**
   * Create countdown timer
   * @param {Date|string} targetTime - Target time for countdown
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Countdown timer element
   */
  createCountdownTimer(targetTime, container = null) {
    const timer = document.createElement('div');
    timer.className = 'mlg-countdown-timer';
    
    const targetDate = new Date(targetTime);
    const timerId = `timer-${Date.now()}`;
    timer.setAttribute('data-timer-id', timerId);

    // Create timer display
    timer.innerHTML = `
      <div class="mlg-countdown-content">
        <div class="mlg-countdown-label">Event Starts In:</div>
        <div class="mlg-countdown-display">
          <div class="mlg-time-unit">
            <span class="mlg-time-value" data-unit="days">00</span>
            <span class="mlg-time-label">Days</span>
          </div>
          <div class="mlg-time-separator">:</div>
          <div class="mlg-time-unit">
            <span class="mlg-time-value" data-unit="hours">00</span>
            <span class="mlg-time-label">Hours</span>
          </div>
          <div class="mlg-time-separator">:</div>
          <div class="mlg-time-unit">
            <span class="mlg-time-value" data-unit="minutes">00</span>
            <span class="mlg-time-label">Minutes</span>
          </div>
          <div class="mlg-time-separator">:</div>
          <div class="mlg-time-unit">
            <span class="mlg-time-value" data-unit="seconds">00</span>
            <span class="mlg-time-label">Seconds</span>
          </div>
        </div>
      </div>
    `;

    // Start countdown
    const interval = setInterval(() => {
      this.updateCountdown(timer, targetDate, interval, timerId);
    }, 1000);

    this.timers.set(timerId, { interval, element: timer, container });
    
    // Initial update
    this.updateCountdown(timer, targetDate, interval, timerId);

    return timer;
  }

  /**
   * Update countdown display
   * @param {HTMLElement} timer - Timer element
   * @param {Date} targetDate - Target date
   * @param {number} interval - Interval ID
   * @param {string} timerId - Timer ID
   */
  updateCountdown(timer, targetDate, interval, timerId) {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance < 0) {
      clearInterval(interval);
      this.timers.delete(timerId);
      timer.innerHTML = `
        <div class="mlg-countdown-expired">
          <span class="mlg-expired-icon">🔴</span>
          <span class="mlg-expired-text">Event Started!</span>
        </div>
      `;
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update display
    const daysElement = timer.querySelector('[data-unit="days"]');
    const hoursElement = timer.querySelector('[data-unit="hours"]');
    const minutesElement = timer.querySelector('[data-unit="minutes"]');
    const secondsElement = timer.querySelector('[data-unit="seconds"]');

    if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
    if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
    if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
    if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');

    // Add urgency styling
    if (distance < 3600000) { // Less than 1 hour
      timer.classList.add('mlg-countdown-urgent');
    } else if (distance < 86400000) { // Less than 1 day
      timer.classList.add('mlg-countdown-soon');
    }
  }

  /**
   * Create live event indicator
   * @param {Object} options - Indicator options
   * @returns {HTMLElement} Live indicator element
   */
  createLiveIndicator(options = {}) {
    const {
      size = 'medium',
      showText = true,
      position = 'top-right'
    } = options;

    const indicator = document.createElement('div');
    indicator.className = `mlg-live-indicator mlg-live-${size} mlg-position-${position}`;

    indicator.innerHTML = `
      <div class="mlg-live-content">
        <div class="mlg-live-pulse"></div>
        <span class="mlg-live-dot"></span>
        ${showText ? '<span class="mlg-live-text">LIVE</span>' : ''}
      </div>
    `;

    return indicator;
  }

  /**
   * Create bracket display
   * @param {Array} brackets - Bracket data
   * @returns {HTMLElement} Bracket display element
   */
  createBracketDisplay(brackets) {
    const bracketContainer = document.createElement('div');
    bracketContainer.className = 'mlg-bracket-display';

    // Create bracket rounds
    brackets.forEach((round, roundIndex) => {
      const roundElement = document.createElement('div');
      roundElement.className = `mlg-bracket-round mlg-round-${roundIndex}`;
      
      const roundHeader = document.createElement('div');
      roundHeader.className = 'mlg-round-header';
      roundHeader.textContent = round.name || `Round ${roundIndex + 1}`;
      roundElement.appendChild(roundHeader);

      // Create matches for this round
      round.matches.forEach(match => {
        const matchElement = this.createMatchElement(match);
        roundElement.appendChild(matchElement);
      });

      bracketContainer.appendChild(roundElement);
    });

    return bracketContainer;
  }

  /**
   * Create match element
   * @param {Object} match - Match data
   * @returns {HTMLElement} Match element
   */
  createMatchElement(match) {
    const {
      id,
      player1,
      player2,
      score1 = 0,
      score2 = 0,
      status = 'upcoming',
      winner = null
    } = match;

    const matchElement = document.createElement('div');
    matchElement.className = `mlg-match-element mlg-match-${status}`;
    matchElement.setAttribute('data-match-id', id);

    matchElement.innerHTML = `
      <div class="mlg-match-content">
        <div class="mlg-player ${winner === player1?.id ? 'mlg-winner' : ''}">
          <span class="mlg-player-name">${player1?.name || 'TBD'}</span>
          <span class="mlg-player-score">${score1}</span>
        </div>
        <div class="mlg-match-vs">VS</div>
        <div class="mlg-player ${winner === player2?.id ? 'mlg-winner' : ''}">
          <span class="mlg-player-name">${player2?.name || 'TBD'}</span>
          <span class="mlg-player-score">${score2}</span>
        </div>
        ${status === 'live' ? '<div class="mlg-match-live-indicator"></div>' : ''}
      </div>
    `;

    return matchElement;
  }

  /**
   * Apply banner styling
   * @param {HTMLElement} banner - Banner element
   * @param {string} type - Event type
   * @param {string} status - Event status
   * @param {Object} options - Styling options
   */
  applyBannerStyling(banner, type, status, options = {}) {
    const { size = 'medium', animated = true } = options;
    
    // Base styling
    const baseStyles = this.config.BANNER_STYLES.primary;
    Object.assign(banner.style, baseStyles);
    
    // Apply type-specific styling
    if (this.config.BANNER_STYLES[type]) {
      Object.assign(banner.style, this.config.BANNER_STYLES[type]);
    }
    
    // Apply status-specific styling
    if (this.config.BANNER_STYLES[status]) {
      Object.assign(banner.style, this.config.BANNER_STYLES[status]);
    }
    
    // Add size-specific adjustments
    const sizeAdjustments = {
      small: { padding: '16px', fontSize: '14px' },
      medium: { padding: '24px', fontSize: '16px' },
      large: { padding: '32px', fontSize: '18px' }
    };
    
    if (sizeAdjustments[size]) {
      Object.assign(banner.style, sizeAdjustments[size]);
    }
    
    // Add animation if enabled
    if (animated && status === 'live') {
      banner.style.animation = 'mlg-live-pulse 2s infinite alternate';
    }
  }

  /**
   * Apply tournament styling
   * @param {HTMLElement} tournament - Tournament element
   * @param {string} phase - Tournament phase
   * @param {string} status - Tournament status
   */
  applyTournamentStyling(tournament, phase, status) {
    const baseStyles = this.config.BANNER_STYLES.tournament;
    Object.assign(tournament.style, baseStyles);
    
    if (status === 'live') {
      tournament.style.animation = 'mlg-live-pulse 2s infinite alternate';
    }
  }

  /**
   * Get event type label
   * @param {string} type - Event type
   * @returns {string} Type label
   */
  getEventTypeLabel(type) {
    const labels = {
      tournament: 'Tournament',
      match: 'Match',
      announcement: 'Announcement',
      registration: 'Registration',
      leaderboard: 'Leaderboard',
      achievement: 'Achievement',
      community: 'Community',
      special: 'Special Event'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Get phase label
   * @param {string} phase - Tournament phase
   * @returns {string} Phase label
   */
  getPhaseLabel(phase) {
    const labels = {
      registration: 'Registration Open',
      group_stage: 'Group Stage',
      quarterfinals: 'Quarter Finals',
      semifinals: 'Semi Finals',
      finals: 'Finals',
      completed: 'Tournament Complete'
    };
    return labels[phase] || phase.charAt(0).toUpperCase() + phase.slice(1);
  }

  /**
   * Format event time
   * @param {Date|string} time - Event time
   * @param {string} status - Event status
   * @returns {string} Formatted time
   */
  formatEventTime(time, status) {
    const date = new Date(time);
    const now = new Date();
    
    if (status === 'live') {
      return 'Live Now';
    }
    
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Update event status
   * @param {string|HTMLElement} target - Event ID or element
   * @param {string} newStatus - New status
   * @param {Object} updateData - Additional update data
   */
  updateEventStatus(target, newStatus, updateData = {}) {
    try {
      const element = typeof target === 'string' ? 
        document.querySelector(`[data-event-id="${target}"]`) : target;
      
      if (!element) {
        this.logger.warn(`❓ Event element not found: ${target}`);
        return;
      }

      // Update status class
      element.className = element.className.replace(/mlg-status-\w+/, `mlg-status-${newStatus}`);
      
      // Handle live status changes
      if (newStatus === 'live') {
        this.liveEvents.add(element);
        
        // Add live indicator if not present
        if (!element.querySelector('.mlg-live-indicator')) {
          const liveIndicator = this.createLiveIndicator();
          element.appendChild(liveIndicator);
        }
        
        // Start live animation
        element.style.animation = 'mlg-live-pulse 2s infinite alternate';
      } else {
        this.liveEvents.delete(element);
        
        // Remove live indicator
        const liveIndicator = element.querySelector('.mlg-live-indicator');
        if (liveIndicator) {
          liveIndicator.remove();
        }
        
        // Stop live animation
        element.style.animation = '';
      }

      // Update cached data
      const cachedData = this.cache.get(element);
      if (cachedData) {
        cachedData.eventData.status = newStatus;
        Object.assign(cachedData.eventData, updateData);
      }

      this.emit('status_updated', { element, newStatus, updateData });
      this.logger.debug(`🔄 Updated event status to: ${newStatus}`);
    } catch (error) {
      this.logger.error('❌ Error updating event status:', error);
    }
  }

  /**
   * Start live event monitoring
   */
  startLiveEventMonitoring() {
    setInterval(() => {
      this.liveEvents.forEach(element => {
        // Add live pulse effect
        const existingPulse = element.querySelector('.mlg-live-pulse-effect');
        if (!existingPulse) {
          const pulse = document.createElement('div');
          pulse.className = 'mlg-live-pulse-effect';
          element.appendChild(pulse);
          
          setTimeout(() => {
            pulse.remove();
          }, 2000);
        }
      });
    }, 3000);
  }

  /**
   * Create fallback banner
   * @param {Object} eventData - Event data
   * @returns {HTMLElement} Fallback banner
   */
  createFallbackBanner(eventData) {
    const fallback = document.createElement('div');
    fallback.className = 'mlg-event-banner mlg-fallback';
    fallback.innerHTML = `
      <div class="mlg-fallback-content">
        <span class="mlg-fallback-icon">🏆</span>
        <span class="mlg-fallback-text">${eventData.title || 'MLG Event'}</span>
      </div>
    `;
    fallback.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #00ff88 50%, #1a1a2e 100%);
      border: 2px solid #00ff88;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #ffffff;
    `;
    return fallback;
  }

  /**
   * Create fallback tournament
   * @param {Object} tournamentData - Tournament data
   * @returns {HTMLElement} Fallback tournament
   */
  createFallbackTournament(tournamentData) {
    const fallback = document.createElement('div');
    fallback.className = 'mlg-tournament-display mlg-fallback';
    fallback.innerHTML = `
      <div class="mlg-fallback-content">
        <span class="mlg-fallback-icon">🏆</span>
        <span class="mlg-fallback-text">${tournamentData.name || 'MLG Tournament'}</span>
      </div>
    `;
    fallback.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #8b5cf6 50%, #1a1a2e 100%);
      border: 2px solid #8b5cf6;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      color: #ffffff;
    `;
    return fallback;
  }

  /**
   * Inject global CSS styles
   */
  async injectGlobalStyles() {
    const styleId = 'mlg-event-banner-styles';
    
    // Remove existing styles
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* MLG Event Banner System Styles */
      
      /* Base Event Banner Styles */
      .mlg-event-banner {
        position: relative;
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
        border: 2px solid #00ff88;
        border-radius: 12px;
        padding: 24px;
        margin: 16px 0;
        overflow: hidden;
        transition: all 300ms cubic-bezier(0.4, 0, 0.6, 1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .mlg-event-banner:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 255, 136, 0.3);
      }

      /* Event Banner Content */
      .mlg-banner-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .mlg-banner-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }

      .mlg-banner-titles {
        flex: 1;
      }

      .mlg-banner-title {
        font-size: 24px;
        font-weight: bold;
        color: #ffffff;
        margin: 0 0 8px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }

      .mlg-banner-subtitle {
        font-size: 16px;
        color: #00ff88;
        margin: 0;
        opacity: 0.9;
      }

      .mlg-event-type {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid #00ff88;
        border-radius: 6px;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: bold;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Banner Main Content */
      .mlg-banner-main {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }

      .mlg-banner-image {
        width: 120px;
        height: 80px;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        border: 1px solid rgba(0, 255, 136, 0.3);
        flex-shrink: 0;
      }

      .mlg-banner-text {
        flex: 1;
      }

      .mlg-banner-description {
        color: #e5e7eb;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
      }

      /* Banner Info Section */
      .mlg-banner-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
        padding: 16px 0;
        border-top: 1px solid rgba(0, 255, 136, 0.2);
      }

      .mlg-info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 255, 136, 0.1);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
      }

      .mlg-info-icon {
        font-size: 16px;
      }

      .mlg-info-text {
        color: #ffffff;
        font-weight: 500;
      }

      /* Banner Actions */
      .mlg-banner-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      .mlg-action-button {
        background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
        color: #0a0a0f;
        border: none;
        border-radius: 6px;
        padding: 10px 20px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: all 300ms cubic-bezier(0.4, 0, 0.6, 1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .mlg-action-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
      }

      .mlg-action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      /* Tournament Display Styles */
      .mlg-tournament-display {
        background: linear-gradient(135deg, #1a1a2e 0%, #8b5cf6 10%, #1a1a2e 100%);
        border: 2px solid #8b5cf6;
        border-radius: 16px;
        padding: 32px;
        margin: 24px 0;
        overflow: hidden;
        position: relative;
      }

      .mlg-tournament-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 2px solid rgba(139, 92, 246, 0.3);
      }

      .mlg-tournament-title-section {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .mlg-tournament-title-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .mlg-tournament-title {
        font-size: 32px;
        font-weight: bold;
        color: #ffffff;
        margin: 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }

      .mlg-tournament-phase {
        font-size: 16px;
        color: #8b5cf6;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-tournament-status {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .mlg-participant-count,
      .mlg-prize-pool {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(139, 92, 246, 0.2);
        border: 1px solid rgba(139, 92, 246, 0.5);
        border-radius: 8px;
        padding: 12px 16px;
        color: #ffffff;
        font-weight: bold;
      }

      /* Countdown Timer Styles */
      .mlg-countdown-timer {
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #00ff88;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 16px 0;
      }

      .mlg-countdown-label {
        color: #00ff88;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
      }

      .mlg-countdown-display {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .mlg-time-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 255, 136, 0.1);
        border-radius: 8px;
        padding: 12px 16px;
        min-width: 60px;
      }

      .mlg-time-value {
        font-size: 24px;
        font-weight: bold;
        color: #ffffff;
        font-family: 'Courier New', monospace;
      }

      .mlg-time-label {
        font-size: 12px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .mlg-time-separator {
        font-size: 24px;
        font-weight: bold;
        color: #00ff88;
        margin: 0 4px;
      }

      .mlg-countdown-urgent {
        border-color: #ef4444;
        animation: mlg-urgent-pulse 1s infinite alternate;
      }

      .mlg-countdown-urgent .mlg-countdown-label {
        color: #ef4444;
      }

      .mlg-countdown-soon {
        border-color: #fbbf24;
      }

      .mlg-countdown-soon .mlg-countdown-label {
        color: #fbbf24;
      }

      .mlg-countdown-expired {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 18px;
        font-weight: bold;
        color: #ef4444;
        animation: mlg-urgent-pulse 1s infinite alternate;
      }

      /* Live Indicator Styles */
      .mlg-live-indicator {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 10;
      }

      .mlg-live-content {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.9);
        border: 1px solid #ef4444;
        border-radius: 20px;
        padding: 6px 12px;
        backdrop-filter: blur(10px);
      }

      .mlg-live-dot {
        width: 8px;
        height: 8px;
        background: #ffffff;
        border-radius: 50%;
        animation: mlg-live-blink 1s infinite;
      }

      .mlg-live-text {
        color: #ffffff;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-live-pulse {
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: #ef4444;
        border-radius: 22px;
        opacity: 0.3;
        animation: mlg-pulse-ring 2s infinite;
      }

      /* Bracket Display Styles */
      .mlg-bracket-display {
        display: flex;
        gap: 32px;
        overflow-x: auto;
        padding: 24px 0;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        border: 1px solid rgba(139, 92, 246, 0.3);
      }

      .mlg-bracket-round {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 200px;
      }

      .mlg-round-header {
        background: rgba(139, 92, 246, 0.2);
        border: 1px solid #8b5cf6;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
        font-weight: bold;
        color: #8b5cf6;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Match Element Styles */
      .mlg-match-element {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(107, 114, 128, 0.3);
        border-radius: 8px;
        padding: 12px;
        position: relative;
        transition: all 300ms ease;
      }

      .mlg-match-upcoming {
        border-color: #6b7280;
      }

      .mlg-match-live {
        border-color: #ef4444;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        animation: mlg-live-pulse 2s infinite alternate;
      }

      .mlg-match-completed {
        border-color: #00ff88;
      }

      .mlg-match-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .mlg-player {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(107, 114, 128, 0.1);
        border-radius: 6px;
        transition: all 300ms ease;
      }

      .mlg-player.mlg-winner {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid #00ff88;
        color: #00ff88;
      }

      .mlg-player-name {
        font-weight: bold;
        color: #ffffff;
      }

      .mlg-player.mlg-winner .mlg-player-name {
        color: #00ff88;
      }

      .mlg-player-score {
        font-size: 18px;
        font-weight: bold;
        color: #9ca3af;
      }

      .mlg-player.mlg-winner .mlg-player-score {
        color: #00ff88;
      }

      .mlg-match-vs {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        font-weight: bold;
        margin: 4px 0;
      }

      .mlg-match-live-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 12px;
        height: 12px;
        background: #ef4444;
        border-radius: 50%;
        animation: mlg-live-blink 1s infinite;
      }

      /* Event Status Variants */
      .mlg-status-live {
        border-color: #ef4444 !important;
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4) !important;
      }

      .mlg-status-upcoming {
        border-color: #00ff88;
      }

      .mlg-status-completed {
        border-color: #6b7280;
        opacity: 0.8;
      }

      .mlg-status-cancelled {
        border-color: #ef4444;
        opacity: 0.6;
      }

      /* Event Type Variants */
      .mlg-event-tournament {
        background: linear-gradient(135deg, #1a1a2e 0%, #8b5cf6 10%, #1a1a2e 100%);
        border-color: #8b5cf6;
      }

      .mlg-event-announcement {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
        border-color: #fbbf24;
        color: #0a0a0f;
      }

      .mlg-event-announcement .mlg-banner-title,
      .mlg-event-announcement .mlg-info-text {
        color: #0a0a0f;
      }

      /* Animations */
      @keyframes mlg-live-pulse {
        from {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        to {
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
        }
      }

      @keyframes mlg-live-blink {
        0%, 50% {
          opacity: 1;
        }
        51%, 100% {
          opacity: 0.3;
        }
      }

      @keyframes mlg-pulse-ring {
        0% {
          transform: scale(1);
          opacity: 0.3;
        }
        100% {
          transform: scale(1.2);
          opacity: 0;
        }
      }

      @keyframes mlg-urgent-pulse {
        from {
          border-color: #ef4444;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
        }
        to {
          border-color: #ff8800;
          box-shadow: 0 0 25px rgba(255, 136, 0, 0.5);
        }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .mlg-event-banner {
          padding: 16px;
          margin: 12px 0;
        }

        .mlg-banner-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .mlg-banner-title {
          font-size: 20px;
        }

        .mlg-banner-main {
          flex-direction: column;
        }

        .mlg-banner-image {
          width: 100%;
          height: 120px;
        }

        .mlg-banner-info {
          flex-direction: column;
          align-items: stretch;
        }

        .mlg-banner-actions {
          flex-direction: column;
        }

        .mlg-countdown-display {
          flex-direction: column;
          gap: 12px;
        }

        .mlg-time-unit {
          min-width: auto;
          width: 100%;
        }

        .mlg-time-separator {
          display: none;
        }

        .mlg-tournament-display {
          padding: 20px;
        }

        .mlg-tournament-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .mlg-tournament-status {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .mlg-bracket-display {
          flex-direction: column;
          gap: 16px;
        }

        .mlg-bracket-round {
          min-width: auto;
        }
      }

      /* Print Styles */
      @media print {
        .mlg-event-banner,
        .mlg-tournament-display {
          background: white !important;
          color: black !important;
          border: 2px solid black !important;
          box-shadow: none !important;
          animation: none !important;
        }

        .mlg-live-indicator,
        .mlg-countdown-timer {
          display: none !important;
        }
      }

      /* High Contrast Mode */
      @media (prefers-contrast: high) {
        .mlg-event-banner {
          border-width: 3px;
          border-color: #ffffff;
        }

        .mlg-banner-title {
          color: #ffffff;
          text-shadow: 2px 2px 0px #000000;
        }

        .mlg-info-item {
          background: #000000;
          border: 1px solid #ffffff;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .mlg-event-banner,
        .mlg-tournament-display,
        .mlg-countdown-timer,
        .mlg-live-indicator,
        .mlg-match-element {
          animation: none !important;
          transition: none !important;
        }

        .mlg-event-banner:hover {
          transform: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.logger.debug('✨ MLG event banner styles injected');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for dynamic content updates
    this.on('event_updated', (data) => {
      if (data.element && data.eventData) {
        this.updateEventDisplay(data.element, data.eventData);
      }
    });

    // Listen for tournament updates
    this.on('tournament_updated', (data) => {
      if (data.element && data.tournamentData) {
        this.updateTournamentDisplay(data.element, data.tournamentData);
      }
    });

    this.logger.debug('🎧 Event listeners setup complete');
  }

  /**
   * Update event display
   * @param {HTMLElement} element - Event element
   * @param {Object} eventData - Updated event data
   */
  updateEventDisplay(element, eventData) {
    try {
      const cachedData = this.cache.get(element);
      if (!cachedData) return;

      // Update cached data
      Object.assign(cachedData.eventData, eventData);

      // Recreate content
      const content = element.querySelector('.mlg-banner-content');
      if (content) {
        const newContent = this.createBannerContent(cachedData.eventData, cachedData.options);
        element.replaceChild(newContent, content);
      }

      this.logger.debug('🔄 Updated event display');
    } catch (error) {
      this.logger.error('❌ Error updating event display:', error);
    }
  }

  /**
   * Clean up timers and resources
   */
  cleanup() {
    // Clear all timers
    this.timers.forEach(({ interval }) => {
      clearInterval(interval);
    });
    this.timers.clear();

    // Clear live events
    this.liveEvents.clear();

    // Clear cache
    this.cache.clear();

    this.logger.debug('🧹 Event banner system cleanup complete');
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      activeTimers: this.timers.size,
      liveEvents: this.liveEvents.size,
      cachedElements: this.cache.size,
      supportedEventTypes: Object.keys(this.config.EVENT_TYPES),
      supportedStatuses: Object.keys(this.config.EVENT_STATUS)
    };
  }
}

// Global Event Banner Utilities
const MLGEventUtils = {
  /**
   * Quick method to create an event banner
   * @param {Object} eventData - Event data
   * @param {Object} options - Options
   * @returns {HTMLElement} Event banner
   */
  createEventBanner(eventData, options = {}) {
    const system = new MLGEventBannerSystem();
    return system.createEventBanner(eventData, options);
  },

  /**
   * Quick method to create a tournament display
   * @param {Object} tournamentData - Tournament data
   * @param {Object} options - Options
   * @returns {HTMLElement} Tournament display
   */
  createTournamentDisplay(tournamentData, options = {}) {
    const system = new MLGEventBannerSystem();
    return system.createTournamentDisplay(tournamentData, options);
  },

  /**
   * Quick method to create a countdown timer
   * @param {Date|string} targetTime - Target time
   * @returns {HTMLElement} Countdown timer
   */
  createCountdownTimer(targetTime) {
    const system = new MLGEventBannerSystem();
    return system.createCountdownTimer(targetTime);
  }
};

// Export the system and utilities
export { MLGEventBannerSystem, MLG_EVENT_CONFIG, MLGEventUtils };
export default MLGEventBannerSystem;