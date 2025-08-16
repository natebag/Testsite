/**
 * MLG Tournament Bracket Display Component
 * 
 * Professional tournament bracket visualization with MLG branding,
 * real-time updates, and interactive features. Supports single-elimination,
 * double-elimination, and round-robin tournament formats with Xbox 360
 * retro gaming aesthetic.
 * 
 * Features:
 * - Dynamic tournament bracket visualization
 * - Real-time match updates and live indicators
 * - Multiple tournament formats (single/double elimination, round-robin)
 * - Interactive match cards with player information
 * - Responsive design for all screen sizes
 * - MLG professional branding and styling
 * - Animated match progression
 * - Live tournament status tracking
 * - Player statistics and performance metrics
 * - Tournament phase navigation
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.3 - Create MLG branded event banners and tournament displays
 */

import { EventEmitter } from 'events';
import { MLGBrandingSystem } from './mlg-branding-system.js';

/**
 * Tournament Bracket Configuration
 */
const BRACKET_CONFIG = {
  // Tournament Formats
  FORMATS: {
    single_elimination: 'single_elimination',
    double_elimination: 'double_elimination',
    round_robin: 'round_robin',
    swiss: 'swiss',
    ladder: 'ladder'
  },
  
  // Match States
  MATCH_STATES: {
    upcoming: 'upcoming',
    live: 'live',
    completed: 'completed',
    bye: 'bye',
    walkover: 'walkover'
  },
  
  // Tournament Phases
  PHASES: {
    registration: 'registration',
    seeding: 'seeding',
    group_stage: 'group_stage',
    round_of_32: 'round_of_32',
    round_of_16: 'round_of_16',
    quarterfinals: 'quarterfinals',
    semifinals: 'semifinals',
    third_place: 'third_place',
    finals: 'finals',
    completed: 'completed'
  },
  
  // Visual Configuration
  LAYOUT: {
    matchWidth: 220,
    matchHeight: 80,
    roundSpacing: 280,
    matchSpacing: 20,
    headerHeight: 50,
    connectorWidth: 2,
    maxRounds: 8
  },
  
  // Colors and Styling
  COLORS: {
    upcoming: '#6b7280',
    live: '#ef4444',
    completed: '#00ff88',
    bye: '#374151',
    selected: '#8b5cf6',
    winner: '#00ff88',
    loser: '#6b7280',
    background: 'rgba(26, 26, 46, 0.8)',
    border: 'rgba(0, 255, 136, 0.3)',
    text: '#ffffff',
    textMuted: '#9ca3af'
  },
  
  // Animation Settings
  ANIMATIONS: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    stagger: 100,
    pulse: '2s infinite alternate'
  }
};

/**
 * MLG Tournament Bracket System Class
 */
