/**
 * Fang 主题 Service Worker
 * 提供基础缓存策略：网络优先 + 缓存回退
 */
'use strict';

var CACHE_NAME = 'fang-blog-v1';
var RUNTIME_CACHE = 'fang-runtime-v1';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(['/', '/manifest.json']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME && name !== RUNTIME_CACHE; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 缓存成功的请求
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(RUNTIME_CACHE).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // 网络失败时使用缓存
        return caches.match(event.request);
      })
  );
});
