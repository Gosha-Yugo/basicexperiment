importScripts("https://www.gstatic.com/firebasejs/8.8.0/firebase-app.js");

importScripts("https://www.gstatic.com/firebasejs/8.8.0/firebase-messaging.js");
const firebaseConfig = {
  apiKey: "AIzaSyA3-z2vq4NrbyX_4hMWiUWlTtQ1MkEp0d4",
  authDomain: "bssicexperiment.firebaseapp.com",
  projectId: "bssicexperiment.firebaseapp.com",
  storageBucket: "bssicexperiment.firebasestorage.app",
  messagingSenderId: "180397220672",
  appId: "1:180397220672:web:43c2d42bcc0e6e85f6d0a5",
  measurementId: "G-49Z0JD3TJJ",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
