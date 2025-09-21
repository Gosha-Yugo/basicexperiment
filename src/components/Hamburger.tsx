// src/components/Hamburger.tsx
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type MenuItem = { href: string; label: string };

const menu: MenuItem[] = [
  { href: "/", label: "ホーム" },
  { href: "/today", label: "本日" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/settings", label: "設定" },
  { href: "/signin", label: "サインイン" },
  { href: "/login", label: "ログイン" },
];

export default function Hamburger() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="hambox">
      <button
        ref={btnRef}
        className="hambtn"
        aria-label="メニューを開く"
        aria-expanded={open}
        aria-controls="hamburger-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {/* シンプルな3本線アイコン（CSSで描画） */}
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      {open && (
        <div id="hamburger-menu" ref={panelRef} className="hambox-panel" role="menu">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="hamlink"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {m.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
