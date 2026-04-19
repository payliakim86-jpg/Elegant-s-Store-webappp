/**
 * admin.js — Admin panel logic for Elegant's Store
 * [ЗМІНА 1] Видалено поле address з renderSysSettings() та saveSysSettings()
 * Products, orders, settings, logs — all in localStorage
 */
(function (win) {
  'use strict';

  /* ── Wait for ES to be ready ──────────────────────────────── */
  function waitES(fn, n) {
    n = n || 0;
    if (win.ES) { fn(); return; }
    if (n > 60)  { console.error('[Admin] ES not available'); return; }
    setTimeout(function () { waitES(fn, n + 1); }, 50);
  }

  /* ── Access guard ─────────────────────────────────────────── */
  function checkAccess() {
    if (!win.ES || !win.ES.isAdmin()) {
      var denied = document.getElementById('denied');
      var panel  = document.getElementById('panel');
      if (denied) denied.style.display = 'flex';
      if (panel)  panel.style.display  = 'none';
      return false;
    }
    return true;
  }

  /* ── Tab switching ────────────────────────────────────────── */
  function switchTab(id) {
    document.querySelectorAll('.atab').forEach(function (t) {
      t.classList.toggle('on', t.dataset.tab === id);
    });
    document.querySelectorAll('.acontent').forEach(function (c) {
      c.classList.toggle('on', c.id === 'tab-' + id);
    });
  }

  /* ── Add log entry ────────────────────────────────────────── */
  function addLog(msg) {
    var logs = win.ES.S.get(win.ES.K.LOGS, []);
    logs.unshift({
      t  : new Date().toISOString(),
      msg: msg,
      uid: win.ElegantTelegram ? win.ElegantTelegram.getUserId() : 'demo',
    });
    if (logs.length > 300) logs.length = 300;
    win.ES.S.set(win.ES.K.LOGS, logs);
    renderLogs();
  }

  /* ── Stats ────────────────────────────────────────────────── */
  function renderStats() {
    var el   = document.getElementById('statsWrap');
    if (!el) return;
    var prods  = win.ES.S.get(win.ES.K.PRODUCTS, []);
    var orders = win.ES.S.get(win.ES.K.ORDERS,  []);
    var rev    = orders.filter(function (o) { return o.status === 'confirmed'; })
                       .reduce(function (s, o) { return s + (o.total || 0); }, 0);
    el.innerHTML =
      '<div class="stats-grid">' +
        stat('📦', prods.length,  'Товарів') +
        stat('🛒', orders.length, 'Замовлень') +
        stat('✅', orders.filter(function (o) { return o.status === 'confirmed'; }).length, 'Підтверджено') +
        stat('💰', win.ES.fmt(rev), 'Виручка') +
      '</div>';
  }
  function stat(icon, val, label) {
    return '<div class="stat"><div class="si">' + icon + '</div><div class="sv">' + val + '</div><div class="sl">' + label + '</div></div>';
  }

  /* ── Bind add-product form ────────────────────────────────── */
  function bindAddForm() {
    var form  = document.getElementById('addForm');
    var photo = document.getElementById('prodPhoto');
    if (photo) {
      photo.addEventListener('change', function () {
        var f = this.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { win.ES.toast('Фото > 2 MB', 'err'); return; }
        var r = new FileReader();
        r.onload = function (e) {
          document.getElementById('prodPhotoB64').value = e.target.result;
          var prev = document.getElementById('addPrev');
          if (prev) prev.innerHTML = '<img src="' + e.target.result + '">';
        };
        r.readAsDataURL(f);
      });
    }
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveNewProduct();
      });
    }
  }

  function g(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  /* ── Save new product ─────────────────────────────────────── */
  function saveNewProduct() {
    var name  = g('prodName');
    var cat   = g('prodCat');
    var price = parseFloat(g('prodPrice'));
    if (!name || !cat || isNaN(price)) { win.ES.toast("Заповніть обов'язкові поля", 'err'); return; }

    var p = {
      id       : 'p' + Date.now(),
      name     : name,
      category : cat,
      price    : price,
      oldPrice : parseFloat(g('prodOldPrice')) || null,
      qty      : parseInt(g('prodQty')) || 0,
      emoji    : g('prodEmoji') || '👕',
      size     : g('prodSize'),
      desc     : g('prodDesc'),
      badge    : g('prodBadge') || null,
      photo    : document.getElementById('prodPhotoB64').value || null,
    };

    var prods = win.ES.S.get(win.ES.K.PRODUCTS, []);
    prods.unshift(p);
    win.ES.S.set(win.ES.K.PRODUCTS, prods);

    addLog('Додано товар: "' + name + '" (' + cat + ', ' + price + ')');
    win.ES.toast('✓ Товар додано', 'ok');
    document.getElementById('addForm').reset();
    var prev = document.getElementById('addPrev');
    if (prev) prev.innerHTML = '';
    document.getElementById('prodPhotoB64').value = '';
    renderProdList();
    renderStats();
  }

  /* ── Product list (manage tab) ────────────────────────────── */
  function renderProdList() {
    var el = document.getElementById('prodList');
    if (!el) return;
    var prods = win.ES.S.get(win.ES.K.PRODUCTS, []);
    if (!prods.length) {
      el.innerHTML = '<div class="empty"><div class="ei">📦</div><h3>Немає товарів</h3></div>';
      return;
    }
    el.innerHTML = prods.map(function (p) {
      var img = p.photo
        ? '<img src="' + p.photo + '">'
        : (p.emoji || '👕');
      return (
        '<div class="aprod" id="ap-' + p.id + '">' +
          '<div class="aprod-em">' + img + '</div>' +
          '<div class="aprod-info">' +
            '<div class="aprod-name">' + win.ES.esc(p.name) + '</div>' +
            '<div class="aprod-sub">' + win.ES.esc(p.category) + ' · ' + win.ES.fmt(p.price) + ' · Залишок: ' + p.qty + '</div>' +
          '</div>' +
          '<div class="aprod-acts">' +
            '<button class="btn btn-ghost btn-sm" onclick="AP.editProd(\'' + p.id + '\')">✏️</button>' +
            '<button class="btn btn-danger btn-sm" onclick="AP.delProd(\'' + p.id + '\')">🗑</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ── Delete product ───────────────────────────────────────── */
  function delProd(id) {
    if (!confirm('Видалити товар?')) return;
    var prods = win.ES.S.get(win.ES.K.PRODUCTS, []);
    var found = null;
    for (var i = 0; i < prods.length; i++) { if (prods[i].id === id) { found = prods[i]; break; } }
    win.ES.S.set(win.ES.K.PRODUCTS, prods.filter(function (p) { return p.id !== id; }));
    if (found) addLog('Видалено товар: "' + found.name + '"');
    win.ES.toast('Товар видалено');
    renderProdList();
    renderStats();
  }

  /* ── Edit product ─────────────────────────────────────────── */
  function editProd(id) {
    var prods = win.ES.S.get(win.ES.K.PRODUCTS, []);
    var p = null;
    for (var i = 0; i < prods.length; i++) { if (prods[i].id === id) { p = prods[i]; break; } }
    if (!p) return;

    var set = function (eid, val) {
      var el = document.getElementById(eid);
      if (el) el.value = val || '';
    };
    set('editId',       p.id);
    set('editName',     p.name);
    set('editCat',      p.category);
    set('editPrice',    p.price);
    set('editOldPrice', p.oldPrice || '');
    set('editQty',      p.qty);
    set('editEmoji',    p.emoji || '');
    set('editSize',     p.size || '');
    set('editDesc',     p.desc || '');
    set('editBadge',    p.badge || '');
    set('editPhotoB64', p.photo || '');

    var prev = document.getElementById('editPrev');
    if (prev) prev.innerHTML = p.photo ? '<img src="' + p.photo + '">' : '';

    openModal('editModal');
  }

  /* ── Save edited product ──────────────────────────────────── */
  function saveEdit() {
    var id    = g('editId');
    var name  = g('editName');
    var cat   = g('editCat');
    var price = parseFloat(g('editPrice'));
    if (!name || !cat || isNaN(price)) { win.ES.toast("Заповніть обов'язкові поля", 'err'); return; }

    var prods = win.ES.S.get(win.ES.K.PRODUCTS, []);
    for (var i = 0; i < prods.length; i++) {
      if (prods[i].id === id) {
        prods[i].name     = name;
        prods[i].category = cat;
        prods[i].price    = price;
        prods[i].oldPrice = parseFloat(g('editOldPrice')) || null;
        prods[i].qty      = parseInt(g('editQty')) || 0;
        prods[i].emoji    = g('editEmoji') || '👕';
        prods[i].size     = g('editSize');
        prods[i].desc     = g('editDesc');
        prods[i].badge    = g('editBadge') || null;
        var ph = document.getElementById('editPhotoB64').value;
        if (ph) prods[i].photo = ph;
        break;
      }
    }
    win.ES.S.set(win.ES.K.PRODUCTS, prods);
    addLog('Відредаговано товар: "' + name + '"');
    win.ES.toast('✓ Збережено', 'ok');
    closeModal('editModal');
    renderProdList();
  }

  /* ── Orders ───────────────────────────────────────────────── */
  function renderOrders() {
    var el = document.getElementById('ordersList');
    if (!el) return;
    var orders = win.ES.S.get(win.ES.K.ORDERS, []);
    if (!orders.length) {
      el.innerHTML = '<div class="empty"><div class="ei">📋</div><h3>Замовлень ще немає</h3></div>';
      return;
    }
    el.innerHTML = orders.map(function (o) {
      var prods  = (o.items || []).map(function (i) { return win.ES.esc(i.name) + ' ×' + i.qty; }).join(', ');
      var date   = new Date(o.createdAt).toLocaleString('uk-UA');
      var stLabel = { pending:'Очікує', confirmed:'Підтверджено', cancelled:'Скасовано' };
      var acts   = o.status === 'pending'
        ? '<button class="btn btn-success btn-sm" onclick="AP.setOrderStatus(\'' + o.id + '\',\'confirmed\')">✅ Підтвердити</button>' +
          '<button class="btn btn-danger btn-sm"  onclick="AP.setOrderStatus(\'' + o.id + '\',\'cancelled\')">✕ Скасувати</button>'
        : '';
      return (
        '<div class="order-card">' +
          '<div class="order-top">' +
            '<span class="order-id">' + o.id + '</span>' +
            '<span class="status ' + o.status + '">' + (stLabel[o.status] || o.status) + '</span>' +
          '</div>' +
          '<div class="order-prods">' + prods + '</div>' +
          '<div class="order-date">' + date + '</div>' +
          '<div class="order-foot">' +
            '<span class="order-total">' + win.ES.fmt(o.total || 0) + '</span>' +
            '<div class="order-acts">' + acts + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function setOrderStatus(oid, status) {
    var orders = win.ES.S.get(win.ES.K.ORDERS, []);
    var labels = { confirmed:'Підтверджено', cancelled:'Скасовано' };
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === oid) { orders[i].status = status; break; }
    }
    win.ES.S.set(win.ES.K.ORDERS, orders);
    addLog('Статус замовлення ' + oid + ' → ' + (labels[status] || status));
    renderOrders();
    renderStats();
  }

  /* ── Logs ─────────────────────────────────────────────────── */
  function renderLogs() {
    var el = document.getElementById('logsWrap');
    if (!el) return;
    var logs = win.ES.S.get(win.ES.K.LOGS, []);
    if (!logs.length) {
      el.innerHTML = '<div class="empty"><div class="ei">📝</div><h3>Логів ще немає</h3></div>';
      return;
    }
    el.innerHTML = '<div class="log-box">' +
      logs.map(function (l) {
        return '<div class="log-row"><div class="log-t">' + new Date(l.t).toLocaleString('uk-UA') + ' · ' + (l.uid || '—') + '</div><div>' + win.ES.esc(l.msg) + '</div></div>';
      }).join('') +
    '</div>';
  }

  function clearLogs() {
    if (!confirm('Очистити всі логи?')) return;
    win.ES.S.set(win.ES.K.LOGS, []);
    renderLogs();
    win.ES.toast('Логи очищено');
  }

  /* ── System settings ──────────────────────────────────────── */
  function renderSysSettings() {
    var el = document.getElementById('sysSettingsForm');
    if (!el) return;
    var cfg = win.ES.S.get(win.ES.K.SETTINGS, win.ES.SEED_SETTINGS);

    // [ЗМІНА 1] Поле 'address' видалено з масиву fields
    var fields = [
      { key:'storeName',  label:'Назва магазину', type:'text'  },
      { key:'currency',   label:'Валюта',          type:'text'  },
      { key:'phone',      label:'Телефон',         type:'tel'   },
      { key:'email',      label:'Email',            type:'email' },
      { key:'channel',    label:'Telegram-канал',  type:'url'   },
      { key:'reviews',    label:'Відгуки',          type:'url'   },
      { key:'supportUrl', label:'URL підтримки',   type:'url'   },
    ];

    el.innerHTML = fields.map(function (f) {
      return '<div class="fgroup"><label>' + f.label + '</label>' +
        '<input type="' + f.type + '" id="as-' + f.key + '" value="' + win.ES.esc(cfg[f.key] || '') + '"></div>';
    }).join('') +
    '<button class="btn btn-gold btn-full" onclick="AP.saveSysSettings()">💾 Зберегти налаштування</button>';
  }

  function saveSysSettings() {
    var cfg = win.ES.S.get(win.ES.K.SETTINGS, {});
    // [ЗМІНА 1] 'address' видалено зі списку збереження
    ['storeName','currency','phone','email','channel','reviews','supportUrl'].forEach(function (k) {
      var el = document.getElementById('as-' + k);
      if (el) cfg[k] = el.value.trim();
    });
    win.ES.S.set(win.ES.K.SETTINGS, cfg);
    addLog('Оновлено системні налаштування');
    win.ES.toast('✓ Налаштування збережено', 'ok');
  }

  /* ── Photo for edit modal ─────────────────────────────────── */
  function bindEditPhoto() {
    var inp = document.getElementById('editPhotoInput');
    if (!inp) return;
    inp.addEventListener('change', function () {
      var f = this.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function (e) {
        document.getElementById('editPhotoB64').value = e.target.result;
        var prev = document.getElementById('editPrev');
        if (prev) prev.innerHTML = '<img src="' + e.target.result + '">';
      };
      r.readAsDataURL(f);
    });
  }

  /* ── Modal helpers ────────────────────────────────────────── */
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.add('on'); document.body.style.overflow = 'hidden'; }
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.remove('on'); document.body.style.overflow = ''; }
  }

  /* ── Init admin ───────────────────────────────────────────── */
  function initAdmin() {
    if (!checkAccess()) return;

    var denied = document.getElementById('denied');
    var panel  = document.getElementById('panel');
    if (denied) denied.style.display = 'none';
    if (panel)  panel.style.display  = 'block';

    switchTab('addProd');
    renderStats();
    renderProdList();
    renderOrders();
    renderLogs();
    renderSysSettings();
    bindAddForm();
    bindEditPhoto();
  }

  /* ── Public API ───────────────────────────────────────────── */
  win.AP = win.AdminPanel = {
    switchTab      : switchTab,
    delProd        : delProd,
    editProd       : editProd,
    saveEdit       : saveEdit,
    setOrderStatus : setOrderStatus,
    clearLogs      : clearLogs,
    saveSysSettings: saveSysSettings,
    openModal      : openModal,
    closeModal     : closeModal,
  };

  /* ── Auto-start ───────────────────────────────────────────── */
  function boot() {
    if (document.body && document.body.dataset.page === 'admin') {
      waitES(initAdmin);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}(window));
