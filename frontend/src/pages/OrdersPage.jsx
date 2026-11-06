import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
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
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FeedbackSnackbar from '../components/FeedbackSnackbar.jsx';
import OrderDialog from '../components/dialogs/OrderDialog.jsx';
import useFeedback from '../hooks/useFeedback.js';
import { api } from '../api/client.js';
import {
  avatarColor,
  formatDateTime,
  initials,
} from '../utils/format.js';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, setDialog] = useState({ open: false, order: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { feedback, showFeedback, closeFeedback } = useFeedback();

  const loadReferences = useCallback(async () => {
    setReferenceLoading(true);

    try {
      const [userResponse, productResponse] = await Promise.all([
        api.getUsers(),
        api.getProducts(),
      ]);
      setUsers(userResponse.data);
      setProducts(productResponse.data);
    } catch (loadError) {
      showFeedback(loadError.message, 'error');
    } finally {
      setReferenceLoading(false);
    }
  }, [showFeedback]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let response;

      if (customerFilter) {
        response = await api.getOrdersByUser(customerFilter);
      } else if (productFilter) {
        response = await api.getOrdersByProduct(productFilter);
      } else {
        response = await api.getOrders();
      }

      let rows = response.data;

      if (customerFilter && productFilter) {
        rows = rows.filter((order) => order.pid === Number(productFilter));
      }

      setOrders(rows);
    } catch (loadError) {
      setError(loadError.message);
      showFeedback(loadError.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [customerFilter, productFilter, showFeedback]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return orders;

    return orders.filter((order) => (
      order.uname.toLowerCase().includes(needle)
      || order.pname.toLowerCase().includes(needle)
      || String(order.oid).includes(needle)
    ));
  }, [orders, search]);

  const visibleOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const hasFilters = Boolean(customerFilter || productFilter);
  const cannotCreateOrder = !referenceLoading && (users.length === 0 || products.length === 0);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredOrders.length / rowsPerPage) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [filteredOrders.length, page, rowsPerPage]);

  function updateCustomerFilter(value) {
    setCustomerFilter(value === 'all' ? '' : value);
    setPage(0);
  }

  function updateProductFilter(value) {
    setProductFilter(value === 'all' ? '' : value);
    setPage(0);
  }

  function clearFilters() {
    setCustomerFilter('');
    setProductFilter('');
    setSearch('');
    setPage(0);
  }

  function handleSaved(message) {
    setDialog({ open: false, order: null });
    showFeedback(message);
    loadOrders();
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setDeleting(true);

    try {
      const response = await api.deleteOrder(pendingDelete.oid);
      setPendingDelete(null);
      showFeedback(response.message);
      loadOrders();
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
        eyebrow="Transactions"
        title="Orders"
        subtitle="Create and maintain orders, then filter them by customer or product."
        action={(
          <Tooltip title={cannotCreateOrder ? 'Add a user and a product first' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                disabled={cannotCreateOrder}
                onClick={() => setDialog({ open: true, order: null })}
              >
                Add order
              </Button>
            </span>
          </Tooltip>
        )}
      />

      {cannotCreateOrder && (
        <Alert
          severity="info"
          sx={{ mb: 2.5 }}
          action={(
            <Stack direction="row" spacing={1}>
              {users.length === 0 && (
                <Button color="inherit" size="small" component={RouterLink} to="/users">
                  Add user
                </Button>
              )}
              {products.length === 0 && (
                <Button color="inherit" size="small" component={RouterLink} to="/products">
                  Add product
                </Button>
              )}
            </Stack>
          )}
        >
          Orders connect a user and a product, so both need to exist before an order can be created.
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={loadOrders}>Retry</Button>}
          sx={{ mb: 2.5 }}
        >
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e7ebf2', borderRadius: 3, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              placeholder="Search orders…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '100%', sm: 230 } }}
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
            <TextField
              select
              size="small"
              label="Customer"
              value={customerFilter || 'all'}
              onChange={(event) => updateCustomerFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 190 } }}
            >
              <MenuItem value="all">All customers</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.uid} value={String(user.uid)}>
                  {user.uname}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Product"
              value={productFilter || 'all'}
              onChange={(event) => updateProductFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 190 } }}
            >
              <MenuItem value="all">All products</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.pid} value={String(product.pid)}>
                  {product.pname}
                </MenuItem>
              ))}
            </TextField>
            {hasFilters && (
              <Button
                size="small"
                color="inherit"
                startIcon={<FilterAltOffRoundedIcon />}
                onClick={clearFilters}
                sx={{ flexShrink: 0 }}
              >
                Clear
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
            <Chip
              size="small"
              label={`${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'}`}
              variant="outlined"
            />
            {customerFilter && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label="Filtered by customer"
              />
            )}
            {productFilter && (
              <Chip
                size="small"
                color="secondary"
                variant="outlined"
                label="Filtered by product"
              />
            )}
          </Stack>
        </Stack>

        {(loading || referenceLoading) && <LinearProgress />}

        {!loading && filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ReceiptLongOutlinedIcon />}
            title={hasFilters || search ? 'No matching orders' : 'No orders yet'}
            description={hasFilters || search
              ? 'Adjust or clear the filters to see other orders.'
              : 'Create an order once you have at least one customer and product.'}
            action={hasFilters || search ? (
              <Button variant="outlined" onClick={clearFilters}>Clear filters</Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                disabled={cannotCreateOrder}
                onClick={() => setDialog({ open: true, order: null })}
              >
                Add order
              </Button>
            )}
          />
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Order date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleOrders.map((order) => (
                    <TableRow key={order.oid} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 750 }}>
                          #{order.oid}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          OID {order.oid}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              fontSize: '0.72rem',
                              fontWeight: 750,
                              backgroundColor: avatarColor(order.uname),
                            }}
                          >
                            {initials(order.uname)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 650 }}>
                              {order.uname}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              UID #{order.uid}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.pname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PID #{order.pid}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatDateTime(order.order_date)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit order">
                          <IconButton
                            size="small"
                            aria-label={`Edit order ${order.oid}`}
                            onClick={() => setDialog({ open: true, order })}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete order">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete order ${order.oid}`}
                            onClick={() => setPendingDelete(order)}
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
              count={filteredOrders.length}
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

      <OrderDialog
        open={dialog.open}
        order={dialog.order}
        users={users}
        products={products}
        onClose={() => setDialog({ open: false, order: null })}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete order?"
        description={pendingDelete
          ? `Order #${pendingDelete.oid} for ${pendingDelete.uname} will be permanently deleted.`
          : ''}
        loading={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      <FeedbackSnackbar feedback={feedback} onClose={closeFeedback} />
    </Box>
  );
}
