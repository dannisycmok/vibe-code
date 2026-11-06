import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { api, ApiError } from '../../api/client.js';

const emptyForm = {
  uname: '',
  email: '',
  password: '',
};

export default function UserDialog({ open, user, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const editing = Boolean(user);

  useEffect(() => {
    if (!open) return;

    setForm(user
      ? { uname: user.uname, email: user.email, password: '' }
      : emptyForm);
    setErrors({});
    setApiError('');
    setSaving(false);
    setShowPassword(false);
  }, [open, user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setApiError('');
  }

  function validate() {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.uname.trim()) {
      nextErrors.uname = 'Full name is required.';
    } else if (form.uname.trim().length > 80) {
      nextErrors.uname = 'Name must be 80 characters or fewer.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!editing && form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    } else if (form.password && form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
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
      uname: form.uname.trim(),
      email: form.email.trim(),
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      const response = editing
        ? await api.updateUser(user.uid, payload)
        : await api.addUser(payload);

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
          <PersonAddAlt1RoundedIcon color="primary" />
          {editing ? 'Edit user' : 'Add user'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <TextField
              autoFocus
              fullWidth
              required
              label="Full name"
              name="uname"
              value={form.uname}
              onChange={handleChange}
              error={Boolean(errors.uname)}
              helperText={errors.uname}
              autoComplete="name"
            />

            <TextField
              fullWidth
              required
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
              autoComplete="email"
            />

            <TextField
              fullWidth
              required={!editing}
              label={editing ? 'New password (optional)' : 'Password'}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password || (editing ? 'Leave blank to keep the current password.' : 'At least 6 characters.')}
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
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
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add user'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
