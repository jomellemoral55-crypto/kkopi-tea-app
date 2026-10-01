/* KKOPI.Tea - Phase 5 (Admin panel). Vanilla JS. Every service is Firebase-ready: swap the bodies, keep the UI. */
const page = document.body.dataset.page;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const peso = (n) => '₱' + Math.round(Number(n) || 0).toLocaleString('en-PH');
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const DAY = 86400000,
  PAGE_SIZE = 8;
const STATUSES = ['Pending', 'Preparing', 'Completed', 'Cancelled'];
const CATEGORY = {
  milk: 'Milk Tea',
  fruit: 'Fruit Tea',
  coffee: 'Coffee',
  matcha: 'Matcha',
  hot: 'Hot Drinks',
  snack: 'Snacks',
};
const slug = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
const initials = (n) =>
  (n || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/* ================= AUTH (swap for Firebase Admin login) ================= */
const SESSION_KEY = 'kkopi_admin_session';
const DEMO_ADMIN = {
  email: 'admin@kkopi.tea',
  password: 'admin123',
  name: 'Admin',
};
const AuthService = {
  async login(email, password, remember) {
    /* later: const cred = await signInWithEmailAndPassword(auth, email, password);
              const token = await cred.user.getIdTokenResult(); if (!token.claims.admin) throw new Error("Not an admin"); */
    if (
      email.toLowerCase() !== DEMO_ADMIN.email ||
      password !== DEMO_ADMIN.password
    )
      throw new Error('Incorrect admin email or password.');
    (remember ? localStorage : sessionStorage).setItem(
      SESSION_KEY,
      JSON.stringify({ email, name: DEMO_ADMIN.name }),
    );
  },
  session() {
    try {
      return JSON.parse(
        sessionStorage.getItem(SESSION_KEY) ||
          localStorage.getItem(SESSION_KEY),
      );
    } catch {
      return null;
    }
  },
  async logout() {
    /* later: await signOut(auth); */ sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};
// NOTE: this guard only hides pages in the demo. Real protection = Firebase Auth + Firestore security rules.
if (page !== 'login' && !AuthService.session())
  location.replace('adminloginphase5.html');

/* ================= DATA LAYER (localStorage now, Firestore later) ================= */
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
      /* full or blocked */
    }
  },
};
const DB_KEY = 'kkopi_admin_db';
function seed() {
  // demo data so every admin page has something to show
  let n = 7;
  const rnd = () => (n = (n * 9301 + 49297) % 233280) / 233280;
  const P = [
    ['classic-milk-tea', 'Classic Milk Tea', 'milk', 89, '🥤'],
    ['brown-sugar-boba', 'Brown Sugar Boba', 'milk', 119, '🥤'],
    ['okinawa-milk-tea', 'Okinawa Milk Tea', 'milk', 105, '🥤'],
    ['strawberry-milk-tea', 'Strawberry Milk Tea', 'milk', 99, '🍓'],
    ['cookies-and-cream', 'Cookies & Cream', 'milk', 125, '🍪'],
    ['taro-milk-tea', 'Taro Milk Tea', 'milk', 99, '🥤'],
    ['mango-green-tea', 'Mango Green Tea', 'fruit', 95, '🥭'],
    ['passionfruit-cooler', 'Passionfruit Cooler', 'fruit', 99, '🍹'],
    ['lychee-black-tea', 'Lychee Black Tea', 'fruit', 95, '🍹'],
    ['caramel-macchiato', 'Caramel Macchiato', 'coffee', 139, '☕'],
    ['spanish-latte', 'Spanish Latte', 'coffee', 129, '☕'],
    ['iced-americano', 'Iced Americano', 'coffee', 99, '☕'],
    ['matcha-latte', 'Matcha Latte', 'matcha', 129, '🍵'],
    ['strawberry-matcha', 'Strawberry Matcha', 'matcha', 145, '🍵'],
    ['choco-hazelnut', 'Choco Hazelnut', 'hot', 109, '☕'],
    ['hot-milk-tea', 'Hot Milk Tea', 'hot', 79, '♨️'],
    ['cheesy-fries', 'Cheesy Fries', 'snack', 89, '🍟'],
    ['chicken-poppers', 'Chicken Poppers', 'snack', 109, '🍗'],
    ['choco-chip-cookie', 'Choco Chip Cookie', 'snack', 59, '🍪'],
  ];
  const stocks = [
    48, 36, 25, 18, 9, 30, 22, 0, 14, 40, 7, 33, 27, 12, 20, 45, 16, 8, 0,
  ];
  const products = P.map(([id, name, category, price, emoji], i) => ({
    id,
    name,
    category,
    price,
    emoji,
    stock: stocks[i],
    description: '',
    image: '',
  }));
  const names = [
    ['Maria Santos', 'maria.santos@email.com', '09171234501'],
    ['Juan Dela Cruz', 'juan.dc@email.com', '09181234502'],
    ['Angela Reyes', 'angela.reyes@email.com', '09191234503'],
    ['Mark Villanueva', 'mark.v@email.com', '09201234504'],
    ['Sofia Ramos', 'sofia.ramos@email.com', '09211234505'],
    ['Carlo Mendoza', 'carlo.m@email.com', '09221234506'],
    ['Bea Garcia', 'bea.garcia@email.com', '09231234507'],
    ['Paolo Cruz', 'paolo.cruz@email.com', '09241234508'],
  ];
  const customers = names.map(([name, email, phone], i) => ({
    id: 'c' + (i + 1),
    name,
    email,
    phone,
    status: i === 7 ? 'Disabled' : 'Active',
  }));
  const pay = ['Cash', 'GCash', 'Maya', 'Credit/Debit Card'],
    now = Date.now(),
    orders = [];
  for (let i = 0; i < 28; i++) {
    const c = customers[Math.floor(rnd() * 7)],
      items = [],
      k = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++)
      items.push({
        name: P[Math.floor(rnd() * P.length)][1],
        qty: 1 + Math.floor(rnd() * 2),
      });
    const total =
      items.reduce(
        (s, it) => s + it.qty * P.find((p) => p[1] === it.name)[3],
        0,
      ) + 15;
    const age = i < 4 ? rnd() * 0.9 : rnd() * 40,
      r = rnd();
    const status =
      age < 1
        ? r < 0.5
          ? 'Pending'
          : 'Preparing'
        : r < 0.08
          ? 'Cancelled'
          : r < 0.12
            ? 'Pending'
            : 'Completed';
    orders.push({
      id: 'KKP-' + (100000 + Math.floor(rnd() * 899999)),
      customer: c.name,
      email: c.email,
      phone: c.phone,
      items,
      qty: items.reduce((s, x) => s + x.qty, 0),
      payment: pay[Math.floor(rnd() * 4)],
      total,
      status,
      date: new Date(now - age * DAY).toISOString(),
    });
  }
  return {
    products,
    customers,
    orders: orders.sort((a, b) => b.date.localeCompare(a.date)),
    imported: [],
  };
}
const DB = {
  get() {
    let db = store.get(DB_KEY, null);
    if (!db) db = seed();
    // import orders customers placed in Phase 3 (kkopi_orders), once each
    store.get('kkopi_orders', []).forEach((o) => {
      if (db.imported.includes(o.id)) return;
      db.imported.push(o.id);
      let c = db.customers.find(
        (x) => x.email.toLowerCase() === (o.customer.email || '').toLowerCase(),
      );
      if (!c) {
        c = {
          id: 'c' + Date.now() + db.customers.length,
          name: o.customer.name,
          email: o.customer.email,
          phone: o.customer.phone,
          status: 'Active',
        };
        db.customers.push(c);
      }
      db.orders.unshift({
        id: o.id,
        customer: c.name,
        email: c.email,
        phone: c.phone,
        items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
        qty: o.items.reduce((s, i) => s + i.qty, 0),
        payment: o.payment?.method || 'Cash',
        total: o.total,
        status: 'Pending',
        date: o.createdAt,
      });
    });
    store.set(DB_KEY, db);
    return db;
  },
  save(db) {
    store.set(DB_KEY, db);
  },
  reset() {
    try {
      localStorage.removeItem(DB_KEY);
    } catch {
      /* ignore */
    }
  },
};
/* Services: each is one Firestore call away */
const ProductService = {
  list: () => DB.get().products, // getDocs(collection(db,"products"))
  save(p) {
    const db = DB.get();
    const i = db.products.findIndex((x) => x.id === p.id);
    i < 0 ? db.products.unshift(p) : (db.products[i] = p);
    DB.save(db);
  }, // addDoc / updateDoc
  remove(id) {
    const db = DB.get();
    db.products = db.products.filter((p) => p.id !== id);
    DB.save(db);
  }, // deleteDoc
};
const OrderService = {
  list: () => DB.get().orders, // getDocs(query(collection(db,"orders"), orderBy("date","desc")))
  setStatus(id, status) {
    const db = DB.get();
    db.orders.find((o) => o.id === id).status = status;
    DB.save(db);
  }, // updateDoc
  remove(id) {
    const db = DB.get();
    db.orders = db.orders.filter((o) => o.id !== id);
    DB.save(db);
  }, // deleteDoc
};
const CustomerService = {
  list() {
    // users collection + aggregated order stats
    const db = DB.get();
    return db.customers.map((c) => {
      const mine = db.orders.filter(
        (o) =>
          o.email.toLowerCase() === c.email.toLowerCase() &&
          o.status !== 'Cancelled',
      );
      return {
        ...c,
        orders: mine.length,
        spent: mine.reduce((s, o) => s + o.total, 0),
        last: mine[0]?.date,
      };
    });
  },
  save(c) {
    const db = DB.get();
    const i = db.customers.findIndex((x) => x.id === c.id);
    db.customers[i] = {
      ...db.customers[i],
      name: c.name,
      phone: c.phone,
      status: c.status,
    };
    DB.save(db);
  }, // updateDoc
};
const revenueOrders = () =>
  OrderService.list().filter((o) => o.status !== 'Cancelled');

