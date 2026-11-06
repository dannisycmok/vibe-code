import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FeedbackSnackbar from '../components/FeedbackSnackbar.jsx';
import useFeedback from '../hooks/useFeedback.js';
import { api } from '../api/client.js';
import {
  avatarColor,
  formatCurrency,
  formatDateTime,
  initials,
} from '../utils/format.js';

export default function DashboardPage() {
  const [data, setData] = useState({ products: [], users: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { feedback, showFeedback, closeFeedback } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [products, users, orders] = await Promise.all([
        api.getProducts(),
        api.getUsers(),
        api.getOrders(),
      ]);

      setData({
        products: products.data,
        users: users.data,
        orders: orders.data,
      });
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

  const inventoryValue = data.products.reduce(
    (total, product) => total + product.price * product.qty,
    0,
  );
  const unitsInStock = data.products.reduce((total, product) => total + product.qty, 0);
  const lowStock = [...data.products]
    .filter((product) => product.qty <= 5)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 5);
  const recentOrders = data.orders.slice(0, 5);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 3.5,
          color: '#fff',
          background: 'linear-gradient(118deg, #312e81 0%, #4f46e5 58%, #0f9f95 145%)',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 260,
            height: 260,
            right: -70,
            top: -100,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.08)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 170,
            height: 170,
            right: 110,
            bottom: -130,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 750, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}
          >
            Operations overview
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.3, color: '#fff' }}>
            Your inventory, in one place.
          </Typography>
          <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.76)', maxWidth: 620 }}>
            Manage products, customer accounts and orders through a single,
            connected workspace.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 3 }}>
            <Button
              component={RouterLink}
              to="/products"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              sx={{
                backgroundColor: '#fff',
                color: '#3730a3',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#f1f5f9', boxShadow: 'none' },
              }}
            >
              Manage products
            </Button>
            <Button
              component={RouterLink}
              to="/orders"
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.35)',
                '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' },
              }}
            >
              View orders
            </Button>
          </Stack>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}
          sx={{ mb: 2.5 }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          icon={<Inventory2RoundedIcon />}
          label="Products"
          value={loading ? <Skeleton width={46} /> : data.products.length}
          helper={`${unitsInStock} units in stock`}
          color="#4f46e5"
        />
        <StatCard
          icon={<PaymentsRoundedIcon />}
          label="Inventory value"
          value={loading ? <Skeleton width={100} /> : formatCurrency(inventoryValue)}
          helper="Based on current stock"
          color="#0f9f95"
        />
        <StatCard
          icon={<PeopleAltRoundedIcon />}
          label="Customers"
          value={loading ? <Skeleton width={46} /> : data.users.length}
          helper="Registered user accounts"
          color="#b45309"
        />
        <StatCard
          icon={<ReceiptLongRoundedIcon />}
          label="Orders"
          value={loading ? <Skeleton width={46} /> : data.orders.length}
          helper={recentOrders[0] ? `Latest ${formatDateTime(recentOrders[0].order_date)}` : 'No orders yet'}
          color="#be185d"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.8fr) minmax(300px, 0.8fr)' },
          alignItems: 'start',
          gap: 2,
        }}
      >
        <Paper elevation={0} sx={{ border: '1px solid #e7ebf2', borderRadius: 3, overflow: 'hidden' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Box>
              <Typography variant="h6">Recent orders</Typography>
              <Typography variant="body2" color="text.secondary">
                The latest activity across your catalog.
              </Typography>
            </Box>
            <Button component={RouterLink} to="/orders" size="small" endIcon={<ArrowForwardRoundedIcon />}>
              View all
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ px: 2.5, pb: 2.5 }}>
              <Skeleton height={50} />
              <Skeleton height={50} />
              <Skeleton height={50} />
            </Box>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon={<ReceiptLongRoundedIcon />}
              title="No orders yet"
              description="Create an order after adding at least one product and customer."
              action={(
                <Button component={RouterLink} to="/orders" variant="contained" size="small">
                  Create an order
                </Button>
              )}
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Product</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.oid} hover>
                      <TableCell sx={{ fontWeight: 700 }}>#{order.oid}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: '0.7rem',
                              fontWeight: 750,
                              backgroundColor: avatarColor(order.uname),
                            }}
                          >
                            {initials(order.uname)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {order.uname}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {order.pname}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatDateTime(order.order_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid #e7ebf2', borderRadius: 3, p: 2.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '11px',
                color: 'warning.main',
                backgroundColor: 'rgba(180, 83, 9, 0.09)',
              }}
            >
              <WarningAmberRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6">Low stock</Typography>
              <Typography variant="caption" color="text.secondary">
                Products with 5 units or fewer
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={2} sx={{ mt: 2.5 }}>
            {loading && (
              <>
                <Skeleton height={44} />
                <Skeleton height={44} />
                <Skeleton height={44} />
              </>
            )}

            {!loading && lowStock.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Stock levels look healthy.
              </Typography>
            )}

            {!loading && lowStock.map((product) => (
              <Box key={product.pid}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Typography variant="body2" sx={{ fontWeight: 650 }} noWrap>
                    {product.pname}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${product.qty} left`}
                    color={product.qty === 0 ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((product.qty / 10) * 100, 100)}
                  color={product.qty === 0 ? 'error' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            ))}
          </Stack>

          {!loading && lowStock.length > 0 && (
            <Button
              component={RouterLink}
              to="/products"
              size="small"
              fullWidth
              sx={{ mt: 3 }}
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Review inventory
            </Button>
          )}
        </Paper>
      </Box>

      <FeedbackSnackbar feedback={feedback} onClose={closeFeedback} />
    </Box>
  );
}
