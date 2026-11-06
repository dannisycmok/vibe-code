import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FeedbackSnackbar from '../components/FeedbackSnackbar.jsx';
import UserDialog from '../components/dialogs/UserDialog.jsx';
import useFeedback from '../hooks/useFeedback.js';
import { api } from '../api/client.js';
import { avatarColor, initials } from '../utils/format.js';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, setDialog] = useState({ open: false, user: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { feedback, showFeedback, closeFeedback } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (loadError) {
      setError(loadError.message);
      showFeedback(loadError.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((user) => (
      user.uname.toLowerCase().includes(needle)
      || user.email.toLowerCase().includes(needle)
    ));
  }, [users, search]);

  const visibleUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredUsers.length / rowsPerPage) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [filteredUsers.length, page, rowsPerPage]);

  function handleSaved(message) {
    setDialog({ open: false, user: null });
    showFeedback(message);
    load();
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setDeleting(true);

    try {
      const response = await api.deleteUser(pendingDelete.uid);
      setPendingDelete(null);
      showFeedback(response.message);
      load();
    } catch (deleteError) {
      setPendingDelete(null);
      showFeedback(deleteError.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Accounts"
        title="Users"
        subtitle="Manage the customers who can be attached to orders. Passwords are stored as secure hashes."
        action={(
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialog({ open: true, user: null })}
          >
            Add user
          </Button>
        )}
      />

      {error && (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}
          sx={{ mb: 2.5 }}
        >
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e7ebf2', borderRadius: 3, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}
        >
          <TextField
            size="small"
            placeholder="Search name or email…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 310 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </Typography>
            {search && (
              <Chip
                size="small"
                label="Clear search"
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setPage(0);
                }}
              />
            )}
          </Stack>
        </Stack>

        {loading && <LinearProgress />}

        {!loading && filteredUsers.length === 0 ? (
          <EmptyState
            icon={<PeopleAltOutlinedIcon />}
            title={search ? 'No matching users' : 'No users yet'}
            description={search
              ? 'Try a different name or email address.'
              : 'Add a customer account before creating orders.'}
            action={search ? (
              <Button variant="outlined" onClick={() => setSearch('')}>Clear search</Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setDialog({ open: true, user: null })}
              >
                Add user
              </Button>
            )}
          />
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 620 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Account ID</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleUsers.map((user) => (
                    <TableRow key={user.uid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              fontSize: '0.78rem',
                              fontWeight: 750,
                              backgroundColor: avatarColor(user.uname),
                            }}
                          >
                            {initials(user.uname)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {user.uname}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { sm: 'none' } }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{user.email}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip size="small" label={`UID #${user.uid}`} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit user">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${user.uname}`}
                            onClick={() => setDialog({ open: true, user })}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete ${user.uname}`}
                            onClick={() => setPendingDelete(user)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={(_event, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: '1px solid #edf0f5' }}
            />
          </>
        )}
      </Paper>

      <UserDialog
        open={dialog.open}
        user={dialog.user}
        onClose={() => setDialog({ open: false, user: null })}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete user?"
        description={pendingDelete
          ? `"${pendingDelete.uname}" will be permanently deleted. Users attached to orders cannot be deleted.`
          : ''}
        loading={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      <FeedbackSnackbar feedback={feedback} onClose={closeFeedback} />
    </Box>
  );
}
