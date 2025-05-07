const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize } = require('sequelize');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// Define Note model
const Note = sequelize.define('Note', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: Sequelize.STRING, allowNull: false, defaultValue: 'New Note' },
  content: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  color: { type: Sequelize.STRING, defaultValue: '#ffff99' },
  positionX: { type: Sequelize.INTEGER, defaultValue: 100 },
  positionY: { type: Sequelize.INTEGER, defaultValue: 100 },
  width: { type: Sequelize.INTEGER, defaultValue: 200 },
  height: { type: Sequelize.INTEGER, defaultValue: 200 }
});

// CRUD Routes
app.get('/api/notes', async (req, res) => {
  const notes = await Note.findAll();
  res.json(notes);
});

app.post('/api/notes', async (req, res) => {
  const note = await Note.create(req.body);
  res.json(note);
});

app.put('/api/notes/:id', async (req, res) => {
  const note = await Note.findByPk(req.params.id);
  if (note) {
    await note.update(req.body);
    res.json(note);
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  const note = await Note.findByPk(req.params.id);
  if (note) {
    await note.destroy();
    res.json({ message: 'Note deleted' });
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
  });
});