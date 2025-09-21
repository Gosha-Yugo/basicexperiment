// src/pages/index.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { PlanDoc, SelfReportDoc, ForgotFlag } from "../lib/types";
import { useUser } from "../contexts/UserContext";
import Link from "next/link";

import dynamic from "next/dynamic";
const Hamburger = dynamic(() => import("../components/Hamburger"), { ssr: false });
const Toast = dynamic(() => import("../components/Toast"), { ssr: false });

export default function DailySummary() {
  const { uid } = useUser();
  const todayKey = dayjs().format("YYYY-MM-DD");
  const [targetKey, setTargetKey] = useState(dayjs().add(1, "day").format("YYYY-MM-DD"));

  // 前日登録（デフォルト）
  const defaultPlan = () => ({
    departures: [""], // 最低1
    items: [""], // 最低1
    allocation: "B" as "A" | "B" | "C",
  });

  // 自己申告（デフォルト）
  const defaultSelf = () => ({
    forgot: "無" as ForgotFlag,
    burden: 1 as number | null,
    note: "",
  });

  const [departures, setDepartures] = useState<string[]>(defaultPlan().departures);
  const [items, setItems] = useState<string[]>(defaultPlan().items);
  const [allocation, setAllocation] = useState<"A" | "B" | "C">(defaultPlan().allocation);

  const [forgot, setForgot] = useState<ForgotFlag>(defaultSelf().forgot);
  const [burden, setBurden] = useState<number | null>(defaultSelf().burden);
  const [note, setNote] = useState(defaultSelf().note);

  const [toast, setToast] = useState<{ text: string; type?: "ok" | "err" } | null>(null);
  const [loading, setLoading] = useState(false);

  // 初期ロード
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const plan = await getDoc(doc(db, "plans", `${uid}_${targetKey}`));
        if (plan.exists()) {
          const p = plan.data() as PlanDoc;
          setDepartures(p.departures?.length ? p.departures : defaultPlan().departures);
          setItems(p.items?.length ? p.items : defaultPlan().items);
          setAllocation(p.allocation ?? defaultPlan().allocation);
        } else {
          const d = defaultPlan();
          setDepartures(d.departures);
          setItems(d.items);
          setAllocation(d.allocation);
        }

        const self = await getDoc(doc(db, "selfReports", `${uid}_${todayKey}`));
        if (self.exists()) {
          const s = self.data() as SelfReportDoc;
          setForgot(s.forgot ?? defaultSelf().forgot);
          setBurden((s.burden ?? defaultSelf().burden) as number | null);
          setNote(s.note || defaultSelf().note);
        } else {
          const d = defaultSelf();
          setForgot(d.forgot);
          setBurden(d.burden);
          setNote(d.note);
        }
      } catch (e) {
        console.error(e);
        setToast({ text: "読み込みに失敗しました", type: "err" });
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, targetKey, todayKey]);

  // 追加・削除ハンドラ（出発時刻）
  const addDeparture = () => {
    if (departures.length >= 2) return;
    setDepartures([...departures, ""]);
  };
  const removeDeparture = (i: number) => {
    if (departures.length <= 1) return; // 最低1
    setDepartures(departures.filter((_, idx) => idx !== i));
  };
  const setDepartureAt = (i: number, v: string) => {
    const a = [...departures];
    a[i] = v;
    setDepartures(a);
  };

  // 追加・削除ハンドラ（持ち物）
  const addItem = () => {
    if (items.length >= 5) return;
    setItems([...items, ""]);
  };
  const removeItem = (i: number) => {
    if (items.length <= 1) return; // 最低1
    setItems(items.filter((_, idx) => idx !== i));
  };
  const setItemAt = (i: number, v: string) => {
    const a = [...items];
    a[i] = v;
    setItems(a);
  };

  // バリデーション
  const canSavePlan = useMemo(() => {
    const nItems = items.map((s) => s.trim()).filter(Boolean).length;
    const nDeps = departures.map((s) => s.trim()).filter(Boolean).length;
    return nItems >= 1 && nDeps >= 1;
  }, [items, departures]);

  // 保存後はフォームをリセット
  const resetSelfForm = () => {
    const d = defaultSelf();
    setForgot(d.forgot);
    setBurden(d.burden);
    setNote(d.note);
  };
  const resetPlanForm = () => {
    const d = defaultPlan();
    // 日付はそのまま残す
    setDepartures(d.departures);
    setItems(d.items);
    setAllocation(d.allocation);
  };

  // 保存
  const saveSelf = async () => {
    try {
      const ref = doc(db, "selfReports", `${uid}_${todayKey}`);
      const payload: Partial<SelfReportDoc> = {
        uid: uid || undefined,
        dateKey: todayKey,
        forgot,
        burden,
        note,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload, { merge: true });
      resetSelfForm();
      setToast({ text: "自己申告を保存しました" });
    } catch (e) {
      console.error(e);
      setToast({ text: "自己申告の保存に失敗しました", type: "err" });
    }
  };

  const savePlan = async () => {
    if (!canSavePlan) {
      setToast({ text: "出発時刻と持ち物を最低1件ずつ入力してください", type: "err" });
      return;
    }
    try {
      const dateTs = Timestamp.fromDate(new Date(`${targetKey}T00:00:00`));
      const ref = doc(db, "plans", `${uid}_${targetKey}`);
      const payload: Partial<PlanDoc> = {
        uid: uid || undefined,
        dateKey: targetKey,
        departures: departures
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 2),
        items: items
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 5),
        allocation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, { ...payload, dateTs }, { merge: true });
      resetPlanForm();
      setToast({ text: "翌日の予定を保存しました" });
    } catch (e) {
      console.error(e);
      setToast({ text: "翌日の予定の保存に失敗しました", type: "err" });
    }
  };

  const saveBoth = async () => {
    await saveSelf();
    await savePlan();
  };

  // uid 未選択の間は何も描画しない（/signin or /login が表示されている想定）
  if (!uid) return null;

  return (
    <main className="container">
       <Hamburger />
         <div className="pair-nav">
         
        </div>

      <h1>日次まとめ</h1>

      <section className="card">
        <h2>本日の自己申告（{todayKey}）</h2>
        <div className="row">
          <div>
            <label>忘れ物有無</label>
            <select value={forgot} onChange={(e) => setForgot(e.target.value as ForgotFlag)}>
              <option value="無">無</option>
              <option value="有">有</option>
              <option value="未確定">未確定</option>
            </select>
          </div>
          <div>
            <label>負担感（1〜5）</label>
            <input
              type="number"
              min={1}
              max={5}
              value={burden ?? ""}
              onChange={(e) => setBurden(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>備考</label>
          <input
            type="text"
            placeholder="任意"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button onClick={saveSelf}>自己申告を保存</button>
        </div>
      </section>

      <section className="card">
        <h2>前日登録（対象日）</h2>
        <div className="row">
          <div>
            <label>日付</label>
            <input type="date" value={targetKey} onChange={(e) => setTargetKey(e.target.value)} />
          </div>
          <div>
            <label>割付パターン</label>
            <select value={allocation} onChange={(e) => setAllocation(e.target.value as any)}>
              <option value="A">A（60/30/15）</option>
              <option value="B">B（45/20/10）</option>
              <option value="C">C（30/15）</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>出発時刻（最大2件）</label>
          {departures.map((v, i) => (
            <div key={i} className="row-inline" style={{ marginTop: 8 }}>
              <input
                type="time"
                value={v || ""}
                onChange={(e) => setDepartureAt(i, e.target.value)}
              />
              <button
                className="iconbtn"
                onClick={() => removeDeparture(i)}
                disabled={departures.length <= 1}
              >
                −
              </button>
              {i === departures.length - 1 && departures.length < 2 && (
                <button className="ghost" onClick={addDeparture}>
                  追加
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <label>持ち物（最大5件）</label>
          {items.map((v, i) => (
            <div key={i} className="row-inline" style={{ marginTop: 8 }}>
              <input type="text" value={v} onChange={(e) => setItemAt(i, e.target.value)} />
              <button
                className="iconbtn"
                onClick={() => removeItem(i)}
                disabled={items.length <= 1}
              >
                −
              </button>
              {i === items.length - 1 && items.length < 5 && (
                <button className="ghost" onClick={addItem}>
                  追加
                </button>
              )}
            </div>
          ))}
          <div className="helper">最低1件は必須です。</div>
        </div>

        <hr className="sep" />
        <div className="helper">推奨利用時間帯: 18:00〜翌0:30（強制ではありません）</div>
        <div className="toolbar" style={{ marginTop: 10 }}>
          <button onClick={savePlan} disabled={!canSavePlan}>
            翌日の予定を保存
          </button>
          <button onClick={saveBoth}>両方保存</button>
        </div>
      </section>

      {loading && <span className="badge">読込中</span>}
      {toast && <Toast text={toast.text} type={toast.type} onDone={() => setToast(null)} />}
    </main>
  );
}