/* ================= SHARED UI ================= */
function toast(msg) {
  $('.toast')?.remove();
  const t = Object.assign(document.createElement('div'), {
    className: 'toast',
    textContent: msg,
    role: 'status',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
function openModal(title, html) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button class="modal-close" type="button" aria-label="Close">&times;</button><h2>${esc(title)}</h2><div class="modal-body">${html}</div></div>`;
  document.body.appendChild(m);
  document.body.classList.add('no-scroll');
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  function close() {
    m.remove();
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
  }
  document.addEventListener('keydown', onKey);
  m.addEventListener('click', (e) => {
    if (
      e.target === m ||
      e.target.closest('.modal-close') ||
      e.target.closest('[data-close]')
    )
      close();
  });
  return { el: m, close };
}
function confirmBox(title, text, okLabel, onOk) {
  const m = openModal(
    title,
    `<p>${text}</p><div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-danger" type="button" id="okBtn">${okLabel}</button></div>`,
  );
  $('#okBtn', m.el).addEventListener('click', () => {
    m.close();
    onOk();
  });
}
function paginate(list, pg) {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  pg = Math.min(pg, pages);
  return { rows: list.slice((pg - 1) * PAGE_SIZE, pg * PAGE_SIZE), pg, pages };
}
function renderPager(total, pg, pages, onPage) {
  // pagination controls
  const el = $('#pager');
  if (!el) return;
  const from = total ? (pg - 1) * PAGE_SIZE + 1 : 0,
    to = Math.min(pg * PAGE_SIZE, total);
  el.innerHTML = `<span>Showing ${from}-${to} of ${total}</span><div><button type="button" id="prevPg" aria-label="Previous page" ${pg <= 1 ? 'disabled' : ''}>&lsaquo;</button><span>${pg} / ${pages}</span><button type="button" id="nextPg" aria-label="Next page" ${pg >= pages ? 'disabled' : ''}>&rsaquo;</button></div>`;
  $('#prevPg').onclick = () => onPage(pg - 1);
  $('#nextPg').onclick = () => onPage(pg + 1);
}
const badge = (label) =>
  `<span class="status s-${slug(label)}">${esc(label)}</span>`;
const stockLabel = (p) =>
  p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock';
function validate(form) {
  let ok = true;
  $$('[data-rule]', form).forEach((i) => {
    const r = i.dataset.rule,
      v = i.value;
    const res =
      r === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ||
          'Enter a valid email address.'
        : r === 'password'
          ? v.length >= 6 || 'Password must be at least 6 characters.'
          : r === 'phone'
            ? v.trim() === '' ||
              /^(\+63|0)?9\d{9}$/.test(v.replace(/[\s-]/g, '')) ||
              'Enter a valid PH mobile number.'
            : r === 'num'
              ? (v !== '' && Number(v) >= 0) || 'Enter a number (0 or more).'
              : v.trim().length >= 2 || 'This field is required.';
    const f = i.closest('.field');
    f.classList.toggle('invalid', res !== true);
    f.querySelector('.error').textContent = res === true ? '' : res;
    if (res !== true) ok = false;
  });
  return ok;
}
function download(name, text, type) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([text], { type })),
    download: name,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

