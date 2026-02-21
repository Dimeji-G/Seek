export const extractNdcFromScan = (rawScan: string): string | null => {
  // Simple check for GS1 '01' AI. Most pharmacy 2D codes use this.
  // Example raw: 0100312345678901... (14 digits after 01 is GTIN)
  if (rawScan.startsWith('01') && rawScan.length >= 16) {
    const gtin = rawScan.substring(2, 16);
    // The NDC is often a subset of the GTIN. 
    // This is a simplified extraction; real-world mapping can vary.
    return gtin.substring(4, 14); 
  }
  return rawScan; // Fallback if it's already a clean NDC
};