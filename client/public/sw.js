// 티끌모아 태산 - Service Worker
const CACHE_NAME = 'tikkle-taesan-v1';
const OFFLINE_URL = '/';

// 캐시할 정적 자산
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// 설치 이벤트 — 정적 자산 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 — 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트 — 네트워크 우선, 실패 시 캐시 반환
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/')) {
    return;
  }

  // GET 요청만 캐싱
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 시 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인 시 캐시에서 반환
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // HTML 요청이면 메인 페이지 반환
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || '티끌모아 태산';
  const options = {
    body: data.body || '포트폴리오 알림이 있습니다.',
    icon: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663037673521/TNgU9ndkzcn3xBu5JAHWWW/pwa-icon-512-V7ZUwTBGmuRrSbGcgjtrw2.png',
    badge: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663037673521/TNgU9ndkzcn3xBu5JAHWWW/pwa-icon-512-V7ZUwTBGmuRrSbGcgjtrw2.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'open', title: '확인하기' },
      { action: 'close', title: '닫기' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
