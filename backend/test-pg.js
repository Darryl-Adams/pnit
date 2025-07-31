const { Client } = require('pg');
const client = new Client({
  user: 'pnit_user',
  password: 'testpass123',
  host: 'localhost',
  port: 5432,
  database: 'pnit'
});
client.connect()
  .then(() => {
    console.log('Connected!');
    return client.end();
  })
  .catch(e => console.error('Connection error:', e));
