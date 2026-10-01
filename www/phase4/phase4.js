/* KKOPI.Tea - Phase 4 (profile, favorites, order history, settings). Vanilla JS, Firebase-ready. */
const page = document.body.dataset.page;
const $ = (s, el = document) => el.querySelector(s);
const peso = (n) => '₱' + Number(n).toLocaleString('en-PH');
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

/* ================= PRODUCT CATALOG (mirror of Phase 2; later = Firestore "products") ================= */
const CATEGORY = {
  milk: 'Milk Tea',
  fruit: 'Fruit Tea',
  coffee: 'Coffee',
  matcha: 'Matcha',
  hot: 'Hot Drinks',
  snack: 'Snacks',
};
const CATALOG = [
  ['classic-milk-tea', 'Classic Milk Tea', 'milk', 89, 4.8, '🥤'],
  ['brown-sugar-boba', 'Brown Sugar Boba', 'milk', 119, 4.9, '🥤'],
  ['okinawa-milk-tea', 'Okinawa Milk Tea', 'milk', 105, 4.7, '🥤'],
  ['strawberry-milk-tea', 'Strawberry Milk Tea', 'milk', 99, 4.6, '🍓'],
  ['cookies-and-cream', 'Cookies & Cream', 'milk', 125, 4.7, '🍪'],
  ['taro-milk-tea', 'Taro Milk Tea', 'milk', 99, 4.5, '🥤'],
  ['mango-green-tea', 'Mango Green Tea', 'fruit', 95, 4.6, '🥭'],
  ['passionfruit-cooler', 'Passionfruit Cooler', 'fruit', 99, 4.5, '🍹'],
  ['lychee-black-tea', 'Lychee Black Tea', 'fruit', 95, 4.4, '🍹'],
  ['caramel-macchiato', 'Caramel Macchiato', 'coffee', 139, 4.8, '☕'],
  ['spanish-latte', 'Spanish Latte', 'coffee', 129, 4.7, '☕'],
  ['iced-americano', 'Iced Americano', 'coffee', 99, 4.3, '☕'],
  ['matcha-latte', 'Matcha Latte', 'matcha', 129, 4.8, '🍵'],
  ['strawberry-matcha', 'Strawberry Matcha', 'matcha', 145, 4.6, '🍵'],
  ['choco-hazelnut', 'Choco Hazelnut', 'hot', 109, 4.6, '☕'],
  ['hot-milk-tea', 'Hot Milk Tea', 'hot', 79, 4.4, '♨️'],
  ['cheesy-fries', 'Cheesy Fries', 'snack', 89, 4.5, '🍟'],
  ['chicken-poppers', 'Chicken Poppers', 'snack', 109, 4.6, '🍗'],
  ['choco-chip-cookie', 'Choco Chip Cookie', 'snack', 59, 4.7, '🍪'],
].map(([id, name, cat, price, rating, emoji]) => ({
  id,
  name,
  cat,
  price,
  rating,
  emoji,
  image: '',
}));

