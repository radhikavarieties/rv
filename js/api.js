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

// ============================================================
//  HOW CORS-SAFE POST WORKS (read once, understand forever)
//
//  PROBLEM:
//    fetch() with {headers: {"Content-Type":"application/json"}}
//    triggers a browser CORS preflight (OPTIONS request).
//    Google Apps Script ignores OPTIONS → browser blocks the call.
//
//  SOLUTION:
//    Send POST body as URLSearchParams (form-encoded).
//    Browser sets Content-Type: application/x-www-form-urlencoded
//    → NO preflight → NO CORS block → Apps Script receives it fine.
//    The JSON payload travels as a single field called "payload".
//
//  On Apps Script side (Code.gs doPost):
//    const body = JSON.parse(e.parameter.payload);
//    const action = body.action;  // ← works perfectly
// ============================================================

// ── Internal: is the URL configured? ─────────────────────────
const _ready = () => API_URL && !API_URL.includes("YOUR_APPS_SCRIPT");

// ── GET — safe, no preflight ──────────────────────────────────
async function apiGet(params = {}) {
  if (!_ready()) {
    console.warn("[api.js] API_URL not set. Edit api.js line 6.");
    return { success: false, _mock: true, message: "API not configured" };
  }
  try {
    const url = API_URL + "?" + new URLSearchParams(params).toString();
    console.log("[GET]", params.action || "", url);
    const res = await fetch(url, { redirect: "follow" });
    const txt = await res.text();
    console.log("[GET ✓]", txt.slice(0, 150));
    return JSON.parse(txt);
  } catch (err) {
    console.error("[GET ✗]", err.message);
    return { success: false, error: err.message };
  }
}

// ── POST — URLSearchParams body, no preflight ─────────────────
async function apiPost(body = {}) {
  if (!_ready()) {
    console.warn("[api.js] API_URL not set. Edit api.js line 6.");
    return { success: false, _mock: true, message: "API not configured" };
  }
  try {
    const form = new URLSearchParams();
    form.append("payload", JSON.stringify(body));
    console.log("[POST]", body.action || "");
    const res = await fetch(API_URL, {
      method  : "POST",
      redirect: "follow",
      body    : form
      // ← No Content-Type override → browser uses form-urlencoded → no preflight
    });
    const txt = await res.text();
    console.log("[POST ✓]", txt.slice(0, 200));
    return JSON.parse(txt);
  } catch (err) {
    console.error("[POST ✗]", err.message);
    return { success: false, error: err.message };
  }
}

// ── Session helpers ───────────────────────────────────────────
function getToken()   { return localStorage.getItem("rv_token"); }
function getUser()    { try { return JSON.parse(localStorage.getItem("rv_user")); } catch { return null; } }
function isLoggedIn() { return !!getToken(); }
function saveSession(d) {
  localStorage.setItem("rv_token", d.token);
  localStorage.setItem("rv_user",  JSON.stringify(d.user));
}
function clearSession() {
  localStorage.removeItem("rv_token");
  localStorage.removeItem("rv_user");
  localStorage.removeItem("rv_cart");
}

// ── Auth ──────────────────────────────────────────────────────
const Auth = {
  register       : (name, email, password, mobile) =>
    apiPost({ action: "register", name, email, password, mobile }),
  login          : (email, password) =>
    apiPost({ action: "login", email, password }),
  logout         : () =>
    apiGet({ action: "logout", token: getToken() }),
  changePassword : (oldPassword, newPassword) =>
    apiPost({ action: "changePassword", token: getToken(), oldPassword, newPassword }),
  updateProfile  : (fields) =>
    apiPost({ action: "updateProfile", token: getToken(), ...fields }),
  forgotPassword : (email) =>
    apiPost({ action: "forgotPassword", email })
};

