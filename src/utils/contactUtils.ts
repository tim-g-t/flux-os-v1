/**
 * Utility functions for handling obfuscated contact information
 * to prevent bot crawling while maintaining clickability
 */

export const deobfuscateEmail = (obfuscatedEmail: string): string => {
  return obfuscatedEmail.replace('[at]', '@');
};

export const deobfuscatePhone = (obfuscatedPhone: string): string => {
  // Remove spaces and replace 'O' with '0' (letter O to number 0)
  return obfuscatedPhone.replace(/\s/g, '').replace(/O/g, '0');
};

export const createMailtoLink = (obfuscatedEmail: string): string => {
  return `mailto:${deobfuscateEmail(obfuscatedEmail)}`;
};

export const createTelLink = (obfuscatedPhone: string): string => {
  return `tel:+${deobfuscatePhone(obfuscatedPhone)}`;
};
