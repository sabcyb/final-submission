require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Admin Model
const Admin = sequelize.define('Admin', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING
}, { timestamps: false });

// Note Model
const Note = sequelize.define('Note', {
  title: { type: DataTypes.STRING, defaultValue: 'New Note' },
  content: { type: DataTypes.TEXT, defaultValue: '' },
  color: { type: DataTypes.STRING, defaultValue: '#ffff99' },
  positionX: { type: DataTypes.INTEGER, defaultValue: 100 },
  positionY: { type: DataTypes.INTEGER, defaultValue: 100 },
  width: { type: DataTypes.INTEGER, defaultValue: 200 },
  height: { type: DataTypes.INTEGER, defaultValue: 200 }
}, { timestamps: false });

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
// server checking
app.get("/", (req,res)=>{
  res.send("Welcome to Server Backend");
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Verify hardcoded admin credentials
  if (username !== process.env.ADMIN_USERNAME || 
      !await bcrypt.compare(password, process.env.ADMIN_HASH)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Protected Routes
app.get('/api/notes', authenticateAdmin, async (req, res) => {
  const notes = await Note.findAll({ where: { AdminId: req.admin.id } });
  res.json(notes);
});

app.post('/api/notes', authenticateAdmin, async (req, res) => {
  const note = await Note.create({ ...req.body, AdminId: req.admin.id });
  res.json(note);
});

app.put('/api/notes/:id', authenticateAdmin, async (req, res) => {
  await Note.update(req.body, { where: { id: req.params.id } });
  res.json({ message: 'Note updated' });
});

app.delete('/api/notes/:id', authenticateAdmin, async (req, res) => {
  await Note.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Note deleted' });
});

// Initialize
(async () => {
  await sequelize.sync();
  
  // Create default admin if not exists
  const adminExists = await Admin.findOne();
  if (!adminExists) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await Admin.create({ 
      username: process.env.ADMIN_USERNAME,
      password: hash
    });
    console.log('Default admin created');
  }

  app.listen(3000, () => console.log('Server running on http://localhost:3000'));
})();