/* ---- images (same rules as the customer app) ---- */
const TINT = {
  milk: '#c8a07a',
  fruit: '#f29b5b',
  coffee: '#7a4a2e',
  matcha: '#8fb85a',
  hot: '#a0643f',
  snack: '#e9b44c',
};
function artSVG(p) {
  const c = TINT[p.category] || '#c8a07a';
  const body =
    p.category === 'snack'
      ? `<circle cx="100" cy="100" r="62" fill="${c}"/><text x="100" y="124" font-size="66" text-anchor="middle">${p.emoji || '🍟'}</text>`
      : `<path d="M52 62h96l-12 108a8 8 0 0 1-8 7H72a8 8 0 0 1-8-7z" fill="#fff" fill-opacity=".6" stroke="#6f4a32" stroke-width="4"/><path d="M58 98h84l-6.500 72a8 8 0 0 1-8 7H72.500a8 8 0 0 1-8-7z" fill="${c}"/><rect x="44" y="52" width="112" height="16" rx="8" fill="#6f4a32"/>`;
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eadbc8"/>${body}</svg>`,
    )
  );
}
let homeMap = {};
async function loadHomeImages() {
  for (const f of ['../home.html', '../Home.html']) {
    try {
      const r = await fetch(f);
      if (!r.ok) continue;
      new DOMParser()
        .parseFromString(await r.text(), 'text/html')
        .querySelectorAll('.card')
        .forEach((c) => {
          const n = c.querySelector('h3')?.textContent.trim().toLowerCase(),
            s = c.querySelector('img')?.getAttribute('src');
          if (n && s)
            homeMap[n] = /^(https?:|data:|\/)/.test(s) ? s : '../' + s;
        });
      break;
    } catch {
      /* no server */
    }
  }
}
function thumb(p) {
  const list = [
    p.image,
    homeMap[p.name.toLowerCase()],
    ...['jpg', 'png', 'webp'].map((e) => `../images/${p.id}.${e}`),
    artSVG(p),
  ].filter(Boolean);
  return `<div class="thumb" data-emoji="${p.emoji || '🥤'}"><img src="${esc(list[0])}" data-srcs="${esc(list.join('|'))}" data-i="0" alt="" loading="lazy" onerror="nextImg(this)"></div>`;
}
function nextImg(img) {
  const l = img.dataset.srcs.split('|'),
    i = +img.dataset.i + 1;
  if (i < l.length) {
    img.dataset.i = i;
    img.src = l[i];
  } else img.remove();
}
function resizeImage(file, max = 240) {
  return new Promise((res, rej) => {
    const img = new Image(),
      url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height)),
        c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = rej;
    img.src = url;
  });
}

