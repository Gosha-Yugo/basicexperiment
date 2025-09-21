importScripts("https://www.gstatic.com/firebasejs/8.8.0/firebase-app.js");

importScripts("https://www.gstatic.com/firebasejs/8.8.0/firebase-messaging.js");
const firebaseConfig = {
  apiKey: "*****",
  authDomain: "*****",
  projectId: "*****",
  storageBucket: "*****",
  messagingSenderId: "*****",
  appId: "*****",
  measurementId: "*****",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "./logo.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
