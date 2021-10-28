const version = 7;

self.addEventListener('install', () => {
    console.log(`Installation du service worker v${version}`);
    return self.skipWaiting();
});

self.addEventListener('activate', () => console.log(`Activation du service worker v${version}`));

self.addEventListener('push', event => {
    const dataJSON = event.data.json();
    console.log(dataJSON)
    const notificationOptions = {
        body: dataJSON.body,
        data: {
            url: dataJSON.url,
        }
    };

    return self.registration.showNotification(dataJSON.title, notificationOptions);
});

self.addEventListener('notificationclick', event => {
    const url = event.notification.data.url;
    event.notification.close();
    event.waitUntil(clients.openWindow(url));
});
