/* KKOPI.Tea - Phase 2 (menu + product details). Vanilla JS, Firebase-ready. */
const page = document.body.dataset.page;
const $ = (s, el = document) => el.querySelector(s);
const peso = (n) => "₱" + n;

/* ================= PRODUCT IMAGES =================
   Put photos in  apps/images/  and name each file after the product id (e.g. spanish-latte.jpg).
   No code edit needed: .jpg, .jpeg, .png and .webp are all tried. If none exist, the emoji shows.
   You can still force a path/URL with the product's  image: "..."  field. */
const IMG_EXT = ["jpg", "png", "webp", "jpeg"];
// Built-in drawing used when no photo file exists yet (a real photo in images/ always wins)
const TINT = { milk: "#c8a07a", fruit: "#f29b5b", coffee: "#7a4a2e", matcha: "#8fb85a", hot: "#a0643f", snack: "#e9b44c" };
function artSVG(p) {
  const c = TINT[p.category] || "#c8a07a";
  const body = p.category === "snack"
    ? `<circle cx="100" cy="100" r="62" fill="${c}"/><text x="100" y="124" font-size="66" text-anchor="middle">${p.emoji}</text>`
    : `<rect x="108" y="20" width="9" height="46" rx="4.5" fill="#b98155" transform="rotate(12 112 43)"/>
       <path d="M52 62h96l-12 108a8 8 0 0 1-8 7H72a8 8 0 0 1-8-7z" fill="#fff" fill-opacity=".6" stroke="#6f4a32" stroke-width="4" stroke-linejoin="round"/>
       <path d="M58 98h84l-6.500 72a8 8 0 0 1-8 7H72.500a8 8 0 0 1-8-7z" fill="${c}"/>
       ${p.category === "milk" ? '<circle cx="84" cy="164" r="6" fill="#2b1a12"/><circle cx="100" cy="166" r="6" fill="#2b1a12"/><circle cx="116" cy="164" r="6" fill="#2b1a12"/>' : ""}
       <rect x="44" y="52" width="112" height="16" rx="8" fill="#6f4a32"/>`;
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eadbc8"/>${body}</svg>`);
}
function imgHTML(p, lazy = false) {
  const list = [p.image, ...IMG_EXT.map((e) => `../images/${p.id}.${e}`), artSVG(p)].filter(Boolean);
  return `<img src="${list[0]}" data-srcs="${list.join("|")}" data-i="0" alt="${p.name}" ${lazy ? 'loading="lazy"' : ""} onerror="nextImg(this)">`;
}
function nextImg(img) {                       // try the next file type, remove the image if none work
  const list = img.dataset.srcs.split("|"), i = +img.dataset.i + 1;
  if (i < list.length) { img.dataset.i = i; img.src = list[i]; } else img.remove();
}

