import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const daysAgo = (days) => new Date(Date.now() - days * 86_400_000);

async function seed() {
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM public.products) AS products,
      (SELECT COUNT(*)::int FROM public.users) AS users,
      (SELECT COUNT(*)::int FROM public.orders) AS orders
  `);

  const existing = counts.rows[0];

  if (existing.products || existing.users || existing.orders) {
    console.log('Seed skipped: the Supabase database already contains data.');
    console.log('Delete the rows in Supabase if you want to seed again.');
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const products = [
      ['Wireless Headphones', 'Over-ear Bluetooth headphones with active noise cancellation.', 129.99, 24],
      ['Mechanical Keyboard', 'Compact 75% keyboard with hot-swappable tactile switches.', 89.5, 15],
      ['4K Monitor', '27-inch IPS monitor with USB-C power delivery.', 349, 8],
      ['USB-C Hub', 'Seven-port aluminium hub with HDMI, SD and USB 3.0.', 45.75, 40],
      ['Laptop Stand', 'Adjustable aluminium stand with ventilation.', 32.25, 5],
    ];

    const productIds = {};

    for (const [pname, description, price, qty] of products) {
      const result = await client.query(`
        INSERT INTO public.products (pname, description, price, qty)
        VALUES ($1, $2, $3, $4)
        RETURNING pid
      `, [pname, description, price, qty]);

      productIds[pname] = Number(result.rows[0].pid);
    }

    const passwordHash = bcrypt.hashSync('password123', 10);
    const users = [
      ['Alice Johnson', 'alice@example.com'],
      ['Ben Carter', 'ben@example.com'],
      ['Chloe Nguyen', 'chloe@example.com'],
    ];

    const userIds = {};

    for (const [uname, email] of users) {
      const result = await client.query(`
        INSERT INTO public.users (uname, email, password)
        VALUES ($1, $2, $3)
        RETURNING uid
      `, [uname, email, passwordHash]);

      userIds[email] = Number(result.rows[0].uid);
    }

    const orders = [
      [userIds['alice@example.com'], productIds['Wireless Headphones'], daysAgo(1)],
      [userIds['alice@example.com'], productIds['USB-C Hub'], daysAgo(3)],
      [userIds['ben@example.com'], productIds['4K Monitor'], daysAgo(5)],
      [userIds['chloe@example.com'], productIds['Mechanical Keyboard'], daysAgo(8)],
      [userIds['ben@example.com'], productIds['Laptop Stand'], daysAgo(12)],
    ];

    for (const [uid, pid, orderDate] of orders) {
      await client.query(`
        INSERT INTO public.orders (uid, pid, order_date)
        VALUES ($1, $2, $3)
      `, [uid, pid, orderDate]);
    }

    await client.query('COMMIT');
    console.log('Sample data inserted into Supabase successfully.');
    console.log('Demo user password for every seeded account: password123');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
