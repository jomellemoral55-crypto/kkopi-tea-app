/* KKOPI.Tea - Phase 3 (cart, checkout, order confirmation). Vanilla JS, Firestore-ready. */
const page = document.body.dataset.page;
const $ = (s, el = document) => el.querySelector(s);
const peso = (n) => '₱' + n.toLocaleString('en-PH');
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

const SERVICE_FEE = 15; // flat fee per order (pesos)
const PICKUP_MINUTES = 20; // estimated prep time
const DELIVERY_MINUTES = 40;

/* ================= STORAGE SERVICES (swap for Firestore later) ================= */
const store = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage blocked */
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};
// Cart items are written by Phase 2 ("Add to Cart") under "kkopi_cart".
const CartService = {
  all: () => store.get('kkopi_cart', []), // later: users/{uid}/cart
  save: (items) => store.set('kkopi_cart', items),
  clear: () => store.del('kkopi_cart'),
};
const OrderService = {
  async create(order) {
    // later: addDoc(collection(db, "orders"), order)
    store.set('kkopi_orders', [...store.get('kkopi_orders', []), order]);
    store.set('kkopi_lastOrder', order);
    return order;
  },
  last: () => store.get('kkopi_lastOrder', null), // later: getDoc(doc(db, "orders", id))
};

