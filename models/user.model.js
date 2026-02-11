const pool = require('../db');

const User = {
  async create(name, email, mobile, isActive = true, isDeleted = false) {
    const result = await pool.query(
      'INSERT INTO "user" (name, email, mobile, is_active, is_deleted) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, mobile, isActive, isDeleted]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query('SELECT * FROM "user" ORDER BY id ASC');
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM "user" WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, name, email, mobile, isActive) {
    const result = await pool.query(
      `UPDATE "user" 
      SET name = $1, email = $2, mobile = $3, is_active = $4, updated_at = now() 
      WHERE id = $5 RETURNING *`,
      [name, email, mobile, isActive, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      'UPDATE "user" SET is_deleted = $1 WHERE id = $2 RETURNING *',
      [true, id]
    );
    return result.rows[0];
  }

};

module.exports = User;
