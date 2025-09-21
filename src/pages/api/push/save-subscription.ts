import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { uid, subscription } = req.body || {};
    if (!uid || !subscription) return res.status(400).json({ error: 'uid and subscription required' });

    await setDoc(doc(db, 'users', uid, 'webpush', 'subscription'), subscription, { merge: true });
    res.status(200).json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ error: e?.message || 'error' });
  }
}
