require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const Database = require('better-sqlite3'); // Direct import
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE SETUP =================
const dbPath = path.join(__dirname, 'database.sqlite');

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('Created new SQLite database file');
}

// Custom ConnectionManager to force better-sqlite3
class BetterSqliteConnectionManager extends Sequelize.ConnectionManager {
  constructor(dialect, sequelize) {
    super(dialect, sequelize);
    this.lib = Database;
  }

  async connect(config) {
    return new this.lib(config.storage, {
      verbose: console.log
    });
  }
}

// Custom Dialect
class BetterSqliteDialect extends Sequelize.Dialect {
  static ConnectionManager = BetterSqliteConnectionManager;

  constructor(sequelize) {
    super(sequelize);
    this.sequelize = sequelize;
    this.connectionManager = new this.constructor.ConnectionManager(this, sequelize);
  }
}

// Initialize Sequelize with our custom dialect
const sequelize = new Sequelize({
  dialectModule: BetterSqliteDialect,
  storage: dbPath,
  logging: false
});

// ================= MODELS =================
const Admin = sequelize.define('Admin', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Note = sequelize.define('Note', {
  title: {
    type: DataTypes.STRING,
    defaultValue: 'New Note'
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#ffff99'
  },
  positionX: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  positionY: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  width: {
    type: DataTypes.INTEGER,
    defaultValue: 250
  },
  height: {
    type: DataTypes.INTEGER,
    defaultValue: 200
  }
});

// ================= RELATIONSHIPS =================
Admin.hasMany(Note);
Note.belongsTo(Admin);

// =============================================
// ROUTES
// =============================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== process.env.ADMIN_USERNAME || 
        !bcrypt.compareSync(password, process.env.ADMIN_HASH)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected Note Routes
app.use('/api/notes', authenticateAdmin);

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.findAll({ where: { AdminId: req.admin.id } });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new note
app.post('/api/notes', async (req, res) => {
  try {
    const note = await Note.create({ 
      ...req.body, 
      AdminId: req.admin.id 
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
app.put('/api/notes/:id', async (req, res) => {
  try {
    await Note.update(req.body, { 
      where: { 
        id: req.params.id,
        AdminId: req.admin.id 
      } 
    });
    res.json({ message: 'Note updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await Note.destroy({ 
      where: { 
        id: req.params.id,
        AdminId: req.admin.id 
      } 
    });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= SERVER INIT =================
(async () => {
    try {
      // Test connection
      await sequelize.authenticate();
      console.log('Database connection established');
      
      // Sync models
      await sequelize.sync();
      console.log('Database synchronized');
      
      // Create default admin
      const adminCount = await Admin.count();
      if (adminCount === 0 && process.env.ADMIN_HASH) {
        await Admin.create({
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_HASH
        });
        console.log('Default admin created');
      }
      
      // Start server
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Initialization failed:', error);
      process.exit(1);
    }
  })();