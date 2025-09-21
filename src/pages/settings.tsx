// src/pages/settings.tsx
import { useUser } from '../contexts/UserContext';
import dynamic from "next/dynamic";
const Hamburger = dynamic(() => import("../components/Hamburger"), { ssr: false });
function toU8(base64url: string) {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function Settings() {
  const { uid } = useUser();

  const registerPush = async () => {
    if (!uid) { alert('ユーザー未選択'); return; }
    if (!('serviceWorker' in navigator)) { alert('Service Worker未対応'); return; }

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { alert('通知が許可されていません'); return; }

    const reg = await navigator.serviceWorker.ready;
    // 既存購読があれば一度解除してから再購読（鍵更新時の不整合対策）
    const old = await reg.pushManager.getSubscription();
    if (old) await old.unsubscribe();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toU8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
    });

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, subscription: sub })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.error(j);
      alert('サブスク保存に失敗しました');
      return;
    }
    alert('通知の購読を登録しました');
  };

  const unregisterPush = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    // サーバ側の保存を消す場合は以下のAPIも実装して呼ぶ
    await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ uid }) });
    alert('通知の購読を解除しました');
  };

  const testPush = async () => {
    if (!uid) return;
    const res = await fetch(`/api/push/test?uid=${encodeURIComponent(uid)}`);
    const j = await res.json();
    if (!res.ok) { alert(JSON.stringify(j)); return; }
    alert('テスト送信しました。通知を確認してください。');
  };

  return (
    <main className="container">
      <Hamburger />
    
      <h1>設定</h1>
      <div className="toolbar" style={{ gap: 8 }}>
        <button onClick={registerPush}>通知を許可して登録</button>
        <button className="ghost" onClick={unregisterPush}>購読解除</button>
        <button onClick={testPush}>テスト通知を送る</button>
      </div>
    </main>
  );
}
