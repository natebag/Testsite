/**
 * Simple MLG.clan Platform Server
 * Basic Express server without complex SSL for testing
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9000;

// Basic CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:9000'
  ],
  credentials: true
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/demo', express.static(path.join(__dirname, 'demo')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'MLG.clan Gaming Platform'
  });
});

// Main application route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// Demo routes
app.get('/demo/voting', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/shared/components/examples/vote-display-demo.html'));
});

app.get('/demo/burn-vote', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/shared/components/examples/burn-vote-confirmation-demo.html'));
});

app.get('/demo/clan-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/shared/components/examples/clan-management-demo.html'));
});

app.get('/demo/content-submission', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/shared/components/examples/content-submission-demo.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log('🎮 MLG.clan Platform Server Started');
  console.log(`🌐 Main Platform: http://localhost:${PORT}`);
  console.log('📋 Available Endpoints:');
  console.log(`   🏠 Main App: http://localhost:${PORT}`);
  console.log(`   🗳️  Voting Demo: http://localhost:${PORT}/demo/voting`);
  console.log(`   🔥 Burn Vote Demo: http://localhost:${PORT}/demo/burn-vote`);
  console.log(`   👥 Clan Demo: http://localhost:${PORT}/demo/clan-management`);
  console.log(`   📝 Content Demo: http://localhost:${PORT}/demo/content-submission`);
  console.log(`   ❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log('✅ Platform ready for testing!');
});

export default app;