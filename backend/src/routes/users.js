import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { httpError } from '../utils/http-error.js';
import {
  assertNoErrors,
  parseId,
  readEmail,
  readString,
} from '../utils/validators.js';

const router = express.Router();

const USER_FIELDS = 'uid, uname, email';

function normalizeUser(user) {
  if (!user) return null;

  return {
    uid: Number(user.uid),
    uname: user.uname,
    email: user.email,
  };
}

async function getUser(id) {
  const result = await query(
    `SELECT ${USER_FIELDS} FROM public.users WHERE uid = $1`,
    [id],
  );

  return normalizeUser(result.rows[0]);
}

async function ensureUser(id) {
  const user = await getUser(id);

  if (!user) {
    throw httpError(404, 'User not found.');
  }

  return user;
}

async function getStoredUser(id) {
  const result = await query(
    'SELECT uid, uname, email, password FROM public.users WHERE uid = $1',
    [id],
  );

  return result.rows[0];
}

function throwUserWriteError(error) {
  if (error?.code === '23505') {
    throw httpError(409, 'A user with this email already exists.', {
      email: 'This email is already registered.',
    });
  }

  throw error;
}

function readPassword(value, { required, errors }) {
  const password = readString(value, {
    field: 'password',
    required,
    min: 6,
    max: 72,
    trim: false,
    errors,
  });

  if (password !== undefined && Buffer.byteLength(password, 'utf8') > 72) {
    errors.password = 'password must be at most 72 bytes.';
    return undefined;
  }

  return password;
}

router.get('/get_users', async (_req, res) => {
  const result = await query(
    `SELECT ${USER_FIELDS} FROM public.users ORDER BY uid ASC`,
  );

  res.json({ data: result.rows.map(normalizeUser) });
});

router.get('/get_user/:id', async (req, res) => {
  const id = parseId(req.params.id, 'uid');
  res.json({ data: await ensureUser(id) });
});

router.post('/add_user', async (req, res) => {
  const body = req.body ?? {};
  const errors = {};

  const uname = readString(body.uname, {
    field: 'uname',
    required: true,
    max: 80,
    errors,
  });
  const email = readEmail(body.email, {
    field: 'email',
    required: true,
    errors,
  });
  const password = readPassword(body.password, {
    required: true,
    errors,
  });

  assertNoErrors(errors);

  const passwordHash = bcrypt.hashSync(password, 10);
  let result;

  try {
    result = await query(`
      INSERT INTO public.users (uname, email, password)
      VALUES ($1, $2, $3)
      RETURNING ${USER_FIELDS}
    `, [uname, email, passwordHash]);
  } catch (error) {
    throwUserWriteError(error);
  }

  res.status(201).json({
    message: 'User added successfully.',
    data: normalizeUser(result.rows[0]),
  });
});

async function updateUser(req, res) {
  const id = parseId(req.params.id, 'uid');
  const existing = await ensureUser(id);
  const storedUser = await getStoredUser(id);

  if (!storedUser) {
    throw httpError(404, 'User not found.');
  }

  const body = req.body ?? {};
  const errors = {};

  let uname = existing.uname;
  let email = existing.email;
  let passwordHash = storedUser.password;

  if (Object.hasOwn(body, 'uname')) {
    uname = readString(body.uname, {
      field: 'uname',
      required: true,
      max: 80,
      errors,
    });
  }

  if (Object.hasOwn(body, 'email')) {
    email = readEmail(body.email, {
      field: 'email',
      required: true,
      errors,
    });
  }

  if (Object.hasOwn(body, 'password') && body.password !== '' && body.password != null) {
    const password = readPassword(body.password, {
      required: true,
      errors,
    });

    if (password !== undefined) {
      passwordHash = bcrypt.hashSync(password, 10);
    }
  }

  assertNoErrors(errors);

  let result;

  try {
    result = await query(`
      UPDATE public.users
      SET uname = $1, email = $2, password = $3
      WHERE uid = $4
      RETURNING ${USER_FIELDS}
    `, [uname, email, passwordHash, id]);
  } catch (error) {
    throwUserWriteError(error);
  }

  res.json({
    message: 'User updated successfully.',
    data: normalizeUser(result.rows[0]),
  });
}

// A dedicated path avoids conflicting with the product `/update/:id` endpoint.
router.put('/update_user/:id', updateUser);
router.patch('/update_user/:id', updateUser);
router.post('/update_user/:id', updateUser);

router.delete('/delete_user/:id', async (req, res) => {
  const id = parseId(req.params.id, 'uid');
  await ensureUser(id);

  const countResult = await query(
    'SELECT COUNT(*)::int AS count FROM public.orders WHERE uid = $1',
    [id],
  );

  if (countResult.rows[0].count > 0) {
    throw httpError(
      409,
      'This user is used by one or more orders. Delete those orders first.',
    );
  }

  await query('DELETE FROM public.users WHERE uid = $1', [id]);
  res.json({ message: 'User deleted successfully.', data: { uid: id } });
});

export default router;
