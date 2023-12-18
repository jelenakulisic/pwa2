const CACHE_NAME = 'travel-journal-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/offline.html',
  '/world.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
      caches
          .match(event.request)
          .then((response) => {
              if (response) {
                  // console.log("Found " + event.request.url + " in cache!");
                  //return response;
              }
              // console.log("----------------->> Network request for ",
              //     event.request.url
              // );
              return fetch(event.request).then((response) => {
                  // console.log("response.status = " + response.status);
                  if (response.status === 404) {
                      return caches.match("404.html");
                  }
                  return caches.open(CACHE_NAME).then((cache) => {
                      // console.log(">>> Caching: " + event.request.url);
                      cache.put(event.request.url, response.clone());
                      return response;
                  });
              });
          })
          .catch((error) => {
              console.log("Error", event.request.url, error);
              // ovdje možemo pregledati header od zahtjeva i možda vratiti različite fallback sadržaje
              // za različite zahtjeve - npr. ako je zahtjev za slikom možemo vratiti fallback sliku iz cachea
              // ali zasad, za sve vraćamo samo offline.html:
              return caches.match("offline.html");
          })
  );
});
