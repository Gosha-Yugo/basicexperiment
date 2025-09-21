'use client';
import { useEffect, useState } from 'react';
import { subscribePush } from '@/lib/pushClient';

export default function EnablePush({ uid }: { uid: string }) {
  const [standalone, setStandalone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true;
    setStandalone(!!isStandalone);
  }, []);

  const onEnable = async () => {
    setMsg(null);
    try {
      await subscribePush(uid);
      setMsg('通知を有効化しました（テスト送信で確認できます）');
    } catch (e:any) {
      setMsg(e?.message || '有効化に失敗しました');
    }
  };

  return (
    <div className="p-4 rounded-xl border">
      {!standalone ? (
        <div>
          <p className="mb-2">まず「ホーム画面に追加」してから、再度この画面を開いてください（iOSの仕様）。</p>
          <p className="text-sm text-gray-500">Safariの共有ボタン → 「ホーム画面に追加」</p>
        </div>
      ) : (
        <button onClick={onEnable} className="px-4 py-2 rounded-lg bg-sky-500 text-white">
          通知を有効化する
        </button>
      )}
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}
