import * as React from "react";
import Image from "next/image";

type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  variant?: "default" | "light";
  className?: string;
};

export function Logo({
  size = 40,
  withWordmark = false,
  variant = "default",
  className,
}: LogoProps) {
  const isLight = variant === "light";

  return (
    <div className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg ${
          isLight ? "bg-white/95 p-1.5" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Logo Digital Profsan Academy"
          fill
          className="object-contain"
          sizes={`${size}px`}
          priority
        />
      </div>

      {withWordmark && (
        <span
          className={`text-[15px] font-semibold tracking-tight leading-none ${
            isLight ? "text-white" : "text-foreground"
          }`}
        >
          Digital Profsan
        </span>
      )}
    </div>
  );
}
