import express from 'express';
import { query } from '../db.js';
import { httpError } from '../utils/http-error.js';
import {
  assertNoErrors,
  parseId,
  readDate,
  readNumber,
} from '../utils/validators.js';

const router = express.Router();

const ORDER_SELECT = `
  SELECT
    o.oid,
    o.uid,
    u.uname,
    o.pid,
    p.pname,
    o.order_date
  FROM public.orders o
  JOIN public.users u ON u.uid = o.uid
  JOIN public.products p ON p.pid = o.pid
`;

function normalizeOrder(order) {
  if (!order) return null;

  return {
    oid: Number(order.oid),
    uid: Number(order.uid),
    uname: order.uname,
    pid: Number(order.pid),
    pname: order.pname,
    order_date: new Date(order.order_date).toISOString(),
  };
}

async function getOrder(id) {
  const result = await query(`${ORDER_SELECT} WHERE o.oid = $1`, [id]);
  return normalizeOrder(result.rows[0]);
}

async function ensureOrder(id) {
  const order = await getOrder(id);

  if (!order) {
    throw httpError(404, 'Order not found.');
  }

  return order;
}

async function ensureUserExists(uid) {
  const result = await query(
    'SELECT uid FROM public.users WHERE uid = $1',
    [uid],
  );

  if (!result.rows[0]) {
    throw httpError(422, 'The selected user does not exist.', {
      uid: 'Select an existing user.',
    });
  }
}

async function ensureProductExists(pid) {
  const result = await query(
    'SELECT pid FROM public.products WHERE pid = $1',
    [pid],
  );

  if (!result.rows[0]) {
    throw httpError(422, 'The selected product does not exist.', {
      pid: 'Select an existing product.',
    });
  }
}

router.get('/get_orders', async (req, res) => {
  const uid = req.query.uid === undefined
    ? null
    : parseId(req.query.uid, 'uid query parameter');
  const pid = req.query.pid === undefined
    ? null
    : parseId(req.query.pid, 'pid query parameter');

  const conditions = [];
  const params = [];

  if (uid !== null) {
    params.push(uid);
    conditions.push(`o.uid = $${params.length}`);
  }

  if (pid !== null) {
    params.push(pid);
    conditions.push(`o.pid = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `${ORDER_SELECT} ${where} ORDER BY o.order_date DESC, o.oid DESC`,
    params,
  );

  res.json({ data: result.rows.map(normalizeOrder) });
});

router.get('/get_order/:id', async (req, res) => {
  const id = parseId(req.params.id, 'oid');
  res.json({ data: await ensureOrder(id) });
});

async function sendOrdersForUser(uid, res) {
  await ensureUserExists(uid);

  const result = await query(
    `${ORDER_SELECT} WHERE o.uid = $1 ORDER BY o.order_date DESC, o.oid DESC`,
    [uid],
  );

  res.json({ data: result.rows.map(normalizeOrder) });
}

async function sendOrdersForProduct(pid, res) {
  await ensureProductExists(pid);

  const result = await query(
    `${ORDER_SELECT} WHERE o.pid = $1 ORDER BY o.order_date DESC, o.oid DESC`,
    [pid],
  );

  res.json({ data: result.rows.map(normalizeOrder) });
}

// Both `/get_orders/uid/:uid` and `/get_orders/uid?uid=:uid` are supported.
router.get('/get_orders/uid/:uid', async (req, res) => {
  await sendOrdersForUser(parseId(req.params.uid, 'uid'), res);
});

router.get('/get_orders/uid', async (req, res) => {
  await sendOrdersForUser(parseId(req.query.uid, 'uid query parameter'), res);
});

router.get('/get_orders/pid/:pid', async (req, res) => {
  await sendOrdersForProduct(parseId(req.params.pid, 'pid'), res);
});

router.get('/get_orders/pid', async (req, res) => {
  await sendOrdersForProduct(parseId(req.query.pid, 'pid query parameter'), res);
});

router.post('/add_order', async (req, res) => {
  const body = req.body ?? {};
  const errors = {};

  const uid = readNumber(body.uid, {
    field: 'uid',
    required: true,
    min: 1,
    integer: true,
    errors,
  });
  const pid = readNumber(body.pid, {
    field: 'pid',
    required: true,
    min: 1,
    integer: true,
    errors,
  });
  const orderDate = body.order_date == null || body.order_date === ''
    ? new Date().toISOString()
    : readDate(body.order_date, { field: 'order_date', errors });

  assertNoErrors(errors);
  await ensureUserExists(uid);
  await ensureProductExists(pid);

  const result = await query(`
    INSERT INTO public.orders (uid, pid, order_date)
    VALUES ($1, $2, $3)
    RETURNING oid
  `, [uid, pid, orderDate]);

  res.status(201).json({
    message: 'Order added successfully.',
    data: await getOrder(Number(result.rows[0].oid)),
  });
});

async function updateOrder(req, res) {
  const id = parseId(req.params.id, 'oid');
  const existing = await ensureOrder(id);
  const body = req.body ?? {};
  const errors = {};

  let uid = existing.uid;
  let pid = existing.pid;
  let orderDate = existing.order_date;

  if (Object.hasOwn(body, 'uid')) {
    uid = readNumber(body.uid, {
      field: 'uid',
      required: true,
      min: 1,
      integer: true,
      errors,
    });
  }

  if (Object.hasOwn(body, 'pid')) {
    pid = readNumber(body.pid, {
      field: 'pid',
      required: true,
      min: 1,
      integer: true,
      errors,
    });
  }

  if (Object.hasOwn(body, 'order_date')) {
    orderDate = readDate(body.order_date, {
      field: 'order_date',
      errors,
    });

    if (body.order_date == null || body.order_date === '') {
      errors.order_date = 'order_date is required.';
    }
  }

  assertNoErrors(errors);
  await ensureUserExists(uid);
  await ensureProductExists(pid);

  await query(`
    UPDATE public.orders
    SET uid = $1, pid = $2, order_date = $3
    WHERE oid = $4
  `, [uid, pid, orderDate, id]);

  res.json({
    message: 'Order updated successfully.',
    data: await getOrder(id),
  });
}

router.put('/update_order/:id', updateOrder);
router.patch('/update_order/:id', updateOrder);
router.post('/update_order/:id', updateOrder);

router.delete('/delete_order/:id', async (req, res) => {
  const id = parseId(req.params.id, 'oid');
  await ensureOrder(id);

  await query('DELETE FROM public.orders WHERE oid = $1', [id]);
  res.json({ message: 'Order deleted successfully.', data: { oid: id } });
});

export default router;
