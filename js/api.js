// ============================================================
//  api.js  —  Central API layer
//  All pages import this. Never write fetch() calls elsewhere.
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycbw9MSe9_-EWuJccsqQNZhfvPGiGJ8n13FNg-SZXeEllmhCB0-PNatowo2n22ISbQ1PL/exec"; // ← Replace after deploying

// ── Core request helpers ─────────────────────────────────────

async function apiGet(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  if (!res.ok) throw new Error("Network error: " + res.status);
  return res.json();
}

async function apiPost(body = {}) {
  const res = await fetch(API_URL, {
    method  : "POST",
    headers : { "Content-Type": "application/json" },
    body    : JSON.stringify(body)
  });
  if (!res.ok) throw new Error("Network error: " + res.status);
  return res.json();
}

// ── Auth token helper ────────────────────────────────────────

function getToken()          { return localStorage.getItem("token"); }
function getUser()           { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }
function isLoggedIn()        { return !!getToken(); }

function saveSession(data)   {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user",  JSON.stringify(data.user));
}
function clearSession()      {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ── Auth APIs ────────────────────────────────────────────────

const Auth = {
  register : (name, email, password, mobile) =>
    apiPost({ action: "register", name, email, password, mobile }),

  login    : (email, password) =>
    apiPost({ action: "login", email, password }),

  logout   : () =>
    apiGet({ action: "logout", token: getToken() }),

  changePassword : (oldPassword, newPassword) =>
    apiPost({ action: "changePassword", token: getToken(), oldPassword, newPassword }),

  updateProfile  : (fields) =>
    apiPost({ action: "updateProfile", token: getToken(), ...fields }),

  forgotPassword : (email) =>
    apiPost({ action: "forgotPassword", email })
};

// ── Product APIs ─────────────────────────────────────────────

const Products = {
  getAll      : (page = 1, limit = 20, category = "") =>
    apiGet({ action: "getProducts", page, limit, category }),

  getFeatured : () =>
    apiGet({ action: "getFeaturedProducts" }),

  getOne      : (id) =>
    apiGet({ action: "getProduct", id }),

  search      : (q) =>
    apiGet({ action: "searchProducts", q }),

  filter      : (params) =>
    apiGet({ action: "filterProducts", ...params }),

  getCategories: () =>
    apiGet({ action: "getCategories" })
};

// ── Cart APIs ────────────────────────────────────────────────

const Cart = {
  get    : ()                         => apiGet({ action: "getCart", token: getToken() }),
  add    : (productId, qty = 1)       => apiPost({ action: "addCart",    token: getToken(), productId, qty }),
  update : (productId, qty)           => apiPost({ action: "updateCart", token: getToken(), productId, qty }),
  remove : (productId)                => apiGet({ action: "removeCart",  token: getToken(), productId })
};

// ── Order APIs ───────────────────────────────────────────────

const Orders = {
  place  : (address, paymentMethod, couponCode) =>
    apiPost({ action: "placeOrder", token: getToken(), address, paymentMethod, couponCode }),

  getAll : ()        => apiGet({ action: "getOrders",  token: getToken() }),
  track  : (orderId) => apiGet({ action: "trackOrder", token: getToken(), orderId }),
  cancel : (orderId) => apiGet({ action: "cancelOrder",token: getToken(), orderId })
};

// ── Reviews ──────────────────────────────────────────────────

const Reviews = {
  get : (productId)                  => apiGet({ action: "getReviews", productId }),
  add : (productId, rating, comment) =>
    apiPost({ action: "addReview", token: getToken(), productId, rating, comment })
};

// ── Settings ─────────────────────────────────────────────────

const Settings = {
  get : () => apiGet({ action: "getSettings" })
};

// ── Misc ─────────────────────────────────────────────────────

const Misc = {
  contact    : (name, email, message) =>
    apiPost({ action: "contactUs", name, email, message }),

  newsletter : (email) =>
    apiPost({ action: "newsletter", email }),

  applyCoupon: (code) =>
    apiGet({ action: "validateCoupon", code })
};

// ── Admin APIs ───────────────────────────────────────────────

const Admin = {
  stats          : ()      => apiGet({ action: "dashboardStats",  token: getToken() }),
  getCustomers   : ()      => apiGet({ action: "getCustomers",    token: getToken() }),
  addProduct     : (data)  => apiPost({ action: "addProduct",     token: getToken(), ...data }),
  updateProduct  : (data)  => apiPost({ action: "updateProduct",  token: getToken(), ...data }),
  deleteProduct  : (id)    => apiPost({ action: "deleteProduct",  token: getToken(), productId: id }),
  updateStock    : (id, s) => apiPost({ action: "updateStock",    token: getToken(), productId: id, stock: s }),
  changeStatus   : (orderId, status) =>
    apiPost({ action: "changeOrderStatus", token: getToken(), orderId, status }),
  generateInvoice: (orderId) =>
    apiPost({ action: "generateInvoice",   token: getToken(), orderId }),
  addCoupon      : (data)  => apiPost({ action: "addCoupon",      token: getToken(), ...data }),
  updateSettings : (settings) =>
    apiPost({ action: "updateSettings", token: getToken(), settings })
};

// ── Cart count badge (shared UI helper) ─────────────────────

async function refreshCartBadge() {
  if (!isLoggedIn()) return;
  try {
    const data = await Cart.get();
    document.querySelectorAll(".cart-badge").forEach(el => {
      el.textContent = data.count || 0;
      el.style.display = data.count > 0 ? "inline-flex" : "none";
    });
  } catch (_) {}
}
