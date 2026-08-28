// ============================================================
//  api.js  —  Central API Configuration & Request Layer
//  Radhika Varieties E-Commerce
//
//  ⚠️  ONLY CHANGE THIS FILE to update the API URL.
//  Never put the API URL inside index.html or any page file.
//
//  CORS FIX EXPLAINED:
//  Google Apps Script cannot handle CORS preflight (OPTIONS).
//  Sending Content-Type: application/json triggers a preflight
//  → Apps Script blocks it → registration/login fails.
//
//  Solution:
//  ✅ GET  → query string params (no preflight)
//  ✅ POST → URLSearchParams body (no preflight, no JSON header)
//            Apps Script reads: JSON.parse(e.parameter.payload)
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwFgIJDRn3lfjBV4yrrkgKwe2wBk9MuuktqiZ_MxxgB-RU9_FHv6fXxARA1wl7_KlYr/exec';

// ── Is API configured? ────────────────────────────────────────
const isMock = () => !API_URL || API_URL.includes('YOUR_APPS_SCRIPT');

// ── GET request — no CORS issues ─────────────────────────────
async function apiGet(params = {}) {
  if (isMock()) {
    console.warn('[API] Mock mode — set API_URL in api.js');
    return { success: false, _mock: true };
  }
  try {
    const qs  = new URLSearchParams(params).toString();
    const url = `${API_URL}?${qs}`;
    console.log('[API GET]', params.action, url);
    const res = await fetch(url, { redirect: 'follow' });
    const txt = await res.text();
    console.log('[API GET response]', txt.substring(0, 200));
    return JSON.parse(txt);
  } catch (err) {
    console.error('[API GET error]', err.message);
    return { success: false, error: err.message };
  }
}

// ── POST request — URLSearchParams (NO preflight, NO CORS block)
// Body is encoded as: payload={"action":"register","name":...}
// Apps Script reads: const body = JSON.parse(e.parameter.payload)
async function apiPost(body = {}) {
  if (isMock()) {
    console.warn('[API] Mock mode — set API_URL in api.js');
    return { success: false, _mock: true };
  }
  try {
    const form = new URLSearchParams();
    form.append('payload', JSON.stringify(body));
    console.log('[API POST] action:', body.action);
    const res = await fetch(API_URL, {
      method  : 'POST',
      redirect: 'follow',
      body    : form
      // ← NO Content-Type header override here
      // Browser auto-sets: application/x-www-form-urlencoded
      // This avoids the CORS preflight OPTIONS request entirely
    });
    const txt = await res.text();
    console.log('[API POST response]', txt.substring(0, 300));
    return JSON.parse(txt);
  } catch (err) {
    console.error('[API POST error]', err.message);
    return { success: false, error: err.message };
  }
}

