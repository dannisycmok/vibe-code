import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { api, ApiError } from '../../api/client.js';

const emptyForm = {
  pname: '',
  description: '',
  price: '',
  qty: '',
};

export default function ProductDialog({ open, product, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  const editing = Boolean(product);

  useEffect(() => {
    if (!open) return;

    setForm(product
      ? {
        pname: product.pname,
        description: product.description,
        price: String(product.price),
        qty: String(product.qty),
      }
      : emptyForm);
    setErrors({});
    setApiError('');
    setSaving(false);
  }, [open, product]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setApiError('');
  }

  function validate() {
    const nextErrors = {};
    const price = Number(form.price);
    const qty = Number(form.qty);

    if (!form.pname.trim()) {
      nextErrors.pname = 'Product name is required.';
    } else if (form.pname.trim().length > 120) {
      nextErrors.pname = 'Product name must be 120 characters or fewer.';
    }

    if (form.price === '' || !Number.isFinite(price) || price < 0) {
      nextErrors.price = 'Enter a price of 0 or more.';
    }

    if (form.qty === '' || !Number.isInteger(qty) || qty < 0) {
      nextErrors.qty = 'Enter a whole quantity of 0 or more.';
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
      pname: form.pname.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      qty: Number(form.qty),
    };

    try {
      const response = editing
        ? await api.updateProduct(product.pid, payload)
        : await api.addProduct(payload);

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
          <Inventory2RoundedIcon color="primary" />
          {editing ? 'Edit product' : 'Add product'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <TextField
              autoFocus
              fullWidth
              required
              label="Product name"
              name="pname"
              value={form.pname}
              onChange={handleChange}
              error={Boolean(errors.pname)}
              helperText={errors.pname}
              placeholder="e.g. Wireless Headphones"
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              error={Boolean(errors.description)}
              helperText={errors.description}
              placeholder="A short description of the product"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.25}>
              <TextField
                fullWidth
                required
                label="Price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                error={Boolean(errors.price)}
                helperText={errors.price}
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
              <TextField
                fullWidth
                required
                label="Quantity in stock"
                name="qty"
                type="number"
                value={form.qty}
                onChange={handleChange}
                error={Boolean(errors.qty)}
                helperText={errors.qty}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
