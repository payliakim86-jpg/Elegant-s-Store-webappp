/**
 * elegant-telegram.js
 * Wrapper for Telegram WebApp API — Elegant's Store
 * Loaded AFTER official https://telegram.org/js/telegram-web-app.js
 */
(function (win) {
  'use strict';

  var tg = win.Telegram && win.Telegram.WebApp ? win.Telegram.WebApp : null;

  var ET = {
    /** Ready + expand */
    init: function () {
      if (!tg) return;
      tg.ready();
      tg.expand();
      try { tg.setHeaderColor('#0a0a0b'); } catch (e) {}
      try { tg.setBackgroundColor('#0a0a0b'); } catch (e) {}
    },

    /** Current Telegram user object or null */
    getUser: function () {
      return tg && tg.initDataUnsafe && tg.initDataUnsafe.user
        ? tg.initDataUnsafe.user
        : null;
    },

    /** Telegram user ID (number) or null */
    getUserId: function () {
      var u = ET.getUser();
      return u ? u.id : null;
    },

    /**
     * Open any URL via Telegram or browser fallback.
     * @param {string} url
     */
    openLink: function (url) {
      if (!url) return;
      try {
        if (tg) {
          if (url.indexOf('t.me') !== -1 && tg.openTelegramLink) {
            tg.openTelegramLink(url);
          } else if (tg.openLink) {
            tg.openLink(url);
          } else {
            win.open(url, '_blank');
          }
        } else {
          win.open(url, '_blank');
        }
      } catch (e) {
        win.open(url, '_blank');
      }
    },

    /** Light haptic feedback */
    haptic: function (type) {
      try {
        if (tg && tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred(type || 'light');
        }
      } catch (e) {}
    },

    /** Is running inside Telegram */
    inTelegram: function () { return !!tg; },

    /** Close the WebApp */
    close: function () { if (tg) tg.close(); }
  };

  ET.init();
  win.ElegantTelegram = ET;

}(window));
