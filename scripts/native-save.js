// native-save.js — 앱(iOS) 안에서만 동작. 웹의 <a download> 저장을 iOS 공유 시트로 바꿔 줌
// → 사용자가 "이미지 저장"을 누르면 내 사진 앱에 저장됨. 웹 브라우저에서는 아무것도 안 함.
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var P = C.Plugins || {};
  function toBase64(href) {
    if (href.indexOf('data:') === 0) return Promise.resolve(href.split(',')[1]);
    return fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (ok, no) {
        var fr = new FileReader();
        fr.onload = function () { ok(String(fr.result).split(',')[1]); };
        fr.onerror = no; fr.readAsDataURL(b);
      });
    });
  }
  function save(href, name) {
    name = (name || 'stylepeek-' + Date.now() + '.jpg').replace(/[^\w.\-]/g, '_');
    return toBase64(href)
      .then(function (data) { return P.Filesystem.writeFile({ path: name, data: data, directory: 'CACHE' }); })
      .then(function (res) { return P.Share.share({ files: [res.uri] }); })
      .catch(function (e) { if (!/cancel/i.test(String(e && e.message))) console.warn('[저장]', e); });
  }
  // 코드에서 a.click()으로 저장하는 경우
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute('download') && this.href) { save(this.href, this.getAttribute('download')); return; }
    return origClick.apply(this, arguments);
  };
  // 사용자가 저장 링크를 직접 누르는 경우
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[download]');
    if (!a || !a.href) return;
    e.preventDefault(); save(a.href, a.getAttribute('download'));
  }, true);
})();