/* ================= DATA (placeholder; later = Firestore "products" collection) ================= */
const CATEGORIES = [
  { id: "all",   label: "All",       icon: "✨" },
  { id: "milk",  label: "Milk Tea",  icon: "🥤" },
  { id: "fruit", label: "Fruit Tea", icon: "🍹" },
  { id: "coffee",label: "Coffee",    icon: "☕" },
  { id: "matcha",label: "Matcha",    icon: "🍵" },
  { id: "hot",   label: "Hot Drinks",icon: "♨️" },
  { id: "snack", label: "Snacks",    icon: "🍟" }
];
// image: "" -> emoji fallback. Put a file path or URL (Firebase Storage) here.
const PRODUCTS = [
  { id: "classic-milk-tea",  name: "Classic Milk Tea",   category: "milk",  price: 89,  rating: 4.8, bestSeller: true,  emoji: "🥤", image: "../images/classic-milk-tea.jpg",  description: "Black tea, creamy milk" },
  { id: "brown-sugar-boba",  name: "Brown Sugar Boba",   category: "milk",  price: 119, rating: 4.9, bestSeller: true,  emoji: "🥤", image: "../images/brown-sugar-boba.jpg",  description: "Tiger stripes, chewy pearls" },
  { id: "okinawa-milk-tea",  name: "Okinawa Milk Tea",   category: "milk",  price: 105, rating: 4.7, bestSeller: true,  emoji: "🥤", image: "../images/okinawa-milk-tea.jpg",  description: "Roasted brown sugar" },
  { id: "strawberry-milk-tea",name:"Strawberry Milk Tea",category: "milk",  price: 99,  rating: 4.6, bestSeller: false, emoji: "🍓", image: "../images/strawberry-milk-tea.jpg",description: "Fresh, fruity, creamy" },
  { id: "cookies-and-cream", name: "Cookies & Cream",    category: "milk",  price: 125, rating: 4.7, bestSeller: false, emoji: "🍪", image: "../images/cookies-and-cream.jpg", description: "Blended, with crumbs" },
  { id: "taro-milk-tea",     name: "Taro Milk Tea",      category: "milk",  price: 99,  rating: 4.5, bestSeller: false, emoji: "🥤", image: "", description: "Smooth, nutty taro" },
  { id: "mango-green-tea",   name: "Mango Green Tea",    category: "fruit", price: 95,  rating: 4.6, bestSeller: false, emoji: "🥭", image: "", description: "Jasmine tea, ripe mango" },
  { id: "passionfruit-cooler",name:"Passionfruit Cooler",category: "fruit", price: 99,  rating: 4.5, bestSeller: false, emoji: "🍹", image: "", description: "Tangy, refreshing, iced" },
  { id: "lychee-black-tea",  name: "Lychee Black Tea",   category: "fruit", price: 95,  rating: 4.4, bestSeller: false, emoji: "🍹", image: "", description: "Floral lychee, black tea" },
  { id: "caramel-macchiato", name: "Caramel Macchiato",  category: "coffee",price: 139, rating: 4.8, bestSeller: true,  emoji: "☕", image: "../images/caramel-macchiato.jpg", description: "Espresso, caramel, milk" },
  { id: "spanish-latte",     name: "Spanish Latte",      category: "coffee",price: 129, rating: 4.7, bestSeller: false, emoji: "☕", image: "", description: "Sweet condensed milk latte" },
  { id: "iced-americano",    name: "Iced Americano",     category: "coffee",price: 99,  rating: 4.3, bestSeller: false, emoji: "☕", image: "", description: "Bold espresso over ice" },
  { id: "matcha-latte",      name: "Matcha Latte",       category: "matcha",price: 129, rating: 4.8, bestSeller: true,  emoji: "🍵", image: "../images/matcha-latte.jpg",      description: "Ceremonial matcha" },
  { id: "strawberry-matcha", name: "Strawberry Matcha",  category: "matcha",price: 145, rating: 4.6, bestSeller: false, emoji: "🍵", image: "", description: "Matcha over strawberry milk" },
  { id: "choco-hazelnut",    name: "Choco Hazelnut",     category: "hot",   price: 109, rating: 4.6, bestSeller: false, emoji: "☕", image: "../images/choco-hazelnut.jpg",    description: "Rich cocoa, nutty finish" },
  { id: "hot-milk-tea",      name: "Hot Milk Tea",       category: "hot",   price: 79,  rating: 4.4, bestSeller: false, emoji: "♨️", image: "", description: "Warm, classic comfort" },
  { id: "cheesy-fries",      name: "Cheesy Fries",       category: "snack", price: 89,  rating: 4.5, bestSeller: false, emoji: "🍟", image: "", description: "Crispy fries, cheese sauce" },
  { id: "chicken-poppers",   name: "Chicken Poppers",    category: "snack", price: 109, rating: 4.6, bestSeller: false, emoji: "🍗", image: "", description: "Bite-size crispy chicken" },
  { id: "choco-chip-cookie", name: "Choco Chip Cookie",  category: "snack", price: 59,  rating: 4.7, bestSeller: false, emoji: "🍪", image: "", description: "Soft, chewy, freshly baked" }
];
// Customization options (price add-on in pesos)
const SIZES  = [{ v: "Small", add: -10 }, { v: "Medium", add: 0 }, { v: "Large", add: 20 }];
const SUGAR  = ["0%", "25%", "50%", "75%", "100%"];
const ICE    = ["No Ice", "Less Ice", "Normal Ice", "Extra Ice"];
const ADDONS = [{ v: "Pearl", add: 15 }, { v: "Coffee Jelly", add: 15 }, { v: "Cream Cheese", add: 25 }, { v: "Pudding", add: 20 }, { v: "Oreo Crumbs", add: 20 }];

/* ================= SERVICES (swap bodies for Firestore later) ================= */
/* Reuse the photos you already set on the Home page (Phase 1): products with the same name
   get the exact <img src> used in home.html, so the menu shows the same picture. */
