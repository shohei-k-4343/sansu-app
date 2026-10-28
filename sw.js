// インターネットなしでも動かすためのしくみ（サービスワーカー）
// アプリのファイルを変更したら、CACHE_NAME の数字を1つ上げると新しい版に入れ替わる
var CACHE_NAME = 'sansu-app-v1';
var FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/items.js',
  './js/problems.js',
  './js/storage.js',
  './js/avatar.js',
  './js/app.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(FILES); })
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

// 保存してあるファイルを先に使い、なければインターネットから取る
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