/* ================= IMAGES (same rules as Phase 2) ================= */
const IMG_EXT = ['jpg', 'png', 'webp', 'jpeg'];
const TINT = {
  milk: '#c8a07a',
  fruit: '#f29b5b',
  coffee: '#7a4a2e',
  matcha: '#8fb85a',
  hot: '#a0643f',
  snack: '#e9b44c',
};
function artSVG(p) {
  // built-in drawing when no photo exists
  const c = TINT[p.cat] || '#c8a07a';
  const body =
    p.cat === 'snack'
      ? `<circle cx="100" cy="100" r="62" fill="${c}"/><text x="100" y="124" font-size="66" text-anchor="middle">${p.emoji}</text>`
      : `<rect x="108" y="20" width="9" height="46" rx="4.5" fill="#b98155" transform="rotate(12 112 43)"/><path d="M52 62h96l-12 108a8 8 0 0 1-8 7H72a8 8 0 0 1-8-7z" fill="#fff" fill-opacity=".6" stroke="#6f4a32" stroke-width="4" stroke-linejoin="round"/><path d="M58 98h84l-6.500 72a8 8 0 0 1-8 7H72.500a8 8 0 0 1-8-7z" fill="${c}"/><rect x="44" y="52" width="112" height="16" rx="8" fill="#6f4a32"/>`;
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eadbc8"/>${body}</svg>`,
    )
  );
}
function imgHTML(p) {
  const list = [
    p.image,
    ...IMG_EXT.map((e) => `../images/${p.id}.${e}`),
    artSVG(p),
  ].filter(Boolean);
  return `<img src="${esc(list[0])}" data-srcs="${esc(list.join('|'))}" data-i="0" alt="${esc(p.name)}" loading="lazy" onerror="nextImg(this)">`;
}
function nextImg(img) {
  // try next file type; remove if none work
  const list = img.dataset.srcs.split('|'),
    i = +img.dataset.i + 1;
  if (i < list.length) {
    img.dataset.i = i;
    img.src = list[i];
  } else img.remove();
}
// Reuse the photos set on the Home page (Phase 1) by product name
let homeMap = null;
async function applyHomeImages() {
  if (!homeMap) {
    homeMap = {};
    for (const file of ['../home.html', '../Home.html']) {
      try {
        const res = await fetch(file);
        if (!res.ok) continue;
        const doc = new DOMParser().parseFromString(
          await res.text(),
          'text/html',
        );
        doc.querySelectorAll('.card').forEach((c) => {
          const name = c.querySelector('h3')?.textContent.trim().toLowerCase();
          const src = c.querySelector('img')?.getAttribute('src');
          if (name && src)
            homeMap[name] = /^(https?:|data:|\/)/.test(src) ? src : '../' + src;
        });
        break;
      } catch {
        /* no server: fall back to images/<id>.jpg */
      }
    }
  }
  CATALOG.forEach((p) => {
    if (homeMap[p.name.toLowerCase()]) p.image = homeMap[p.name.toLowerCase()];
  });
}

/* ================= STORAGE + SERVICES (swap bodies for Firebase later) ================= */
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
      /* storage blocked / full */
    }
  },
};
const FavService = {
  all: () => store.get('kkopi_favs', []),
  save: (a) => store.set('kkopi_favs', a),
}; // later: users/{uid}/favorites
const CartService = {
  all: () => store.get('kkopi_cart', []),
  save: (a) => store.set('kkopi_cart', a),
}; // later: users/{uid}/cart
const OrderService = { all: () => store.get('kkopi_orders', []) }; // later: getDocs(query(collection(db,"orders"), where("uid","==",uid)))
const SettingsService = {
  defaults: { dark: false, notifOrders: true, notifPromos: false, lang: 'en' },
  get() {
    return { ...this.defaults, ...store.get('kkopi_settings', {}) };
  },
  save(s) {
    store.set('kkopi_settings', s);
  }, // later: users/{uid}/settings
};
const ProfileService = {
  get() {
    // later: getDoc(doc(db,"users",uid))
    let p = store.get('kkopi_profile', null);
    const last = OrderService.all().slice(-1)[0]; // fill blanks from the latest order
    if (!p)
      p = {
        name: '',
        email: '',
        phone: '',
        address: '',
        photo: null,
        memberSince: new Date().toISOString(),
      };
    ['name', 'email', 'phone'].forEach((k) => {
      if (!p[k] && last?.customer?.[k]) p[k] = last.customer[k];
    });
    if (!p.address && last?.delivery?.address)
      p.address = last.delivery.address;
    store.set('kkopi_profile', p);
    return p;
  },
  save(p) {
    store.set('kkopi_profile', p);
  }, // later: setDoc(doc(db,"users",uid), p, {merge:true})
  async uploadPhoto(file) {
    // later: uploadBytes(ref(storage,`avatars/${uid}`), file) -> getDownloadURL
    return resizeImage(file, 240);
  },
};
const AuthService = {
  async logout() {
    /* later: await signOut(auth); */ return true;
  },
  async changePassword(current, next) {
    /* later: reauthenticateWithCredential(...) then updatePassword(user, next) */ return true;
  },
};

