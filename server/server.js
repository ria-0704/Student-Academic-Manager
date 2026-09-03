require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const subjectRoutes     = require('./routes/subjects');
const unitRoutes        = require('./routes/units');
const materialRoutes    = require('./routes/materials');
const summaryRoutes     = require('./routes/summaries');
const mockRoutes        = require('./routes/mock');
const attemptRoutes     = require('./routes/attempts');
const examRoutes        = require('./routes/exams');
const plannerRoutes     = require('./routes/planner');
const dashboardRoutes   = require('./routes/dashboard');
const performanceRoutes = require('./routes/performance');
const profileRoutes     = require('./routes/profile');

app.use('/api/auth',        authRoutes);
app.use('/api/subjects',    subjectRoutes);
app.use('/api/units',       unitRoutes);
app.use('/api/materials',   materialRoutes);
app.use('/api/summaries',   summaryRoutes);
app.use('/api/mock',        mockRoutes);
app.use('/api/attempts',    attemptRoutes);
app.use('/api/exams',       examRoutes);
app.use('/api/planner',     plannerRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/profile',     profileRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Student Academic Manager API running' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 50 MB.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error.' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
