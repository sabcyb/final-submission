const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Admin {
  static async create(username, password) {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    return stmt.run(username, hash);
  }

  static async findByUsername(username) {
    return db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  }

  static async verify(username, password) {
    const admin = this.findByUsername(username);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return null;
    }
    return admin;
  }

  static generateToken(adminId) {
    return jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '8h' });
  }
}

module.exports = Admin;