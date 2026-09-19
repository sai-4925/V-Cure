import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getGreetingName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "V-Cure Patient";
  const trimmed = fullName.trim();
  if (trimmed === "V-Cure Patient" || trimmed === "V-Cure" || trimmed === "Demo User") {
    return "V-Cure Patient";
  }
  const firstName = trimmed.split(/\s+/)[0];
  return firstName || "V-Cure Patient";
}
