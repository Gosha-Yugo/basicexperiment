/// <reference types="minimatch" />

import { messaging } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();
const db = getFirestore();

type PlanDoc = {
  uid: string;
  dateKey: string; // 'YYYY-MM-DD'
  dateTs?: Timestamp; // その日の 00:00
  departures: string[]; // 'HH:mm' 1～2
  items: string[]; // 1～5
  allocation: "A" | "B" | "C";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type UserDoc = {
  displayName: string;
  fcmToken: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const formatMinutesToHHmm = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = h < 10 ? `0${h}` : `${h}`;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${hh}:${mm}`;
};

// 予定が立てられたら通知ドキュメントを追加
export const addNotificationDoc = onDocumentCreated("plans/{planId}", async (event) => {
  if (event.data === undefined) return;

  const data = event.data.data() as PlanDoc;
  const user = (await db.collection("users").doc(data.uid).get()).data() as UserDoc;
  const notification = {
    title: "持ち物をチェックしてください",
    body: data.items.join("、"),
    token: user.fcmToken,
    time: "",
  };
  const notifications: (typeof notification)[] = [];
  const minutes =
    Number(data.departures[0].split(":")[0]) * 60 + Number(data.departures[0].split(":")[1]);

  if (data.allocation === "A") {
    notifications.push({ ...notification, time: formatMinutesToHHmm(minutes - 30) });
    notifications.push({ ...notification, time: formatMinutesToHHmm(minutes - 20) });
    notifications.push({ ...notification, time: formatMinutesToHHmm(minutes - 10) });
  }
  if (data.allocation === "B") {
    notifications.push({ ...notification, time: formatMinutesToHHmm(minutes - 20) });
    notifications.push({ ...notification, time: formatMinutesToHHmm(minutes - 10) });
  }
  if (data.allocation === "C") {
    notifications.push({ ...notification, time: formatMinutesToHHmm(minutes - 10) });
  }

  for (const n of notifications) {
    await db.collection("notifications").add(n);
  }
});

// 1分毎に通知ドキュメントをチェックして、あればFCM送信＆ドキュメント削除
export const checkNotification = onSchedule("every 1 minutes", async (context) => {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24時間表記
  });

  const japanTime = formatter.format(now);

  const snapshot = await db.collection("notifications").where("time", "==", japanTime).get();

  if (snapshot.empty) {
    console.log("No matching documents.");
    return;
  }

  snapshot.forEach(async (doc) => {
    const data = doc.data() as {
      title: string;
      body: string;
      token: string;
      time: string;
    };
    console.log(data);

    // FCM送信
    messaging().send({
      token: data.token,
      notification: {
        title: data.title,
        body: data.body,
      },
    });

    // 通知ドキュメント削除
    await db.collection("notifications").doc(doc.id).delete();
  });
});