/* ---- charts (plain SVG/CSS now; replace these two functions with Chart.js later) ---- */
function barChart(el, labels, values) {
  const W = 600,
    H = 220,
    pad = 28,
    max = Math.max(...values, 1),
    bw = (W - pad * 2) / labels.length;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sales bar chart">${labels
    .map((l, i) => {
      const h = (values[i] / max) * (H - 70),
        x = pad + i * bw + bw * 0.18,
        w = bw * 0.64;
      return `<g><rect class="bar" x="${x}" y="${H - 34 - h}" width="${w}" height="${Math.max(h, 2)}" rx="6"><title>${l}: ${peso(values[i])}</title></rect>
      <text x="${x + w / 2}" y="${H - 14}" text-anchor="middle">${esc(l)}</text>${values[i] ? `<text x="${x + w / 2}" y="${H - 40 - h}" text-anchor="middle">${peso(values[i])}</text>` : ''}</g>`;
    })
    .join('')}</svg>`;
}
function pieChart(el, slices) {
  const colors = [
      '#2b1a12',
      '#6f4a32',
      '#b98155',
      '#8fb85a',
      '#f29b5b',
      '#c8a07a',
    ],
    total = slices.reduce((s, x) => s + x.v, 0) || 1;
  let acc = 0;
  const stops = slices.map((s, i) => {
    const a = (acc / total) * 100;
    acc += s.v;
    return `${colors[i % 6]} ${a}% ${(acc / total) * 100}%`;
  });
  el.innerHTML = `<div class="pie" style="background:conic-gradient(${stops.join(',') || '#eadbc8 0 100%'})" role="img" aria-label="Revenue by category"></div>
    <ul class="legend">${slices.map((s, i) => `<li><i style="background:${colors[i % 6]}"></i>${esc(s.l)} · ${Math.round((s.v / total) * 100)}%</li>`).join('')}</ul>`;
}
function salesSeries(period) {
  // totals per day / week / month from real orders
  const o = revenueOrders(),
    now = new Date(),
    labels = [],
    values = [];
  const sum = (from, to) =>
    o
      .filter((x) => {
        const t = +new Date(x.date);
        return t >= from && t < to;
      })
      .reduce((s, x) => s + x.total, 0);
  const sod = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  if (period === 'daily')
    for (let i = 6; i >= 0; i--) {
      const d = new Date(sod - i * DAY);
      labels.push(
        d.toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric' }),
      );
      values.push(sum(+d, +d + DAY));
    }
  if (period === 'weekly')
    for (let i = 3; i >= 0; i--) {
      labels.push(i ? `${i}w ago` : 'This week');
      values.push(sum(sod + DAY - (i + 1) * 7 * DAY, sod + DAY - i * 7 * DAY));
    }
  if (period === 'monthly')
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1),
        e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      labels.push(d.toLocaleDateString('en-PH', { month: 'short' }));
      values.push(sum(+d, +e));
    }
  return { labels, values };
}

/* ================= SHELL (sidebar, top bar, notifications) ================= */
function initShell() {
  const s = AuthService.session();
  $('#adminName').textContent = s.name;
  $('#adminInitial').textContent = initials(s.name);
  const side = $('#sidebar'),
    scrim = $('#scrim');
  const toggle = (open) => {
    side.classList.toggle('open', open);
    scrim.hidden = !open;
  };
  $('#menuBtn').addEventListener('click', () => toggle(true));
  scrim.addEventListener('click', () => toggle(false));
  $('#logoutBtn').addEventListener('click', () =>
    confirmBox(
      'Log out?',
      'You will return to the customer login page.',
      'Log out',
      async () => {
        await AuthService.logout();
        location.href = '../login.html';
      },
    ),
  );
  $('#resetDemo').addEventListener('click', () =>
    confirmBox(
      'Reset demo data?',
      'This restores the sample products, orders and customers.',
      'Reset',
      () => {
        DB.reset();
        location.reload();
      },
    ),
  );

  const pending = OrderService.list().filter((o) => o.status === 'Pending'); // notifications = pending orders
  const nc = $('#notifCount');
  nc.textContent = pending.length;
  nc.hidden = !pending.length;
  $('#notifMenu').innerHTML =
    `<h3>Pending orders (${pending.length})</h3>` +
    (pending
      .slice(0, 5)
      .map(
        (o) =>
          `<a href="ordersphase5.html?q=${encodeURIComponent(o.id)}">${esc(o.id)}<small>${esc(o.customer)} · ${peso(o.total)}</small></a>`,
      )
      .join('') || `<a>No pending orders</a>`);
  $('#notifBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const m = $('#notifMenu');
    m.hidden = !m.hidden;
    $('#notifBtn').setAttribute('aria-expanded', !m.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif')) $('#notifMenu').hidden = true;
  });

  // Search bar: filters the table on Products/Orders/Customers, otherwise jumps to Products
  const input = $('#searchInput'),
    q = new URLSearchParams(location.search).get('q');
  if (q) input.value = q;
  input.addEventListener('keydown', (e) => {
    if (
      e.key === 'Enter' &&
      !['products', 'orders', 'customers'].includes(page) &&
      input.value.trim()
    )
      location.href =
        'productsphase5.html?q=' + encodeURIComponent(input.value.trim());
  });
}

/* ================= LOGIN PAGE ================= */
function initLogin() {
  if (AuthService.session()) {
    location.replace('dashboardphase5.html');
    return;
  }
  const form = $('#loginForm'),
    err = $('#formError');
  $('#showPw').addEventListener('change', (e) => {
    form.password.type = e.target.checked ? 'text' : 'password';
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    if (!validate(form)) return;
    const btn = $('#loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      await AuthService.login(
        form.email.value.trim(),
        form.password.value,
        $('#remember').checked,
      );
      location.href = 'dashboardphase5.html';
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
}

/* ================= DASHBOARD ================= */
function countUp(el, to, fmt = (n) => Math.round(n).toLocaleString('en-PH')) {
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min((t - t0) / 700, 1);
    el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function initDashboard() {
  const orders = OrderService.list(),
    custs = CustomerService.list();
  countUp($('#statProducts'), ProductService.list().length);
  countUp($('#statOrders'), orders.length);
  countUp($('#statCustomers'), custs.length);
  countUp(
    $('#statRevenue'),
    revenueOrders().reduce((s, o) => s + o.total, 0),
    peso,
  );
  const { labels, values } = salesSeries('daily');
  barChart($('#salesChart'), labels, values);
  $('#latestCustomers').innerHTML = custs
    .slice(-5)
    .reverse()
    .map(
      (c) =>
        `<li><span class="avatar-sm">${initials(c.name)}</span><div>${esc(c.name)}<small>${esc(c.email)}</small></div></li>`,
    )
    .join('');
  $('#recentOrders').innerHTML = orders
    .slice(0, 5)
    .map(
      (o) =>
        `<tr><td class="cell-main">${esc(o.id)}</td><td>${esc(o.customer)}</td><td>${peso(o.total)}</td><td>${badge(o.status)}</td><td>${fmtDate(o.date)}</td></tr>`,
    )
    .join('');
}

/* ================= PRODUCTS (CRUD) ================= */
function productForm(p, onSaved) {
  const isNew = !p;
  p = p || {
    id: '',
    name: '',
    category: 'milk',
    price: '',
    stock: '',
    description: '',
    emoji: '🥤',
    image: '',
  };
  const m = openModal(
    isNew ? 'Add product' : 'Edit product',
    `<form id="pForm" novalidate>
    <div class="field"><label for="pn">Product name</label><input id="pn" name="name" data-rule="text" value="${esc(p.name)}"><p class="error"></p></div>
    <div class="field"><label for="pc">Category</label><select id="pc" name="category">${Object.entries(
      CATEGORY,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${p.category === k ? 'selected' : ''}>${v}</option>`,
      )
      .join('')}</select></div>
    <div class="two-fields">
      <div class="field"><label for="pp">Price (₱)</label><input id="pp" name="price" type="number" min="0" data-rule="num" value="${esc(p.price)}"><p class="error"></p></div>
      <div class="field"><label for="ps">Stock</label><input id="ps" name="stock" type="number" min="0" data-rule="num" value="${esc(p.stock)}"><p class="error"></p></div>
    </div>
    <div class="field"><label for="pd">Description</label><textarea id="pd" name="description">${esc(p.description)}</textarea></div>
    <div class="field"><label>Image (optional)</label><div class="upload"><div id="prev">${thumb(p)}</div><input id="pf" type="file" accept="image/*"></div></div>
    <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">${isNew ? 'Add product' : 'Save changes'}</button></div></form>`,
  );
  const form = $('#pForm', m.el);
  let image = p.image;
  $('#pf', m.el).addEventListener('change', async (e) => {
    // later: uploadBytes(ref(storage,`products/${id}`), file) -> getDownloadURL
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    image = await resizeImage(f);
    $('#prev', m.el).innerHTML = thumb({ ...p, image });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const f = form.elements,
      name = f.name.value.trim(); // (form.name would clash with the form's own name)
    ProductService.save({
      ...p,
      id: isNew ? slug(name) + '-' + Date.now().toString(36) : p.id,
      name,
      category: f.category.value,
      price: +f.price.value,
      stock: +f.stock.value,
      description: f.description.value.trim(),
      image,
    });
    m.close();
    toast(isNew ? 'Product added' : 'Product updated');
    onSaved();
  });
}
async function initProducts() {
  await loadHomeImages();
  const state = { q: $('#searchInput').value, cat: 'all', stock: 'all', pg: 1 };
  $('#catFilter').insertAdjacentHTML(
    'beforeend',
    Object.entries(CATEGORY)
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join(''),
  );
  function render() {
    const q = state.q.trim().toLowerCase();
    const list = ProductService.list().filter(
      (p) =>
        (state.cat === 'all' || p.category === state.cat) &&
        (state.stock === 'all' || stockLabel(p) === state.stock) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
    const { rows, pg, pages } = paginate(list, state.pg);
    state.pg = pg;
    $('#productRows').innerHTML = rows
      .map(
        (
          p,
        ) => `<tr data-id="${esc(p.id)}"><td>${thumb(p)}</td><td class="cell-main">${esc(p.name)}</td><td>${CATEGORY[p.category]}</td><td>${peso(p.price)}</td><td>${p.stock}</td><td>${badge(stockLabel(p))}</td>
      <td><div class="row-actions"><button class="btn btn-sm btn-ghost" data-act="edit" type="button">Edit</button><button class="btn btn-sm btn-danger" data-act="delete" type="button">Delete</button></div></td></tr>`,
      )
      .join('');
    $('#emptyMsg').hidden = list.length > 0;
    renderPager(list.length, pg, pages, (n) => {
      state.pg = n;
      render();
    });
  }
  $('#searchInput').addEventListener('input', (e) => {
    state.q = e.target.value;
    state.pg = 1;
    render();
  });
  $('#catFilter').addEventListener('change', (e) => {
    state.cat = e.target.value;
    state.pg = 1;
    render();
  });
  $('#stockFilter').addEventListener('change', (e) => {
    state.stock = e.target.value;
    state.pg = 1;
    render();
  });
  $('#addBtn').addEventListener('click', () => productForm(null, render));
  $('#productRows').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const p = ProductService.list().find(
      (x) => x.id === b.closest('tr').dataset.id,
    );
    if (b.dataset.act === 'edit') productForm(p, render);
    else
      confirmBox(
        'Delete product?',
        `Remove <strong>${esc(p.name)}</strong> from the menu? This can't be undone.`,
        'Delete',
        () => {
          ProductService.remove(p.id);
          render();
          toast('Product deleted');
        },
      );
  });
  render();
  if (new URLSearchParams(location.search).get('add'))
    productForm(null, render);
}

