import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Join class names; later Tailwind classes override earlier ones (so `className` props win). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
