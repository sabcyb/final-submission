const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// Admin Model
const Admin = sequelize.define('Admin', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING
});

// Note Model
const Note = sequelize.define('Note', {
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
  color: { type: DataTypes.STRING, defaultValue: '#ffff99' },
  positionX: { type: DataTypes.INTEGER, defaultValue: 100 },
  positionY: { type: DataTypes.INTEGER, defaultValue: 100 },
  userId: DataTypes.INTEGER // Stores which admin created the note
});

// Auth Middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'ADMIN_SECRET_KEY', (err, admin) => {
    if (err) return res.sendStatus(403);
    req.admin = admin;
    next();
  });
};

// Routes
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded admin credentials (change these!)
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, 'ADMIN_SECRET_KEY', { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Protected Routes
app.use('/api/notes', authenticateAdmin);

app.get('/api/notes', async (req, res) => {
  const notes = await Note.findAll({ where: { userId: req.admin.id } });
  res.json(notes);
});

app.post('/api/notes', async (req, res) => {
  const note = await Note.create({ ...req.body, userId: req.admin.id });
  res.json(note);
});

// Initialize DB with default admin
sequelize.sync().then(async () => {
  await Admin.findOrCreate({ 
    where: { username: 'admin' },
    defaults: { password: await bcrypt.hash('admin123', 10) }
  });
  app.listen(3001, () => console.log('Server running on http://localhost:3001'));
});