/* ================= ORDERS ================= */
function viewOrder(o) {
  openModal(
    'Order ' + o.id,
    `<dl class="kv"><div><dt>Customer</dt><dd>${esc(o.customer)}</dd></div><div><dt>Email</dt><dd>${esc(o.email)}</dd></div><div><dt>Phone</dt><dd>${esc(o.phone)}</dd></div>
    <div><dt>Date</dt><dd>${fmtDate(o.date)}</dd></div><div><dt>Payment</dt><dd>${esc(o.payment)}</dd></div><div><dt>Status</dt><dd>${badge(o.status)}</dd></div></dl>
    <ul class="lines">${o.items.map((i) => `<li><span>${i.qty}× ${esc(i.name)}</span></li>`).join('')}</ul><dl class="kv"><div><dt><strong>Total</strong></dt><dd><strong>${peso(o.total)}</strong></dd></div></dl>`,
  );
}
function initOrders() {
  const state = { q: $('#searchInput').value, status: 'All', pg: 1 };
  function render() {
    const all = OrderService.list(),
      q = state.q.trim().toLowerCase();
    $('#statusChips').innerHTML = ['All', ...STATUSES]
      .map(
        (s) =>
          `<button class="chip ${state.status === s ? 'on' : ''}" type="button" data-s="${s}">${s} (${s === 'All' ? all.length : all.filter((o) => o.status === s).length})</button>`,
      )
      .join('');
    const list = all.filter(
      (o) =>
        (state.status === 'All' || o.status === state.status) &&
        (!q || (o.id + o.customer).toLowerCase().includes(q)),
    );
    const { rows, pg, pages } = paginate(list, state.pg);
    state.pg = pg;
    $('#orderRows').innerHTML = rows
      .map(
        (
          o,
        ) => `<tr data-id="${esc(o.id)}"><td class="cell-main">${esc(o.id)}</td><td>${esc(o.customer)}</td>
      <td>${esc(o.items[0].name)}${o.items.length > 1 ? `<span class="cell-sub">+${o.items.length - 1} more</span>` : ''}</td><td>${o.qty}</td><td>${esc(o.payment)}</td><td>${peso(o.total)}</td><td>${badge(o.status)}</td><td>${fmtDate(o.date)}</td>
      <td><div class="row-actions"><button class="btn btn-sm btn-ghost" data-act="view" type="button">View Details</button><button class="btn btn-sm" data-act="status" type="button">Update Status</button><button class="btn btn-sm btn-danger" data-act="delete" type="button">Delete</button></div></td></tr>`,
      )
      .join('');
    $('#emptyMsg').hidden = list.length > 0;
    renderPager(list.length, pg, pages, (n) => {
      state.pg = n;
      render();
    });
  }
  $('#searchInput').addEventListener('input', (e) => {
    state.q = e.target.value;
    state.pg = 1;
    render();
  });
  $('#statusChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (b) {
      state.status = b.dataset.s;
      state.pg = 1;
      render();
    }
  });
  $('#orderRows').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const o = OrderService.list().find(
      (x) => x.id === b.closest('tr').dataset.id,
    );
    if (b.dataset.act === 'view') return viewOrder(o);
    if (b.dataset.act === 'delete')
      return confirmBox(
        'Delete order?',
        `Delete order <strong>${esc(o.id)}</strong>?`,
        'Delete',
        () => {
          OrderService.remove(o.id);
          render();
          toast('Order deleted');
        },
      );
    const m = openModal(
      'Update status',
      `<form id="stForm"><div class="radio-list">${STATUSES.map((s) => `<label><input type="radio" name="st" value="${s}" ${o.status === s ? 'checked' : ''}>${s}</label>`).join('')}</div>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`,
    );
    $('#stForm', m.el).addEventListener('submit', (ev) => {
      ev.preventDefault();
      OrderService.setStatus(o.id, $('#stForm input:checked', m.el).value);
      m.close();
      render();
      toast('Status updated');
    });
  });
  render();
}

