/**
 * MLG.clan Route Configuration
 * Defines all application routes with nested routes, guards, and lazy loading
 */

// Route guard functions
const AuthGuard = {
  requireAuth: async (context) => {
    const isAuthenticated = window.mlg?.wallet?.connected || false;
    
    if (!isAuthenticated) {
      window.mlg?.showNotification('Please connect your wallet to access this feature', 'warning');
      context.router.push('/dashboard');
      return false;
    }
    return true;
  },

  requireAdmin: async (context) => {
    const user = window.mlg?.user;
    
    if (!user || !user.roles?.includes('admin')) {
      window.mlg?.showNotification('Admin access required', 'error');
      context.router.push('/dashboard');
      return false;
    }
    return true;
  },

  requireClanMember: async (context) => {
    const clanId = context.to.params.clanId;
    const user = window.mlg?.user;
    
    if (!user?.clans?.includes(clanId)) {
      window.mlg?.showNotification('Clan membership required', 'warning');
      context.router.push('/clans');
      return false;
    }
    return true;
  }
};

// Lazy component loaders
const ComponentLoaders = {
  Dashboard: () => import('./components/Dashboard.js'),
  VoteVault: () => import('./components/VoteVault.js'),
  Clans: () => import('./components/Clans.js'),
  ClanDetail: () => import('./components/ClanDetail.js'),
  ContentHub: () => import('./components/ContentHub.js'),
  ContentDetail: () => import('./components/ContentDetail.js'),
  DAO: () => import('./components/DAO.js'),
  Analytics: () => import('./components/Analytics.js'),
  Profile: () => import('./components/Profile.js'),
  Settings: () => import('./components/Settings.js'),
  Mobile: () => import('./components/Mobile.js'),
  Tournament: () => import('./components/Tournament.js'),
  NotFound: () => import('./components/NotFound.js')
};

