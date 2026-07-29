"use client";

import { useEffect, useState } from "react";

interface Claim { id: string; amount: number; createdAt: string; }
interface Withdrawal { id: string; amount: number; status: string; createdAt: string; }
interface Commission { id: string; amount: number; level: number; createdAt: string; }

export default function HistoryPage() {
  const [tab, setTab] = useState<"claims" | "withdrawals" | "commissions">("claims");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) { setLoading(false); return; }
    tg.ready();
    fetch("/api/user/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims || []);
        setWithdrawals(data.withdrawals || []);
        setCommissions(data.commissions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  function formatDate(d: string) {
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const statusLabel: Record<string, string> = {
    PENDING: "⏳ En attente", COMPLETED: "✅ Complété", FAILED: "❌ Échoué", REJECTED: "🚫 Rejeté",
  };

  const tabs = [
    { key: "claims", label: "🌾 Récoltes" },
    { key: "withdrawals", label: "💸 Retraits" },
    { key: "commissions", label: "👥 Commissions" },
  ];

  return (
    <main className="min-h-screen bg-[#1A1400] text-white px-4 pt-6 pb-24">
      <h1 className="text-2xl font-black mb-1" style={{ color: "#FFD700" }}>📜 Historique</h1>
      <p className="text-yellow-700 text-sm mb-5">Toutes tes activités</p>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t.key ? "linear-gradient(135deg, #FFD700, #B8860B)" : "#2A2000",
              color: tab === t.key ? "#1A1400" : "#B8860B",
              border: tab === t.key ? "none" : "1px solid #3D2E00",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-yellow-600 text-center mt-8">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {tab === "claims" && (
            claims.length === 0
              ? <p className="text-yellow-800 text-center mt-8">Aucune récolte encore</p>
              : claims.map((c) => (
                <div key={c.id} className="rounded-xl p-3 flex justify-between items-center"
                  style={{ background: "#2A2000", border: "1px solid #3D2E00" }}>
                  <span className="text-xs text-yellow-700">{formatDate(c.createdAt)}</span>
                  <span className="font-black text-sm" style={{ color: "#FFD700" }}>+{c.amount} PEPE</span>
                </div>
              ))
          )}
          {tab === "withdrawals" && (
            withdrawals.length === 0
              ? <p className="text-yellow-800 text-center mt-8">Aucun retrait encore</p>
              : withdrawals.map((w) => (
                <div key={w.id} className="rounded-xl p-3 flex justify-between items-center"
                  style={{ background: "#2A2000", border: "1px solid #3D2E00" }}>
                  <div>
                    <p className="text-xs text-yellow-700">{formatDate(w.createdAt)}</p>
                    <p className="text-xs text-yellow-800">{statusLabel[w.status]}</p>
                  </div>
                  <span className="font-black text-sm" style={{ color: "#FFD700" }}>-{w.amount} PEPE</span>
                </div>
              ))
          )}
          {tab === "commissions" && (
            commissions.length === 0
              ? <p className="text-yellow-800 text-center mt-8">Aucune commission encore</p>
              : commissions.map((c) => (
                <div key={c.id} className="rounded-xl p-3 flex justify-between items-center"
                  style={{ background: "#2A2000", border: "1px solid #3D2E00" }}>
                  <div>
                    <p className="text-xs text-yellow-700">{formatDate(c.createdAt)}</p>
                    <p className="text-xs text-yellow-800">Niveau {c.level}</p>
                  </div>
                  <span className="font-black text-sm" style={{ color: "#FFD700" }}>+{c.amount.toFixed(2)} PEPE</span>
                </div>
              ))
          )}
        </div>
      )}
    </main>
  );
}