// Service Worker для игры UNO
const CACHE_NAME = 'uno-game-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('[SW] Установка Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('[SW] Активация Service Worker');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированный ответ или делаем сетевой запрос
        if (response) {
          console.log('[SW] Загрузка из кэша:', event.request.url);
          return response;
        }
        
        console.log('[SW] Сетевой запрос:', event.request.url);
        return fetch(event.request).then(function(response) {
          // Проверяем корректность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Клонируем ответ для кэширования
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(function() {
          // Возвращаем базовую страницу при отсутствии сети
          return caches.match('./index.html');
        });
      }
    )
  );
});

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', function(event) {
  console.log('[SW] Push уведомление получено');
  
  const options = {
    body: 'Пора сыграть в UNO!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Игра UNO', options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Клик по уведомлению');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
}); 