// Route components (for immediate rendering without lazy loading)
const RouteComponents = {
  Dashboard: async (context) => {
    const stats = window.mlg?.stats || {};
    return `
      <div class="dashboard-view">
        <h2 class="text-3xl font-bold mb-8 text-center text-gaming-accent">🎮 Gaming Platform Dashboard</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Quick Stats -->
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4 text-gaming-accent">Platform Overview</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-gaming-blue">${stats.users?.toLocaleString() || '2,847'}</div>
                <div class="text-sm text-gray-400">Active Users</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gaming-purple">${stats.clans?.toLocaleString() || '1,234'}</div>
                <div class="text-sm text-gray-400">Gaming Clans</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gaming-yellow">${stats.votes?.toLocaleString() || '856'}</div>
                <div class="text-sm text-gray-400">Daily Votes</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gaming-accent">${((stats.mlg || 289000) / 1000).toFixed(0)}K</div>
                <div class="text-sm text-gray-400">MLG Burned</div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <button onclick="router.push('/voting')" class="w-full bg-gaming-accent hover:bg-green-400 text-black px-4 py-2 rounded font-bold transition-colors">
                🗳️ Vote on Content
              </button>
              <button onclick="router.push('/clans')" class="w-full bg-gaming-purple hover:bg-purple-600 px-4 py-2 rounded font-bold transition-colors">
                🏛️ Browse Clans
              </button>
              <button onclick="router.push('/content')" class="w-full bg-gaming-blue hover:bg-blue-600 px-4 py-2 rounded font-bold transition-colors">
                📱 Explore Content
              </button>
            </div>
          </div>
        </div>

        <!-- System Status -->
        <div class="bg-gaming-surface rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">System Health</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="w-3 h-3 bg-gaming-accent rounded-full mx-auto mb-2 animate-pulse"></div>
              <div class="font-bold text-gaming-accent">API Online</div>
              <div class="text-xs text-gray-500">50+ endpoints</div>
            </div>
            <div class="text-center">
              <div class="w-3 h-3 bg-gaming-blue rounded-full mx-auto mb-2 animate-pulse"></div>
              <div class="font-bold text-gaming-blue">DB Connected</div>
              <div class="text-xs text-gray-500">Multi-database</div>
            </div>
            <div class="text-center">
              <div class="w-3 h-3 bg-gaming-purple rounded-full mx-auto mb-2 animate-pulse"></div>
              <div class="font-bold text-gaming-purple">Cache: 85%</div>
              <div class="text-xs text-gray-500">Redis optimized</div>
            </div>
            <div class="text-center">
              <div class="w-3 h-3 bg-gaming-yellow rounded-full mx-auto mb-2 animate-pulse"></div>
              <div class="font-bold text-gaming-yellow">WebSocket</div>
              <div class="text-xs text-gray-500">Real-time active</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  VoteVault: async (context) => {
    const walletBalance = window.mlg?.wallet?.balance?.mlg || 0;
    return `
      <div class="vote-vault-view">
        <h2 class="text-3xl font-bold mb-8 text-center">🗳️ Vote Vault - MLG Token Burn Voting</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Voting Power Panel -->
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold text-gaming-accent mb-4">Your Voting Power</h3>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span>Daily Votes Remaining</span>
                <span class="text-gaming-accent font-bold">3/4</span>
              </div>
              <div class="flex justify-between">
                <span>MLG Token Balance</span>
                <span class="text-gaming-yellow font-bold">${walletBalance.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span>Vote Cost</span>
                <span class="text-gaming-red font-bold">25 MLG</span>
              </div>
              <div class="bg-gaming-bg rounded p-4">
                <h4 class="font-bold mb-2">How Voting Works</h4>
                <ul class="text-sm space-y-1 text-gray-300">
                  <li>• 4 free daily votes per user</li>
                  <li>• Additional votes cost 25 MLG tokens</li>
                  <li>• Tokens are permanently burned</li>
                  <li>• Higher stakes = more meaningful votes</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Trending Content -->
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold text-gaming-accent mb-4">🔥 Trending Content</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gaming-bg rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-8 bg-gradient-to-r from-red-500 to-purple-600 rounded"></div>
                  <div>
                    <div class="font-medium">Epic Valorant Clutch</div>
                    <div class="text-xs text-gray-400">by ProGamer2024</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-gaming-accent font-bold text-sm">847 votes</div>
                  <button class="bg-gaming-accent text-black px-3 py-1 rounded text-xs font-bold hover:bg-green-400 transition-colors mt-1">
                    Vote (25 MLG)
                  </button>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-gaming-bg rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-8 bg-gradient-to-r from-blue-500 to-teal-600 rounded"></div>
                  <div>
                    <div class="font-medium">Rocket League Goal</div>
                    <div class="text-xs text-gray-400">by AerialMaster</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-gaming-accent font-bold text-sm">623 votes</div>
                  <button class="bg-gaming-accent text-black px-3 py-1 rounded text-xs font-bold hover:bg-green-400 transition-colors mt-1">
                    Vote (25 MLG)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  Clans: async (context) => {
    return `
      <div class="clans-view">
        <h2 class="text-3xl font-bold mb-8 text-center text-gaming-purple">🏛️ Clan Hub - Complete Clan Management</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Your Clan -->
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold text-gaming-purple mb-4">Your Clan</h3>
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-gradient-to-r from-gaming-purple to-gaming-blue rounded-full mx-auto mb-3"></div>
              <h4 class="font-bold text-lg">MLG Elite</h4>
              <p class="text-sm text-gray-400">Diamond Tier</p>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span>Members</span>
                <span class="text-gaming-accent">47/50</span>
              </div>
              <div class="flex justify-between">
                <span>Global Rank</span>
                <span class="text-gaming-yellow">#12</span>
              </div>
              <div class="flex justify-between">
                <span>Staked MLG</span>
                <span class="text-gaming-blue">125,000</span>
              </div>
            </div>
            <button onclick="router.push('/clans/mlg-elite')" class="w-full mt-4 bg-gaming-purple hover:bg-purple-600 px-4 py-2 rounded font-bold transition-colors">
              Manage Clan
            </button>
          </div>

          <!-- Clan Leaderboard -->
          <div class="lg:col-span-2 bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">🏆 Clan Leaderboard</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-gaming-bg rounded-lg">
                <div class="flex items-center space-x-3">
                  <span class="text-gaming-yellow font-bold">#1</span>
                  <div class="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                  <span class="font-medium">Phoenix Rising</span>
                </div>
                <span class="text-gaming-accent font-bold">1,247,892 pts</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gaming-bg rounded-lg">
                <div class="flex items-center space-x-3">
                  <span class="text-gray-300 font-bold">#2</span>
                  <div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full"></div>
                  <span class="font-medium">Digital Warriors</span>
                </div>
                <span class="text-gaming-accent font-bold">1,156,234 pts</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gaming-purple bg-opacity-20 rounded-lg border border-gaming-purple">
                <div class="flex items-center space-x-3">
                  <span class="text-gaming-yellow font-bold">#12</span>
                  <div class="w-8 h-8 bg-gradient-to-r from-gaming-purple to-gaming-blue rounded-full"></div>
                  <span class="font-medium">MLG Elite (Your Clan)</span>
                </div>
                <span class="text-gaming-accent font-bold">892,471 pts</span>
              </div>
            </div>
            
            <div class="mt-6 flex space-x-4">
              <button onclick="router.push('/clans/browse')" class="bg-gaming-blue hover:bg-blue-600 px-4 py-2 rounded font-bold transition-colors">
                Browse Clans
              </button>
              <button onclick="router.push('/clans/create')" class="bg-gaming-accent hover:bg-green-400 text-black px-4 py-2 rounded font-bold transition-colors">
                Create Clan
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  ClanDetail: async (context) => {
    const clanId = context.to.params.clanId;
    return `
      <div class="clan-detail-view">
        <div class="bg-gaming-surface rounded-lg p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-gradient-to-r from-gaming-purple to-gaming-blue rounded-full"></div>
              <div>
                <h2 class="text-2xl font-bold">${clanId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                <p class="text-gray-400">Diamond Tier Clan • Rank #12</p>
              </div>
            </div>
            <button class="bg-gaming-accent hover:bg-green-400 text-black px-6 py-2 rounded font-bold transition-colors">
              Join Clan
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-gaming-accent">47</div>
              <div class="text-sm text-gray-400">Members</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gaming-yellow">#12</div>
              <div class="text-sm text-gray-400">Global Rank</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gaming-blue">125K</div>
              <div class="text-sm text-gray-400">Staked MLG</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gaming-purple">892K</div>
              <div class="text-sm text-gray-400">Total Points</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">Recent Activities</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Tournament victory +500 pts</span>
                <span class="text-gaming-accent text-xs">2 hours ago</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">New member joined</span>
                <span class="text-gaming-blue text-xs">5 hours ago</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Content vote submission</span>
                <span class="text-gaming-purple text-xs">1 day ago</span>
              </div>
            </div>
          </div>

          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">Top Members</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 bg-gaming-accent rounded-full"></div>
                  <span class="text-sm font-medium">ClanLeader47</span>
                </div>
                <span class="text-gaming-yellow text-sm">15,890 pts</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 bg-gaming-blue rounded-full"></div>
                  <span class="text-sm font-medium">ProGamer2024</span>
                </div>
                <span class="text-gaming-purple text-sm">12,450 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  ContentHub: async (context) => {
    return `
      <div class="content-hub-view">
        <h2 class="text-3xl font-bold mb-8 text-center text-gaming-blue">📱 Content Hub - Multi-Platform Integration</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Platform Integration -->
          <div>
            <h3 class="text-xl font-bold text-gaming-blue mb-6">Integrated Platforms</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-red-600 rounded-lg p-4 text-center">
                <div class="text-2xl mb-2">📺</div>
                <div class="font-bold">YouTube</div>
                <div class="text-sm opacity-75">12,847 videos</div>
              </div>
              <div class="bg-black rounded-lg p-4 text-center">
                <div class="text-2xl mb-2">🎵</div>
                <div class="font-bold">TikTok</div>
                <div class="text-sm opacity-75">8,923 clips</div>
              </div>
              <div class="bg-purple-600 rounded-lg p-4 text-center">
                <div class="text-2xl mb-2">🎮</div>
                <div class="font-bold">Twitch</div>
                <div class="text-sm opacity-75">5,621 streams</div>
              </div>
              <div class="bg-blue-600 rounded-lg p-4 text-center">
                <div class="text-2xl mb-2">📘</div>
                <div class="font-bold">Facebook</div>
                <div class="text-sm opacity-75">3,456 videos</div>
              </div>
            </div>
          </div>

          <!-- Content Analytics -->
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">📊 Content Analytics</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span>Total Views Today</span>
                <span class="text-gaming-accent font-bold">2.4M</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Engagement Rate</span>
                <span class="text-gaming-blue font-bold">847K</span>
              </div>
              <div class="flex justify-between items-center">
                <span>New Creators</span>
                <span class="text-gaming-purple font-bold">156</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Trending Items</span>
                <span class="text-gaming-yellow font-bold">234</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Actions -->
        <div class="bg-gaming-surface rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">Content Management</h3>
          <div class="flex flex-wrap gap-4">
            <button onclick="router.push('/content/submit')" class="bg-gaming-accent hover:bg-green-400 text-black px-6 py-2 rounded font-bold transition-colors">
              Submit Content
            </button>
            <button onclick="router.push('/content/browse')" class="bg-gaming-blue hover:bg-blue-600 px-6 py-2 rounded font-bold transition-colors">
              Browse Content
            </button>
            <button onclick="router.push('/content/moderation')" class="bg-gaming-purple hover:bg-purple-600 px-6 py-2 rounded font-bold transition-colors">
              Moderation Queue
            </button>
          </div>
        </div>
      </div>
    `;
  },

  NotFound: async (context) => {
    return `
      <div class="not-found-view text-center py-20">
        <div class="text-6xl mb-6">🎮</div>
        <h2 class="text-4xl font-bold mb-4 text-gaming-red">404 - Page Not Found</h2>
        <p class="text-xl text-gray-400 mb-8">The page you're looking for doesn't exist in our gaming universe.</p>
        
        <div class="space-y-4">
          <button onclick="router.push('/dashboard')" class="bg-gaming-accent hover:bg-green-400 text-black px-8 py-3 rounded-lg font-bold transition-colors">
            Return to Dashboard
          </button>
          <div class="text-sm text-gray-500">
            Or try one of these popular sections:
          </div>
          <div class="flex flex-wrap gap-4 justify-center">
            <button onclick="router.push('/voting')" class="bg-gaming-surface hover:bg-gray-700 px-4 py-2 rounded transition-colors">
              Vote Vault
            </button>
            <button onclick="router.push('/clans')" class="bg-gaming-surface hover:bg-gray-700 px-4 py-2 rounded transition-colors">
              Clans
            </button>
            <button onclick="router.push('/content')" class="bg-gaming-surface hover:bg-gray-700 px-4 py-2 rounded transition-colors">
              Content Hub
            </button>
          </div>
        </div>
      </div>
    `;
  }
};

// Main route configuration
const routeConfig = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: RouteComponents.Dashboard,
    meta: {
      title: 'Dashboard',
      description: 'MLG.clan gaming platform dashboard with real-time stats',
      requiresAuth: false,
      icon: 'activity'
    }
  },
  {
    path: '/voting',
    name: 'voting',
    component: RouteComponents.VoteVault,
    meta: {
      title: 'Vote Vault',
      description: 'Democratic content voting powered by MLG token burns',
      requiresAuth: false,
      icon: 'vote'
    }
  },
  {
    path: '/clans',
    name: 'clans',
    component: RouteComponents.Clans,
    meta: {
      title: 'Clan Hub',
      description: 'Complete clan management and leaderboards',
      requiresAuth: false,
      icon: 'users'
    },
    children: [
      {
        path: '/clans/{clanId}',
        name: 'clan-detail',
        component: RouteComponents.ClanDetail,
        beforeEnter: AuthGuard.requireClanMember,
        meta: {
          title: 'Clan Details',
          requiresAuth: true
        }
      },
      {
        path: '/clans/browse',
        name: 'clans-browse',
        component: async () => `
          <div class="clans-browse-view">
            <h2 class="text-2xl font-bold mb-6">Browse All Clans</h2>
            <div class="text-center py-20 text-gray-400">
              Clan browsing interface coming soon...
            </div>
          </div>
        `,
        meta: { title: 'Browse Clans' }
      },
      {
        path: '/clans/create',
        name: 'clans-create',
        component: async () => `
          <div class="clans-create-view">
            <h2 class="text-2xl font-bold mb-6">Create New Clan</h2>
            <div class="text-center py-20 text-gray-400">
              Clan creation interface coming soon...
            </div>
          </div>
        `,
        beforeEnter: AuthGuard.requireAuth,
        meta: { title: 'Create Clan', requiresAuth: true }
      }
    ]
  },
  {
    path: '/content',
    name: 'content',
    component: RouteComponents.ContentHub,
    meta: {
      title: 'Content Hub',
      description: 'Multi-platform gaming content integration',
      icon: 'video'
    },
    children: [
      {
        path: '/content/{contentId}',
        name: 'content-detail',
        component: async (context) => `
          <div class="content-detail-view">
            <h2 class="text-2xl font-bold mb-6">Content: ${context.to.params.contentId}</h2>
            <div class="text-center py-20 text-gray-400">
              Content detail view coming soon...
            </div>
          </div>
        `,
        meta: { title: 'Content Details' }
      },
      {
        path: '/content/submit',
        name: 'content-submit',
        component: async () => `
          <div class="content-submit-view">
            <h2 class="text-2xl font-bold mb-6">Submit Content</h2>
            <div class="text-center py-20 text-gray-400">
              Content submission form coming soon...
            </div>
          </div>
        `,
        beforeEnter: AuthGuard.requireAuth,
        meta: { title: 'Submit Content', requiresAuth: true }
      },
      {
        path: '/content/browse',
        name: 'content-browse',
        component: async () => `
          <div class="content-browse-view">
            <h2 class="text-2xl font-bold mb-6">Browse Content</h2>
            <div class="text-center py-20 text-gray-400">
              Content browser coming soon...
            </div>
          </div>
        `,
        meta: { title: 'Browse Content' }
      },
      {
        path: '/content/moderation',
        name: 'content-moderation',
        component: async () => `
          <div class="content-moderation-view">
            <h2 class="text-2xl font-bold mb-6">Content Moderation</h2>
            <div class="text-center py-20 text-gray-400">
              Moderation queue coming soon...
            </div>
          </div>
        `,
        beforeEnter: AuthGuard.requireAdmin,
        meta: { title: 'Content Moderation', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },
  {
    path: '/dao',
    name: 'dao',
    component: async () => `
      <div class="dao-view">
        <h2 class="text-3xl font-bold mb-8 text-center text-gaming-yellow">🏛️ DAO Governance</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold text-gaming-yellow mb-4">Treasury</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span>Total Assets</span>
                <span class="text-gaming-accent font-bold">$2.4M</span>
              </div>
              <div class="flex justify-between">
                <span>MLG Tokens</span>
                <span class="text-gaming-blue font-bold">8.9M</span>
              </div>
              <div class="flex justify-between">
                <span>Monthly Revenue</span>
                <span class="text-gaming-purple font-bold">$180K</span>
              </div>
            </div>
          </div>
          
          <div class="lg:col-span-2 bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">🗳️ Active Proposals</h3>
            <div class="bg-gaming-bg rounded-lg p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h4 class="font-bold text-gaming-accent">Increase Tournament Prize Pool</h4>
                  <p class="text-sm text-gray-400">Increase monthly tournaments from $50K to $100K</p>
                </div>
                <div class="text-right">
                  <div class="text-sm text-gray-400">2 days left</div>
                  <div class="text-gaming-accent font-bold">78% For</div>
                </div>
              </div>
              <div class="w-full bg-gray-600 rounded-full h-2 mb-3">
                <div class="bg-gaming-accent h-2 rounded-full" style="width: 78%"></div>
              </div>
              <div class="flex space-x-2">
                <button class="bg-gaming-accent text-black px-4 py-2 rounded font-bold text-sm hover:bg-green-400 transition-colors">Vote For</button>
                <button class="bg-gaming-red px-4 py-2 rounded font-bold text-sm hover:bg-red-600 transition-colors">Vote Against</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    meta: {
      title: 'DAO Governance',
      description: 'Community-driven platform governance',
      icon: 'landmark'
    }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: async () => {
      const stats = window.mlg?.stats || {};
      return `
        <div class="analytics-view">
          <h2 class="text-3xl font-bold mb-8 text-center text-gaming-red">📊 Analytics Dashboard</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gaming-surface rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-gaming-accent">${stats.users?.toLocaleString() || '24,800'}</div>
                <div class="text-sm text-gray-400">Daily Active Users</div>
                <div class="text-xs text-gaming-accent mt-1">↑ 12% today</div>
              </div>
              
              <div class="bg-gaming-surface rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-gaming-blue">156K</div>
                <div class="text-sm text-gray-400">Transactions</div>
                <div class="text-xs text-gaming-blue mt-1">↑ 8% today</div>
              </div>
              
              <div class="bg-gaming-surface rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-gaming-yellow">$847K</div>
                <div class="text-sm text-gray-400">Revenue (30d)</div>
                <div class="text-xs text-gaming-yellow mt-1">↑ 24% MoM</div>
              </div>
              
              <div class="bg-gaming-surface rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-gaming-purple">${stats.clans?.toLocaleString() || '1,234'}</div>
                <div class="text-sm text-gray-400">Active Clans</div>
                <div class="text-xs text-gaming-purple mt-1">↑ 15% weekly</div>
              </div>
            </div>
            
            <div class="bg-gaming-surface rounded-lg p-6">
              <h3 class="text-xl font-bold mb-4">🎮 Platform Health</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span>Server Uptime</span>
                  <span class="text-gaming-accent font-bold">99.98%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>API Response Time</span>
                  <span class="text-gaming-blue font-bold">147ms</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Cache Hit Rate</span>
                  <span class="text-gaming-purple font-bold">87.3%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Active Connections</span>
                  <span class="text-gaming-yellow font-bold">1,247</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    beforeEnter: AuthGuard.requireAuth,
    meta: {
      title: 'Analytics',
      description: 'Platform performance and business intelligence',
      requiresAuth: true,
      icon: 'trending-up'
    }
  },
  {
    path: '/mobile',
    name: 'mobile',
    component: async () => `
      <div class="mobile-view">
        <h2 class="text-3xl font-bold mb-8 text-center">📱 Mobile App - Cross-Platform Gaming</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">📱 App Performance</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span>iOS Rating</span>
                <span class="text-gaming-yellow font-bold">4.9/5 ⭐</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Android Rating</span>
                <span class="text-gaming-yellow font-bold">4.8/5 ⭐</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Total Downloads</span>
                <span class="text-gaming-blue font-bold">12.4K</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Daily Active Users</span>
                <span class="text-gaming-purple font-bold">8,923</span>
              </div>
            </div>
          </div>
          
          <div class="bg-gaming-surface rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">🚀 Features</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span>Phantom Wallet Integration</span>
                <span class="text-gaming-accent">✓</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Biometric Authentication</span>
                <span class="text-gaming-accent">✓</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Offline Support</span>
                <span class="text-gaming-accent">✓</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Push Notifications</span>
                <span class="text-gaming-accent">✓</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Cross-Platform Sync</span>
                <span class="text-gaming-accent">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    meta: {
      title: 'Mobile App',
      description: 'Cross-platform mobile gaming experience',
      icon: 'smartphone'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: async () => `
      <div class="profile-view">
        <h2 class="text-2xl font-bold mb-6">User Profile</h2>
        <div class="text-center py-20 text-gray-400">
          Profile management coming soon...
        </div>
      </div>
    `,
    beforeEnter: AuthGuard.requireAuth,
    meta: {
      title: 'Profile',
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: async () => `
      <div class="settings-view">
        <h2 class="text-2xl font-bold mb-6">Settings</h2>
        <div class="text-center py-20 text-gray-400">
          Settings panel coming soon...
        </div>
      </div>
    `,
    beforeEnter: AuthGuard.requireAuth,
    meta: {
      title: 'Settings',
      requiresAuth: true
    }
  },
  {
    path: '/tournaments',
    name: 'tournaments',
    component: async () => `
      <div class="tournaments-view">
        <h2 class="text-2xl font-bold mb-6">🏆 Tournaments</h2>
        <div class="text-center py-20 text-gray-400">
          Tournament system coming soon...
        </div>
      </div>
    `,
    meta: {
      title: 'Tournaments'
    }
  },
  {
    path: '/404',
    name: 'not-found',
    component: RouteComponents.NotFound,
    meta: {
      title: 'Page Not Found'
    }
  },
  {
    path: '*',
    redirect: '/404'
  }
];

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.routeConfig = routeConfig;
  window.AuthGuard = AuthGuard;
  window.RouteComponents = RouteComponents;
  window.ComponentLoaders = ComponentLoaders;
}

// Export for module use (if available)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { routeConfig, AuthGuard, RouteComponents, ComponentLoaders };
}