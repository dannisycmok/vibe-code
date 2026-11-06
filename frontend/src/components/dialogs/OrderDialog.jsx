import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { api, ApiError } from '../../api/client.js';
import { toDateTimeLocal } from '../../utils/format.js';

function blankForm(users, products) {
  return {
    uid: users[0]?.uid ?? '',
    pid: products[0]?.pid ?? '',
    order_date: toDateTimeLocal(new Date()),
  };
}

export default function OrderDialog({
  open,
  order,
  users,
  products,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => blankForm(users, products));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  const editing = Boolean(order);

  useEffect(() => {
    if (!open) return;

    setForm(order
      ? {
        uid: order.uid,
        pid: order.pid,
        order_date: toDateTimeLocal(order.order_date),
      }
      : blankForm(users, products));
    setErrors({});
    setApiError('');
    setSaving(false);
  }, [open, order, users, products]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setApiError('');
  }

  function validate() {
    const nextErrors = {};

    if (!form.uid) nextErrors.uid = 'Select a customer.';
    if (!form.pid) nextErrors.pid = 'Select a product.';
    if (!form.order_date) {
      nextErrors.order_date = 'Choose an order date.';
    } else if (Number.isNaN(new Date(form.order_date).getTime())) {
      nextErrors.order_date = 'Enter a valid order date.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError('');

    const payload = {
      uid: Number(form.uid),
      pid: Number(form.pid),
      order_date: new Date(form.order_date).toISOString(),
    };

    try {
      const response = editing
        ? await api.updateOrder(order.oid, payload)
        : await api.addOrder(payload);

      onSaved(response.message);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors((current) => ({ ...current, ...error.errors }));
      }
      setApiError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <ReceiptLongRoundedIcon color="primary" />
          {editing ? `Edit order #${order.oid}` : 'Create order'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            {(users.length === 0 || products.length === 0) && (
              <Alert severity="warning">
                Add at least one user and one product before creating an order.
              </Alert>
            )}

            <TextField
              select
              fullWidth
              required
              label="Customer"
              name="uid"
              value={form.uid}
              onChange={handleChange}
              error={Boolean(errors.uid)}
              helperText={errors.uid}
            >
              {users.map((user) => (
                <MenuItem key={user.uid} value={user.uid}>
                  {user.uname} — {user.email}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              required
              label="Product"
              name="pid"
              value={form.pid}
              onChange={handleChange}
              error={Boolean(errors.pid)}
              helperText={errors.pid}
            >
              {products.map((product) => (
                <MenuItem key={product.pid} value={product.pid}>
                  {product.pname}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              required
              label="Order date and time"
              name="order_date"
              type="datetime-local"
              value={form.order_date}
              onChange={handleChange}
              error={Boolean(errors.order_date)}
              helperText={errors.order_date}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || users.length === 0 || products.length === 0}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create order'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
