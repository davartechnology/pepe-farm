"use client";

import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "🌾", label: "Farm" },
  { href: "/referral", icon: "👥", label: "Parrainage" },
  { href: "/withdraw", icon: "💸", label: "Retrait" },
  { href: "/history", icon: "📜", label: "Historique" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Ne pas afficher sur les pages admin et login
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1400] border-t border-yellow-600/30 z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${
                isActive
                  ? "text-yellow-400"
                  : "text-yellow-900 hover:text-yellow-600"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-yellow-400 rounded-full" />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}