let homeMap = null;
async function homeImages() {
  if (homeMap) return homeMap;
  homeMap = {};
  for (const file of ["../home.html", "../Home.html"]) {
    try {
      const res = await fetch(file); if (!res.ok) continue;
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      doc.querySelectorAll(".card").forEach((c) => {
        const name = c.querySelector("h3")?.textContent.trim().toLowerCase();
        const src = c.querySelector("img")?.getAttribute("src");
        if (name && src) homeMap[name] = /^(https?:|data:|\/)/.test(src) ? src : "../" + src;
      });
      break;
    } catch { /* opened without a server: fall back to images/<id>.jpg */ }
  }
  return homeMap;
}
async function withHomeImages() {
  const map = await homeImages();
  PRODUCTS.forEach((p) => { if (map[p.name.toLowerCase()]) p.image = map[p.name.toLowerCase()]; });
  return PRODUCTS;
}
const ProductService = {
  async getAll()   { return withHomeImages(); /* getDocs(collection(db, "products")) */ },
  async getById(id){ return (await withHomeImages()).find((p) => p.id === id); /* getDoc(doc(db, "products", id)) */ }
};
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } }
};
const FavService  = { all: () => store.get("kkopi_favs", []), save: (a) => store.set("kkopi_favs", a) };   // later: users/{uid}/favorites
const CartService = { all: () => store.get("kkopi_cart", []), save: (a) => store.set("kkopi_cart", a) };   // later: users/{uid}/cart

/* ================= SHARED UI ================= */
function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = Object.assign(document.createElement("div"), { className: "toast", textContent: msg, role: "status" });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
function updateCartBadge() {
  const n = CartService.all().reduce((s, i) => s + i.qty, 0);
  const b = $("#cartCount"); b.textContent = n; b.hidden = n === 0;
}
updateCartBadge();
$("#cartBtn").addEventListener("click", () => (location.href = "../phase3/cartphase3.html"));
$("#profileBtn").addEventListener("click", () => (location.href = "../phase4/profilephase4.html"));

/* ================= MENU PAGE ================= */
function cardHTML(p) {
  const fav = FavService.all().includes(p.id);
  return `
  <article class="card" data-id="${p.id}">
    <div class="pic" data-emoji="${p.emoji}">
      ${imgHTML(p, true)}
      <button class="heart ${fav ? "on" : ""}" type="button" aria-pressed="${fav}" aria-label="Favorite ${p.name}">${fav ? "♥" : "♡"}</button>
    </div>
    <h3>${p.name}</h3>
    <p class="desc">${p.description}</p>
    <div class="meta"><span class="rating">${p.rating.toFixed(1)}</span><span class="price">${peso(p.price)}</span></div>
    <a class="btn btn-sm" href="productdetailsphase2.html?id=${p.id}">View Details</a>
  </article>`;
}

// Favorite toggle (event delegation, works on every card)
document.addEventListener("click", (e) => {
  const h = e.target.closest(".heart");
  if (!h) return;
  const id = h.closest(".card").dataset.id;
  let favs = FavService.all();
  const on = !favs.includes(id);
  favs = on ? [...favs, id] : favs.filter((x) => x !== id);
  FavService.save(favs);
  document.querySelectorAll(`.card[data-id="${id}"] .heart`).forEach((b) => {
    b.classList.toggle("on", on); b.textContent = on ? "♥" : "♡"; b.setAttribute("aria-pressed", on);
  });
  toast(on ? "Added to favorites" : "Removed from favorites");
});

async function initMenu() {
  const products = await ProductService.getAll();
  const state = { cat: "all", q: new URLSearchParams(location.search).get("q") || "" };
  const input = $("#searchInput");
  input.value = state.q;

  $("#categories").innerHTML = CATEGORIES.map((c) =>
    `<button class="cat glass" type="button" data-cat="${c.id}"><span>${c.icon}</span>${c.label}</button>`).join("");

  function render() {
    const q = state.q.trim().toLowerCase();
    const list = products.filter((p) =>
      (state.cat === "all" || p.category === state.cat) &&
      (!q || (p.name + " " + p.description).toLowerCase().includes(q)));
    const catLabel = CATEGORIES.find((c) => c.id === state.cat).label;

    document.querySelectorAll(".cat").forEach((b) => b.classList.toggle("active", b.dataset.cat === state.cat));
    $("#productsTitle").textContent = q ? `Results for "${state.q.trim()}"` : state.cat === "all" ? "All drinks" : catLabel;
    $("#productCount").textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;
    $("#productGrid").innerHTML = list.map(cardHTML).join("");
    $("#emptyMsg").hidden = list.length > 0;
    // Best sellers only show on the default view
    $("#bestSection").hidden = state.cat !== "all" || !!q;
    $("#bestGrid").innerHTML = products.filter((p) => p.bestSeller).map(cardHTML).join("");
  }

  $("#categories").addEventListener("click", (e) => {                       // category filter
    const b = e.target.closest(".cat"); if (!b) return;
    state.cat = b.dataset.cat; render();
    $("#products").scrollIntoView({ behavior: "smooth", block: "start" });  // smooth scroll
  });
  input.addEventListener("input", () => { state.q = input.value; render(); }); // live search
  render();
}