// ── Products ──────────────────────────────────────────────────
const Products = {
  getAll       : (page = 1, limit = 20, category = "") =>
    apiGet({ action: "getProducts", page, limit, category }),
  getFeatured  : () =>
    apiGet({ action: "getFeaturedProducts" }),
  getOne       : (id) =>
    apiGet({ action: "getProduct", id }),
  search       : (q) =>
    apiGet({ action: "searchProducts", q }),
  filter       : (params) =>
    apiGet({ action: "filterProducts", ...params }),
  getCategories: () =>
    apiGet({ action: "getCategories" })
};

// ── Cart ──────────────────────────────────────────────────────
const Cart = {
  get    : ()                   => apiGet({ action: "getCart",    token: getToken() }),
  add    : (productId, qty = 1) => apiPost({ action: "addCart",   token: getToken(), productId, qty }),
  update : (productId, qty)     => apiPost({ action: "updateCart",token: getToken(), productId, qty }),
  remove : (productId)          => apiGet({ action: "removeCart", token: getToken(), productId })
};

// ── Orders ────────────────────────────────────────────────────
const Orders = {
  place  : (address, paymentMethod, couponCode) =>
    apiPost({ action: "placeOrder", token: getToken(), address, paymentMethod, couponCode }),
  getAll : ()        => apiGet({ action: "getOrders",  token: getToken() }),
  track  : (orderId) => apiGet({ action: "trackOrder", token: getToken(), orderId }),
  cancel : (orderId) => apiGet({ action: "cancelOrder",token: getToken(), orderId })
};

// ── Reviews ───────────────────────────────────────────────────
const Reviews = {
  get : (productId) =>
    apiGet({ action: "getReviews", productId }),
  add : (productId, rating, comment) =>
    apiPost({ action: "addReview", token: getToken(), productId, rating, comment })
};

// ── Settings ──────────────────────────────────────────────────
const Settings = {
  get : () => apiGet({ action: "getSettings" })
};

// ── Misc ──────────────────────────────────────────────────────
const Misc = {
  contact    : (name, email, message) =>
    apiPost({ action: "contactUs", name, email, message }),
  newsletter : (email) =>
    apiPost({ action: "newsletter", email }),
  coupon     : (code) =>
    apiGet({ action: "validateCoupon", code })
};

// ── Admin ─────────────────────────────────────────────────────
const Admin = {
  stats          : ()              => apiGet({ action: "dashboardStats",   token: getToken() }),
  getCustomers   : ()              => apiGet({ action: "getCustomers",     token: getToken() }),
  addProduct     : (data)          => apiPost({ action: "addProduct",      token: getToken(), ...data }),
  updateProduct  : (data)          => apiPost({ action: "updateProduct",   token: getToken(), ...data }),
  deleteProduct  : (id)            => apiPost({ action: "deleteProduct",   token: getToken(), productId: id }),
  updateStock    : (id, stock)     => apiPost({ action: "updateStock",     token: getToken(), productId: id, stock }),
  changeStatus   : (orderId, status) =>
    apiPost({ action: "changeOrderStatus", token: getToken(), orderId, status }),
  generateInvoice: (orderId)       => apiPost({ action: "generateInvoice", token: getToken(), orderId }),
  addCoupon      : (data)          => apiPost({ action: "addCoupon",       token: getToken(), ...data }),
  updateSettings : (settings)      => apiPost({ action: "updateSettings",  token: getToken(), settings }),
  uploadImage    : (productId, imageData, mimeType, fileName) =>
    apiPost({ action: "uploadProductImage", token: getToken(), productId, imageData, mimeType, fileName }),
  listImages     : (productId, category) =>
    apiPost({ action: "listProductImages",  token: getToken(), productId, category }),
  deleteImage    : (imageUrl)      =>
    apiPost({ action: "deleteProductImage", token: getToken(), imageUrl })
};

// ── Cart badge refresh ────────────────────────────────────────
async function refreshCartBadge() {
  if (!isLoggedIn()) return;
  try {
    const d = await Cart.get();
    document.querySelectorAll(".cbadge, #cb, #cartCount").forEach(el => {
      el.textContent   = d.count || 0;
      el.style.display = (d.count || 0) > 0 ? "inline-flex" : "none";
    });
  } catch (_) {}
}
