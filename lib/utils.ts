import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function formatApplicationId(id: number | string | undefined | null, createdAt?: string) {
  if (id === undefined || id === null || id === "") return "N/A";
  const idStr = String(id);
  let year = "26";
  if (createdAt) {
    try {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        year = date.getFullYear().toString().slice(-2);
      }
    } catch (e) {
      // ignore invalid date
    }
  }
  // UUID: show first 8 chars; legacy number: zero-pad
  const isUuid = idStr.length === 36 && idStr.includes("-");
  return isUuid ? `MWHWR/APP/${year}/${idStr.slice(0, 8)}` : `MWHWR/APP/${year}/${idStr.padStart(4, "0")}`;
}
