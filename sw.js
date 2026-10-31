// インターネットなしでも動かすためのしくみ（サービスワーカー）
// ・インターネットにつながっているときは、いつも最新のファイルを取りに行く（古い画面と新しいプログラムが混ざらないように）
// ・つながっていないときだけ、保存しておいたファイルを使う
// アプリのファイルを変更したら、CACHE_NAME の数字を1つ上げると保存も新しい版に入れ替わる
var CACHE_NAME = 'sansu-app-v3';
var FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/items.js',
  './js/problems.js',
  './js/kanji.js',
  './js/kanji-strokes.js',
  './js/kokugo.js',
  './js/storage.js',
  './js/avatar.js',
  './js/trace.js',
  './js/app.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // ブラウザに一時的に残っている古いファイルではなく、必ずサーバーから取り直す
      return cache.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; })
        .map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req.url, { cache: 'no-cache' }).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true });
    })
  );
});
