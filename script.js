/* KKOPI.Tea – Phase 1 */
const page = document.body.dataset.page;
const $ = (s) => document.querySelector(s);

/* ---------- Auth service (swap these bodies for Firebase later) ----------
   import { initializeApp } from "firebase/app";
   import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
            sendPasswordResetEmail, updateProfile } from "firebase/auth";
   const app = initializeApp({ apiKey:"...", authDomain:"...", projectId:"..." });
   const auth = getAuth(app);
*/
const authService = {
  async login(email, password)  { /* return signInWithEmailAndPassword(auth, email, password); */ return { email }; },
  async register(data)          { /* const c = await createUserWithEmailAndPassword(auth, data.email, data.password);
                                     await updateProfile(c.user, { displayName: data.name }); return c; */ return data; },
  async resetPassword(email)    { /* return sendPasswordResetEmail(auth, email); */ return { email }; }
};

/* ---------- Validation ---------- */
const rules = {
  name:     (v) => v.trim().length >= 2 || "Enter your full name.",
  email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Enter a valid email address.",
  phone:    (v) => /^(\+63|0)?9\d{9}$/.test(v.replace(/[\s-]/g, "")) || "Enter a valid PH mobile number (e.g. 09171234567).",
  password: (v) => v.length >= 6 || "Password must be at least 6 characters.",
  confirm:  (v) => v === $("#password")?.value || "Passwords do not match."
};
function validate(form) {
  let ok = true;
  form.querySelectorAll("[data-rule]").forEach((input) => {
    const res = rules[input.dataset.rule](input.value);
    const field = input.closest(".field");
    field.classList.toggle("invalid", res !== true);
    field.querySelector(".error").textContent = res === true ? "" : res;
    if (res !== true) ok = false;
  });
  return ok;
}
function bindForm(id, onValid) {
  const form = $(id);
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try { await onValid(Object.fromEntries(new FormData(form))); }
    catch (err) { alert(err.message || "Something went wrong. Try again."); btn.disabled = false; }
  });
  form.querySelectorAll("[data-rule]").forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("invalid")));
}

/* ---------- Pages ---------- */
if (page === "splash") setTimeout(() => location.replace("login.html"), 3000); // replace: hindi na babalik sa splash ang Back button

if (page === "login") {
  const saved = localStorage.getItem("kkopi_email");
  if (saved) { $("#email").value = saved; $("#remember").checked = true; }
  bindForm("#loginForm", async (d) => {
    await authService.login(d.email, d.password);
    $("#remember").checked ? localStorage.setItem("kkopi_email", d.email) : localStorage.removeItem("kkopi_email");
    location.href = "home.html";
  });
}
if (page === "register") bindForm("#registerForm", async (d) => { await authService.register(d); location.href = "home.html"; });

if (page === "forgot") bindForm("#forgotForm", async (d) => {
  await authService.resetPassword(d.email);
  $("#msg").classList.add("show");
  setTimeout(() => (location.href = "login.html"), 2500);
});

if (page === "home") {
  $("#startOrdering").addEventListener("click", () => (location.href = "phase2/menuphase2.html")); // Phase 2 page
  document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((x) => x.classList.remove("active")); c.classList.add("active");
  }));
  $("#searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) location.href = "phase2/menuphase2.html?q=" + encodeURIComponent(e.target.value.trim());
  });
}

/* ---------- Home: click a product card to feature it ---------- */
if (page === "home") {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="mName">
      <button class="modal-close" type="button" aria-label="Close">&times;</button>
      <div class="modal-pic" id="mPic"></div>
      <div class="modal-body">
        <h2 id="mName"></h2>
        <p id="mDesc"></p>
        <div class="sizes" role="group" aria-label="Size">
          <button class="chip active" type="button" data-size="Regular" data-add="0">Regular</button>
          <button class="chip" type="button" data-size="Large" data-add="20">Large +₱20</button>
        </div>
        <div class="modal-foot">
          <strong id="mPrice"></strong>
          <button class="btn btn-block" id="mOrder" type="button">Order this</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const $m = (s) => modal.querySelector(s);
  let current = null, base = 0, size = "Regular", lastCard = null;

  const peso = (n) => "₱" + n;
  const setPrice = () => {
    const add = +modal.querySelector(".sizes .active").dataset.add;
    $m("#mPrice").textContent = peso(base + add);
  };

  function openModal(card) {
    lastCard = card;
    const img = card.querySelector("img");
    const pic = card.querySelector(".pic");
    current = card.querySelector("h3").textContent;
    base = parseInt(card.querySelector(".price span").textContent.replace(/\D/g, ""), 10);
    $m("#mName").textContent = current;
    $m("#mDesc").textContent = card.querySelector("small").textContent;
    $m("#mPic").dataset.emoji = pic.dataset.emoji;
    $m("#mPic").innerHTML = img ? `<img src="${img.src}" alt="${current}">` : "";
    modal.querySelectorAll(".sizes .chip").forEach((c, i) => c.classList.toggle("active", i === 0));
    setPrice();
    card.classList.add("selected");
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    $m(".modal-close").focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastCard) { lastCard.classList.remove("selected"); lastCard.focus(); }
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.addEventListener("click", () => openModal(card));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(card); } });
    card.querySelector(".add")?.addEventListener("click", (e) => { e.stopPropagation(); openModal(card); }); // "+" opens the same view
  });

  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  $m(".modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  modal.querySelectorAll(".sizes .chip").forEach((c) => c.addEventListener("click", () => {
    modal.querySelectorAll(".sizes .chip").forEach((x) => x.classList.remove("active"));
    c.classList.add("active"); size = c.dataset.size; setPrice();
  }));
  $m("#mOrder").addEventListener("click", () => {
    location.href = `phase2/productdetailsphase2.html?item=${encodeURIComponent(current)}&size=${size}`; // Phase 2 reads these
  });
}

/* ---------- Home: close the account menu when clicking elsewhere ---------- */
if (page === "home") {
  document.addEventListener("click", (e) => { const d = $(".account"); if (d && !d.contains(e.target)) d.open = false; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const d = $(".account"); if (d) d.open = false; } });
}
