const db = require('../db/database');

class Note {
  static getAll(adminId) {
    return db.prepare('SELECT * FROM notes WHERE adminId = ?').all(adminId);
  }

  static create(noteData) {
    const stmt = db.prepare(`
      INSERT INTO notes 
      (title, content, color, positionX, positionY, width, height, adminId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      noteData.title,
      noteData.content,
      noteData.color,
      noteData.positionX,
      noteData.positionY,
      noteData.width,
      noteData.height,
      noteData.adminId
    );
  }

  static update(id, adminId, updates) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    
    values.push(id, adminId);
    
    const stmt = db.prepare(`
      UPDATE notes 
      SET ${fields.join(', ')} 
      WHERE id = ? AND adminId = ?
    `);
    
    return stmt.run(...values);
  }

  static delete(id, adminId) {
    return db.prepare('DELETE FROM notes WHERE id = ? AND adminId = ?').run(id, adminId);
  }
}

module.exports = Note;