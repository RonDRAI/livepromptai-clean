const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'livepromptai',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      database: 'disconnected'
    });
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Conversation Routes
app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { title, prospect_name, prospect_company } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      `INSERT INTO conversations (user_id, title, prospect_name, prospect_company, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING *`,
      [userId, title, prospect_name, prospect_company]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT c.*, COUNT(m.id) as message_count 
       FROM conversations c 
       LEFT JOIN messages m ON c.id = m.conversation_id 
       WHERE c.user_id = $1 
       GROUP BY c.id 
       ORDER BY c.updated_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Message Routes
app.post('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { content, speaker, confidence, detected_patterns, ai_analysis } = req.body;
    const userId = req.user.userId;

    // Verify conversation belongs to user
    const convResult = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, content, speaker, confidence, detected_patterns, ai_analysis, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [conversationId, content, speaker, confidence, JSON.stringify(detected_patterns), JSON.stringify(ai_analysis)]
    );

    // Update conversation timestamp
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.userId;
    const { limit = 100, offset = 0 } = req.query;

    // Verify conversation belongs to user
    const convResult = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics Routes
app.get('/api/analytics/patterns', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = '7d' } = req.query;

    let timeCondition = '';
    switch (timeframe) {
      case '1d':
        timeCondition = "AND m.created_at >= NOW() - INTERVAL '1 day'";
        break;
      case '7d':
        timeCondition = "AND m.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "AND m.created_at >= NOW() - INTERVAL '30 days'";
        break;
    }

    const result = await pool.query(`
      SELECT 
        jsonb_array_elements(detected_patterns)->>'type' as pattern_type,
        COUNT(*) as count,
        AVG((jsonb_array_elements(detected_patterns)->>'confidence')::float) as avg_confidence
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = $1 
        AND detected_patterns IS NOT NULL 
        AND jsonb_array_length(detected_patterns) > 0
        ${timeCondition}
      GROUP BY pattern_type
      ORDER BY count DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get pattern analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        AVG(CASE WHEN m.speaker = 'rep' THEN 1 ELSE 0 END) as rep_talk_ratio,
        AVG(m.confidence) as avg_confidence,
        COUNT(CASE WHEN detected_patterns IS NOT NULL THEN 1 END) as messages_with_patterns
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = $1
    `, [userId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LivePromptAI API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
