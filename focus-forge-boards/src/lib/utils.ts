import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone?: number | string) {
  if (!phone) return '-';
  const phoneStr = phone.toString();
  if (phoneStr.length === 10) {
    return `+33 ${phoneStr[1]} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5, 8)} ${phoneStr.slice(8)}`;
  }
  return phoneStr;
}

export function getInitials(firstName?: string, lastName?: string) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();

  // If both are missing, return '?'
  if (!first && !last) return '?';

  // If only firstName exists and it's not "Unknown", use first 2 chars
  if (first && first !== 'Unknown' && !last) {
    return first.slice(0, 2).toUpperCase();
  }

  // If only lastName exists, use first 2 chars
  if (!first && last) {
    return last.slice(0, 2).toUpperCase();
  }

  // If both exist and firstName is not "Unknown", use first letter of each
  if (first && first !== 'Unknown' && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }

  // Fallback to '?'
  return '?';
}
