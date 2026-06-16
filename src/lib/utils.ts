import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseMexicanDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  
  const str = String(dateString).trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  
  if (match) {
    let part1 = parseInt(match[1], 10);
    let part2 = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    let hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    
    if (str.toLowerCase().includes("pm") && hour < 12) hour += 12;
    if (str.toLowerCase().includes("am") && hour === 12) hour = 0;

    let day = part1;
    let month = part2 - 1;
    if (part2 > 12) {
      day = part2;
      month = part1 - 1;
    }
    const parsed = new Date(year, month, day, hour, minute);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}
