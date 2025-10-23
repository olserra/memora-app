// Safe storage utility functions
export function safeStorageSet(
  storage: Storage,
  key: string,
  value: string
): boolean {
  if (!key || typeof key !== "string" || key.trim() === "") {
    console.error("Storage key must be a non-empty string.");
    return false;
  }
  storage.setItem(key, value);
  return true;
}

export function safeStorageGet(storage: Storage, key: string): string | null {
  if (!key || typeof key !== "string" || key.trim() === "") {
    console.error("Storage key must be a non-empty string.");
    return null;
  }
  return storage.getItem(key);
}

export function safeStorageRemove(storage: Storage, key: string): boolean {
  if (!key || typeof key !== "string" || key.trim() === "") {
    console.error("Storage key must be a non-empty string.");
    return false;
  }
  storage.removeItem(key);
  return true;
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
