"use client";

import { TadsWidget } from "react-tads-widget";

const TADS_TGB_ID = "11244"; // Text-Graphic Block statique

export default function TadsStaticBanner() {
  return (
    <div className="w-full flex justify-center my-4">
      <TadsWidget
        id={TADS_TGB_ID}
        type="static"
        debug={false}
        onAdsNotFound={() => {}}
      />
    </div>
  );
}