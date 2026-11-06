import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FeedbackSnackbar from '../components/FeedbackSnackbar.jsx';
import ProductDialog from '../components/dialogs/ProductDialog.jsx';
import useFeedback from '../hooks/useFeedback.js';
import { api } from '../api/client.js';
import { formatCurrency } from '../utils/format.js';

function stockColor(qty) {
  if (qty === 0) return 'error';
  if (qty <= 5) return 'warning';
  return 'success';
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, setDialog] = useState({ open: false, product: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { feedback, showFeedback, closeFeedback } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getProducts();
      setProducts(response.data);
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

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products;

    return products.filter((product) => (
      product.pname.toLowerCase().includes(needle)
      || product.description.toLowerCase().includes(needle)
    ));
  }, [products, search]);

  const visibleProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredProducts.length / rowsPerPage) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [filteredProducts.length, page, rowsPerPage]);

  function handleSaved(message) {
    setDialog({ open: false, product: null });
    showFeedback(message);
    load();
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setDeleting(true);

    try {
      const response = await api.deleteProduct(pendingDelete.pid);
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
        eyebrow="Catalog"
        title="Products"
        subtitle="Create your product catalog, adjust prices and keep stock levels accurate."
        action={(
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialog({ open: true, product: null })}
          >
            Add product
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
            placeholder="Search products…"
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
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
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

        {!loading && filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Inventory2OutlinedIcon />}
            title={search ? 'No matching products' : 'Your catalog is empty'}
            description={search
              ? 'Try a different product name or clear the search.'
              : 'Add your first product to start building orders.'}
            action={search ? (
              <Button variant="outlined" onClick={() => setSearch('')}>Clear search</Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setDialog({ open: true, product: null })}
              >
                Add product
              </Button>
            )}
          />
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleProducts.map((product) => (
                    <TableRow key={product.pid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              borderRadius: '11px',
                              color: 'primary.main',
                              backgroundColor: 'rgba(79, 70, 229, 0.08)',
                            }}
                          >
                            <Inventory2OutlinedIcon fontSize="small" />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {product.pname}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              PID #{product.pid}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 360 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={`${product.qty} in stock`}
                          color={stockColor(product.qty)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit product">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${product.pname}`}
                            onClick={() => setDialog({ open: true, product })}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete product">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete ${product.pname}`}
                            onClick={() => setPendingDelete(product)}
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
              count={filteredProducts.length}
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

      <ProductDialog
        open={dialog.open}
        product={dialog.product}
        onClose={() => setDialog({ open: false, product: null })}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete product?"
        description={pendingDelete
          ? `"${pendingDelete.pname}" will be permanently deleted. Products attached to orders cannot be deleted.`
          : ''}
        loading={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      <FeedbackSnackbar feedback={feedback} onClose={closeFeedback} />
    </Box>
  );
}
