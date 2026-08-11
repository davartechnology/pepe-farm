"use client";

import { useEffect, useState, useCallback } from "react";

interface UserData {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  balance: number;
  totalMined: number;
  lastClaimAt: string | null;
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [initData, setInitData] = useState<string>("");

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
      const startParamOfficial = tg.initDataUnsafe?.start_param;
      const urlParams = new URLSearchParams(window.location.search);
      const startParamFromUrl = urlParams.get("startapp") || urlParams.get("tgWebAppStartParam");
      const referralCode = startParamOfficial || startParamFromUrl || undefined;
      authenticate(tg.initData, referralCode);
    } else {
      setMessage({ text: "⚠️ Ouvre cette application depuis Telegram", type: "error" });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const interval = setInterval(() => {
      setCooldownMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  async function authenticate(initDataStr: string, referralCode?: string) {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: initDataStr, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Erreur d'authentification", type: "error" });
        setLoading(false);
        return;
      }
      setUser(data.user);
      setCooldownMs(data.remainingCooldownMs || 0);
    } catch {
      setMessage({ text: "Erreur de connexion au serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Appelé uniquement quand AdsGram confirme que la pub a été vue en entier
  const processClaim = useCallback(async () => {
    if (!initData) return;
    setClaiming(true);
    setMessage(null);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.remainingMs) setCooldownMs(data.remainingMs);
        setMessage({ text: data.error || "Erreur lors de la réclamation", type: "error" });
        return;
      }

      setUser((prev) => prev ? { ...prev, balance: data.newBalance } : prev);
      const nextClaimMs = data.nextClaimAt
        ? Math.max(0, new Date(data.nextClaimAt).getTime() - Date.now())
        : 60 * 60 * 1000;
      setCooldownMs(nextClaimMs);
      setMessage({ text: `✅ +${data.claimedAmount} PEPE récoltés !`, type: "success" });
    } catch {
      setMessage({ text: "Erreur réseau, réessaie", type: "error" });
    } finally {
      setClaiming(false);
    }
  }, [initData]);

  const handleClaimButton = useCallback(() => {
    if (!initData || claiming || cooldownMs > 0) return;
    setClaiming(true);
    setMessage(null);

    const showGiga = (window as any).showGiga;
    if (typeof showGiga !== "function") {
      // Script pas encore chargé => traité comme un échec, jamais un succès silencieux
      setClaiming(false);
      setMessage({ text: "⚠️ Regarde la publicité en entier pour récolter tes PEPE", type: "error" });
      return;
    }

    showGiga()
      .then(() => {
        // Pub vue en entier -> on peut créditer
        processClaim();
      })
      .catch(() => {
        // Refus / pas de pub / erreur -> aucun claim
        setClaiming(false);
        setMessage({ text: "⚠️ Regarde la publicité en entier pour récolter tes PEPE", type: "error" });
      });
  }, [initData, claiming, cooldownMs, processClaim]);

  function formatCooldown(ms: number) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1A1400]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌾</div>
          <p className="text-yellow-400 font-medium">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#1A1400] text-white px-4 pt-8 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🌾</div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#FFD700" }}>
          PEPE FARM
        </h1>
        <p className="text-yellow-700 text-sm mt-1">Récolte, partage, encaisse.</p>
      </div>

      {user ? (
        <>
          {/* Carte solde */}
          <div className="w-full max-w-sm rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #2A2000 0%, #3D2E00 100%)", border: "1px solid #B8860B" }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
              style={{ background: "#FFD700", transform: "translate(30%, -30%)" }} />
            <p className="text-yellow-600 text-xs uppercase tracking-widest mb-1">Solde</p>
            <p className="text-5xl font-black" style={{ color: "#FFD700" }}>
              {user.balance.toLocaleString()}
            </p>
            <p className="text-yellow-500 text-lg font-bold mt-1">PEPE</p>
            <div className="mt-3 pt-3 border-t border-yellow-900/50">
              <p className="text-yellow-700 text-xs">
                Total récolté : {user.totalMined.toLocaleString()} PEPE
              </p>
            </div>
          </div>

          {/* Bouton Farm */}
          <button
            onClick={handleClaimButton}
            disabled={claiming || cooldownMs > 0}
            className="w-full max-w-sm py-5 rounded-2xl font-black text-xl transition-all"
            style={{
              background: cooldownMs > 0
                ? "#2A2000"
                : "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
              color: cooldownMs > 0 ? "#4A3800" : "#1A1400",
              border: cooldownMs > 0 ? "1px solid #3D2E00" : "none",
              boxShadow: cooldownMs > 0 ? "none" : "0 4px 20px rgba(255, 215, 0, 0.3)",
            }}
          >
            {claiming
              ? "🌾 Récolte en cours..."
              : cooldownMs > 0
              ? `⏱ ${formatCooldown(cooldownMs)}`
              : "🌾 Récolter 50 PEPE"}
          </button>

          {message && (
            <p className={`mt-4 text-sm text-center font-medium ${
              message.type === "success" ? "text-yellow-400" : "text-red-400"
            }`}>
              {message.text}
            </p>
          )}
        </>
      ) : (
        <p className="text-red-400 text-center">{message?.text}</p>
      )}
    </main>
  );
}