// ── Session helpers ───────────────────────────────────────────
function getToken()  { return localStorage.getItem('rv_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('rv_user')); } catch { return null; } }
function isLoggedIn(){ return !!getToken(); }

function saveSession(data) {
  localStorage.setItem('rv_token', data.token);
  localStorage.setItem('rv_user',  JSON.stringify(data.user));
}
function clearSession() {
  localStorage.removeItem('rv_token');
  localStorage.removeItem('rv_user');
}

// ── Auth APIs ─────────────────────────────────────────────────
const Auth = {
  register : (name, email, password, mobile) =>
    apiPost({ action: 'register', name, email, password, mobile }),

  login    : (email, password) =>
    apiPost({ action: 'login', email, password }),

  logout   : () =>
    apiGet({ action: 'logout', token: getToken() }),

  changePassword : (oldPassword, newPassword) =>
    apiPost({ action: 'changePassword', token: getToken(), oldPassword, newPassword }),

  updateProfile  : (fields) =>
    apiPost({ action: 'updateProfile', token: getToken(), ...fields }),

  forgotPassword : (email) =>
    apiPost({ action: 'forgotPassword', email })
};

// ── Product APIs ──────────────────────────────────────────────
const Products = {
  getAll      : (page = 1, limit = 20, category = '') =>
    apiGet({ action: 'getProducts', page, limit, category }),

  getFeatured : () =>
    apiGet({ action: 'getFeaturedProducts' }),

  getOne      : (id) =>
    apiGet({ action: 'getProduct', id }),

  search      : (q) =>
    apiGet({ action: 'searchProducts', q }),

  filter      : (params) =>
    apiGet({ action: 'filterProducts', ...params }),

  getCategories: () =>
    apiGet({ action: 'getCategories' })
};

// ── Cart APIs ─────────────────────────────────────────────────
const Cart = {
  get    : ()                   => apiGet({ action: 'getCart',    token: getToken() }),
  add    : (productId, qty = 1) => apiPost({ action: 'addCart',   token: getToken(), productId, qty }),
  update : (productId, qty)     => apiPost({ action: 'updateCart',token: getToken(), productId, qty }),
  remove : (productId)          => apiGet({ action: 'removeCart', token: getToken(), productId })
};

// ── Order APIs ────────────────────────────────────────────────
const Orders = {
  place  : (address, paymentMethod, couponCode) =>
    apiPost({ action: 'placeOrder', token: getToken(), address, paymentMethod, couponCode }),

  getAll : ()        => apiGet({ action: 'getOrders',  token: getToken() }),
  track  : (orderId) => apiGet({ action: 'trackOrder', token: getToken(), orderId }),
  cancel : (orderId) => apiGet({ action: 'cancelOrder',token: getToken(), orderId })
};

// ── Review APIs ───────────────────────────────────────────────
const Reviews = {
  get : (productId)                   => apiGet({ action: 'getReviews', productId }),
  add : (productId, rating, comment)  =>
    apiPost({ action: 'addReview', token: getToken(), productId, rating, comment })
};

// ── Settings API ──────────────────────────────────────────────
const Settings = {
  get : () => apiGet({ action: 'getSettings' })
};

// ── Misc APIs ─────────────────────────────────────────────────
const Misc = {
  contact    : (name, email, message) =>
    apiPost({ action: 'contactUs', name, email, message }),
  newsletter : (email) =>
    apiPost({ action: 'newsletter', email }),
  applyCoupon: (code) =>
    apiGet({ action: 'validateCoupon', code })
};

// ── Admin APIs ────────────────────────────────────────────────
const Admin = {
  stats          : ()           => apiGet({ action: 'dashboardStats',   token: getToken() }),
  getCustomers   : ()           => apiGet({ action: 'getCustomers',     token: getToken() }),
  addProduct     : (data)       => apiPost({ action: 'addProduct',      token: getToken(), ...data }),
  updateProduct  : (data)       => apiPost({ action: 'updateProduct',   token: getToken(), ...data }),
  deleteProduct  : (id)         => apiPost({ action: 'deleteProduct',   token: getToken(), productId: id }),
  updateStock    : (id, stock)  => apiPost({ action: 'updateStock',     token: getToken(), productId: id, stock }),
  changeStatus   : (orderId, status) =>
    apiPost({ action: 'changeOrderStatus', token: getToken(), orderId, status }),
  generateInvoice: (orderId)    => apiPost({ action: 'generateInvoice', token: getToken(), orderId }),
  addCoupon      : (data)       => apiPost({ action: 'addCoupon',       token: getToken(), ...data }),
  updateSettings : (settings)   => apiPost({ action: 'updateSettings',  token: getToken(), settings }),
  uploadImage    : (productId, imageData, mimeType, fileName) =>
    apiPost({ action: 'uploadProductImage', token: getToken(), productId, imageData, mimeType, fileName }),
  listImages     : (productId, category) =>
    apiPost({ action: 'listProductImages',  token: getToken(), productId, category }),
  deleteImage    : (imageUrl) =>
    apiPost({ action: 'deleteProductImage', token: getToken(), imageUrl })
};

// ── Cart badge refresh (usable from any page) ─────────────────
async function refreshCartBadge() {
  if (!isLoggedIn()) return;
  try {
    const data = await Cart.get();
    document.querySelectorAll('.cart-badge, .cbadge, #cb, #cartCount').forEach(el => {
      el.textContent  = data.count || 0;
      el.style.display = (data.count || 0) > 0 ? 'inline-flex' : 'none';
    });
  } catch (_) {}
}