/* ================= PRODUCT DETAILS PAGE ================= */
async function initDetails() {
  const params = new URLSearchParams(location.search);
  const byName = params.get("item");                                        // link from Phase 1 pop-up
  const p = params.get("id") ? await ProductService.getById(params.get("id"))
          : byName ? (await ProductService.getAll()).find((x) => x.name.toLowerCase() === byName.toLowerCase()) : null;
  const root = $("#detail");
  if (!p) { root.innerHTML = `<p class="empty">We couldn't find that item. <a href="menuphase2.html"><u>Back to menu</u></a></p>`; return; }

  document.title = `${p.name} | KKOPI.Tea`;
  const isSnack = p.category === "snack", isHot = p.category === "hot";
  const startSize = params.get("size") === "Large" ? "Large" : "Medium";
  const radios = (name, items, checked, fmt) => items.map((o) => {
    const v = o.v ?? o;
    return `<label class="opt"><input type="radio" name="${name}" value="${v}" ${v === checked ? "checked" : ""}><span>${fmt ? fmt(o) : v}</span></label>`;
  }).join("");

  root.innerHTML = `
  <div class="detail">
    <div class="pic" data-emoji="${p.emoji}">${imgHTML(p)}</div>
    <form id="orderForm" onsubmit="return false">
      <div class="top-row"><h1>${p.name}</h1><span class="detail-price">${peso(p.price)}</span></div>
      <span class="rating">${p.rating.toFixed(1)}</span>
      <p class="desc">${p.description}</p>

      ${isSnack ? "" : `
      <div class="group"><h3>Drink size</h3><div class="opts">${radios("size", SIZES, startSize, (o) => `${o.v} <small>${o.add ? (o.add > 0 ? "+" : "-") + peso(Math.abs(o.add)) : ""}</small>`)}</div></div>
      <div class="group"><h3>Sugar level</h3><div class="opts">${radios("sugar", SUGAR, "100%")}</div></div>
      ${isHot ? "" : `<div class="group"><h3>Ice level</h3><div class="opts">${radios("ice", ICE, "Normal Ice")}</div></div>`}
      <div class="group"><h3>Add-ons</h3><div class="opts">${ADDONS.map((a) =>
        `<label class="opt"><input type="checkbox" name="addon" value="${a.v}"><span>${a.v} <small>+${peso(a.add)}</small></span></label>`).join("")}</div></div>`}

      <div class="buy glass">
        <div class="total-row">
          <div class="qty"><button type="button" id="minus" aria-label="Decrease">&minus;</button><output id="qty">1</output><button type="button" id="plus" aria-label="Increase">+</button></div>
          <div class="total" id="total"></div>
        </div>
        <div class="actions"><a class="btn btn-ghost" href="menuphase2.html">Back to Menu</a><button class="btn" id="addCart" type="button">Add to Cart</button></div>
      </div>
    </form>
  </div>`;

  const form = $("#orderForm");
  let qty = 1;
  const pick = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value;
  const addons = () => [...form.querySelectorAll('input[name="addon"]:checked')].map((i) => i.value);
  const unit = () => {                                                       // price per drink
    const size = SIZES.find((s) => s.v === pick("size"))?.add ?? 0;
    const extra = addons().reduce((s, v) => s + ADDONS.find((a) => a.v === v).add, 0);
    return p.price + size + extra;
  };
  const refresh = () => { $("#qty").textContent = qty; $("#total").textContent = peso(unit() * qty); };

  form.addEventListener("change", refresh);
  $("#plus").addEventListener("click",  () => { qty = Math.min(qty + 1, 20); refresh(); });
  $("#minus").addEventListener("click", () => { qty = Math.max(qty - 1, 1);  refresh(); });
  $("#addCart").addEventListener("click", () => {
    const cart = CartService.all();
    cart.push({ productId: p.id, name: p.name, size: pick("size") || null, sugar: pick("sugar") || null, ice: pick("ice") || null,
                addons: addons(), qty, unitPrice: unit(), total: unit() * qty,
                image: $(".detail .pic img")?.getAttribute("src") || null, emoji: p.emoji });   // same image the customer sees here
    CartService.save(cart); updateCartBadge();
    location.href = "../phase3/cartphase3.html";   // Phase 3: go straight to the cart
  });
  refresh();
}

/* Search bar on the details page sends you to the menu */
if (page === "details") $("#searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.value.trim()) location.href = "menuphase2.html?q=" + encodeURIComponent(e.target.value.trim());
});

page === "menu" ? initMenu() : initDetails();
