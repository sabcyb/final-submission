require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize'); // Fixed import
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup with better-sqlite3
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  dialectModule: require('better-sqlite3'),
  logging: false
});

// Admin Model - Corrected DataTypes usage
const Admin = sequelize.define('Admin', {
  username: { 
    type: DataTypes.STRING, 
    unique: true 
  },
  password: DataTypes.STRING
}, { timestamps: false });

// Note Model - Corrected DataTypes usage
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
app.use('/api/notes', authenticateAdmin);

app.get('/api/notes', async (req, res) => {
  const notes = await Note.findAll({ where: { AdminId: req.admin.id } });
  res.json(notes);
});

app.post('/api/notes', async (req, res) => {
  const note = await Note.create({ ...req.body, AdminId: req.admin.id });
  res.json(note);
});

app.put('/api/notes/:id', async (req, res) => {
  await Note.update(req.body, { where: { id: req.params.id } });
  res.json({ message: 'Note updated' });
});

app.delete('/api/notes/:id', async (req, res) => {
  await Note.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Note deleted' });
});

// Initialize
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    
    // Create default admin if not exists
    const adminExists = await Admin.findOne();
    if (!adminExists && process.env.ADMIN_HASH) {
      await Admin.create({ 
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_HASH
      });
      console.log('Default admin created');
    }

    app.listen(process.env.PORT || 3001, () => 
      console.log(`Server running on port ${process.env.PORT || 3001}`)
    );
  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();