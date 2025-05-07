require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const db = require('./db/database');
const Admin = require('./models/Admin');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Initialize Admin
const initAdmin = async () => {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0 && process.env.ADMIN_HASH) {
    await Admin.create(process.env.ADMIN_USERNAME, process.env.ADMIN_HASH);
    console.log('Default admin created');
  }
};

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await initAdmin();
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin username: ${process.env.ADMIN_USERNAME}`);
});