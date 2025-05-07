const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const Note = require('../models/Note');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const notes = await Note.getAll(req.adminId);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await Note.create({ ...req.body, adminId: req.adminId });
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await Note.update(req.params.id, req.adminId, req.body);
    res.json({ message: 'Note updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Note.delete(req.params.id, req.adminId);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;