/* ================= CUSTOMERS ================= */
function initCustomers() {
  const state = { q: $('#searchInput').value, pg: 1 };
  function render() {
    const q = state.q.trim().toLowerCase();
    const list = CustomerService.list().filter(
      (c) => !q || (c.name + c.email + c.phone).toLowerCase().includes(q),
    );
    const { rows, pg, pages } = paginate(list, state.pg);
    state.pg = pg;
    $('#customerRows').innerHTML = rows
      .map(
        (
          c,
        ) => `<tr data-id="${esc(c.id)}"><td><span class="avatar-sm">${initials(c.name)}</span></td><td class="cell-main">${esc(c.name)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${c.orders}</td><td>${peso(c.spent)}</td><td>${badge(c.status)}</td>
      <td><div class="row-actions"><button class="btn btn-sm btn-ghost" data-act="view" type="button">View</button><button class="btn btn-sm" data-act="edit" type="button">Edit</button><button class="btn btn-sm btn-danger" data-act="toggle" type="button">${c.status === 'Active' ? 'Disable' : 'Enable'}</button></div></td></tr>`,
      )
      .join('');
    $('#emptyMsg').hidden = list.length > 0;
    renderPager(list.length, pg, pages, (n) => {
      state.pg = n;
      render();
    });
  }
  $('#searchInput').addEventListener('input', (e) => {
    state.q = e.target.value;
    state.pg = 1;
    render();
  });
  $('#customerRows').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = CustomerService.list().find(
      (x) => x.id === b.closest('tr').dataset.id,
    );
    if (b.dataset.act === 'view')
      return openModal(
        c.name,
        `<dl class="kv"><div><dt>Email</dt><dd>${esc(c.email)}</dd></div><div><dt>Phone</dt><dd>${esc(c.phone)}</dd></div><div><dt>Status</dt><dd>${badge(c.status)}</dd></div>
      <div><dt>Orders</dt><dd>${c.orders}</dd></div><div><dt>Total spending</dt><dd>${peso(c.spent)}</dd></div><div><dt>Last order</dt><dd>${c.last ? fmtDate(c.last) : '-'}</dd></div></dl>`,
      );
    if (b.dataset.act === 'toggle') {
      CustomerService.save({
        ...c,
        status: c.status === 'Active' ? 'Disabled' : 'Active',
      });
      render();
      return toast(
        c.status === 'Active' ? 'Customer disabled' : 'Customer enabled',
      );
    }
    const m = openModal(
      'Edit customer',
      `<form id="cForm" novalidate><div class="field"><label for="cn">Full name</label><input id="cn" name="name" data-rule="text" value="${esc(c.name)}"><p class="error"></p></div>
      <div class="field"><label for="cp">Phone</label><input id="cp" name="phone" data-rule="phone" value="${esc(c.phone)}"><p class="error"></p></div>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`,
    );
    const f = $('#cForm', m.el);
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!validate(f)) return;
      CustomerService.save({
        ...c,
        name: f.elements.name.value.trim(),
        phone: f.elements.phone.value.trim(),
      });
      m.close();
      render();
      toast('Customer updated');
    });
  });
  render();
}

