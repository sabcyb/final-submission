require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const BetterSqlite3 = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Database Configuration
const dbPath = path.join(__dirname, 'database.sqlite');

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, 'w'));
  console.log('Created new SQLite database file');
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  dialectOptions: {
    mode: BetterSqlite3.OPEN_READWRITE | BetterSqlite3.OPEN_CREATE,
  }
});

// Force Sequelize to use better-sqlite3
sequelize.connectionManager.lib = BetterSqlite3;

// Admin Model
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
}, { timestamps: false });

// Note Model
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
}, { timestamps: false });

// Relationships
Admin.hasMany(Note);
Note.belongsTo(Admin);

// Auth Middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
    if (err) return res.sendStatus(403);
    req.admin = admin;
    next();
  });
};

// Routes
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username !== process.env.ADMIN_USERNAME || 
      !bcrypt.compareSync(password, process.env.ADMIN_HASH)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Protected Routes
app.get('/api/notes', authenticateAdmin, async (req, res) => {
  try {
    const notes = await Note.findAll({ where: { AdminId: req.admin.id } });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', authenticateAdmin, async (req, res) => {
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

app.put('/api/notes/:id', authenticateAdmin, async (req, res) => {
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

app.delete('/api/notes/:id', authenticateAdmin, async (req, res) => {
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

// Initialize Database and Server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    
    await sequelize.sync();
    console.log('Database synchronized');
    
    // Create default admin if not exists
    const adminCount = await Admin.count();
    if (adminCount === 0 && process.env.ADMIN_HASH) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_HASH
      });
      console.log('Default admin account created');
    }
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
})();