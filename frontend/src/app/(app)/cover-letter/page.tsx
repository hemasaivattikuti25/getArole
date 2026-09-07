"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function CoverLetterPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [builderUrl] = useState<string>("/cover-letter-builder/index.html?v=3");

  return (
    <div className="relative w-full h-[100vh] min-h-screen bg-white overflow-hidden">
      {!iframeLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-600">Loading AI Cover Letter Architect...</p>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 p-6 text-center">
          <p className="text-sm font-bold text-slate-800 mb-2">Unable to connect to Cover Letter Architect service</p>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            Please ensure the service is accessible or retry the connection.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIframeLoaded(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
      <iframe
        src={builderUrl}
        title="getArole AI Cover Letter Builder"
        className="w-full h-full border-none"
        onLoad={() => setIframeLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
