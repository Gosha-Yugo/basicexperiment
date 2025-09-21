// src/pages/api/push/unsubscribe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { uid } = req.body || {};
  if (!uid) return res.status(400).json({ error: 'uid missing' });
  await deleteDoc(doc(db, 'pushSubs', uid)).catch(() => {});
  res.status(200).json({ ok: true });
}