/* ================= HELPERS ================= */
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = Object.assign(document.createElement('div'), {
    className: 'toast',
    textContent: msg,
    role: 'status',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
function updateBadge() {
  const n = CartService.all().reduce((s, i) => s + i.qty, 0);
  const b = $('#cartCount');
  b.textContent = n;
  b.hidden = n === 0;
}
function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const serviceFee = items.length ? SERVICE_FEE : 0;
  return { subtotal, serviceFee, total: subtotal + serviceFee };
}
function renderTotals(items) {
  const t = calcTotals(items);
  $('#subtotal').textContent = peso(t.subtotal);
  $('#serviceFee').textContent = peso(t.serviceFee);
  $('#grandTotal').textContent = peso(t.total);
}
// Order number like KKP-260930-4821
function generateOrderId() {
  const d = new Date(),
    p = (n) => String(n).padStart(2, '0');
  return `KKP-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function nextImg(img) {
  // try the next file type, remove if none work
  const list = img.dataset.srcs.split('|'),
    i = +img.dataset.i + 1;
  if (i < list.length) {
    img.dataset.i = i;
    img.src = list[i];
  } else img.remove();
}
// Use the exact image saved when the item was added to the cart; old items fall back to images/<id>.<ext>
function cartImg(i) {
  const list = i.image
    ? [i.image]
    : ['jpg', 'png', 'webp', 'jpeg'].map(
        (e) => `../images/${i.productId}.${e}`,
      );
  return `<img src="${esc(list[0])}" data-srcs="${esc(list.join('|'))}" data-i="0" alt="${esc(i.name)}" onerror="nextImg(this)">`;
}
const itemOptions = (i) =>
  [i.size, i.sugar && `${i.sugar} sugar`, i.ice].filter(Boolean).join(' · ');
updateBadge();

/* ================= CART PAGE ================= */
function renderCart() {
  const items = CartService.all();
  $('#cartLayout').hidden = items.length === 0;
  $('#emptyCart').hidden = items.length > 0;
  if (!items.length) return;

  $('#cartList').innerHTML = items
    .map(
      (i, idx) => `
    <article class="line" data-i="${idx}">
      <div class="pic" data-emoji="${esc(i.emoji || '🥤')}">${cartImg(i)}</div>
      <div>
        <h3>${esc(i.name)}</h3>
        ${itemOptions(i) ? `<p class="opts-txt">${esc(itemOptions(i))}</p>` : ''}
        ${i.addons?.length ? `<p class="opts-txt">Add-ons: ${esc(i.addons.join(', '))}</p>` : ''}
        <p class="unit">${peso(i.unitPrice)} each</p>
      </div>
      <div class="line-side">
        <div class="qty">
          <button type="button" data-act="minus" aria-label="Decrease quantity">&minus;</button>
          <output>${i.qty}</output>
          <button type="button" data-act="plus" aria-label="Increase quantity">+</button>
        </div>
        <strong class="sub">${peso(i.unitPrice * i.qty)}</strong>
        <button class="remove" type="button" data-act="remove" aria-label="Remove ${esc(i.name)}">🗑</button>
      </div>
    </article>`,
    )
    .join('');
  renderTotals(items);
}

function initCart() {
  $('#cartList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const row = btn.closest('.line'),
      idx = +row.dataset.i;
    const items = CartService.all();
    const act = btn.dataset.act;

    if (act === 'plus') items[idx].qty = Math.min(items[idx].qty + 1, 20); // increase
    if (act === 'minus') items[idx].qty = Math.max(items[idx].qty - 1, 1); // decrease (min 1)
    if (act === 'plus' || act === 'minus') {
      items[idx].total = items[idx].unitPrice * items[idx].qty;
      CartService.save(items);
      renderCart();
      updateBadge();
      return;
    }
    // remove with a short slide-out animation
    row.classList.add('removing');
    setTimeout(() => {
      items.splice(idx, 1);
      CartService.save(items);
      renderCart();
      updateBadge();
      toast('Item removed');
    }, 280);
  });
  renderCart();
}

/* ================= CHECKOUT PAGE ================= */
const RULES = {
  name: (v) => v.trim().length >= 2 || 'Enter your full name.',
  phone: (v) =>
    /^(\+63|0)?9\d{9}$/.test(v.replace(/[\s-]/g, '')) ||
    'Enter a valid PH mobile number (e.g. 09171234567).',
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address.',
  address: (v) => v.trim().length >= 6 || 'Enter your delivery address.',
};
const PAY_NOTES = {
  Cash: 'Pay with cash when you pick up or receive your order.',
  GCash:
    "You'll be asked to complete payment in GCash (connected in a later phase).",
  Maya: "You'll be asked to complete payment in Maya (connected in a later phase).",
  'Credit/Debit Card':
    'Card payments will use a secure payment page later. Never type card numbers into this form.',
};

function initCheckout() {
  const items = CartService.all();
  if (!items.length) {
    location.replace('cartphase3.html');
    return;
  } // nothing to check out

  const form = $('#checkoutForm');
  $('#sumItems').innerHTML = items
    .map(
      (i) => `
    <li><span>${esc(i.name)} × ${i.qty}<small>${esc([itemOptions(i), ...(i.addons || [])].filter(Boolean).join(', '))}</small></span><strong>${peso(i.unitPrice * i.qty)}</strong></li>`,
    )
    .join('');
  renderTotals(items);

  const pick = (name) =>
    form.querySelector(`input[name="${name}"]:checked`).value;
  const syncMethod = () => {
    $('#deliveryFields').hidden = pick('method') !== 'Delivery';
  };
  const syncPay = () => {
    $('#payNote').textContent = PAY_NOTES[pick('payment')];
  };
  form.addEventListener('change', () => {
    syncMethod();
    syncPay();
  });
  syncMethod();
  syncPay();

  function validate() {
    let ok = true;
    form.querySelectorAll('[data-rule]').forEach((input) => {
      const field = input.closest('.field');
      if (input.dataset.rule === 'address' && pick('method') !== 'Delivery') {
        field.classList.remove('invalid');
        return;
      }
      const res = RULES[input.dataset.rule](input.value);
      field.classList.toggle('invalid', res !== true);
      field.querySelector('.error').textContent = res === true ? '' : res;
      if (res !== true) ok = false;
    });
    return ok;
  }
  form.addEventListener('input', (e) =>
    e.target.closest('.field')?.classList.remove('invalid'),
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      $('.field.invalid input')?.focus();
      return;
    }
    const btn = $('#placeOrder');
    btn.disabled = true;
    btn.textContent = 'Placing order...';

    const method = pick('method'),
      totals = calcTotals(items);
    const created = new Date();
    const order = {
      // shape of the future Firestore document
      id: generateOrderId(),
      createdAt: created.toISOString(),
      estimatedAt: new Date(
        created.getTime() +
          (method === 'Delivery' ? DELIVERY_MINUTES : PICKUP_MINUTES) * 60000,
      ).toISOString(),
      status: 'pending',
      customer: {
        name: form.fullName.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
      },
      delivery: {
        method,
        address: method === 'Delivery' ? form.address.value.trim() : null,
        landmark: method === 'Delivery' ? form.landmark.value.trim() : null,
      },
      payment: { method: pick('payment') },
      items,
      subtotal: totals.subtotal,
      serviceFee: totals.serviceFee,
      total: totals.total,
    };
    try {
      await OrderService.create(order);
      CartService.clear(); // clear cart after success
      location.href = 'orderconfirmationphase3.html';
    } catch (err) {
      toast('Something went wrong. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });
}

/* ================= CONFIRMATION PAGE ================= */
function initConfirm() {
  const o = OrderService.last();
  if (!o) {
    location.replace('cartphase3.html');
    return;
  }
  const fmtDate = new Date(o.createdAt).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const fmtTime = new Date(o.estimatedAt).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
  $('#custName').textContent = o.customer.name.split(' ')[0];
  $('#orderId').textContent = o.id;
  $('#orderDate').textContent = fmtDate;
  $('#etaLabel').textContent =
    o.delivery.method === 'Delivery'
      ? 'Estimated delivery'
      : 'Estimated pickup';
  $('#orderEta').textContent = fmtTime;
  $('#orderPay').textContent = o.payment.method;
  $('#orderTotal').textContent = peso(o.total);
  $('#trackBtn').addEventListener('click', () =>
    toast('Order tracking is coming soon.'),
  );
}

({ cart: initCart, checkout: initCheckout, confirm: initConfirm })[page]();
