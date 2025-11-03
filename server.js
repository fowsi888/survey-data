require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-change-this';
const DB_PATH = process.env.DB_PATH || './survey.db';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Initialize SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  // Responses table - New simplified structure for rating questions
  db.run(`CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    q1 INTEGER NOT NULL,
    q2 INTEGER NOT NULL,
    q3 INTEGER NOT NULL,
    q4 INTEGER NOT NULL,
    q5 INTEGER NOT NULL,
    q6 INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating responses table:', err);
    } else {
      console.log('Responses table created or already exists');
    }
  });

  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, async (err) => {
    if (err) {
      console.error('Error creating admin_users table:', err);
    } else {
      // Create default admin user from environment variables
      const defaultPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      db.run(`INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)`,
        [ADMIN_USERNAME, defaultPassword],
        (err) => {
          if (err) console.error('Error creating default admin:', err);
          else console.log(`Default admin user created  `);
        }
      );
    }
  });
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Routes

// Serve survey page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit survey response
app.post('/api/submit-survey', (req, res) => {
  const { q1, q2, q3, q4, q5, q6 } = req.body;

  // Validate that all questions are answered with values 0-5
  const questions = [q1, q2, q3, q4, q5, q6];
  for (let i = 0; i < questions.length; i++) {
    const value = parseInt(questions[i]);
    if (isNaN(value) || value < 0 || value > 5) {
      return res.status(400).json({ error: `Invalid value for question ${i + 1}` });
    }
  }

  const query = `INSERT INTO responses (q1, q2, q3, q4, q5, q6) VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(query, [q1, q2, q3, q4, q5, q6], function(err) {
    if (err) {
      console.error('Error inserting survey response:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admin_users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (passwordMatch) {
      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({ success: true, username: user.username });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// Get all survey responses (protected)
app.get('/api/responses', isAuthenticated, (req, res) => {
  db.all('SELECT * FROM responses ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching responses:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get analytics summary (protected)
app.get('/api/analytics', isAuthenticated, (req, res) => {
  // Get total responses
  db.get('SELECT COUNT(*) as total FROM responses', [], (err, row) => {
    if (err) {
      console.error('Error getting total:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const total = row.total;

    // Get aggregated statistics for each question
    db.all('SELECT * FROM responses', [], (err, rows) => {
      if (err) {
        console.error('Error fetching all responses:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Initialize counters for each question (0-5 scale)
      const questionStats = {
        q1: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, avg: 0 },
        q2: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, avg: 0 },
        q3: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, avg: 0 },
        q4: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, avg: 0 },
        q5: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, avg: 0 },
        q6: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, avg: 0 }
      };

      // Count responses for each rating
      rows.forEach(row => {
        for (let i = 1; i <= 6; i++) {
          const qKey = `q${i}`;
          const value = row[qKey];
          if (value >= 0 && value <= 5) {
            questionStats[qKey][value]++;
          }
        }
      });

      // Calculate averages
      for (let i = 1; i <= 6; i++) {
        const qKey = `q${i}`;
        let sum = 0;
        let count = 0;
        for (let rating = 0; rating <= 5; rating++) {
          sum += rating * questionStats[qKey][rating];
          count += questionStats[qKey][rating];
        }
        questionStats[qKey].avg = count > 0 ? (sum / count).toFixed(2) : 0;
      }

      res.json({
        total,
        questionStats
      });
    });
  });
});


// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/dashboard`);
  console.log(`Admin credentials configured from .env file`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