/* ================= REPORTS ================= */
function initReports() {
  const orders = revenueOrders(),
    now = Date.now(),
    sod = new Date().setHours(0, 0, 0, 0);
  const sum = (f) => orders.filter(f).reduce((s, o) => s + o.total, 0),
    t = (o) => +new Date(o.date),
    mo = new Date().getMonth();
  const cards = [
    ['📅', 'Today', peso(sum((o) => t(o) >= sod))],
    ['🗓️', 'Last 7 days', peso(sum((o) => t(o) >= now - 7 * DAY))],
    ['📆', 'This month', peso(sum((o) => new Date(o.date).getMonth() === mo))],
    ['💰', 'All-time revenue', peso(sum(() => true))],
    [
      '🧾',
      'Avg. order value',
      peso(orders.length ? sum(() => true) / orders.length : 0),
    ],
  ];
  $('#revCards').innerHTML = cards
    .map(
      ([i, l, v]) =>
        `<div class="stat-card glass"><span class="ico">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`,
    )
    .join('');
  $('#revCards').style.gridTemplateColumns =
    'repeat(auto-fit,minmax(170px,1fr))';

  const show = (p) => {
    const s = salesSeries(p);
    barChart($('#barChart'), s.labels, s.values);
    $$('#periodSeg button').forEach((b) =>
      b.classList.toggle('on', b.dataset.p === p),
    );
  };
  $('#periodSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (b) show(b.dataset.p);
  });
  show('daily');

  const prod = Object.fromEntries(
      ProductService.list().map((p) => [p.name, p]),
    ),
    sold = {},
    cat = {};
  orders.forEach((o) =>
    o.items.forEach((i) => {
      const p = prod[i.name],
        rev = i.qty * (p?.price || 0);
      (sold[i.name] ||= { q: 0, r: 0 }).q += i.qty;
      sold[i.name].r += rev;
      const c = CATEGORY[p?.category] || 'Other';
      cat[c] = (cat[c] || 0) + rev;
    }),
  );
  pieChart(
    $('#pieChart'),
    Object.entries(cat)
      .map(([l, v]) => ({ l, v }))
      .sort((a, b) => b.v - a.v),
  );
  $('#topProducts').innerHTML = Object.entries(sold)
    .sort((a, b) => b[1].q - a[1].q)
    .slice(0, 5)
    .map(
      ([n, s], i) =>
        `<tr><td>${i + 1}</td><td class="cell-main">${esc(n)}</td><td>${s.q}</td><td>${peso(s.r)}</td></tr>`,
    )
    .join('');
  $('#topCustomers').innerHTML = CustomerService.list()
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map(
      (c, i) =>
        `<tr><td>${i + 1}</td><td class="cell-main">${esc(c.name)}</td><td>${c.orders}</td><td>${peso(c.spent)}</td></tr>`,
    )
    .join('');

  // Exports: CSV downloads a file, Excel opens in Excel, PDF uses the browser's "Save as PDF"
  const rowsData = [
    ['Order ID', 'Date', 'Customer', 'Payment', 'Status', 'Total'],
    ...OrderService.list().map((o) => [
      o.id,
      fmtDate(o.date),
      o.customer,
      o.payment,
      o.status,
      o.total,
    ]),
  ];
  $('#exCsv').addEventListener('click', () => {
    download(
      'kkopi-sales.csv',
      rowsData
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
        )
        .join('\n'),
      'text/csv',
    );
    toast('CSV downloaded');
  });
  $('#exXls').addEventListener('click', () => {
    download(
      'kkopi-sales.xls',
      `<table>${rowsData.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`,
      'application/vnd.ms-excel',
    );
    toast('Excel file downloaded');
  });
  $('#exPdf').addEventListener('click', () => window.print());
}

/* ================= START ================= */
if (page === 'login') initLogin();
else if (AuthService.session()) {
  initShell();
  ({
    dashboard: initDashboard,
    products: initProducts,
    orders: initOrders,
    customers: initCustomers,
    reports: initReports,
  })[page]();
}
