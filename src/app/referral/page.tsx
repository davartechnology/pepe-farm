"use client";

import { useEffect, useState } from "react";

interface ReferralData {
  telegramId: string;
  counts: { level1: number; level2: number; level3: number };
  earnings: { level1: number; level2: number; level3: number; total: number };
  percents: { level1: number; level2: number; level3: number };
  directReferrals: { id: string; username?: string; firstName?: string; createdAt: string }[];
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "pepefarm_bot";

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) { setLoading(false); return; }
    tg.ready();
    fetch("/api/user/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const inviteLink = data ? `https://t.me/${botUsername}?start=${data.telegramId}` : "";

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    const tg = (window as any).Telegram?.WebApp;
    const text = "🌾 Rejoins PEPE FARM et récolte des PEPE gratuitement !";
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    tg ? tg.openTelegramLink(url) : window.open(url, "_blank");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1A1400] flex items-center justify-center pb-20">
        <p className="text-yellow-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1A1400] text-white px-4 pt-6 pb-24">
      <h1 className="text-2xl font-black mb-1" style={{ color: "#FFD700" }}>👥 Parrainage</h1>
      <p className="text-yellow-700 text-sm mb-5">Invite des amis et gagne en passif</p>

      {/* Total commissions */}
      <div className="rounded-2xl p-4 mb-4 text-center"
        style={{ background: "linear-gradient(135deg, #2A2000, #3D2E00)", border: "1px solid #B8860B" }}>
        <p className="text-yellow-600 text-xs uppercase tracking-widest mb-1">Total gagné</p>
        <p className="text-3xl font-black" style={{ color: "#FFD700" }}>
          {data?.earnings.total.toFixed(2)}
        </p>
        <p className="text-yellow-500 font-bold">PEPE</p>
      </div>

      {/* Lien de parrainage */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#2A2000", border: "1px solid #3D2E00" }}>
        <p className="text-yellow-600 text-xs uppercase tracking-widest mb-2">Ton lien</p>
        <p className="text-xs text-yellow-300 break-all bg-black/40 rounded-lg p-2 mb-3 font-mono">
          {inviteLink || "Chargement..."}
        </p>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 py-2 rounded-lg text-sm font-bold"
            style={{ background: "#3D2E00", color: "#FFD700", border: "1px solid #B8860B" }}>
            {copied ? "✅ Copié" : "📋 Copier"}
          </button>
          <button onClick={shareLink} className="flex-1 py-2 rounded-lg text-sm font-black"
            style={{ background: "linear-gradient(135deg, #FFD700, #B8860B)", color: "#1A1400" }}>
            📤 Partager
          </button>
        </div>
      </div>

      {/* Niveaux */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { level: "1", count: data?.counts.level1, pct: data?.percents.level1, earn: data?.earnings.level1 },
          { level: "2", count: data?.counts.level2, pct: data?.percents.level2, earn: data?.earnings.level2 },
          { level: "3", count: data?.counts.level3, pct: data?.percents.level3, earn: data?.earnings.level3 },
        ].map((l) => (
          <div key={l.level} className="rounded-xl p-3 text-center"
            style={{ background: "#2A2000", border: "1px solid #3D2E00" }}>
            <p className="text-yellow-600 text-xs mb-1">Niv. {l.level}</p>
            <p className="text-2xl font-black" style={{ color: "#FFD700" }}>{l.count ?? 0}</p>
            <p className="text-yellow-600 text-xs">{l.pct ?? 0}%</p>
            <p className="text-yellow-400 text-xs mt-1 font-bold">{l.earn?.toFixed(1) ?? "0.0"} PEPE</p>
          </div>
        ))}
      </div>

      {/* Filleuls directs */}
      <p className="text-yellow-600 text-xs uppercase tracking-widest mb-2">Filleuls directs</p>
      {!data?.directReferrals.length ? (
        <p className="text-yellow-800 text-center py-6 text-sm">
          Aucun filleul pour l'instant. Partage ton lien !
        </p>
      ) : (
        <div className="space-y-2">
          {data.directReferrals.map((r) => (
            <div key={r.id} className="rounded-xl p-3 text-sm font-medium"
              style={{ background: "#2A2000", color: "#FFD700" }}>
              🌾 {r.firstName || r.username || "Utilisateur"}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}