"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  label?: string;
  className?: string;
}

export function QRCodeDisplay({ url, size = 150, label, className = "" }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [url, size]);

  if (!qrDataUrl) {
    return (
      <div 
        className={`bg-white/10 rounded-xl animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white p-2 rounded-xl shadow-lg">
        <img 
          src={qrDataUrl} 
          alt="Scan to vote" 
          width={size} 
          height={size}
          className="block"
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-center">{label}</span>
      )}
    </div>
  );
}
