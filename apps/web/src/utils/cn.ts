import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine et fusionne les classes CSS avec clsx et tailwind-merge
 * Utile pour les composants qui acceptent des classes conditionnelles et personnalisées
 * 
 * @param inputs - Les classes CSS à combiner
 * @returns Les classes CSS fusionnées
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
