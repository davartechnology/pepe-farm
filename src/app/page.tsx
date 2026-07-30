"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { renderTadsWidget, TadsWidget } from "react-tads-widget";
import TadsBanner from "@/components/TadsBanner";

interface UserData {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  balance: number;
  totalMined: number;
  lastClaimAt: string | null;
}

const TADS_FULLSCREEN_ID = "11246"; // Fullscreen - bloquant, déclenche le claim après visionnage
const TADS_TGB_ID = "11244";        // TGB statique - affiché en bas de page

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [waitingForAd, setWaitingForAd] = useState(false);
  const claimRef = useRef<string>("");

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
      claimRef.current = initDataStr;
    } catch {
      setMessage({ text: "Erreur de connexion au serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Appelé UNIQUEMENT après que l'user a vu la pub fullscreen en entier
  const onAdShown = useCallback(async () => {
    setWaitingForAd(false);
    await processClaim();
  }, []);

  // Si pas de pub disponible : on informe l'user mais on NE CREDITE PAS
  // (pour ne jamais distribuer des PEPE sans revenus publicitaires)
  const onAdsNotFound = useCallback(() => {
    setWaitingForAd(false);
    setClaiming(false);
    setMessage({
      text: "⚠️ Aucune publicité disponible pour toi en ce moment. Réessaie dans quelques minutes.",
      type: "error"
    });
  }, []);

  const handleClaimButton = useCallback(() => {
    if (!initData || claiming || cooldownMs > 0 || waitingForAd) return;
    setClaiming(true);
    setMessage(null);
    setWaitingForAd(true);

    // Déclenche la pub fullscreen TADS — bloque l'écran jusqu'à visionnage complet
    renderTadsWidget({
      id: TADS_FULLSCREEN_ID,
      type: "fullscreen",
    });
  }, [initData, claiming, cooldownMs, waitingForAd]);

  async function processClaim() {
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: claimRef.current }),
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
  }

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
          <div
            className="w-full max-w-sm rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2A2000 0%, #3D2E00 100%)",
              border: "1px solid #B8860B",
            }}
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
              style={{ background: "#FFD700", transform: "translate(30%, -30%)" }}
            />
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

          {/* Message d'attente pub */}
          {waitingForAd && (
            <div
              className="w-full max-w-sm rounded-xl p-4 mb-4 text-center"
              style={{ background: "#2A2000", border: "1px solid #B8860B" }}
            >
              <p className="text-yellow-400 text-sm font-bold animate-pulse">
                📺 Publicité en cours... Regarde jusqu'au bout pour recevoir tes PEPE !
              </p>
            </div>
          )}

          {/* Bouton Farm */}
          <button
            onClick={handleClaimButton}
            disabled={claiming || cooldownMs > 0 || waitingForAd}
            className="w-full max-w-sm py-5 rounded-2xl font-black text-xl transition-all"
            style={{
              background:
                cooldownMs > 0 || waitingForAd
                  ? "#2A2000"
                  : "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
              color: cooldownMs > 0 || waitingForAd ? "#4A3800" : "#1A1400",
              border:
                cooldownMs > 0 || waitingForAd ? "1px solid #3D2E00" : "none",
              boxShadow:
                cooldownMs > 0 || waitingForAd
                  ? "none"
                  : "0 4px 20px rgba(255, 215, 0, 0.3)",
            }}
          >
            {waitingForAd
              ? "📺 Pub en cours..."
              : claiming
              ? "🌾 Récolte en cours..."
              : cooldownMs > 0
              ? `⏱ ${formatCooldown(cooldownMs)}`
              : "🌾 Récolter 300 PEPE"}
          </button>

          {message && (
            <p
              className={`mt-4 text-sm text-center font-medium ${
                message.type === "success" ? "text-yellow-400" : "text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}

          {/* Widget TADS Fullscreen caché - géré par renderTadsWidget */}
          <div className="hidden">
            <TadsWidget
              id={TADS_FULLSCREEN_ID}
              type="fullscreen"
              debug={false}
              onShowReward={onAdShown}
              onAdsNotFound={onAdsNotFound}
            />
          </div>

          {/* TGB statique en bas de page */}
          <div className="mt-6 w-full max-w-sm">
            <TadsWidget
              id={TADS_TGB_ID}
              type="static"
              debug={false}
              onAdsNotFound={() => {}}
            />
          </div>
        </>
      ) : (
        <p className="text-red-400 text-center">{message?.text}</p>
      )}
    </main>
  );
}