/* ================= SHARED UI ================= */
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = Object.assign(document.createElement('div'), {
    className: 'toast',
    textContent: msg,
    role: 'status',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
function updateBadge() {
  const n = CartService.all().reduce((s, i) => s + i.qty, 0);
  const b = $('#cartCount');
  b.textContent = n;
  b.hidden = n === 0;
}
function openModal(title, bodyHTML) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <button class="modal-close" type="button" aria-label="Close">&times;</button><h2>${esc(title)}</h2><div class="modal-body">${bodyHTML}</div></div>`;
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
  m.querySelector('.modal-close').focus();
  return { el: m, close };
}
function confirmLogout() {
  const m = openModal(
    'Log out?',
    `<p>You'll need to log in again to place orders.</p>
    <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-danger" type="button" id="doLogout">Log out</button></div>`,
  );
  $('#doLogout', m.el).addEventListener('click', async () => {
    await AuthService.logout();
    location.href = '../login.html';
  });
}
const RULES = {
  name: (v) => v.trim().length >= 2 || 'Enter your full name.',
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address.',
  phone: (v) =>
    v.trim() === '' ||
    /^(\+63|0)?9\d{9}$/.test(v.replace(/[\s-]/g, '')) ||
    'Enter a valid PH mobile number (e.g. 09171234567).',
  password: (v) => v.length >= 6 || 'Password must be at least 6 characters.',
};
function validate(form) {
  // data-rule on inputs, .error element after each
  let ok = true;
  form.querySelectorAll('[data-rule]').forEach((input) => {
    const res =
      input.dataset.rule === 'match'
        ? input.value === form.next.value || 'Passwords do not match.'
        : RULES[input.dataset.rule](input.value);
    const field = input.closest('.field');
    field.classList.toggle('invalid', res !== true);
    field.querySelector('.error').textContent = res === true ? '' : res;
    if (res !== true) ok = false;
  });
  return ok;
}
const field = (id, label, type, rule, value = '', extra = '') =>
  `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" data-rule="${rule}" value="${esc(value)}" ${extra}><p class="error"></p></div>`;
function resizeImage(file, max) {
  // downscale before saving so localStorage stays small
  return new Promise((resolve, reject) => {
    const img = new Image(),
      url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height)),
        c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
const optsText = (i) =>
  [i.size, i.sugar && `${i.sugar} sugar`, i.ice, ...(i.addons || [])]
    .filter(Boolean)
    .join(', ');

/* Order status. If the backend later stores a real status, it wins; until then it is simulated from time. */
function statusOf(o) {
  if (o.status && o.status !== 'pending') return o.status;
  const now = Date.now(),
    eta = +new Date(o.estimatedAt),
    delivery = o.delivery?.method === 'Delivery';
  if (now < eta) return 'Preparing';
  if (delivery) return now < eta + 2 * 3600000 ? 'Delivered' : 'Completed';
  return now < eta + 30 * 60000 ? 'Ready for Pickup' : 'Completed';
}
const statusClass = (s) =>
  s === 'Preparing'
    ? 'preparing'
    : s === 'Ready for Pickup'
      ? 'ready'
      : s === 'Delivered'
        ? 'delivered'
        : 'completed';

/* ================= PROFILE PAGE ================= */
function renderProfile() {
  const p = ProfileService.get(),
    orders = OrderService.all(),
    favs = FavService.all();
  const initials = (p.name || 'K')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const av = $('#avatar');
  av.style.backgroundImage = p.photo ? `url("${p.photo}")` : 'none';
  av.textContent = p.photo ? '' : initials;

  // favorite drink = most ordered; otherwise the first saved favorite
  const counts = {};
  orders.forEach((o) =>
    o.items.forEach((i) => {
      counts[i.name] = (counts[i.name] || 0) + i.qty;
    }),
  );
  const top =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    CATALOG.find((c) => c.id === favs[0])?.name ||
    '-';

  $('#pName').textContent = p.name || 'KKOPI Customer';
  $('#pEmail').textContent = p.email || 'No email yet';
  $('#pSince').textContent = fmtDate(p.memberSince);
  $('#statOrders').textContent = orders.length;
  $('#statFavs').textContent = favs.length;
  $('#statDrink').textContent = top;
  $('#dName').textContent = p.name || 'Not set';
  $('#dEmail').textContent = p.email || 'Not set';
  $('#dPhone').textContent = p.phone || 'Not set';
  $('#dAddress').textContent = p.address || 'Not set';
}
function initProfile() {
  renderProfile();
  $('#logoutBtn').addEventListener('click', confirmLogout);
  $('#photoBtn').addEventListener('click', () => $('#photoInput').click());
  $('#photoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast('Choose an image under 5 MB.');
      return;
    }
    try {
      const p = ProfileService.get();
      p.photo = await ProfileService.uploadPhoto(file);
      ProfileService.save(p);
      renderProfile();
      toast('Profile picture updated');
    } catch {
      toast("Couldn't read that image.");
    }
  });
  $('#editBtn').addEventListener('click', () => {
    const p = ProfileService.get();
    const m = openModal(
      'Edit profile',
      `<form id="editForm" novalidate>
      ${field('name', 'Full name', 'text', 'name', p.name, 'autocomplete="name"')}
      ${field('email', 'Email', 'email', 'email', p.email, 'autocomplete="email"')}
      ${field('phone', 'Contact number', 'tel', 'phone', p.phone, 'autocomplete="tel" placeholder="09171234567"')}
      <div class="field"><label for="address">Address</label><input id="address" name="address" value="${esc(p.address)}" autocomplete="street-address"></div>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`,
    );
    const form = $('#editForm', m.el);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const f = form.elements; // (form.name would clash with the form's own name)
      Object.assign(p, {
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim(),
        address: f.address.value.trim(),
      });
      ProfileService.save(p);
      renderProfile();
      m.close();
      toast('Profile saved');
    });
  });
}

