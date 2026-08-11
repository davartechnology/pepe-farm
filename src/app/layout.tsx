"use client";

import { TadsWidget } from "react-tads-widget";

interface TadsBannerProps {
  widgetId: string;
}

export default function TadsBanner({ widgetId }: TadsBannerProps) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
      style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: "90px" }}
    >
      <TadsWidget
        id={widgetId}
        type="static"
        debug={false}
        onAdsNotFound={() => {}}
      />
    </div>
  );
}