import type { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v || v.trim() === '') throw new Error(`ENV ${name} is missing`);
  return v;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    webpush.setVapidDetails(
      mustEnv('VAPID_MAILTO'),
      mustEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
      mustEnv('VAPID_PRIVATE_KEY')
    );

    const uid = (req.query.uid as string) || req.body?.uid;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const snap = await getDoc(doc(db, 'users', uid, 'webpush', 'subscription'));
    if (!snap.exists()) return res.status(404).json({ error: 'subscription not found' });

    const subscription = snap.data();

    const payload = JSON.stringify({
      title: 'テスト通知',
      body: 'iOS PWAからのWeb Push動作確認です 🎉',
      clickUrl: '/' // クリック時に開くURL
    });

    await webpush.sendNotification(subscription as any, payload);
    res.status(200).json({ ok: true });
  } catch (e:any) {
    // よくあるエラー：410 Gone → 古いsub。消して再購読が必要。
    res.status(500).json({ error: e?.message || 'send error' });
  }
}