/* ================= FAVORITES PAGE ================= */
function favCard(p) {
  return `<article class="card" data-id="${p.id}">
    <div class="pic" data-emoji="${p.emoji}">${imgHTML(p)}</div>
    <span class="cat-tag">${CATEGORY[p.cat]}</span>
    <h3>${esc(p.name)}</h3>
    <div class="meta"><span class="rating">${p.rating.toFixed(1)}</span><span class="price">${peso(p.price)}</span></div>
    <div class="card-actions">
      <a class="btn btn-sm" href="../phase2/productdetailsphase2.html?id=${p.id}">View Details</a>
      <button class="btn btn-sm btn-soft" type="button" data-act="cart">Add to Cart</button>
    </div>
    <button class="btn-link" type="button" data-act="remove">♥ Remove Favorite</button>
  </article>`;
}
function renderFavorites() {
  const list = FavService.all()
    .map((id) => CATALOG.find((p) => p.id === id))
    .filter(Boolean);
  $('#favGrid').innerHTML = list.map(favCard).join('');
  $('#favEmpty').hidden = list.length > 0;
  $('#favCount').textContent = list.length
    ? `${list.length} saved drink${list.length === 1 ? '' : 's'}`
    : '';
}
async function initFavorites() {
  await applyHomeImages();
  renderFavorites();
  $('#favGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const card = btn.closest('.card'),
      p = CATALOG.find((x) => x.id === card.dataset.id);
    if (btn.dataset.act === 'remove') {
      // remove favorite
      FavService.save(FavService.all().filter((id) => id !== p.id));
      card.classList.add('removing');
      setTimeout(() => {
        renderFavorites();
        toast('Removed from favorites');
      }, 280);
    } else {
      // add to cart with default options
      const snack = p.cat === 'snack',
        hot = p.cat === 'hot',
        cart = CartService.all();
      cart.push({
        productId: p.id,
        name: p.name,
        size: snack ? null : 'Medium',
        sugar: snack ? null : '100%',
        ice: snack || hot ? null : 'Normal Ice',
        addons: [],
        qty: 1,
        unitPrice: p.price,
        total: p.price,
        image: card.querySelector('img')?.getAttribute('src') || null,
        emoji: p.emoji,
      });
      CartService.save(cart);
      updateBadge();
      toast(`${p.name} added to cart`);
    }
  });
}

