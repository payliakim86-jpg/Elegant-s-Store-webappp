/**
 * app.js — Core logic for Elegant's Store
 * [ЗМІНА 1] Видалено поле address з renderSettings()
 * [ЗМІНА 2] Оновлено channel та reviews в SEED_SETTINGS
 * [ЗМІНА 5] Додано обробник кнопки discountBtn
 * Storage, catalog render, cart, settings, global API
 */
(function (win) {
  'use strict';

  /* ── Constants ────────────────────────────────────────────── */
  var ADMIN_IDS   = [5254893784, 6307392995];
  var MANAGER     = 'Elegant876';
  var MANAGER_URL = 'https://t.me/' + MANAGER;

  var K = {
    PRODUCTS : 'es_products',
    CART     : 'es_cart',
    ORDERS   : 'es_orders',
    SETTINGS : 'es_settings',
    LOGS     : 'es_logs',
    SESSION  : 'es_session',
  };

  /* ── Seed data ────────────────────────────────────────────── */
  var SEED_PRODUCTS = [
    { id:'p01', name:'Classic White Tee',  category:'Футболки',  price:590,  oldPrice:null, qty:15, emoji:'👕', size:'M, L, XL',       desc:'Преміум-бавовна 100%, ідеальна посадка для будь-якого образу.',              badge:'Новинка', photo:null },
    { id:'p02', name:'Sport Shorts',       category:'Шорти',     price:720,  oldPrice:950,  qty:10, emoji:'🩳', size:'S, M, L',         desc:'Легкі шорти з дихаючої тканини, ідеально для активного відпочинку.',        badge:'Sale',    photo:null },
    { id:'p03', name:'Premium Hoodie',     category:'Худі',      price:1490, oldPrice:null, qty:8,  emoji:'🧥', size:'M, L, XL, XXL',  desc:'Флісова підкладка, тепло і стиль у будь-яку погоду.',                        badge:null,      photo:null },
    { id:'p04', name:'Leather Belt',       category:'Ремені',    price:890,  oldPrice:null, qty:20, emoji:'🔖', size:'One Size',        desc:'Справжня шкіра, металева пряжка золотистого кольору.',                        badge:null,      photo:null },
    { id:'p05', name:'Snapback Cap',       category:'Кепки',     price:450,  oldPrice:580,  qty:30, emoji:'🧢', size:'One Size',        desc:'Регульований снепбек, вишита емблема Elegant\'s.',                            badge:'Sale',    photo:null },
    { id:'p06', name:'Runner Sneakers',    category:'Кросівки',  price:2990, oldPrice:null, qty:5,  emoji:'👟', size:'38–45',           desc:'Амортизуюча підошва, доступні у кількох кольорах.',                           badge:'Хіт',     photo:null },
    { id:'p07', name:'Slim Fit Pants',     category:'Штани',     price:1190, oldPrice:null, qty:12, emoji:'👖', size:'S, M, L, XL',    desc:'Еластичний пояс, ідеальний для офісу або вечірки.',                           badge:null,      photo:null },
    { id:'p08', name:'Winter Jacket',      category:'Куртки',    price:3490, oldPrice:4200, qty:6,  emoji:'🧣', size:'M, L, XL',        desc:'Утеплювач, водовідштовхувальне покриття, знімний капюшон.',                   badge:'Sale',    photo:null },
  ];

  /* [ЗМІНА 2] Оновлені посилання на канал та відгуки */
  var SEED_SETTINGS = {
    storeName  : "Elegant's Store",
    currency   : '₴',
    phone      : '+380 63 875 24 85',
    email      : 'mishasavarin2010@gmail.com',
    channel    : 'https://t.me/EleganTSstore1',    // [ЗМІНА 2] оновлено
    reviews    : 'https://t.me/+bQd5BjHhAx9kYzIy', // [ЗМІНА 2] оновлено
    supportUrl : 'https://t.me/Elegant876',          // не змінювати
  };

  /* ── Storage ──────────────────────────────────────────────── */
  var S = {
    has: function (k) { return localStorage.getItem(k) !== null; },
    get: function (k, fb) {
      try {
        var raw = localStorage.getItem(k);
        if (raw === null) return (fb !== undefined ? fb : null);
        return JSON.parse(raw);
      } catch (e) { return (fb !== undefined ? fb : null); }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    },
    del: function (k) { localStorage.removeItem(k); }
  };

  /* ── Init seed data (only if key absent) ─────────────────── */
  function seedData() {
    if (!S.has(K.PRODUCTS)) S.set(K.PRODUCTS, SEED_PRODUCTS);
    if (!S.has(K.SETTINGS)) S.set(K.SETTINGS, SEED_SETTINGS);
    if (!S.has(K.CART))     S.set(K.CART,    []);
    if (!S.has(K.ORDERS))   S.set(K.ORDERS,  []);
    if (!S.has(K.LOGS))     S.set(K.LOGS,    []);
  }

  /* ── Admin check ──────────────────────────────────────────── */
  function isAdmin() {
    // 1. Telegram ID
    var et = win.ElegantTelegram;
    if (et) {
      var uid = et.getUserId();
      if (uid && ADMIN_IDS.indexOf(uid) !== -1) return true;
    }
    // 2. Demo session
    var sess = S.get(K.SESSION);
    if (sess && sess.admin && sess.exp > Date.now()) return true;
    return false;
  }

  /* ── Open manager chat ────────────────────────────────────── */
  function openChatWithManager() {
    var et = win.ElegantTelegram;
    if (et) { et.openLink(MANAGER_URL); }
    else     { win.open(MANAGER_URL, '_blank'); }
  }

  /* ── Format price ─────────────────────────────────────────── */
  function fmt(price) {
    var cfg = S.get(K.SETTINGS, {});
    var cur = cfg.currency || '₴';
    return price.toLocaleString('uk-UA') + '\u00a0' + cur;
  }

  /* ── Toast ────────────────────────────────────────────────── */
  function toast(msg, type) {
    var el = document.getElementById('estoast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'estoast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast' + (type ? ' ' + type : '');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  /* ── Cart ─────────────────────────────────────────────────── */
  var Cart = {
    all: function () { return S.get(K.CART, []); },
    save: function (a) { S.set(K.CART, a); updateCartBadge(); },
    add: function (pid) {
      var prods = S.get(K.PRODUCTS, []);
      var p = null;
      for (var i = 0; i < prods.length; i++) { if (prods[i].id === pid) { p = prods[i]; break; } }
      if (!p) return;
      var cart = Cart.all();
      var ex = null;
      for (var j = 0; j < cart.length; j++) { if (cart[j].id === pid) { ex = cart[j]; break; } }
      if (ex) { ex.qty += 1; }
      else { cart.push({ id:p.id, name:p.name, category:p.category, price:p.price, emoji:p.emoji, photo:p.photo, qty:1 }); }
      Cart.save(cart);
    },
    remove: function (pid) { Cart.save(Cart.all().filter(function (i) { return i.id !== pid; })); },
    setQty: function (pid, q) {
      if (q <= 0) { Cart.remove(pid); return; }
      var cart = Cart.all();
      for (var i = 0; i < cart.length; i++) { if (cart[i].id === pid) { cart[i].qty = q; break; } }
      Cart.save(cart);
    },
    total: function () { return Cart.all().reduce(function (s, i) { return s + i.price * i.qty; }, 0); },
    count: function () { return Cart.all().reduce(function (s, i) { return s + i.qty; }, 0); },
    clear: function () { Cart.save([]); }
  };

  /* ── Update cart badge in header ─────────────────────────── */
  function updateCartBadge() {
    var cnt = Cart.count();
    document.querySelectorAll('.cnt').forEach(function (el) {
      el.textContent = cnt;
      el.classList.toggle('show', cnt > 0);
    });
  }

  /* ── Render catalog ───────────────────────────────────────── */
  function renderCatalog() {
    var grid = document.getElementById('prodGrid');
    if (!grid) return;

    var prods   = S.get(K.PRODUCTS, []);
    var search  = (document.getElementById('srch') || {}).value || '';
    var catEl   = document.querySelector('.chip.on');
    var cat     = catEl ? catEl.dataset.cat : 'all';
    var minP    = parseFloat((document.getElementById('minP') || {}).value) || 0;
    var maxP    = parseFloat((document.getElementById('maxP') || {}).value) || Infinity;

    var list = prods.filter(function (p) {
      var ms = p.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
               p.category.toLowerCase().indexOf(search.toLowerCase()) !== -1;
      var mc = cat === 'all' || p.category === cat;
      var mp = p.price >= minP && p.price <= maxP;
      return ms && mc && mp;
    });

    if (!list.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="ei">🔍</div><h3>Нічого не знайдено</h3><p>Спробуйте змінити фільтри</p></div>';
      return;
    }

    grid.innerHTML = list.map(function (p, idx) {
      var imgHtml = p.photo
        ? '<img src="' + p.photo + '" alt="' + esc(p.name) + '">'
        : p.emoji || '👕';
      var bdg = p.badge
        ? '<span class="card-bdg' + (p.badge === 'Sale' ? ' sale' : p.badge === 'Хіт' ? ' hit' : '') + '">' + esc(p.badge) + '</span>'
        : '';
      var old = p.oldPrice
        ? '<span class="card-old">' + fmt(p.oldPrice) + '</span>'
        : '';
      return (
        '<div class="card au" style="animation-delay:' + (idx * 0.04) + 's">' +
          '<div class="card-img">' + imgHtml + bdg + '</div>' +
          '<div class="card-body">' +
            '<div class="card-cat">' + esc(p.category) + '</div>' +
            '<div class="card-name">' + esc(p.name) + '</div>' +
            '<div class="card-meta">' +
              '<span class="card-price">' + fmt(p.price) + '</span>' +
              old +
              '<span class="card-size">' + esc(p.size) + '</span>' +
            '</div>' +
            '<div class="card-btns">' +
              '<button class="btn btn-ghost" onclick="ES.addToCart(\'' + p.id + '\',this)">🛒 Кошик</button>' +
              '<button class="btn btn-gold" onclick="ES.buyNow()">Купити</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ── Render category chips ────────────────────────────────── */
  function renderChips() {
    var el = document.getElementById('catChips');
    if (!el) return;
    var prods = S.get(K.PRODUCTS, []);
    var cats  = ['all'];
    prods.forEach(function (p) {
      if (cats.indexOf(p.category) === -1) cats.push(p.category);
    });
    el.innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === 'all' ? ' on' : '') + '" data-cat="' + c + '" onclick="ES.setFilter(\'' + c + '\')">' + (c === 'all' ? '✨ Всі' : c) + '</button>';
    }).join('');
  }

  /* ── Render quick links ───────────────────────────────────── */
  function renderQL() {
    var el = document.getElementById('qlRow');
    if (!el) return;
    var cfg   = S.get(K.SETTINGS, {});
    var admin = isAdmin();
    var links = [
      { icon:'📣', label:'Канал',     url: cfg.channel,    ext:true },
      { icon:'⭐', label:'Відгуки',   url: cfg.reviews,    ext:true },
      { icon:'💬', label:'Підтримка', url: cfg.supportUrl, ext:true },
    ];
    if (admin) links.push({ icon:'⚙️', label:'Адмін', url:'admin.html', ext:false });
    el.innerHTML = links.map(function (l) {
      var fn = l.ext
        ? 'ES.openExt(\'' + l.url + '\')'
        : 'location.href=\'' + l.url + '\'';
      return '<button class="ql" onclick="' + fn + '"><span class="qi">' + l.icon + '</span>' + l.label + '</button>';
    }).join('');
  }

  /* ── Render cart ──────────────────────────────────────────── */
  function renderCart() {
    var listEl = document.getElementById('cartList');
    var sumEl  = document.getElementById('cartSum');
    if (!listEl) return;

    var items = Cart.all();
    if (!items.length) {
      listEl.innerHTML = '<div class="empty"><div class="ei">🛒</div><h3>Кошик порожній</h3><p>Додайте товари з каталогу</p></div>';
      if (sumEl) sumEl.style.display = 'none';
      return;
    }

    listEl.innerHTML = items.map(function (item) {
      var img = item.photo
        ? '<img src="' + item.photo + '" alt="">'
        : (item.emoji || '👕');
      return (
        '<div class="cart-item" id="ci-' + item.id + '">' +
          '<div class="ci-img">' + img + '</div>' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + esc(item.name) + '</div>' +
            '<div class="ci-cat">' + esc(item.category) + '</div>' +
            '<div class="ci-row">' +
              '<div class="qty">' +
                '<button class="qty-btn" onclick="ES.qtyDelta(\'' + item.id + '\',-1)">−</button>' +
                '<span class="qty-val" id="qv-' + item.id + '">' + item.qty + '</span>' +
                '<button class="qty-btn" onclick="ES.qtyDelta(\'' + item.id + '\',1)">+</button>' +
              '</div>' +
              '<span class="ci-price">' + fmt(item.price * item.qty) + '</span>' +
              '<button class="ci-del" onclick="ES.removeFromCart(\'' + item.id + '\')">✕</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    if (sumEl) {
      var total    = Cart.total();
      var count    = Cart.count();
      var shipping = total >= 1500 ? 0 : 150;
      sumEl.style.display = 'block';
      sumEl.innerHTML = (
        '<div class="sum-row"><span>Товарів</span><span>' + count + '</span></div>' +
        '<div class="sum-row"><span>Доставка</span><span>' + (shipping === 0 ? 'Безкоштовно' : fmt(shipping)) + '</span></div>' +
        '<div class="sum-row total"><span>Всього</span><span class="sum-val">' + fmt(total + shipping) + '</span></div>' +
        '<p class="checkout-note">Натискаючи «Оформити», ви перейдете до менеджера</p>' +
        '<button class="btn btn-gold btn-full" onclick="ES.checkout()">💬 Оформити замовлення</button>'
      );
    }
  }

  /* ── Render settings ──────────────────────────────────────── */
  function renderSettings() {
    var el    = document.getElementById('settingsWrap');
    var badge = document.getElementById('settingsBadge');
    if (!el) return;

    var cfg   = S.get(K.SETTINGS, SEED_SETTINGS);
    var admin = isAdmin();

    if (badge) {
      badge.textContent  = admin ? '✏️ Режим редагування' : '👁 Тільки перегляд';
      badge.className    = 'overline ' + (admin ? 'gold' : 't3');
    }

    var sections = [
      {
        icon: '🏪', title: 'Загальна інформація',
        fields: [
          { key:'storeName', label:'Назва магазину',  type:'text'  },
          { key:'currency',  label:'Валюта',           type:'text'  },
          { key:'phone',     label:'Телефон',          type:'tel'   },
          { key:'email',     label:'Email',             type:'email' },
          // [ЗМІНА 1] Поле 'address' видалено
        ]
      },
      {
        icon: '🔗', title: 'Посилання',
        fields: [
          { key:'channel',    label:'Telegram-канал', type:'url' },
          { key:'reviews',    label:'Відгуки',         type:'url' },
          { key:'supportUrl', label:'Підтримка',       type:'url' },
        ]
      }
    ];

    el.innerHTML = sections.map(function (sec) {
      return (
        '<div class="scard">' +
          '<div class="scard-hdr"><span>' + sec.icon + '</span><h3>' + sec.title + '</h3></div>' +
          sec.fields.map(function (f) {
            var val = esc(cfg[f.key] || '');
            if (admin) {
              return '<div class="sfield"><label>' + f.label + '</label>' +
                '<input type="' + f.type + '" id="sf-' + f.key + '" value="' + val + '"' +
                ' onchange="ES.saveField(\'' + f.key + '\',this.value)"></div>';
            }
            return '<div class="sfield"><label>' + f.label + '</label><div class="ro">' + (cfg[f.key] || '—') + '</div></div>';
          }).join('') +
        '</div>'
      );
    }).join('');

    // Admin link
    var al = document.getElementById('adminLink');
    if (al) al.style.display = admin ? 'block' : 'none';
  }

  /* ── Save single settings field ───────────────────────────── */
  function saveField(key, val) {
    if (!isAdmin()) return;
    var cfg = S.get(K.SETTINGS, {});
    cfg[key] = val;
    S.set(K.SETTINGS, cfg);
  }

  /* ── Set catalog filter ───────────────────────────────────── */
  function setFilter(cat) {
    document.querySelectorAll('.chip').forEach(function (c) {
      c.classList.toggle('on', c.dataset.cat === cat);
    });
    renderCatalog();
  }

  /* ── Add to cart (catalog action) ────────────────────────── */
  function addToCart(pid, triggerEl) {
    Cart.add(pid);
    if (win.ElegantTelegram) win.ElegantTelegram.haptic('light');
    updateCartBadge();
    animateCartAdd(triggerEl);
    toast('✓ Додано до кошика', 'ok');
  }

  /* ── Cart add animation ───────────────────────────────────── */
  /* Золота крапля летить від кнопки до іконки кошика, потім кошик підскакує */
  function animateCartAdd(triggerEl) {
    var cartChip = document.querySelector('.cart-chip');
    if (!cartChip) return;

    var cartRect = cartChip.getBoundingClientRect();
    var cartCX   = cartRect.left + cartRect.width  / 2;
    var cartCY   = cartRect.top  + cartRect.height / 2;

    // Визначаємо точку старту: кнопка або центр екрану
    var startX = cartCX;
    var startY = cartCY;
    if (triggerEl) {
      var r = triggerEl.getBoundingClientRect();
      startX = r.left + r.width  / 2;
      startY = r.top  + r.height / 2;
    }

    // Створюємо літаючу краплю
    var dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.left = startX - 5 + 'px';
    dot.style.top  = startY - 5 + 'px';
    // CSS-змінні для кінцевої точки польоту
    dot.style.setProperty('--dx', (cartCX - startX) + 'px');
    dot.style.setProperty('--dy', (cartCY - startY) + 'px');
    document.body.appendChild(dot);

    // Після польоту — підскок кошика + кільце
    dot.addEventListener('animationend', function () {
      dot.remove();

      // Bounce
      cartChip.classList.remove('bouncing');
      void cartChip.offsetWidth; // reflow щоб анімація перезапустилась
      cartChip.classList.add('bouncing');

      // Ring flash
      cartChip.classList.remove('ring-flash');
      void cartChip.offsetWidth;
      cartChip.classList.add('ring-flash');

      cartChip.addEventListener('animationend', function cleanup() {
        cartChip.classList.remove('bouncing', 'ring-flash');
        cartChip.removeEventListener('animationend', cleanup);
      });
    });
  }

  /* ── Buy now ──────────────────────────────────────────────── */
  function buyNow() { openChatWithManager(); }

  /* ── Qty delta in cart ────────────────────────────────────── */
  function qtyDelta(pid, d) {
    var cart = Cart.all();
    var item = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === pid) { item = cart[i]; break; } }
    if (!item) return;
    var nq = item.qty + d;
    Cart.setQty(pid, nq);
    if (nq <= 0) {
      var el = document.getElementById('ci-' + pid);
      if (el) el.remove();
    } else {
      var qv = document.getElementById('qv-' + pid);
      if (qv) qv.textContent = nq;
    }
    renderCart();
  }

  /* ── Remove from cart ─────────────────────────────────────── */
  function removeFromCart(pid) { Cart.remove(pid); renderCart(); }

  /* ── Checkout ─────────────────────────────────────────────── */
  function checkout() {
    var items = Cart.all();
    if (!items.length) { toast('Кошик порожній', 'err'); return; }
    // Save order locally
    var orders = S.get(K.ORDERS, []);
    orders.unshift({
      id       : 'ORD-' + Date.now(),
      items    : items,
      total    : Cart.total(),
      status   : 'pending',
      createdAt: new Date().toISOString(),
      userId   : win.ElegantTelegram ? win.ElegantTelegram.getUserId() : null,
    });
    S.set(K.ORDERS, orders);
    Cart.clear();
    openChatWithManager();
  }

  /* ── Open external link (safe fallback) ───────────────────── */
  function openExt(url) {
    var et = win.ElegantTelegram;
    if (et) { et.openLink(url); }
    else     { win.open(url, '_blank'); }
  }

  /* ── HTML escape ──────────────────────────────────────────── */
  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* ── Page init ────────────────────────────────────────────── */
  function initPage() {
    seedData();
    updateCartBadge();

    var page = document.body.dataset.page;

    // Mark active nav
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.toggle('on', n.dataset.p === page);
    });

    if (page === 'index') {
      renderQL();
      renderChips();
      renderCatalog();

      // [ЗМІНА 3] Кнопка "Купити зараз" на логотип-банері
      var hb = document.getElementById('heroBuy');
      if (hb) hb.addEventListener('click', openChatWithManager);

      // [ЗМІНА 5] Кнопка "Отримати знижку" відкриває чат з менеджером
      var db = document.getElementById('discountBtn');
      if (db) db.addEventListener('click', openChatWithManager);

      // Search
      var srch = document.getElementById('srch');
      if (srch) srch.addEventListener('input', renderCatalog);

      // Price filter
      ['minP','maxP'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', renderCatalog);
      });
    }

    if (page === 'cart')     renderCart();
    if (page === 'settings') renderSettings();
  }

  /* ── Public API ───────────────────────────────────────────── */
  win.ES = win.ElegantStore = {
    // Constants
    ADMIN_IDS : ADMIN_IDS,
    K         : K,
    SEED_SETTINGS : SEED_SETTINGS,

    // Storage
    S         : S,
    Cart      : Cart,

    // Helpers
    isAdmin   : isAdmin,
    fmt       : fmt,
    toast     : toast,
    esc       : esc,
    openExt   : openExt,
    openChatWithManager : openChatWithManager,

    // Actions
    addToCart : addToCart,
    removeFromCart : removeFromCart,
    qtyDelta  : qtyDelta,
    buyNow    : buyNow,
    checkout  : checkout,
    setFilter : setFilter,
    saveField : saveField,

    // Render
    renderCatalog  : renderCatalog,
    renderChips    : renderChips,
    renderCart     : renderCart,
    renderQL       : renderQL,
    renderSettings : renderSettings,
    updateCartBadge: updateCartBadge,
    initPage       : initPage,
  };

  /* ── Auto-start ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }

}(window));
