/**
 * MLG.clan Development Server
 * Simple Express server to serve the platform files during development
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
app.use(express.static(path.join(__dirname, 'src')));
app.use('/ui', express.static(path.join(__dirname, 'src/ui')));
app.use('/examples', express.static(path.join(__dirname, 'src/ui/examples')));

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

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🎮 MLG.clan Development Server running on port ${PORT}`);
  console.log(`🔗 Main app: http://localhost:${PORT}`);
  console.log(`🗳️  Voting demo: http://localhost:${PORT}/demo/voting`);
  console.log(`🔥 Burn vote demo: http://localhost:${PORT}/demo/burn-vote`);
  console.log(`👥 Clan management: http://localhost:${PORT}/demo/clan-management`);
  console.log(`📝 Content submission: http://localhost:${PORT}/demo/content-submission`);
  console.log('');
  console.log('✨ All systems ready for testing!');
});

export default app;