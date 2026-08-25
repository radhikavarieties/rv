// ============================================================
//  utils.js  —  Shared UI utilities
// ============================================================

// ── Currency formatter ───────────────────────────────────────
function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style    : "currency",
    currency : "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

// ── Date formatter ───────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

// ── Toast notification ───────────────────────────────────────
function toast(message, type = "success") {
  const existing = document.getElementById("toast-container");
  if (existing) existing.remove();

  const c = document.createElement("div");
  c.id = "toast-container";
  c.innerHTML = `<div class="toast toast--${type}">${message}</div>`;
  document.body.appendChild(c);

  setTimeout(() => { c.querySelector(".toast").classList.add("toast--hide"); }, 3000);
  setTimeout(() => c.remove(), 3400);
}

// ── Show / hide loader overlay ───────────────────────────────
function showLoader()  { document.getElementById("loader")?.classList.remove("hidden"); }
function hideLoader()  { document.getElementById("loader")?.classList.add("hidden"); }

// ── Render star rating HTML ──────────────────────────────────
function renderStars(rating, max = 5) {
  let html = "";
  for (let i = 1; i <= max; i++) {
    html += `<span class="star ${i <= Math.round(rating) ? "star--filled" : ""}">&starf;</span>`;
  }
  return html;
}

// ── Truncate text ────────────────────────────────────────────
function truncate(str, n = 80) {
  return str && str.length > n ? str.slice(0, n) + "…" : str;
}

// ── Build product card HTML ──────────────────────────────────
function productCard(p) {
  const img      = p.images?.[0] || "assets/placeholder.svg";
  const price    = p.SalePrice ? p.SalePrice : p.Price;
  const original = p.SalePrice ? p.Price     : null;
  const badge    = !p.inStock ? "Out of Stock" : (p.SalePrice ? "Sale" : "");

  return `
  <article class="card" data-id="${p.ProductID}">
    <a href="product.html?id=${p.ProductID}" class="card__img-wrap">
      <img src="${img}" alt="${p.Name}" loading="lazy" class="card__img">
      ${badge ? `<span class="card__badge card__badge--${badge === "Sale" ? "sale" : "oos"}">${badge}</span>` : ""}
    </a>
    <div class="card__body">
      <p class="card__cat">${p.Category}</p>
      <h3 class="card__name"><a href="product.html?id=${p.ProductID}">${p.Name}</a></h3>
      <div class="card__pricing">
        <span class="card__price">${formatPrice(price)}</span>
        ${original ? `<span class="card__original">${formatPrice(original)}</span>` : ""}
      </div>
      <button class="btn btn--primary btn--sm card__cta"
        onclick="addToCart('${p.ProductID}')"
        ${!p.inStock ? "disabled" : ""}>
        ${p.inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    </div>
  </article>`;
}

// ── Quick add to cart (usable from any page) ─────────────────
async function addToCart(productId, qty = 1) {
  if (!isLoggedIn()) {
    toast("Please log in to add items to cart.", "error");
    setTimeout(() => window.location.href = "login.html", 1000);
    return;
  }
  try {
    const res = await Cart.add(productId, qty);
    if (res.success) {
      toast("Added to cart!");
      refreshCartBadge();
    } else {
      toast(res.message, "error");
    }
  } catch (e) {
    toast("Something went wrong.", "error");
  }
}

// ── Guard: redirect to login if not authenticated ────────────
function requireAuth(redirectTo = "login.html") {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// ── Guard: redirect to home if already logged in ─────────────
function requireGuest(redirectTo = "index.html") {
  if (isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// ── Read URL query param ─────────────────────────────────────
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ── Render empty state ───────────────────────────────────────
function emptyState(container, icon, title, subtitle, actionHtml = "") {
  container.innerHTML = `
    <div class="empty">
      <div class="empty__icon">${icon}</div>
      <h3 class="empty__title">${title}</h3>
      <p class="empty__sub">${subtitle}</p>
      ${actionHtml}
    </div>`;
}

// ── Render pagination ────────────────────────────────────────
function renderPagination(container, currentPage, total, limit, onPageChange) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let html = `<div class="pagination">`;
  if (currentPage > 1)
    html += `<button class="pg-btn" data-page="${currentPage - 1}">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pg-btn ${i === currentPage ? "pg-btn--active" : ""}" data-page="${i}">${i}</button>`;
  }
  if (currentPage < totalPages)
    html += `<button class="pg-btn" data-page="${currentPage + 1}">Next →</button>`;
  html += `</div>`;

  container.innerHTML = html;
  container.querySelectorAll(".pg-btn").forEach(btn => {
    btn.addEventListener("click", () => onPageChange(parseInt(btn.dataset.page)));
  });
}

// ── Order status badge ───────────────────────────────────────
function statusBadge(status) {
  const map = {
    Pending          : "warn",
    Confirmed        : "info",
    Shipped          : "info",
    "Out for Delivery": "info",
    Delivered        : "success",
    Cancelled        : "error"
  };
  return `<span class="badge badge--${map[status] || "info"}">${status}</span>`;
}
