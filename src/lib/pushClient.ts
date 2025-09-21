export async function ensureSwRegistered() {
  if (!('serviceWorker' in navigator)) throw new Error('SW unsupported');
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function subscribePush(uid: string) {
  if (!('Notification' in window)) throw new Error('Notification unsupported');
  // iOS: A2HS & standalone確認（インストール前は弾く）
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || (navigator as any).standalone === true;
  if (!standalone) throw new Error('ホーム画面に追加後に有効化してください');

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('通知が許可されませんでした');

  const reg = await ensureSwRegistered();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string)
  });

  // サーバへ保存
  const res = await fetch('/api/push/save-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, subscription: sub })
  });
  if (!res.ok) throw new Error('サブスクリプション保存に失敗');
  return sub;
}
