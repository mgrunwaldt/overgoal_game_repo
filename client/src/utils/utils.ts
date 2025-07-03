import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to convert hex values to numbers
export const hexToNumber = (hexValue: string | number): number => {
  if (typeof hexValue === 'number') return hexValue;
  if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
    return parseInt(hexValue, 16);
  }
  if (typeof hexValue === 'string') {
    return parseInt(hexValue, 10);
  }
  return 0;
};

// Helper to convert hex strings to readable text
export const hexToString = (hexValue: string): string => {
  if (!hexValue || typeof hexValue !== 'string') return '';
  
  // Remove 0x prefix if present
  const cleanHex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
  
  // If it's not a hex string, return as is
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) return hexValue;
  
  try {
    // Convert hex to bytes and then to string
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexPair = cleanHex.substr(i, 2);
      const charCode = parseInt(hexPair, 16);
      if (charCode !== 0) { // Skip null bytes
        result += String.fromCharCode(charCode);
      }
    }
    return result || hexValue; // Return original if conversion fails
  } catch (error) {
    console.warn('Failed to convert hex to string:', hexValue, error);
    return hexValue; // Return original hex if conversion fails
  }
};
