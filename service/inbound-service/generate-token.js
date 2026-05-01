/**
 * Script untuk generate JWT token testing di Postman
 * Jalankan: node generate-token.js
 * 
 * Pastikan sudah npm install terlebih dahulu.
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'kuncirahasiauikajwtsecret123';

// Ganti sesuai kebutuhan testing
const payloadAdmin = {
  id_user: 1,
  email: 'admin@uika.ac.id',
  role: 'admin',
  id_unit: 1,
};

const payloadOperator = {
  id_user: 2,
  email: 'operator@uika.ac.id',
  role: 'operator',
  id_unit: 1,
};

const tokenAdmin    = jwt.sign(payloadAdmin,    secret, { expiresIn: '24h' });
const tokenOperator = jwt.sign(payloadOperator, secret, { expiresIn: '24h' });

console.log('\n=== TOKEN UNTUK TESTING POSTMAN ===\n');
console.log('[ ADMIN TOKEN ]');
console.log(tokenAdmin);
console.log('\n[ OPERATOR TOKEN ]');
console.log(tokenOperator);
console.log('\n====================================');
console.log('Salin token di atas ke Postman:');
console.log('Authorization → Bearer Token → paste token\n');
