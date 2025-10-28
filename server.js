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
  // Responses table
  db.run(`CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age TEXT,
    gender TEXT,
    education TEXT,
    occupation TEXT,
    visit_frequency TEXT,
    info_search TEXT,
    info_search_other TEXT,
    info_source TEXT,
    info_source_other TEXT,
    ai_services TEXT,
    ai_services_other TEXT,
    interface_preference TEXT,
    interface_other TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating responses table:', err);
    } else {
      // Add new columns if they don't exist (for existing databases)
      db.run(`ALTER TABLE responses ADD COLUMN visit_frequency TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding visit_frequency column:', err);
        }
      });
      db.run(`ALTER TABLE responses ADD COLUMN info_source TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding info_source column:', err);
        }
      });
      db.run(`ALTER TABLE responses ADD COLUMN info_source_other TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding info_source_other column:', err);
        }
      });
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
  const {
    age,
    gender,
    education,
    occupation,
    visitFrequency,
    infoSearch,
    infoSearchOther,
    infoSource,
    infoSourceOther,
    aiServices,
    aiServicesOther,
    interfacePreference,
    interfaceOther
  } = req.body;

  const query = `INSERT INTO responses
    (age, gender, education, occupation, visit_frequency, info_search, info_search_other,
     info_source, info_source_other, ai_services, ai_services_other, interface_preference, interface_other)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    age,
    gender,
    education,
    occupation,
    visitFrequency,
    JSON.stringify(infoSearch),
    infoSearchOther || '',
    JSON.stringify(infoSource),
    infoSourceOther || '',
    JSON.stringify(aiServices),
    aiServicesOther || '',
    interfacePreference,
    interfaceOther || ''
  ], function(err) {
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

    // Parse JSON strings back to arrays
    const parsedRows = rows.map(row => ({
      ...row,
      info_search: JSON.parse(row.info_search || '[]'),
      info_source: JSON.parse(row.info_source || '[]'),
      ai_services: JSON.parse(row.ai_services || '[]')
    }));

    res.json(parsedRows);
  });
});

// Get analytics summary (protected)
app.get('/api/analytics', isAuthenticated, (req, res) => {
  const analytics = {};

  // Get total responses
  db.get('SELECT COUNT(*) as total FROM responses', [], (err, row) => {
    if (err) {
      console.error('Error getting total:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    analytics.total = row.total;

    // Get all responses for processing
    db.all('SELECT * FROM responses', [], (err, rows) => {
      if (err) {
        console.error('Error fetching all responses:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Process demographics
      analytics.demographics = {
        age: {},
        gender: {},
        education: {},
        occupation: {}
      };

      // Process visit frequency
      analytics.visitFrequency = {};

      // Process info search
      analytics.infoSearch = {};

      // Process info source
      analytics.infoSource = {};

      // Process AI services
      analytics.aiServices = {};

      // Process interface preferences
      analytics.interfacePreference = {};

      rows.forEach(row => {
        // Demographics
        analytics.demographics.age[row.age] = (analytics.demographics.age[row.age] || 0) + 1;
        analytics.demographics.gender[row.gender] = (analytics.demographics.gender[row.gender] || 0) + 1;
        analytics.demographics.education[row.education] = (analytics.demographics.education[row.education] || 0) + 1;
        if (row.occupation) {
          analytics.demographics.occupation[row.occupation] = (analytics.demographics.occupation[row.occupation] || 0) + 1;
        }

        // Visit Frequency
        if (row.visit_frequency) {
          analytics.visitFrequency[row.visit_frequency] = (analytics.visitFrequency[row.visit_frequency] || 0) + 1;
        }

        // Info Search
        try {
          const infoSearchArray = JSON.parse(row.info_search || '[]');
          infoSearchArray.forEach(item => {
            analytics.infoSearch[item] = (analytics.infoSearch[item] || 0) + 1;
          });
        } catch (e) {
          console.error('Error parsing info_search:', e);
        }

        // Info Source
        try {
          const infoSourceArray = JSON.parse(row.info_source || '[]');
          infoSourceArray.forEach(item => {
            analytics.infoSource[item] = (analytics.infoSource[item] || 0) + 1;
          });
        } catch (e) {
          console.error('Error parsing info_source:', e);
        }

        // AI Services
        try {
          const aiServicesArray = JSON.parse(row.ai_services || '[]');
          aiServicesArray.forEach(item => {
            analytics.aiServices[item] = (analytics.aiServices[item] || 0) + 1;
          });
        } catch (e) {
          console.error('Error parsing ai_services:', e);
        }

        // Interface Preference
        if (row.interface_preference) {
          analytics.interfacePreference[row.interface_preference] =
            (analytics.interfacePreference[row.interface_preference] || 0) + 1;
        }
      });

      res.json(analytics);
    });
  });
});

// Get correlation patterns (protected)
app.get('/api/correlations', isAuthenticated, (req, res) => {
  db.all('SELECT * FROM responses', [], (err, rows) => {
    if (err) {
      console.error('Error fetching responses for correlations:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const correlations = {
      // Age vs Interface
      ageVsInterface: {},
      // Education vs Info Search
      educationVsInfoSearch: {},
      // Occupation vs AI Services
      occupationVsAiServices: {},
      // Visit Frequency vs Interface
      visitFrequencyVsInterface: {},
      // Age vs Visit Frequency
      ageVsVisitFrequency: {},
      // Education vs Interface
      educationVsInterface: {},
      // Occupation patterns
      occupationPatterns: {}
    };

    rows.forEach(row => {
      // Age vs Interface
      const age = row.age;
      const interfacePref = row.interface_preference;
      if (age && interfacePref) {
        if (!correlations.ageVsInterface[age]) correlations.ageVsInterface[age] = {};
        correlations.ageVsInterface[age][interfacePref] = (correlations.ageVsInterface[age][interfacePref] || 0) + 1;
      }

      // Education vs Info Search
      const education = row.education;
      if (education && row.info_search) {
        try {
          const infoSearchArray = JSON.parse(row.info_search);
          if (!correlations.educationVsInfoSearch[education]) correlations.educationVsInfoSearch[education] = {};
          infoSearchArray.forEach(item => {
            correlations.educationVsInfoSearch[education][item] = (correlations.educationVsInfoSearch[education][item] || 0) + 1;
          });
        } catch (e) {}
      }

      // Occupation vs AI Services
      const occupation = row.occupation;
      if (occupation && row.ai_services) {
        try {
          const aiServicesArray = JSON.parse(row.ai_services);
          if (!correlations.occupationVsAiServices[occupation]) correlations.occupationVsAiServices[occupation] = {};
          aiServicesArray.forEach(item => {
            correlations.occupationVsAiServices[occupation][item] = (correlations.occupationVsAiServices[occupation][item] || 0) + 1;
          });
        } catch (e) {}
      }

      // Visit Frequency vs Interface
      const visitFreq = row.visit_frequency;
      if (visitFreq && interfacePref) {
        if (!correlations.visitFrequencyVsInterface[visitFreq]) correlations.visitFrequencyVsInterface[visitFreq] = {};
        correlations.visitFrequencyVsInterface[visitFreq][interfacePref] = (correlations.visitFrequencyVsInterface[visitFreq][interfacePref] || 0) + 1;
      }

      // Age vs Visit Frequency
      if (age && visitFreq) {
        if (!correlations.ageVsVisitFrequency[age]) correlations.ageVsVisitFrequency[age] = {};
        correlations.ageVsVisitFrequency[age][visitFreq] = (correlations.ageVsVisitFrequency[age][visitFreq] || 0) + 1;
      }

      // Education vs Interface
      if (education && interfacePref) {
        if (!correlations.educationVsInterface[education]) correlations.educationVsInterface[education] = {};
        correlations.educationVsInterface[education][interfacePref] = (correlations.educationVsInterface[education][interfacePref] || 0) + 1;
      }

      // Occupation patterns (aggregate all data per occupation)
      if (occupation) {
        if (!correlations.occupationPatterns[occupation]) {
          correlations.occupationPatterns[occupation] = {
            count: 0,
            ageGroups: {},
            education: {},
            visitFrequency: {},
            infoSearch: {},
            aiServices: {},
            interface: {}
          };
        }

        correlations.occupationPatterns[occupation].count += 1;

        if (age) {
          correlations.occupationPatterns[occupation].ageGroups[age] =
            (correlations.occupationPatterns[occupation].ageGroups[age] || 0) + 1;
        }
        if (education) {
          correlations.occupationPatterns[occupation].education[education] =
            (correlations.occupationPatterns[occupation].education[education] || 0) + 1;
        }
        if (visitFreq) {
          correlations.occupationPatterns[occupation].visitFrequency[visitFreq] =
            (correlations.occupationPatterns[occupation].visitFrequency[visitFreq] || 0) + 1;
        }
        if (interfacePref) {
          correlations.occupationPatterns[occupation].interface[interfacePref] =
            (correlations.occupationPatterns[occupation].interface[interfacePref] || 0) + 1;
        }

        try {
          const infoSearchArray = JSON.parse(row.info_search || '[]');
          infoSearchArray.forEach(item => {
            correlations.occupationPatterns[occupation].infoSearch[item] =
              (correlations.occupationPatterns[occupation].infoSearch[item] || 0) + 1;
          });
        } catch (e) {}

        try {
          const aiServicesArray = JSON.parse(row.ai_services || '[]');
          aiServicesArray.forEach(item => {
            correlations.occupationPatterns[occupation].aiServices[item] =
              (correlations.occupationPatterns[occupation].aiServices[item] || 0) + 1;
          });
        } catch (e) {}
      }
    });

    res.json(correlations);
  });
});

// Get correlation patterns (protected)
app.get('/api/correlations', isAuthenticated, (req, res) => {
  db.all('SELECT * FROM responses', [], (err, rows) => {
    if (err) {
      console.error('Error fetching responses for correlations:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const correlations = {
      // Age vs Interface
      ageVsInterface: {},
      // Education vs Info Search
      educationVsInfoSearch: {},
      // Occupation vs AI Services
      occupationVsAiServices: {},
      // Visit Frequency vs Interface
      visitFrequencyVsInterface: {},
      // Age vs Visit Frequency
      ageVsVisitFrequency: {},
      // Education vs Interface
      educationVsInterface: {},
      // Occupation patterns
      occupationPatterns: {}
    };

    rows.forEach(row => {
      // Age vs Interface
      const age = row.age;
      const interfacePref = row.interface_preference;
      if (age && interfacePref) {
        if (!correlations.ageVsInterface[age]) correlations.ageVsInterface[age] = {};
        correlations.ageVsInterface[age][interfacePref] = (correlations.ageVsInterface[age][interfacePref] || 0) + 1;
      }

      // Education vs Info Search
      const education = row.education;
      if (education && row.info_search) {
        try {
          const infoSearchArray = JSON.parse(row.info_search);
          if (!correlations.educationVsInfoSearch[education]) correlations.educationVsInfoSearch[education] = {};
          infoSearchArray.forEach(item => {
            correlations.educationVsInfoSearch[education][item] = (correlations.educationVsInfoSearch[education][item] || 0) + 1;
          });
        } catch (e) {}
      }

      // Occupation vs AI Services
      const occupation = row.occupation;
      if (occupation && row.ai_services) {
        try {
          const aiServicesArray = JSON.parse(row.ai_services);
          if (!correlations.occupationVsAiServices[occupation]) correlations.occupationVsAiServices[occupation] = {};
          aiServicesArray.forEach(item => {
            correlations.occupationVsAiServices[occupation][item] = (correlations.occupationVsAiServices[occupation][item] || 0) + 1;
          });
        } catch (e) {}
      }

      // Visit Frequency vs Interface
      const visitFreq = row.visit_frequency;
      if (visitFreq && interfacePref) {
        if (!correlations.visitFrequencyVsInterface[visitFreq]) correlations.visitFrequencyVsInterface[visitFreq] = {};
        correlations.visitFrequencyVsInterface[visitFreq][interfacePref] = (correlations.visitFrequencyVsInterface[visitFreq][interfacePref] || 0) + 1;
      }

      // Age vs Visit Frequency
      if (age && visitFreq) {
        if (!correlations.ageVsVisitFrequency[age]) correlations.ageVsVisitFrequency[age] = {};
        correlations.ageVsVisitFrequency[age][visitFreq] = (correlations.ageVsVisitFrequency[age][visitFreq] || 0) + 1;
      }

      // Education vs Interface
      if (education && interfacePref) {
        if (!correlations.educationVsInterface[education]) correlations.educationVsInterface[education] = {};
        correlations.educationVsInterface[education][interfacePref] = (correlations.educationVsInterface[education][interfacePref] || 0) + 1;
      }

      // Occupation patterns (aggregate all data per occupation)
      if (occupation) {
        if (!correlations.occupationPatterns[occupation]) {
          correlations.occupationPatterns[occupation] = {
            count: 0,
            ageGroups: {},
            education: {},
            visitFrequency: {},
            infoSearch: {},
            aiServices: {},
            interface: {}
          };
        }

        correlations.occupationPatterns[occupation].count += 1;

        if (age) {
          correlations.occupationPatterns[occupation].ageGroups[age] =
            (correlations.occupationPatterns[occupation].ageGroups[age] || 0) + 1;
        }
        if (education) {
          correlations.occupationPatterns[occupation].education[education] =
            (correlations.occupationPatterns[occupation].education[education] || 0) + 1;
        }
        if (visitFreq) {
          correlations.occupationPatterns[occupation].visitFrequency[visitFreq] =
            (correlations.occupationPatterns[occupation].visitFrequency[visitFreq] || 0) + 1;
        }
        if (interfacePref) {
          correlations.occupationPatterns[occupation].interface[interfacePref] =
            (correlations.occupationPatterns[occupation].interface[interfacePref] || 0) + 1;
        }

        try {
          const infoSearchArray = JSON.parse(row.info_search || '[]');
          infoSearchArray.forEach(item => {
            correlations.occupationPatterns[occupation].infoSearch[item] =
              (correlations.occupationPatterns[occupation].infoSearch[item] || 0) + 1;
          });
        } catch (e) {}

        try {
          const aiServicesArray = JSON.parse(row.ai_services || '[]');
          aiServicesArray.forEach(item => {
            correlations.occupationPatterns[occupation].aiServices[item] =
              (correlations.occupationPatterns[occupation].aiServices[item] || 0) + 1;
          });
        } catch (e) {}
      }
    });

    res.json(correlations);
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
