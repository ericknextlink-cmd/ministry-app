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

export function formatApplicationId(id: number | undefined | null, createdAt?: string) {
  if (!id) return "N/A";
  
  let year = "26"; // Default fallback
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
  
  return `MWHWR/APP/${year}/${id.toString().padStart(4, "0")}`;
}
