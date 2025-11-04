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
    if (canvasRef.current && url && url.trim() !== "") {
      QRCode.toCanvas(canvasRef.current, url, {
        width: width,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }).catch((error) => {
        console.error("Error generating QR code:", error);
      });
    }
  }, [url, width]);

  return (
    <canvas 
      ref={canvasRef} 
      className="rounded-lg"
      width={width}
      height={width}
    />
  );
}

