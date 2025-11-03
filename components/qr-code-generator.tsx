"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  url: string;
  width?: number;
}

export function QRCodeGenerator({ url, width = 200 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: width,
        margin: 2,
        color: {
          dark: "#C6DCF2",
          light: "#C6DCF2",
        },
      });
    }
  }, [url, width]);

  return <canvas ref={canvasRef} className="rounded-lg" />;
}