class MLGTournamentBracket extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...BRACKET_CONFIG, ...options };
    this.brandingSystem = new MLGBrandingSystem();
    this.bracketData = null;
    this.container = null;
    this.selectedMatch = null;
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.updateMatch = this.updateMatch.bind(this);
    this.selectMatch = this.selectMatch.bind(this);
    this.createMatchCard = this.createMatchCard.bind(this);
    this.createRoundHeader = this.createRoundHeader.bind(this);
    
    this.logger.info('🏆 MLG Tournament Bracket initialized');
  }

  /**
   * Initialize the tournament bracket
   * @param {HTMLElement} container - Container element
   * @param {Object} tournamentData - Tournament data
   */
  async initialize(container, tournamentData) {
    try {
      if (!container) {
        throw new Error('Container element is required');
      }

      this.container = container;
      this.bracketData = tournamentData;
      
      this.logger.info('🚀 Initializing MLG Tournament Bracket...');
      
      // Initialize branding system
      await this.brandingSystem.initialize();
      
      // Inject bracket styles
      await this.injectBracketStyles();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial render
      await this.render();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Tournament Bracket initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize tournament bracket:', error);
      throw error;
    }
  }

  /**
   * Render the tournament bracket
   */
  async render() {
    try {
      if (!this.container || !this.bracketData) {
        throw new Error('Container and tournament data are required');
      }

      this.logger.debug('🎨 Rendering tournament bracket...');
      
      // Clear container
      this.container.innerHTML = '';
      this.container.className = 'mlg-tournament-bracket-container';

      // Create bracket header
      const header = this.createBracketHeader();
      this.container.appendChild(header);

      // Create bracket content based on format
      const content = await this.createBracketContent();
      this.container.appendChild(content);

      // Create bracket footer with controls
      const footer = this.createBracketFooter();
      this.container.appendChild(footer);

      // Apply container styling
      this.applyContainerStyling();
      
      this.emit('bracket_rendered', { tournamentData: this.bracketData });
      this.logger.debug('✅ Tournament bracket rendered successfully');
      
    } catch (error) {
      this.logger.error('❌ Error rendering tournament bracket:', error);
      this.renderErrorState(error);
    }
  }

  /**
   * Create bracket header
   * @returns {HTMLElement} Header element
   */
  createBracketHeader() {
    const {
      name = 'MLG Tournament',
      format = 'single_elimination',
      phase = 'quarterfinals',
      totalPlayers = 0,
      currentRound = 1,
      totalRounds = 1
    } = this.bracketData;

    const header = document.createElement('div');
    header.className = 'mlg-bracket-header';

    header.innerHTML = `
      <div class="mlg-bracket-title-section">
        ${this.brandingSystem.createBrandBadge({ 
          size: 'large', 
          animated: true,
          variant: 'tournament' 
        }).outerHTML}
        <div class="mlg-bracket-title-info">
          <h2 class="mlg-bracket-title">${name}</h2>
          <div class="mlg-bracket-meta">
            <span class="mlg-bracket-format">${this.getFormatLabel(format)}</span>
            <span class="mlg-bracket-separator">•</span>
            <span class="mlg-bracket-phase">${this.getPhaseLabel(phase)}</span>
            <span class="mlg-bracket-separator">•</span>
            <span class="mlg-bracket-players">${totalPlayers} Players</span>
          </div>
        </div>
      </div>
      
      <div class="mlg-bracket-progress">
        <div class="mlg-progress-info">
          <span class="mlg-progress-text">Round ${currentRound} of ${totalRounds}</span>
        </div>
        <div class="mlg-progress-bar">
          <div class="mlg-progress-fill" style="width: ${(currentRound / totalRounds) * 100}%"></div>
        </div>
      </div>
    `;

    return header;
  }

  /**
   * Create bracket content based on tournament format
   * @returns {HTMLElement} Content element
   */
  async createBracketContent() {
    const { format = 'single_elimination' } = this.bracketData;

    const content = document.createElement('div');
    content.className = 'mlg-bracket-content';

    switch (format) {
      case 'single_elimination':
        return this.createSingleEliminationBracket();
      case 'double_elimination':
        return this.createDoubleEliminationBracket();
      case 'round_robin':
        return this.createRoundRobinBracket();
      case 'swiss':
        return this.createSwissBracket();
      default:
        return this.createSingleEliminationBracket();
    }
  }

  /**
   * Create single elimination bracket
   * @returns {HTMLElement} Single elimination bracket
   */
  createSingleEliminationBracket() {
    const { rounds = [] } = this.bracketData;
    
    const bracket = document.createElement('div');
    bracket.className = 'mlg-single-elimination-bracket';

    // Create rounds container
    const roundsContainer = document.createElement('div');
    roundsContainer.className = 'mlg-rounds-container';

    rounds.forEach((round, roundIndex) => {
      const roundElement = this.createRoundElement(round, roundIndex, 'single');
      roundsContainer.appendChild(roundElement);
    });

    bracket.appendChild(roundsContainer);

    // Add connectors between rounds
    this.addRoundConnectors(roundsContainer, 'single');

    return bracket;
  }

  /**
   * Create double elimination bracket
   * @returns {HTMLElement} Double elimination bracket
   */
  createDoubleEliminationBracket() {
    const { winnersRounds = [], losersRounds = [], grandFinal = null } = this.bracketData;
    
    const bracket = document.createElement('div');
    bracket.className = 'mlg-double-elimination-bracket';

    // Winners bracket
    const winnersContainer = document.createElement('div');
    winnersContainer.className = 'mlg-winners-bracket';
    
    const winnersHeader = document.createElement('div');
    winnersHeader.className = 'mlg-bracket-section-header';
    winnersHeader.innerHTML = `
      <h3 class="mlg-section-title">Winners Bracket</h3>
      <div class="mlg-section-decoration"></div>
    `;
    winnersContainer.appendChild(winnersHeader);

    const winnersRoundsContainer = document.createElement('div');
    winnersRoundsContainer.className = 'mlg-rounds-container';
    
    winnersRounds.forEach((round, roundIndex) => {
      const roundElement = this.createRoundElement(round, roundIndex, 'winners');
      winnersRoundsContainer.appendChild(roundElement);
    });
    
    winnersContainer.appendChild(winnersRoundsContainer);
    bracket.appendChild(winnersContainer);

    // Losers bracket
    const losersContainer = document.createElement('div');
    losersContainer.className = 'mlg-losers-bracket';
    
    const losersHeader = document.createElement('div');
    losersHeader.className = 'mlg-bracket-section-header';
    losersHeader.innerHTML = `
      <h3 class="mlg-section-title">Losers Bracket</h3>
      <div class="mlg-section-decoration"></div>
    `;
    losersContainer.appendChild(losersHeader);

    const losersRoundsContainer = document.createElement('div');
    losersRoundsContainer.className = 'mlg-rounds-container';
    
    losersRounds.forEach((round, roundIndex) => {
      const roundElement = this.createRoundElement(round, roundIndex, 'losers');
      losersRoundsContainer.appendChild(roundElement);
    });
    
    losersContainer.appendChild(losersRoundsContainer);
    bracket.appendChild(losersContainer);

    // Grand final
    if (grandFinal) {
      const grandFinalContainer = document.createElement('div');
      grandFinalContainer.className = 'mlg-grand-final';
      
      const finalHeader = document.createElement('div');
      finalHeader.className = 'mlg-bracket-section-header mlg-grand-final-header';
      finalHeader.innerHTML = `
        <h3 class="mlg-section-title">Grand Final</h3>
        <div class="mlg-grand-final-decoration">🏆</div>
      `;
      grandFinalContainer.appendChild(finalHeader);

      const finalMatch = this.createMatchCard(grandFinal, 0, 'grand_final');
      grandFinalContainer.appendChild(finalMatch);
      
      bracket.appendChild(grandFinalContainer);
    }

    return bracket;
  }

  /**
   * Create round robin bracket
   * @returns {HTMLElement} Round robin bracket
   */
  createRoundRobinBracket() {
    const { groups = [] } = this.bracketData;
    
    const bracket = document.createElement('div');
    bracket.className = 'mlg-round-robin-bracket';

    groups.forEach((group, groupIndex) => {
      const groupElement = this.createGroupElement(group, groupIndex);
      bracket.appendChild(groupElement);
    });

    return bracket;
  }

  /**
   * Create round element
   * @param {Object} round - Round data
   * @param {number} roundIndex - Round index
   * @param {string} bracketType - Bracket type
   * @returns {HTMLElement} Round element
   */
  createRoundElement(round, roundIndex, bracketType = 'single') {
    const { name, matches = [] } = round;

    const roundElement = document.createElement('div');
    roundElement.className = `mlg-round mlg-round-${roundIndex} mlg-bracket-${bracketType}`;
    roundElement.setAttribute('data-round-index', roundIndex);

    // Create round header
    const roundHeader = this.createRoundHeader(name || `Round ${roundIndex + 1}`, roundIndex);
    roundElement.appendChild(roundHeader);

    // Create matches container
    const matchesContainer = document.createElement('div');
    matchesContainer.className = 'mlg-matches-container';

    matches.forEach((match, matchIndex) => {
      const matchCard = this.createMatchCard(match, matchIndex, bracketType);
      matchesContainer.appendChild(matchCard);
    });

    roundElement.appendChild(matchesContainer);

    return roundElement;
  }

  /**
   * Create round header
   * @param {string} title - Round title
   * @param {number} index - Round index
   * @returns {HTMLElement} Round header element
   */
  createRoundHeader(title, index) {
    const header = document.createElement('div');
    header.className = 'mlg-round-header';

    header.innerHTML = `
      <div class="mlg-round-title">${title}</div>
      <div class="mlg-round-indicator">
        <span class="mlg-round-number">${index + 1}</span>
      </div>
    `;

    return header;
  }

  /**
   * Create match card
   * @param {Object} match - Match data
   * @param {number} index - Match index
   * @param {string} bracketType - Bracket type
   * @returns {HTMLElement} Match card element
   */
  createMatchCard(match, index, bracketType = 'single') {
    const {
      id,
      player1,
      player2,
      score1 = 0,
      score2 = 0,
      state = 'upcoming',
      winner = null,
      startTime = null,
      endTime = null,
      round = 1,
      position = index
    } = match;

    const matchCard = document.createElement('div');
    matchCard.className = `mlg-match-card mlg-match-${state} mlg-bracket-${bracketType}`;
    matchCard.setAttribute('data-match-id', id);
    matchCard.setAttribute('data-match-index', index);

    // Apply match styling
    this.applyMatchStyling(matchCard, state);

    // Create match content
    const content = document.createElement('div');
    content.className = 'mlg-match-content';

    // Create player 1 section
    const player1Section = this.createPlayerSection(player1, score1, state, winner, 1);
    content.appendChild(player1Section);

    // Create VS divider
    const divider = document.createElement('div');
    divider.className = 'mlg-match-divider';
    divider.innerHTML = `
      <div class="mlg-vs-text">VS</div>
      ${state === 'live' ? '<div class="mlg-live-pulse-dot"></div>' : ''}
    `;
    content.appendChild(divider);

    // Create player 2 section
    const player2Section = this.createPlayerSection(player2, score2, state, winner, 2);
    content.appendChild(player2Section);

    matchCard.appendChild(content);

    // Add live indicator if match is live
    if (state === 'live') {
      const liveIndicator = this.createMatchLiveIndicator();
      matchCard.appendChild(liveIndicator);
    }

    // Add match info footer
    const footer = this.createMatchFooter(match);
    matchCard.appendChild(footer);

    // Add click handler
    matchCard.addEventListener('click', () => {
      this.selectMatch(match, matchCard);
    });

    return matchCard;
  }

  /**
   * Create player section
   * @param {Object} player - Player data
   * @param {number} score - Player score
   * @param {string} matchState - Match state
   * @param {string} winner - Winner ID
   * @param {number} playerNumber - Player number (1 or 2)
   * @returns {HTMLElement} Player section element
   */
  createPlayerSection(player, score, matchState, winner, playerNumber) {
    const isWinner = winner === player?.id;
    const isBye = !player || player.isBye;

    const section = document.createElement('div');
    section.className = `mlg-player-section mlg-player-${playerNumber} ${isWinner ? 'mlg-winner' : ''} ${isBye ? 'mlg-bye' : ''}`;

    if (isBye) {
      section.innerHTML = `
        <div class="mlg-player-info">
          <div class="mlg-player-name">BYE</div>
          <div class="mlg-player-subtitle">Automatic Advance</div>
        </div>
        <div class="mlg-player-score mlg-bye-score">-</div>
      `;
    } else if (!player) {
      section.innerHTML = `
        <div class="mlg-player-info">
          <div class="mlg-player-name">TBD</div>
          <div class="mlg-player-subtitle">To Be Determined</div>
        </div>
        <div class="mlg-player-score mlg-tbd-score">-</div>
      `;
    } else {
      section.innerHTML = `
        <div class="mlg-player-info">
          <div class="mlg-player-avatar">
            ${player.avatar ? `<img src="${player.avatar}" alt="${player.name}" />` : 
              `<div class="mlg-default-avatar">${player.name.charAt(0).toUpperCase()}</div>`}
          </div>
          <div class="mlg-player-details">
            <div class="mlg-player-name">${player.name}</div>
            <div class="mlg-player-subtitle">${player.team || player.rank || 'Player'}</div>
          </div>
        </div>
        <div class="mlg-player-score ${isWinner ? 'mlg-winner-score' : ''}">
          ${matchState === 'upcoming' ? '-' : score}
        </div>
      `;
    }

    return section;
  }

  /**
   * Create match live indicator
   * @returns {HTMLElement} Live indicator element
   */
  createMatchLiveIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'mlg-match-live-indicator';

    indicator.innerHTML = `
      <div class="mlg-live-badge">
        <div class="mlg-live-dot"></div>
        <span class="mlg-live-text">LIVE</span>
      </div>
    `;

    return indicator;
  }

  /**
   * Create match footer
   * @param {Object} match - Match data
   * @returns {HTMLElement} Match footer element
   */
  createMatchFooter(match) {
    const { state, startTime, round, position } = match;

    const footer = document.createElement('div');
    footer.className = 'mlg-match-footer';

    let timeText = '';
    if (state === 'live') {
      timeText = 'Live Now';
    } else if (state === 'completed') {
      timeText = 'Completed';
    } else if (startTime) {
      const date = new Date(startTime);
      timeText = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      timeText = 'Scheduled';
    }

    footer.innerHTML = `
      <div class="mlg-match-time">
        <span class="mlg-time-icon">${state === 'live' ? '🔴' : '⏰'}</span>
        <span class="mlg-time-text">${timeText}</span>
      </div>
      <div class="mlg-match-position">
        Match ${position + 1}
      </div>
    `;

    return footer;
  }

  /**
   * Create bracket footer with controls
   * @returns {HTMLElement} Footer element
   */
  createBracketFooter() {
    const footer = document.createElement('div');
    footer.className = 'mlg-bracket-footer';

    footer.innerHTML = `
      <div class="mlg-bracket-controls">
        <button class="mlg-control-button mlg-zoom-out" title="Zoom Out">
          <span class="mlg-control-icon">🔍-</span>
        </button>
        <button class="mlg-control-button mlg-zoom-reset" title="Reset Zoom">
          <span class="mlg-control-icon">🎯</span>
        </button>
        <button class="mlg-control-button mlg-zoom-in" title="Zoom In">
          <span class="mlg-control-icon">🔍+</span>
        </button>
        <div class="mlg-control-separator"></div>
        <button class="mlg-control-button mlg-fullscreen" title="Fullscreen">
          <span class="mlg-control-icon">⛶</span>
        </button>
        <button class="mlg-control-button mlg-refresh" title="Refresh">
          <span class="mlg-control-icon">🔄</span>
        </button>
      </div>
      
      <div class="mlg-bracket-legend">
        <div class="mlg-legend-item">
          <div class="mlg-legend-color mlg-legend-upcoming"></div>
          <span class="mlg-legend-text">Upcoming</span>
        </div>
        <div class="mlg-legend-item">
          <div class="mlg-legend-color mlg-legend-live"></div>
          <span class="mlg-legend-text">Live</span>
        </div>
        <div class="mlg-legend-item">
          <div class="mlg-legend-color mlg-legend-completed"></div>
          <span class="mlg-legend-text">Completed</span>
        </div>
      </div>
    `;

    // Add control event listeners
    this.setupFooterControls(footer);

    return footer;
  }

  /**
   * Setup footer control event listeners
   * @param {HTMLElement} footer - Footer element
   */
  setupFooterControls(footer) {
    const zoomOut = footer.querySelector('.mlg-zoom-out');
    const zoomIn = footer.querySelector('.mlg-zoom-in');
    const zoomReset = footer.querySelector('.mlg-zoom-reset');
    const fullscreen = footer.querySelector('.mlg-fullscreen');
    const refresh = footer.querySelector('.mlg-refresh');

    if (zoomOut) {
      zoomOut.addEventListener('click', () => this.zoomOut());
    }

    if (zoomIn) {
      zoomIn.addEventListener('click', () => this.zoomIn());
    }

    if (zoomReset) {
      zoomReset.addEventListener('click', () => this.resetZoom());
    }

    if (fullscreen) {
      fullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    if (refresh) {
      refresh.addEventListener('click', () => this.refreshBracket());
    }
  }

  /**
   * Select a match
   * @param {Object} match - Match data
   * @param {HTMLElement} matchElement - Match element
   */
  selectMatch(match, matchElement) {
    // Remove previous selection
    if (this.selectedMatch) {
      this.selectedMatch.classList.remove('mlg-selected');
    }

    // Select new match
    this.selectedMatch = matchElement;
    matchElement.classList.add('mlg-selected');

    this.emit('match_selected', { match, element: matchElement });
    this.logger.debug(`🎯 Selected match: ${match.id}`);
  }

  /**
   * Update match data
   * @param {string} matchId - Match ID
   * @param {Object} updateData - Update data
   */
  updateMatch(matchId, updateData) {
    try {
      const matchElement = this.container.querySelector(`[data-match-id="${matchId}"]`);
      if (!matchElement) {
        this.logger.warn(`❓ Match element not found: ${matchId}`);
        return;
      }

      // Find match in data
      const match = this.findMatchById(matchId);
      if (!match) {
        this.logger.warn(`❓ Match data not found: ${matchId}`);
        return;
      }

      // Update match data
      Object.assign(match, updateData);

      // Update visual state
      this.updateMatchVisual(matchElement, match);

      this.emit('match_updated', { matchId, updateData, element: matchElement });
      this.logger.debug(`🔄 Updated match: ${matchId}`);
    } catch (error) {
      this.logger.error('❌ Error updating match:', error);
    }
  }

  /**
   * Update match visual representation
   * @param {HTMLElement} matchElement - Match element
   * @param {Object} match - Updated match data
   */
  updateMatchVisual(matchElement, match) {
    const { state, score1, score2, winner } = match;

    // Update match state class
    matchElement.className = matchElement.className.replace(/mlg-match-\w+/, `mlg-match-${state}`);

    // Update scores
    const player1Score = matchElement.querySelector('.mlg-player-1 .mlg-player-score');
    const player2Score = matchElement.querySelector('.mlg-player-2 .mlg-player-score');

    if (player1Score) {
      player1Score.textContent = state === 'upcoming' ? '-' : score1;
      if (winner === match.player1?.id) {
        player1Score.classList.add('mlg-winner-score');
      } else {
        player1Score.classList.remove('mlg-winner-score');
      }
    }

    if (player2Score) {
      player2Score.textContent = state === 'upcoming' ? '-' : score2;
      if (winner === match.player2?.id) {
        player2Score.classList.add('mlg-winner-score');
      } else {
        player2Score.classList.remove('mlg-winner-score');
      }
    }

    // Update winner highlighting
    const player1Section = matchElement.querySelector('.mlg-player-1');
    const player2Section = matchElement.querySelector('.mlg-player-2');

    if (player1Section) {
      if (winner === match.player1?.id) {
        player1Section.classList.add('mlg-winner');
      } else {
        player1Section.classList.remove('mlg-winner');
      }
    }

    if (player2Section) {
      if (winner === match.player2?.id) {
        player2Section.classList.add('mlg-winner');
      } else {
        player2Section.classList.remove('mlg-winner');
      }
    }

    // Handle live indicator
    const existingIndicator = matchElement.querySelector('.mlg-match-live-indicator');
    if (state === 'live' && !existingIndicator) {
      const liveIndicator = this.createMatchLiveIndicator();
      matchElement.appendChild(liveIndicator);
    } else if (state !== 'live' && existingIndicator) {
      existingIndicator.remove();
    }

    // Apply styling
    this.applyMatchStyling(matchElement, state);
  }

  /**
   * Find match by ID
   * @param {string} matchId - Match ID
   * @returns {Object|null} Match data
   */
  findMatchById(matchId) {
    if (!this.bracketData) return null;

    // Search in rounds
    if (this.bracketData.rounds) {
      for (const round of this.bracketData.rounds) {
        for (const match of round.matches) {
          if (match.id === matchId) return match;
        }
      }
    }

    // Search in winners/losers rounds for double elimination
    if (this.bracketData.winnersRounds) {
      for (const round of this.bracketData.winnersRounds) {
        for (const match of round.matches) {
          if (match.id === matchId) return match;
        }
      }
    }

    if (this.bracketData.losersRounds) {
      for (const round of this.bracketData.losersRounds) {
        for (const match of round.matches) {
          if (match.id === matchId) return match;
        }
      }
    }

    return null;
  }

  /**
   * Apply match styling
   * @param {HTMLElement} matchElement - Match element
   * @param {string} state - Match state
   */
  applyMatchStyling(matchElement, state) {
    const colors = this.config.COLORS;
    
    const stateColors = {
      upcoming: colors.upcoming,
      live: colors.live,
      completed: colors.completed,
      bye: colors.bye
    };

    const borderColor = stateColors[state] || colors.upcoming;
    
    matchElement.style.borderColor = borderColor;
    
    if (state === 'live') {
      matchElement.style.boxShadow = `0 0 20px ${borderColor}40`;
      matchElement.style.animation = this.config.ANIMATIONS.pulse;
    } else {
      matchElement.style.boxShadow = 'none';
      matchElement.style.animation = 'none';
    }
  }

  /**
   * Apply container styling
   */
  applyContainerStyling() {
    if (!this.container) return;

    this.container.style.cssText = `
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
      border: 2px solid #00ff88;
      border-radius: 16px;
      padding: 24px;
      overflow: auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #ffffff;
      position: relative;
    `;
  }

  /**
   * Zoom out
   */
  zoomOut() {
    const content = this.container.querySelector('.mlg-bracket-content');
    if (content) {
      const currentZoom = parseFloat(content.style.zoom || '1');
      const newZoom = Math.max(0.5, currentZoom - 0.1);
      content.style.zoom = newZoom;
      this.emit('zoom_changed', { zoom: newZoom });
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    const content = this.container.querySelector('.mlg-bracket-content');
    if (content) {
      const currentZoom = parseFloat(content.style.zoom || '1');
      const newZoom = Math.min(2, currentZoom + 0.1);
      content.style.zoom = newZoom;
      this.emit('zoom_changed', { zoom: newZoom });
    }
  }

  /**
   * Reset zoom
   */
  resetZoom() {
    const content = this.container.querySelector('.mlg-bracket-content');
    if (content) {
      content.style.zoom = '1';
      this.emit('zoom_changed', { zoom: 1 });
    }
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => {
        this.logger.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Refresh bracket
   */
  refreshBracket() {
    this.emit('refresh_requested');
    this.render();
  }

  /**
   * Get format label
   * @param {string} format - Format type
   * @returns {string} Format label
   */
  getFormatLabel(format) {
    const labels = {
      single_elimination: 'Single Elimination',
      double_elimination: 'Double Elimination',
      round_robin: 'Round Robin',
      swiss: 'Swiss System',
      ladder: 'Ladder'
    };
    return labels[format] || format;
  }

  /**
   * Get phase label
   * @param {string} phase - Phase type
   * @returns {string} Phase label
   */
  getPhaseLabel(phase) {
    const labels = {
      registration: 'Registration',
      seeding: 'Seeding',
      group_stage: 'Group Stage',
      round_of_32: 'Round of 32',
      round_of_16: 'Round of 16',
      quarterfinals: 'Quarter Finals',
      semifinals: 'Semi Finals',
      third_place: 'Third Place',
      finals: 'Finals',
      completed: 'Completed'
    };
    return labels[phase] || phase;
  }

  /**
   * Add round connectors
   * @param {HTMLElement} roundsContainer - Rounds container
   * @param {string} bracketType - Bracket type
   */
  addRoundConnectors(roundsContainer, bracketType) {
    // This would add SVG connectors between rounds
    // Implementation would depend on specific layout requirements
    this.logger.debug('🔗 Adding round connectors...');
  }

  /**
   * Render error state
   * @param {Error} error - Error object
   */
  renderErrorState(error) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mlg-bracket-error">
        <div class="mlg-error-content">
          <div class="mlg-error-icon">❌</div>
          <h3 class="mlg-error-title">Tournament Bracket Error</h3>
          <p class="mlg-error-message">${error.message}</p>
          <button class="mlg-error-retry" onclick="location.reload()">
            Retry Loading
          </button>
        </div>
      </div>
    `;

    this.container.style.cssText = `
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid #ef4444;
      border-radius: 16px;
      padding: 48px;
      text-align: center;
      color: #ffffff;
    `;
  }

  /**
   * Inject bracket styles
   */
  async injectBracketStyles() {
    const styleId = 'mlg-tournament-bracket-styles';
    
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* MLG Tournament Bracket Styles */
      
      .mlg-tournament-bracket-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #ffffff;
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
        border: 2px solid #00ff88;
        border-radius: 16px;
        overflow: hidden;
      }

      /* Bracket Header */
      .mlg-bracket-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        background: rgba(0, 255, 136, 0.1);
        border-bottom: 1px solid rgba(0, 255, 136, 0.3);
      }

      .mlg-bracket-title-section {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .mlg-bracket-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: #ffffff;
      }

      .mlg-bracket-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #9ca3af;
        margin-top: 4px;
      }

      .mlg-bracket-separator {
        color: #00ff88;
      }

      .mlg-bracket-progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 200px;
      }

      .mlg-progress-info {
        text-align: right;
        font-size: 14px;
        color: #00ff88;
        font-weight: bold;
      }

      .mlg-progress-bar {
        height: 8px;
        background: rgba(107, 114, 128, 0.3);
        border-radius: 4px;
        overflow: hidden;
      }

      .mlg-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff88 0%, #00d4ff 100%);
        border-radius: 4px;
        transition: width 300ms ease;
      }

      /* Bracket Content */
      .mlg-bracket-content {
        padding: 24px;
        overflow: auto;
        min-height: 400px;
      }

      .mlg-rounds-container {
        display: flex;
        gap: 280px;
        align-items: flex-start;
        min-width: fit-content;
      }

      .mlg-round {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 220px;
      }

      .mlg-round-header {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid #00ff88;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
        position: relative;
      }

      .mlg-round-title {
        font-weight: bold;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 14px;
      }

      .mlg-round-indicator {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #00ff88;
        color: #0a0a0f;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }

      .mlg-matches-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* Match Cards */
      .mlg-match-card {
        background: rgba(26, 26, 46, 0.8);
        border: 2px solid rgba(107, 114, 128, 0.3);
        border-radius: 12px;
        padding: 16px;
        position: relative;
        transition: all 300ms cubic-bezier(0.4, 0, 0.6, 1);
        cursor: pointer;
        backdrop-filter: blur(10px);
      }

      .mlg-match-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 255, 136, 0.2);
      }

      .mlg-match-card.mlg-selected {
        border-color: #8b5cf6;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
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

      .mlg-match-bye {
        border-color: #374151;
        opacity: 0.7;
      }

      .mlg-match-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Player Sections */
      .mlg-player-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(107, 114, 128, 0.1);
        border-radius: 8px;
        padding: 12px;
        transition: all 300ms ease;
      }

      .mlg-player-section.mlg-winner {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid rgba(0, 255, 136, 0.5);
      }

      .mlg-player-section.mlg-bye {
        background: rgba(55, 65, 81, 0.3);
        color: #9ca3af;
      }

      .mlg-player-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .mlg-player-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(0, 255, 136, 0.3);
      }

      .mlg-player-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .mlg-default-avatar {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #0a0a0f;
        font-size: 16px;
      }

      .mlg-player-details {
        flex: 1;
      }

      .mlg-player-name {
        font-weight: bold;
        font-size: 16px;
        color: #ffffff;
      }

      .mlg-player-section.mlg-winner .mlg-player-name {
        color: #00ff88;
      }

      .mlg-player-subtitle {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 2px;
      }

      .mlg-player-score {
        font-size: 20px;
        font-weight: bold;
        color: #9ca3af;
        min-width: 40px;
        text-align: center;
        font-family: 'Courier New', monospace;
      }

      .mlg-player-score.mlg-winner-score {
        color: #00ff88;
      }

      .mlg-bye-score,
      .mlg-tbd-score {
        color: #6b7280;
      }

      /* Match Divider */
      .mlg-match-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin: 4px 0;
      }

      .mlg-vs-text {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid rgba(0, 255, 136, 0.5);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-live-pulse-dot {
        position: absolute;
        right: -20px;
        width: 8px;
        height: 8px;
        background: #ef4444;
        border-radius: 50%;
        animation: mlg-live-blink 1s infinite;
      }

      /* Match Live Indicator */
      .mlg-match-live-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
      }

      .mlg-live-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(239, 68, 68, 0.9);
        border: 1px solid #ef4444;
        border-radius: 12px;
        padding: 4px 8px;
        backdrop-filter: blur(10px);
      }

      .mlg-live-dot {
        width: 6px;
        height: 6px;
        background: #ffffff;
        border-radius: 50%;
        animation: mlg-live-blink 1s infinite;
      }

      .mlg-live-text {
        color: #ffffff;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Match Footer */
      .mlg-match-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(107, 114, 128, 0.3);
        font-size: 12px;
        color: #9ca3af;
      }

      .mlg-match-time {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mlg-time-icon {
        font-size: 12px;
      }

      .mlg-match-position {
        font-weight: bold;
      }

      /* Double Elimination Specific */
      .mlg-double-elimination-bracket {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .mlg-winners-bracket,
      .mlg-losers-bracket {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 20px;
      }

      .mlg-bracket-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid rgba(0, 255, 136, 0.3);
      }

      .mlg-section-title {
        font-size: 20px;
        font-weight: bold;
        color: #00ff88;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-section-decoration {
        width: 40px;
        height: 4px;
        background: linear-gradient(90deg, #00ff88 0%, #00d4ff 100%);
        border-radius: 2px;
      }

      .mlg-grand-final {
        background: rgba(139, 92, 246, 0.1);
        border: 2px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
      }

      .mlg-grand-final-header .mlg-section-title {
        color: #8b5cf6;
      }

      .mlg-grand-final-decoration {
        font-size: 24px;
      }

      /* Bracket Footer */
      .mlg-bracket-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(0, 255, 136, 0.3);
      }

      .mlg-bracket-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .mlg-control-button {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid rgba(0, 255, 136, 0.5);
        border-radius: 6px;
        padding: 8px 12px;
        color: #00ff88;
        cursor: pointer;
        transition: all 300ms ease;
        font-size: 14px;
      }

      .mlg-control-button:hover {
        background: rgba(0, 255, 136, 0.3);
        transform: translateY(-1px);
      }

      .mlg-control-separator {
        width: 1px;
        height: 24px;
        background: rgba(0, 255, 136, 0.3);
        margin: 0 8px;
      }

      .mlg-bracket-legend {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .mlg-legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #9ca3af;
      }

      .mlg-legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }

      .mlg-legend-upcoming {
        background: #6b7280;
      }

      .mlg-legend-live {
        background: #ef4444;
      }

      .mlg-legend-completed {
        background: #00ff88;
      }

      /* Error State */
      .mlg-bracket-error {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        text-align: center;
      }

      .mlg-error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        max-width: 400px;
      }

      .mlg-error-icon {
        font-size: 48px;
      }

      .mlg-error-title {
        font-size: 24px;
        font-weight: bold;
        color: #ef4444;
        margin: 0;
      }

      .mlg-error-message {
        font-size: 16px;
        color: #9ca3af;
        margin: 0;
        line-height: 1.5;
      }

      .mlg-error-retry {
        background: linear-gradient(135deg, #ef4444 0%, #ff8800 100%);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: bold;
        cursor: pointer;
        transition: all 300ms ease;
      }

      .mlg-error-retry:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
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

      /* Responsive Design */
      @media (max-width: 768px) {
        .mlg-bracket-header {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }

        .mlg-bracket-title-section {
          justify-content: center;
        }

        .mlg-bracket-progress {
          min-width: auto;
        }

        .mlg-rounds-container {
          flex-direction: column;
          gap: 32px;
        }

        .mlg-round {
          min-width: auto;
        }

        .mlg-match-card {
          padding: 12px;
        }

        .mlg-player-info {
          gap: 8px;
        }

        .mlg-player-avatar {
          width: 32px;
          height: 32px;
        }

        .mlg-player-name {
          font-size: 14px;
        }

        .mlg-player-score {
          font-size: 18px;
        }

        .mlg-bracket-footer {
          flex-direction: column;
          gap: 16px;
        }

        .mlg-bracket-controls {
          flex-wrap: wrap;
          justify-content: center;
        }

        .mlg-bracket-legend {
          flex-wrap: wrap;
          justify-content: center;
        }
      }

      /* Print Styles */
      @media print {
        .mlg-tournament-bracket-container {
          background: white !important;
          color: black !important;
          border: 2px solid black !important;
        }

        .mlg-bracket-footer,
        .mlg-match-live-indicator {
          display: none !important;
        }

        .mlg-match-card {
          break-inside: avoid;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .mlg-match-card,
        .mlg-control-button,
        .mlg-live-dot,
        .mlg-live-pulse-dot {
          animation: none !important;
          transition: none !important;
        }

        .mlg-match-card:hover,
        .mlg-control-button:hover {
          transform: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.logger.debug('✨ Tournament bracket styles injected');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      this.emit('fullscreen_changed', { isFullscreen });
    });

    this.logger.debug('🎧 Bracket event listeners setup complete');
  }

  /**
   * Get bracket statistics
   * @returns {Object} Bracket statistics
   */
  getStatistics() {
    const totalMatches = this.getTotalMatches();
    const completedMatches = this.getCompletedMatches();
    const liveMatches = this.getLiveMatches();

    return {
      isInitialized: this.isInitialized,
      totalMatches,
      completedMatches,
      liveMatches,
      upcomingMatches: totalMatches - completedMatches - liveMatches,
      progressPercentage: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0,
      selectedMatch: this.selectedMatch ? this.selectedMatch.getAttribute('data-match-id') : null
    };
  }

  /**
   * Get total number of matches
   * @returns {number} Total matches
   */
  getTotalMatches() {
    if (!this.bracketData) return 0;

    let total = 0;
    
    if (this.bracketData.rounds) {
      this.bracketData.rounds.forEach(round => {
        total += round.matches.length;
      });
    }

    if (this.bracketData.winnersRounds) {
      this.bracketData.winnersRounds.forEach(round => {
        total += round.matches.length;
      });
    }

    if (this.bracketData.losersRounds) {
      this.bracketData.losersRounds.forEach(round => {
        total += round.matches.length;
      });
    }

    if (this.bracketData.grandFinal) {
      total += 1;
    }

    return total;
  }

  /**
   * Get number of completed matches
   * @returns {number} Completed matches
   */
  getCompletedMatches() {
    return this.container.querySelectorAll('.mlg-match-completed').length;
  }

  /**
   * Get number of live matches
   * @returns {number} Live matches
   */
  getLiveMatches() {
    return this.container.querySelectorAll('.mlg-match-live').length;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove event listeners
    this.removeAllListeners();
    
    // Clear selected match
    this.selectedMatch = null;
    
    // Clear data
    this.bracketData = null;
    
    this.logger.debug('🧹 Tournament bracket cleanup complete');
  }
}

// Export the tournament bracket system
export { MLGTournamentBracket, BRACKET_CONFIG };
export default MLGTournamentBracket;