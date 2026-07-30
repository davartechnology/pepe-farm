"use client";

import { TadsWidgetProvider } from "react-tads-widget";

export default function TadsProvider({ children }: { children: React.ReactNode }) {
  return <TadsWidgetProvider>{children}</TadsWidgetProvider>;
}