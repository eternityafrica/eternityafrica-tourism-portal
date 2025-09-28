const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eternityafrica_tourism'
};

let pool;

const createConnection = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Database connected successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getConnection = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createConnection first.');
  }
  return pool;
};

module.exports = {
  createConnection,
  getConnection
};