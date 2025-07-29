// utils/payos.config.js
require('dotenv').config() 
const PayOS = require('@payos/node');


const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payos;
console.log('PAYOS_CLIENT_ID:', process.env.PAYOS_CLIENT_ID);
console.log('PAYOS_API_KEY:', process.env.PAYOS_API_KEY);
console.log('PAYOS_CHECKSUM_KEY:', process.env.PAYOS_CHECKSUM_KEY);