/**
 * WLO-SLT tracker client.
 *
 * Instalaci\ufffd\ufffd:
 *   <script src="https://wlo-slt.vercel.app/tracker.js"
 *           data-site-id="misitio"
 *           data-endpoint="https://wlo-slt.vercel.app/api/ingest"
 *           data-auto-init="true"></script>
 *
 * Auto-tracks: pageview (on load), click, scroll depth (25/50/75 %),
 * form_submit. Env\ufffds eventos a data-endpoint (default: origen del script + /api/ingest).
 */
(function () {
  'use strict';

  // --- Localizaci\ufffd\ufffd del script y configuraci\ufffd\ufffd ----------------------------
  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    for (var i = 0; i < s.length; i++) {
      if (s[i].getAttribute('data-site-id')) return s[i];
    }
    return null;
  })();

  if (!script) {
    console.warn('[wlo-slt] tracker.js: no se encontr\ufffd script con data-site-id');
    return;
  }

  var siteId = script.getAttribute('data-site-id');
  var endpointAttr = script.getAttribute('data-endpoint');
  var autoInit = script.getAttribute('data-auto-init') !== 'false';

  if (!siteId) {
    console.warn('[wlo-slt] tracker.js: falta data-site-id');
  }

  var defaultEndpoint = (function () {
    try {
      var base = script.src ? new URL(script.src).origin : window.location.origin;
      return base + '/api/ingest';
    } catch (e) {
      return window.location.origin + '/api/ingest';
    }
  })();
  var endpoint = endpointAttr || defaultEndpoint;

  // --- Identidad de sesi\ufffd\ufffd / fingerprint -----------------------------------
  function storage(kind) {
    try { return window[kind + 'Storage']; } catch (e) { return null; }
  }

  function getOrCreateFP() {
    var ls = storage('local');
    if (!ls) return genId();
    var k = '_wlo_fp';
    var v = ls.getItem(k);
    if (v) return v;
    v = genId();
    ls.setItem(k, v);
    return v;
  }

  function getOrCreateSid() {
    var ss = storage('session');
    if (!ss) return genId();
    var k = '_wlo_sid';
    var v = ss.getItem(k);
    if (v) return v;
    v = 'sid_' + genId();
    ss.setItem(k, v);
    return v;
  }

  function genId() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var a = new Uint8Array(8);
      crypto.getRandomValues(a);
      var h = '';
      for (var i = 0; i < a.length; i++) h += a[i].toString(16).padStart(2, '0');
      return h + Date.now().toString(36);
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  var fingerprint = getOrCreateFP();
  var sessionId = getOrCreateSid();

  // --- Utilidades ----------------------------------------------------------
  function nowISO() { return new Date().toISOString(); }

  function is_bot_like() {
    if (location.search.indexOf('no_track=1') !== -1) return false;
    var ua = navigator.userAgent || '';
    var gbot = /bot|google|baidu|bing|msn|teoma|slurp|yandex/i;
    return gbot.test(ua);
  }

  function deviceType() {
    var w = screen.width || (window.innerWidth || 0);
    if (w >= 1024) return 'desktop';
    if (w >= 768) return 'tablet';
    return 'mobile';
  }

  function detectBrowser() {
    var ua = navigator.userAgent || '', m;
    if ((m = ua.match(/(Edg)\/(\d+)/))) return 'Edge ' + m[2];
    if (ua.indexOf('OP') !== -1 && (m = ua.match(/(Opera|OP)\/(\d+)/))) return 'Opera ' + m[2];
    if ((m = ua.match(/(Firefox)\/(\d+)/))) return 'Firefox ' + m[2];
    if ((m = ua.match(/(Chrome)\/(\d+)/))) return 'Chrome ' + m[2];
    if ((m = ua.match(/(Safari)\/(\d+)/))) return 'Safari';
    if ((m = ua.match(/(MSIE |Trident.*rv:)(\d+)/))) return 'IE ' + m[2];
    return '';
  }

  function detectOS() {
    var ua = navigator.userAgent || '', o = '';
    if (/iPad|iPhone|iPod/.test(ua)) o = 'iOS';
    else if (/Windows/.test(ua)) o = 'Windows';
    else if (/Android/.test(ua)) o = 'Android';
    else if (/Mac/.test(ua)) o = 'macOS';
    else if (/Linux/.test(ua)) o = 'Linux';
    return o;
  }

  function getParam(k) {
    try { return new URL(window.location.href).searchParams.get(k) || undefined; } catch (e) { return undefined; }
  }

  function collectUTM() {
    var params = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) {
      var v = getParam(k);
      if (v) params[k] = v;
    });
    return params;
  }

  var baseContext = {
    site_id: siteId,
    session_id: sessionId,
    fingerprint: fingerprint,
    device_type: deviceType(),
    browser: detectBrowser(),
    os: detectOS(),
    screen_res: (screen.width || 0) + 'x' + (screen.height || 0),
    referrer: document.referrer || undefined,
    connection_type: (navigator.connection && (navigator.connection.effectiveType || undefined)) || undefined,
  };

  // Persistencia de campa\ufffda/UTM para atribuir conversiones.
  function persistCampaign() {
    var utm = collectUTM();
    var ls = storage('local');
    if (!ls) return;
    var existing = {};
    try { existing = JSON.parse(ls.getItem('_wlo_utm') || '{}'); } catch (e) {}
    Object.keys(utm).forEach(function (k) { existing[k] = utm[k]; });
    ls.setItem('_wlo_utm', JSON.stringify(existing));
    if (Object.keys(utm).length) ls.setItem('_wlo_utm_last', nowISO());
  }

  // --- Env\ufffdo ---------------------------------------------------------------
  function send(type, extra) {
    if (is_bot_like()) return;
    if (!siteId) return;

    var payload = Object.assign({}, baseContext, {
      type: type,
      url: window.location.href,
      timestamp: nowISO(),
    }, extra || {});

    var ls = storage('local');
    if (ls) {
      try {
        var saved = JSON.parse(ls.getItem('_wlo_utm') || '{}');
        Object.keys(saved).forEach(function (k) { if (!payload[k]) payload[k] = saved[k]; });
      } catch (e) {}
    }

    var body = JSON.stringify([payload]);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Fingerprint': fingerprint },
      body: body,
      keepalive: true,
      credentials: 'omit',
    }).catch(function () {});
  }

  // --- Auto-tracking -------------------------------------------------------
  function pageview() {
    if (document.location.hash === '#no-track' || location.search.indexOf('no_track=1') !== -1) return;
    persistCampaign();
    send('pageview', { event_name: document.title || undefined });
  }

  function onClick(e) {
    var target = e.target;
    if (!target || target.nodeType !== 1) return;
    var t = target.tagName.toLowerCase();
    var id = target.getAttribute('id') || '';
    var cls = target.getAttribute('class') || '';
    send('click', {
      element_id: id || undefined,
      event_name: t + (cls ? '.' + cls.split(' ')[0] : ''),
      payload: { href: t === 'a' ? target.getAttribute('href') || undefined : undefined },
    });
  }

  function onScroll() {
    var max = 0;
    var handler = function () {
      var doc = document.documentElement;
      var win = window;
      var scrolled = win.scrollY || win.pageYOffset || doc.scrollTop;
      var h = doc.scrollHeight - doc.clientHeight;
      var pct = h > 0 ? (scrolled / h) : 0;
      [0.25, 0.5, 0.75, 1].forEach(function (mark) {
        if (pct >= mark && mark > max) {
          max = mark;
          send('scroll', {
            event_name: 'scroll_' + Math.round(mark * 100),
            payload: { percent: Math.round(pct * 100) },
          });
        }
      });
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(handler);
      }
    }, { passive: true });
  }

  function onFormSubmit(e) {
    var form = e.target;
    if (!form || !form.tagName || form.tagName.toLowerCase() !== 'form') return;
    var id = form.getAttribute('id') || '';
    send('form_submit', { element_id: id || undefined, event_name: form.getAttribute('data-wlo-event') || 'form_submit' });
  }

  function trackVisibility() {
    if (document.visibilityState === 'hidden') {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') pageview();
      }, { once: true });
    } else {
      pageview();
    }
  }

  // --- Inicializaci\ufffd\ufffd p\ufffdflica -----------------------------------------------
  function init() {
    if (window.wlo && window.wlo.tracking) return;
    window.wlo = window.wlo || {};
    window.wlo.siteId = siteId;
    window.wlo.endpoint = endpoint;
    window.wlo.send = send;
    window.wlo.track = function (type, extra) { send(type, extra); };
    window.wlo.tracking = true;

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onFormSubmit, true);
    onScroll();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackVisibility);
    } else {
      trackVisibility();
    }
  }

  if (autoInit) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  window.wloTracker = {
    init: init,
    send: send,
    track: function (type, extra) { send(type, extra); },
  };
})();
