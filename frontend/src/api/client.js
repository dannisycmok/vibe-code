const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || `Request failed with status ${response.status}.`,
      response.status,
      payload?.errors,
    );
  }

  return payload;
}

export const api = {
  getProducts: () => request('/get_products'),
  getProduct: (id) => request(`/get_product/${id}`),
  addProduct: (product) => request('/add_product', { method: 'POST', body: product }),
  updateProduct: (id, product) => request(`/update/${id}`, { method: 'PUT', body: product }),
  deleteProduct: (id) => request(`/delete_product/${id}`, { method: 'DELETE' }),

  getUsers: () => request('/get_users'),
  getUser: (id) => request(`/get_user/${id}`),
  addUser: (user) => request('/add_user', { method: 'POST', body: user }),
  updateUser: (id, user) => request(`/update_user/${id}`, { method: 'PUT', body: user }),
  deleteUser: (id) => request(`/delete_user/${id}`, { method: 'DELETE' }),

  getOrders: () => request('/get_orders'),
  getOrder: (id) => request(`/get_order/${id}`),
  getOrdersByUser: (uid) => request(`/get_orders/uid/${uid}`),
  getOrdersByProduct: (pid) => request(`/get_orders/pid/${pid}`),
  addOrder: (order) => request('/add_order', { method: 'POST', body: order }),
  updateOrder: (id, order) => request(`/update_order/${id}`, { method: 'PUT', body: order }),
  deleteOrder: (id) => request(`/delete_order/${id}`, { method: 'DELETE' }),
};
