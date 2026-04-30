"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrPreview({
  value,
  size = 220,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#0f172a"
      className={className}
      aria-label="Aperçu du QR code"
      title="QR code scannable"
    />
  );
}
