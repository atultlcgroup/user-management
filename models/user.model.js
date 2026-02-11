const pool = require('../db');

const User = {
  async create(name, email, mobile, password, isActive = true, isDeleted = false) {
    const result = await pool.query(
      'INSERT INTO "user" (name, email, mobile, password, is_active, is_deleted) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, mobile, password, isActive, isDeleted]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query(
      'SELECT id, name, email, mobile, is_active, is_deleted, created_at, updated_at FROM "user" ORDER BY id ASC'
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT id, name, email, mobile, is_active, is_deleted, created_at, updated_at FROM "user" WHERE id = $1', [id]);
    return result.rows[0];
  },

  async getByEmail(email) {
    const result = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
    return result.rows[0];
  },

  async update(id, name, email, mobile, isActive, password = null) {
    if (password) {
      const result = await pool.query(
        `UPDATE "user" 
        SET name = $1, email = $2, mobile = $3, is_active = $4, password = $5, updated_at = now() 
        WHERE id = $6 RETURNING *`,
        [name, email, mobile, isActive, password, id]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `UPDATE "user" 
        SET name = $1, email = $2, mobile = $3, is_active = $4, updated_at = now() 
        WHERE id = $5 RETURNING *`,
        [name, email, mobile, isActive, id]
      );
      return result.rows[0];
    }
  },

  async delete(id) {
    const result = await pool.query(
      'UPDATE "user" SET is_active = false, is_deleted = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

};

module.exports = User;