/* ================= ORDER HISTORY PAGE ================= */
function renderOrders() {
  const orders = OrderService.all().slice().reverse(); // newest first
  $('#orderEmpty').hidden = orders.length > 0;
  $('#orderList').innerHTML = orders
    .map((o) => {
      const st = statusOf(o);
      const summary = o.items.map((i) => `${i.qty}× ${esc(i.name)}`).join(', ');
      return `<article class="order glass" data-id="${esc(o.id)}">
      <div class="order-top"><div><div class="order-id">${esc(o.id)}</div><div class="order-date">${fmtDate(o.createdAt)}</div></div><span class="status ${statusClass(st)}">${st}</span></div>
      <p class="order-items">${summary}</p>
      <div class="order-bottom"><span class="order-total">${peso(o.total)}</span>
        <div class="order-btns"><button class="btn btn-sm btn-ghost" type="button" data-act="view">View Order</button><button class="btn btn-sm" type="button" data-act="reorder">Reorder</button></div></div>
    </article>`;
    })
    .join('');
}
function viewOrder(o) {
  const del = o.delivery?.method === 'Delivery';
  openModal(
    o.id,
    `<p>${fmtDate(o.createdAt)} · <strong>${statusOf(o)}</strong></p>
    <ul class="lines">${o.items.map((i) => `<li><span>${i.qty}× ${esc(i.name)}<small>${esc(optsText(i))}</small></span><strong>${peso(i.unitPrice * i.qty)}</strong></li>`).join('')}</ul>
    <div class="sum"><div><span>Subtotal</span><span>${peso(o.subtotal)}</span></div><div><span>Service fee</span><span>${peso(o.serviceFee)}</span></div><div class="grand"><span>Total</span><span>${peso(o.total)}</span></div></div>
    <p style="margin-top:1rem">${del ? 'Delivery to: ' + esc(o.delivery.address) + (o.delivery.landmark ? ' (' + esc(o.delivery.landmark) + ')' : '') : 'Pickup at KKOPI.Tea'}<br>Payment: ${esc(o.payment?.method)}</p>`,
  );
}
function initOrders() {
  renderOrders();
  $('#orderList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const o = OrderService.all().find(
      (x) => x.id === btn.closest('.order').dataset.id,
    );
    if (!o) return;
    if (btn.dataset.act === 'view') return viewOrder(o);
    const cart = CartService.all(); // reorder: copy every item into the cart
    o.items.forEach((i) => cart.push({ ...i }));
    CartService.save(cart);
    updateBadge();
    location.href = '../phase3/cartphase3.html';
  });
}

/* ================= SETTINGS PAGE ================= */
const INFO = {
  about: [
    'About KKOPI.Tea',
    '<p>KKOPI.Tea is a modern milk tea and coffee shop ordering app, built as a Human-Computer Interaction class project.</p><p>Version 1.0 (prototype)</p>',
  ],
  privacy: [
    'Privacy Policy',
    '<p>This prototype stores your profile, favorites, cart and orders only in your own browser (localStorage).</p><p>When Firebase is connected, your data will be kept in your account and never sold or shared.</p>',
  ],
  terms: [
    'Terms & Conditions',
    '<p>This is a student prototype. Orders placed here are for demonstration and are not charged or fulfilled.</p><p>Prices and availability may change.</p>',
  ],
};
function applySettings(s) {
  document.documentElement.dataset.theme = s.dark ? 'dark' : 'light';
}
function initSettings() {
  const s = SettingsService.get();
  $('#darkToggle').checked = s.dark;
  $('#notifOrders').checked = s.notifOrders;
  $('#notifPromos').checked = s.notifPromos;
  $('#langSelect').value = s.lang;
  const save = (patch, msg) => {
    Object.assign(s, patch);
    SettingsService.save(s);
    applySettings(s);
    if (msg) toast(msg);
  };

  $('#darkToggle').addEventListener('change', (e) =>
    save(
      { dark: e.target.checked },
      e.target.checked ? 'Dark mode on' : 'Dark mode off',
    ),
  );
  $('#notifOrders').addEventListener('change', (e) =>
    save({ notifOrders: e.target.checked }, 'Saved'),
  );
  $('#notifPromos').addEventListener('change', (e) =>
    save({ notifPromos: e.target.checked }, 'Saved'),
  );
  $('#langSelect').addEventListener('change', (e) =>
    save({ lang: e.target.value }, 'Language saved (translations coming soon)'),
  );
  $('#logoutBtn').addEventListener('click', confirmLogout);

  document.querySelectorAll('[data-modal]').forEach((b) =>
    b.addEventListener('click', () => {
      const key = b.dataset.modal;
      if (INFO[key]) {
        openModal(INFO[key][0], INFO[key][1]);
        return;
      }
      const m = openModal(
        'Account security',
        `<form id="pwForm" novalidate>
      ${field('current', 'Current password', 'password', 'password', '', 'autocomplete="current-password"')}
      ${field('next', 'New password', 'password', 'password', '', 'autocomplete="new-password"')}
      ${field('again', 'Confirm new password', 'password', 'match', '', 'autocomplete="new-password"')}
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Update</button></div></form>`,
      );
      const form = $('#pwForm', m.el);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validate(form)) return;
        await AuthService.changePassword(form.current.value, form.next.value);
        m.close();
        toast('Password updated (demo)');
      });
    }),
  );
}

/* ================= START ================= */
updateBadge();
({
  profile: initProfile,
  favorites: initFavorites,
  orders: initOrders,
  settings: initSettings,
})[page]();
