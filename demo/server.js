/**
 * Simple Demo Server for MLG.clan Platform
 * 
 * This server demonstrates the complete MLG.clan platform with all implemented features.
 * It serves the demo HTML and provides basic API endpoints to showcase functionality.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS Configuration for Cross-Origin Development
const corsOptions = {
  origin: [
    'http://localhost:9000', // Frontend development server
    'http://localhost:3000', // Main development server
    'http://localhost:3001', // Demo server
    'http://127.0.0.1:9000',
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-API-Key'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours for preflight cache
  optionsSuccessStatus: 200 // Support legacy browsers
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  next();
});
app.use(express.static(path.join(__dirname)));

// Serve demo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Demo API endpoints to showcase functionality
app.get('/api/demo/status', (req, res) => {
  res.json({
    success: true,
    platform: 'MLG.clan',
    status: 'operational',
    systems: {
      backend: 'online',
      web3: 'connected',
      realtime: 'active',
      content: 'processing',
      mobile: 'deployed',
      dao: 'governance_active'
    },
    stats: {
      users_online: 2847 + Math.floor(Math.random() * 100),
      transactions_hour: 1234 + Math.floor(Math.random() * 50),
      votes_today: 856 + Math.floor(Math.random() * 25),
      content_items: 1847 + Math.floor(Math.random() * 75)
    }
  });
});

app.get('/api/demo/wallet', (req, res) => {
  res.json({
    success: true,
    wallet: {
      connected: false,
      address: null,
      balance: {
        sol: 0,
        mlg: 0
      }
    }
  });
});

app.post('/api/demo/wallet/connect', (req, res) => {
  const { publicKey } = req.body;
  
  res.json({
    success: true,
    wallet: {
      connected: true,
      address: publicKey,
      balance: {
        sol: 2.45,
        mlg: 1250
      }
    },
    message: 'Wallet connected successfully'
  });
});

app.get('/api/demo/voting', (req, res) => {
  res.json({
    success: true,
    voting: {
      daily_votes_remaining: 3,
      mlg_balance: 1250,
      next_vote_cost: 25,
      total_votes_today: 12847,
      mlg_burned_today: 289432,
      active_voters: 5621
    },
    trending_content: [
      {
        id: 1,
        title: "Epic Valorant Clutch - 1v5 Ace",
        creator: "ProGamer2024",
        votes: 847,
        platform: "youtube",
        thumbnail: "/api/demo/thumbnail/1"
      },
      {
        id: 2,
        title: "Insane Rocket League Goal",
        creator: "AerialMaster",
        votes: 623,
        platform: "tiktok",
        thumbnail: "/api/demo/thumbnail/2"
      }
    ]
  });
});

app.get('/api/demo/clans', (req, res) => {
  res.json({
    success: true,
    user_clan: {
      name: "MLG Elite",
      members: 47,
      max_members: 50,
      rank: 12,
      staked_mlg: 125000,
      win_rate: 87
    },
    leaderboard: [
      { rank: 1, name: "Phoenix Rising", points: 1247892 },
      { rank: 2, name: "Digital Warriors", points: 1156234 },
      { rank: 12, name: "MLG Elite", points: 892471, user_clan: true }
    ],
    treasury: {
      balance: 45670,
      monthly_income: 12500,
      pending_votes: 3
    }
  });
});

app.get('/api/demo/content', (req, res) => {
  res.json({
    success: true,
    platforms: {
      youtube: { videos: 12847, status: 'active' },
      tiktok: { clips: 8923, status: 'active' },
      twitch: { streams: 5621, status: 'active' },
      facebook: { videos: 3456, status: 'active' }
    },
    trending: [
      {
        title: "World Championship Finals - Epic Comeback",
        platform: "YouTube",
        creator: "ProGamesCentral",
        views: "1.2M",
        upvotes: 2847,
        downvotes: 123
      },
      {
        title: "Insane Rocket League Trick Shots",
        platform: "TikTok",
        creator: "@AerialGod",
        views: "890K",
        upvotes: 1923,
        downvotes: 87
      }
    ],
    analytics: {
      total_views_today: "2.4M",
      engagement_rate: "847K",
      new_creators: 156
    }
  });
});

app.get('/api/demo/dao', (req, res) => {
  res.json({
    success: true,
    treasury: {
      total_assets: "$2.4M",
      mlg_tokens: "8.9M",
      monthly_revenue: "$180K"
    },
    governance: {
      active_proposals: 7,
      total_voters: 8921,
      participation_rate: 67
    },
    user_voting: {
      mlg_holdings: 1250,
      voting_weight: 1.5,
      proposals_voted: 23
    },
    proposals: [
      {
        id: 47,
        title: "Increase Tournament Prize Pool",
        description: "Increase monthly tournament prizes from $50K to $100K",
        support_percentage: 78,
        ends_in_days: 2,
        status: "active"
      },
      {
        id: 46,
        title: "New Platform Features",
        description: "Add live streaming integration and clan voice channels",
        support_percentage: 92,
        ends_in_days: 5,
        status: "active"
      }
    ]
  });
});

app.get('/api/demo/analytics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      daily_active_users: 24891,
      transactions: "156K",
      revenue_30d: "$847K",
      active_clans: 2847
    },
    gaming_activity: {
      votes_cast_today: 12847,
      content_submissions: 1234,
      clan_battles: 456,
      tournaments_active: 23
    },
    token_metrics: {
      mlg_burned_today: 289432,
      mlg_earned_today: 156789,
      average_vote_cost: 25,
      token_velocity: 2.4
    },
    growth: {
      user_retention_7d: 89,
      revenue_per_user: "$34.50",
      user_satisfaction: 4.8
    }
  });
});

app.get('/api/demo/mobile', (req, res) => {
  res.json({
    success: true,
    app_performance: {
      ios_rating: 4.9,
      android_rating: 4.8,
      downloads: "12.4K",
      daily_users: 8923
    },
    features: {
      phantom_wallet: "integrated",
      biometric_auth: "touchid_faceid",
      offline_mode: "full_support",
      push_notifications: "real_time"
    },
    development_status: {
      ios_version: "v1.2.0",
      android_version: "v1.2.0",
      beta_testers: 500,
      app_store_status: "submitted"
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MLG.clan Demo Server running on http://localhost:${PORT}`);
  console.log(`📱 Complete gaming platform demo with all features`);
  console.log(`🎮 Features: Web3, Voting, Clans, Content, DAO, Mobile, Analytics`);
  console.log(`⚡ Backend: PostgreSQL, MongoDB, Redis, WebSocket, API`);
});

module.exports = app;