// native-auth.js — 앱(iOS) 안에서만 동작. 쇼핑몰·미용실 지도(iframe)의 로그인을 앱이 대신 처리
// (2026-11-28) 쇼핑몰은 iframe 이라 애플 로그인 창을 직접 띄울 수 없음 → 앱이 네이티브 애플 로그인
//   쇼핑몰 → 앱  { type: "gyeol-auth-get" }              지금 토큰 주세요
//   쇼핑몰 → 앱  { type: "gyeol-login", provider: "apple" } 로그인 버튼
//   쇼핑몰 → 앱  { type: "gyeol-logout" }                로그아웃·탈퇴 → 토큰 버림
//   앱 → 쇼핑몰  { type: "gyeol-auth", token | null }  ·  { type: "gyeol-login-error", error }
// 토큰은 앱 저장소(Preferences = UserDefaults)에 보관. 서버: 쇼핑몰의 /api/customer/login
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var P = C.Plugins || {};
  var MK = 'https://tryon-marketplace-web.choisunfriend.workers.dev';
  var KEY = 'gyeol_customer_token';
  var TOKEN_RE = /^gy_[0-9a-f]{64}$/;

  function getToken() {
    if (P.Preferences) return P.Preferences.get({ key: KEY }).then(function (r) { return r && TOKEN_RE.test(r.value || '') ? r.value : null; });
    try { var v = localStorage.getItem(KEY); return Promise.resolve(TOKEN_RE.test(v || '') ? v : null); } catch (e) { return Promise.resolve(null); }
  }
  function setToken(t) {
    if (P.Preferences) return t ? P.Preferences.set({ key: KEY, value: t }) : P.Preferences.remove({ key: KEY });
    try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {}
    return Promise.resolve();
  }
  function reply(src, msg) { try { src.postMessage(msg, MK); } catch (e) {} }

  function randomHex(n) {
    var a = new Uint8Array(n); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function sha256Hex(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function lang() { return (document.documentElement.lang || navigator.language || 'en').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en'; }

  function loginApple(src) {
    if (!P.SignInWithApple) return reply(src, { type: 'gyeol-login-error', error: 'unsupported' });
    var raw = randomHex(16);
    sha256Hex(raw).then(function (hashed) {
      // 애플에는 해시를, 서버에는 원래 값을 보냄(서버가 둘 다 받아 줌)
      return P.SignInWithApple.authorize({ clientId: 'com.ylcompany.stylepeek', redirectURI: MK, scopes: 'email name', nonce: hashed });
    }).then(function (res) {
      var r = (res && res.response) || {};
      if (!r.identityToken) throw new Error('no token');
      var name = [r.givenName, r.familyName].filter(Boolean).join(' ');
      return getToken().then(function (old) {
        var h = { 'Content-Type': 'application/json', 'X-Gyeol-Lang': lang() };
        if (old) h.Authorization = 'Bearer ' + old;
        return fetch(MK + '/api/customer/login', {
          method: 'POST', headers: h,
          body: JSON.stringify({ provider: 'apple', idToken: r.identityToken, nonce: raw, name: name || undefined, platform: 'ios' })
        });
      });
    }).then(function (resp) {
      return resp.json().then(function (d) {
        if (!resp.ok || !d.success || !TOKEN_RE.test(d.token || '')) throw new Error(d.error || ('HTTP ' + resp.status));
        return setToken(d.token).then(function () { reply(src, { type: 'gyeol-auth', token: d.token }); });
      });
    }).catch(function (e) {
      var m = String(e && (e.message || e) || 'error');
      // 사용자가 창을 닫으면 애플이 1001(canceled) 오류를 줌
      reply(src, { type: 'gyeol-login-error', error: /1001|cancel/i.test(m) ? 'cancelled' : m.slice(0, 200) });
    });
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== MK || !e.source) return;
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'gyeol-auth-get') {
      getToken().then(function (t) { reply(e.source, { type: 'gyeol-auth', token: t }); });
    } else if (d.type === 'gyeol-login') {
      if (d.provider === 'apple') loginApple(e.source);
      else reply(e.source, { type: 'gyeol-login-error', error: 'unsupported' });
    } else if (d.type === 'gyeol-logout') {
      setToken(null);
    }
  });
})();
