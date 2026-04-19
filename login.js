/**
 * login.js — Login page logic for Elegant's Store
 * Demo-admin credentials + session management
 */
(function (win) {
  'use strict';

  var SESS_KEY = 'es_session';
  var TTL      = 7 * 24 * 60 * 60 * 1000; // 7 days

  var ADMINS = [
    { email: 'admin@elegants.store', pwd: 'ElegantAdmin2026!', name: 'Admin'  },
    { email: 'owner@elegants.store', pwd: 'OwnerAccess2026!',  name: 'Owner'  },
  ];

  /* ── Session helpers ──────────────────────────────────────── */
  function hasSession() {
    try {
      var raw  = localStorage.getItem(SESS_KEY);
      if (!raw) return false;
      var sess = JSON.parse(raw);
      return sess && sess.admin && sess.exp > Date.now();
    } catch (e) { return false; }
  }

  function saveSession(name) {
    localStorage.setItem(SESS_KEY, JSON.stringify({
      admin: true,
      name : name,
      at   : Date.now(),
      exp  : Date.now() + TTL,
    }));
  }

  function logout() {
    localStorage.removeItem(SESS_KEY);
    win.location.href = 'login.html';
  }

  /* ── Redirect if already logged in ───────────────────────── */
  function checkAlreadyIn() {
    if (hasSession()) { win.location.href = 'index.html'; }
  }

  /* ── Show error ───────────────────────────────────────────── */
  function showErr(msg) {
    var el = document.getElementById('loginErr');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  /* ── Shake animation ──────────────────────────────────────── */
  function shake() {
    var card = document.querySelector('.login-card');
    if (!card) return;
    card.style.animation = 'shake .36s ease';
    card.addEventListener('animationend', function () {
      card.style.animation = '';
    }, { once: true });
  }

  /* ── Toggle password visibility ───────────────────────────── */
  function togglePwd() {
    var inp = document.getElementById('pwd');
    var btn = document.getElementById('togglePwd');
    if (!inp) return;
    if (inp.type === 'password') { inp.type = 'text'; if (btn) btn.textContent = '🙈'; }
    else                         { inp.type = 'password'; if (btn) btn.textContent = '👁'; }
  }

  /* ── Handle login submit ──────────────────────────────────── */
  function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    var emailEl = document.getElementById('email');
    var pwdEl   = document.getElementById('pwd');
    var btnEl   = document.getElementById('loginBtn');
    if (!emailEl || !pwdEl) return;

    var email = emailEl.value.trim();
    var pwd   = pwdEl.value;

    document.getElementById('loginErr').style.display = 'none';

    if (!email || !pwd) { showErr('Введіть email та пароль'); return; }

    // Match credentials
    var found = null;
    for (var i = 0; i < ADMINS.length; i++) {
      if (ADMINS[i].email === email && ADMINS[i].pwd === pwd) {
        found = ADMINS[i]; break;
      }
    }

    if (!found) { showErr('Невірний email або пароль'); shake(); return; }

    saveSession(found.name);
    if (btnEl) { btnEl.textContent = 'Вхід успішний…'; btnEl.disabled = true; }
    setTimeout(function () { win.location.href = 'index.html'; }, 700);
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    checkAlreadyIn();

    var form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', handleLogin);

    var pwd = document.getElementById('pwd');
    if (pwd) pwd.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleLogin(e);
    });

    var tog = document.getElementById('togglePwd');
    if (tog) tog.addEventListener('click', togglePwd);
  }

  win.ElegantLogin = { logout: logout };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window));
