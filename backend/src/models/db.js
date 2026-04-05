const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'facturation_4usit',
  user: process.env.DB_USER || 'facturation_user',
  password: process.env.DB_PASSWORD || 'Facturation@2026!'
});

pool.on('connect', () => console.log('PostgreSQL connecté'));
module.exports = pool;
