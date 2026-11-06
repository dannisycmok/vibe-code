import express from 'express';
import { query } from '../db.js';
import { httpError } from '../utils/http-error.js';
import {
  assertNoErrors,
  parseId,
  readNumber,
  readString,
} from '../utils/validators.js';

const router = express.Router();

const PRODUCT_FIELDS = 'pid, pname, description, price, qty';

function normalizeProduct(product) {
  if (!product) return null;

  return {
    pid: Number(product.pid),
    pname: product.pname,
    description: product.description,
    price: Number(product.price),
    qty: Number(product.qty),
  };
}

async function getProduct(id) {
  const result = await query(
    `SELECT ${PRODUCT_FIELDS} FROM public.products WHERE pid = $1`,
    [id],
  );

  return normalizeProduct(result.rows[0]);
}

async function ensureProduct(id) {
  const product = await getProduct(id);

  if (!product) {
    throw httpError(404, 'Product not found.');
  }

  return product;
}

router.get('/get_products', async (_req, res) => {
  const result = await query(
    `SELECT ${PRODUCT_FIELDS} FROM public.products ORDER BY pid ASC`,
  );

  res.json({ data: result.rows.map(normalizeProduct) });
});

router.get('/get_product/:id', async (req, res) => {
  const id = parseId(req.params.id, 'pid');
  res.json({ data: await ensureProduct(id) });
});

router.post('/add_product', async (req, res) => {
  const body = req.body ?? {};
  const errors = {};

  const pname = readString(body.pname, {
    field: 'pname',
    required: true,
    max: 120,
    errors,
  });
  const description = body.description == null
    ? ''
    : readString(body.description, {
      field: 'description',
      allowEmpty: true,
      max: 2000,
      errors,
    });
  const price = readNumber(body.price, {
    field: 'price',
    required: true,
    min: 0,
    errors,
  });
  const qty = readNumber(body.qty, {
    field: 'qty',
    required: true,
    min: 0,
    integer: true,
    errors,
  });

  assertNoErrors(errors);

  const result = await query(`
    INSERT INTO public.products (pname, description, price, qty)
    VALUES ($1, $2, $3, $4)
    RETURNING ${PRODUCT_FIELDS}
  `, [pname, description, price, qty]);

  res.status(201).json({
    message: 'Product added successfully.',
    data: normalizeProduct(result.rows[0]),
  });
});

async function updateProduct(req, res) {
  const id = parseId(req.params.id, 'pid');
  const existing = await ensureProduct(id);
  const body = req.body ?? {};
  const errors = {};

  let pname = existing.pname;
  let description = existing.description;
  let price = existing.price;
  let qty = existing.qty;

  if (Object.hasOwn(body, 'pname')) {
    pname = readString(body.pname, {
      field: 'pname',
      required: true,
      max: 120,
      errors,
    });
  }

  if (Object.hasOwn(body, 'description')) {
    description = body.description == null
      ? ''
      : readString(body.description, {
        field: 'description',
        allowEmpty: true,
        max: 2000,
        errors,
      });
  }

  if (Object.hasOwn(body, 'price')) {
    price = readNumber(body.price, {
      field: 'price',
      required: true,
      min: 0,
      errors,
    });
  }

  if (Object.hasOwn(body, 'qty')) {
    qty = readNumber(body.qty, {
      field: 'qty',
      required: true,
      min: 0,
      integer: true,
      errors,
    });
  }

  assertNoErrors(errors);

  const result = await query(`
    UPDATE public.products
    SET pname = $1, description = $2, price = $3, qty = $4
    WHERE pid = $5
    RETURNING ${PRODUCT_FIELDS}
  `, [pname, description, price, qty, id]);

  res.json({
    message: 'Product updated successfully.',
    data: normalizeProduct(result.rows[0]),
  });
}

// `/update/:id` is the product endpoint from the requested API list.
// `/update_product/:id` is a clearer alias that the frontend also supports.
router.put(['/update/:id', '/update_product/:id'], updateProduct);
router.patch(['/update/:id', '/update_product/:id'], updateProduct);
router.post(['/update/:id', '/update_product/:id'], updateProduct);

router.delete('/delete_product/:id', async (req, res) => {
  const id = parseId(req.params.id, 'pid');
  await ensureProduct(id);

  const countResult = await query(
    'SELECT COUNT(*)::int AS count FROM public.orders WHERE pid = $1',
    [id],
  );

  if (countResult.rows[0].count > 0) {
    throw httpError(
      409,
      'This product is used by one or more orders. Delete those orders first.',
    );
  }

  await query('DELETE FROM public.products WHERE pid = $1', [id]);
  res.json({ message: 'Product deleted successfully.', data: { pid: id } });
});

export default router;
