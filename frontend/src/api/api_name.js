// --------------------
// Detect Environment
// --------------------
const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const API = isLocalhost
  ? 'http://localhost:4000/api'
  : 'https://YOUR-PRODUCTION-DOMAIN.com/api';

// --------------------
// Helper Function
// --------------------
async function request(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `API request failed: ${res.status} ${res.statusText} - ${errorText}`
    );
  }

  return res.status !== 204 ? res.json() : null;
}

// --------------------
// Users / Staff
// --------------------
export const getStaff = () => request('/staff/all');
export const createStaff = (data) =>
  request('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id, data) =>
  request('/staff/edit', { method: 'PUT', body: JSON.stringify({ id, ...data }) });
export const deleteStaff = (id) => request(`/staff/${id}`, { method: 'DELETE' });
export const updateStatus = (id, status, suspension_days = 0, suspension_reason = '') =>
  request(`/staff/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, suspension_days, suspension_reason }) });
export const inviteStaff = (data) =>
  request('/staff/invite', { method: 'POST', body: JSON.stringify(data) });

// --------------------
// Departments
// --------------------
export const getDepartments = () => request('/departments');
export const updateDepartment = (staffId, newDeptId) =>
  request(`/departments/${staffId}`, { method: 'PUT', body: JSON.stringify({ department: newDeptId }) });

// --------------------
// Machines
// --------------------
export const fetchMachines = () => request('/machines');

// --------------------
// Store Inventory
// --------------------
export const fetchInventory = () => request('/store-inventory');
export const createInventoryItem = (data) =>
  request('/store-inventory', { method: 'POST', body: JSON.stringify(data) });
export const updateInventoryItem = (id, data) =>
  request(`/store-inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// --------------------
// Categories
// --------------------
export const fetchCategories = () => request('/categories');
export const createCategory = (data) =>
  request('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// --------------------
// Vendors
// --------------------
export const fetchVendors = () => request('/vendors');
export const createVendor = (data) =>
  request('/vendors', { method: 'POST', body: JSON.stringify(data) });
export const updateVendor = (id, data) =>
  request(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// --------------------
// Current User
// --------------------
export const fetchCurrentUser = async () => {
  try {
    return await request('/me');
  } catch {
    return null;
  }
};

// --------------------
// Users by Role
// --------------------
export const fetchMailerOfficers = () => request('/users/mailer-officers');
export const fetchMachineOperators = () => request('/users/machine-operators');
export const fetchQcOfficers = () => request('/users/qc-officers');

// --------------------
// Embeddings
// --------------------
export const fetchEmbedding = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/embedding?${query}`);
};
export const createEmbedding = (data) =>
  request('/embedding', { method: 'POST', body: JSON.stringify(data) });
