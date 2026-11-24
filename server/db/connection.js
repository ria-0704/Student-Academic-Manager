const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_academic_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Add columns introduced after the original schema, if the database is missing them.
// Keeps older databases (created from an earlier schema.sql) working.
async function ensureSchema(conn) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mock_attempts' AND COLUMN_NAME = 'answer_type'`
  );
  if (rows[0].n === 0) {
    await conn.query(
      "ALTER TABLE mock_attempts ADD COLUMN answer_type ENUM('typed', 'handwritten') NOT NULL DEFAULT 'typed' AFTER status"
    );
    console.log('🛠️  Added missing column mock_attempts.answer_type');
  }
}

// Test the connection on startup
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    await ensureSchema(conn);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
