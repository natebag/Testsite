/**
 * MLG.clan Development Server
 * Enhanced Express server with better error handling
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/ui', express.static(path.join(__dirname, 'src/ui')));
app.use('/examples', express.static(path.join(__dirname, 'src/ui/examples')));
app.use('/config', express.static(path.join(__dirname, 'config')));

// API endpoints (mock for development)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    network: 'mainnet-beta',
    mlgToken: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
  });
});

// Mock API for wallet data
app.get('/api/wallet/balance', (req, res) => {
  res.json({
    balance: 1337.42,
    currency: 'MLG',
    lastUpdate: new Date().toISOString()
  });
});

// Mock API for clan data
app.get('/api/clans', (req, res) => {
  res.json({
    clans: [
      { id: 1, name: 'Elite Gamers', tier: 'Diamond', members: 147 },
      { id: 2, name: 'Shadow Legends', tier: 'Gold', members: 89 },
      { id: 3, name: 'Cyber Warriors', tier: 'Silver', members: 42 }
    ]
  });
});

// Serve main application
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  console.log('Serving index from:', indexPath);
  res.sendFile(indexPath);
});

// Serve demos and examples
app.get('/demo/voting', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/vote-display-demo.html'));
});

app.get('/demo/burn-vote', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/burn-vote-confirmation-demo.html'));
});

app.get('/demo/clan-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/clan-management-demo.html'));
});

app.get('/demo/content-submission', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/content-submission-demo.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not found:', req.url);
  res.status(404).json({ error: 'Not found', path: req.url });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('═'.repeat(60));
  console.log('🎮 MLG.clan Gaming Platform Development Server');
  console.log('═'.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('');
  console.log('🔗 Available URLs:');
  console.log(`   Main Platform:     http://localhost:${PORT}`);
  console.log(`   Voting Demo:       http://localhost:${PORT}/demo/voting`);
  console.log(`   Burn Vote Demo:    http://localhost:${PORT}/demo/burn-vote`);
  console.log(`   Clan Management:   http://localhost:${PORT}/demo/clan-management`);
  console.log(`   Content Upload:    http://localhost:${PORT}/demo/content-submission`);
  console.log('');
  console.log('📡 API Endpoints:');
  console.log(`   Health Check:      http://localhost:${PORT}/api/health`);
  console.log(`   Wallet Balance:    http://localhost:${PORT}/api/wallet/balance`);
  console.log(`   Clans List:        http://localhost:${PORT}/api/clans`);
  console.log('');
  console.log('✨ Platform Features:');
  console.log('   ✅ Unified dashboard with Xbox 360 aesthetic');
  console.log('   ✅ Phantom wallet integration (mock & real)');
  console.log('   ✅ Clan management with token staking');
  console.log('   ✅ DAO voting with burn-to-vote mechanics');
  console.log('   ✅ Content hub with multi-platform embeds');
  console.log('   ✅ Achievement system with rewards');
  console.log('   ✅ Treasury dashboard (mock UI)');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('═'.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down server gracefully...');
  server.close(() => {
    console.log('👋 Server closed. Goodbye!');
    process.exit(0);
  });
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

export default app;