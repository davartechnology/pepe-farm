"use client";

import { useEffect, useState } from "react";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [minWithdrawal] = useState(200);
  const [email, setEmail] = useState("");
  const [initData, setInitData] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) { setLoading(false); return; }
    tg.ready();
    setInitData(tg.initData);
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setBalance(data.user.balance);
          if (data.user.faucetpayEmail) setEmail(data.user.faucetpayEmail);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw() {
    if (!email) {
      setMessage({ type: "error", text: "Renseigne ton email FaucetPay" });
      return;
    }
    if (balance < minWithdrawal) {
      setMessage({ type: "error", text: `Minimum : ${minWithdrawal} PEPE` });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, faucetpayEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur" });
        return;
      }
      setMessage({ type: "success", text: `✅ ${data.amount} PEPE envoyés sur FaucetPay !` });
      setBalance(0);
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1A1400] flex items-center justify-center pb-20">
        <p className="text-yellow-400">Chargement.....</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1A1400] text-white px-4 pt-6 pb-24">
      <h1 className="text-2xl font-black mb-1" style={{ color: "#FFD700" }}>💸 Retrait</h1>
      <p className="text-yellow-700 text-sm mb-5">Encaisse tes PEPE sur FaucetPay</p>

      {/* Carte solde */}
      <div className="rounded-2xl p-5 mb-5 text-center"
        style={{ background: "linear-gradient(135deg, #2A2000, #3D2E00)", border: "1px solid #B8860B" }}>
        <p className="text-yellow-600 text-xs uppercase tracking-widest mb-1">Solde disponible</p>
        <p className="text-4xl font-black" style={{ color: "#FFD700" }}>{balance.toLocaleString()}</p>
        <p className="text-yellow-500 font-bold">PEPE</p>
        <p className="text-yellow-800 text-xs mt-2">Minimum : {minWithdrawal} PEPE</p>
      </div>

      {/* Champ email */}
      <label className="text-yellow-600 text-xs uppercase tracking-widest block mb-2">
        Email ou adresse FaucetPay
      </label>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton-email@exemple.com"
        className="w-full rounded-xl px-4 py-3 mb-4 text-white text-sm"
        style={{ background: "#2A2000", border: "1px solid #3D2E00", outline: "none" }}
      />

      {/* Bouton retrait */}
      <button
        onClick={handleWithdraw}
        disabled={submitting || balance < minWithdrawal}
        className="w-full py-4 rounded-2xl font-black text-lg transition-all mb-4"
        style={{
          background: submitting || balance < minWithdrawal
            ? "#2A2000"
            : "linear-gradient(135deg, #FFD700, #B8860B)",
          color: submitting || balance < minWithdrawal ? "#4A3800" : "#1A1400",
          border: submitting || balance < minWithdrawal ? "1px solid #3D2E00" : "none",
        }}
      >
        {submitting ? "Envoi en cours..." : "💸 Retirer maintenant"}
      </button>

      {message && (
        <p className={`text-sm text-center font-medium mb-4 ${
          message.type === "success" ? "text-yellow-400" : "text-red-400"
        }`}>
          {message.text}
        </p>
      )}
    </main>
  );
}