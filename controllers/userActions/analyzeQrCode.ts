import { Request, Response } from "express";
import axios from 'axios';

/**
 * Utility to convert various barcode formats into potential NDC patterns
 * FDA expects formats like: 0781-1506 or 07811506
 */
const normalizeNdc = (rawScan: string): string => {
  let cleaned = rawScan.replace(/[^0-9]/g, ''); // Remove dashes/spaces
  
  // If it's a 12-digit UPC (common on retail boxes), 
  // the NDC is often digits 2 through 11.
  if (cleaned.length === 12) {
    return cleaned.substring(1, 11); 
  }
  
  return cleaned;
};

export const analyzeQrCode = async (req: Request, res: Response) => {
  try {
    const { scanData, userProfile } = req.body;

    if (!scanData) {
      return res.status(400).json({ error: 'No scan data provided' });
    }

    const ndc = normalizeNdc(scanData);

    // Try searching the LABEL endpoint (contains safety/usage text)
    const fdaUrl = `https://api.fda.gov/drug/label.json`;
    
    const response = await axios.get(fdaUrl, {
      params: {
        // We use .exact for more precise matching on cleaned strings
        search: `openfda.package_ndc:"${ndc}" OR openfda.product_ndc:"${ndc}"`,
        limit: 1
      }
    });

    const drug = response.data.results[0];
    const info = drug.openfda;

    // --- SAFETY ANALYSIS LOGIC ---
    const activeIngredients = drug.active_ingredient || [];
    let safetyStatus = "Safe to use";
    let alerts: string[] = [];

    // 1. Check for Allergy Matches
    if (userProfile?.allergies) {
      const userAllergies = userProfile.allergies.map((a: string) => a.toLowerCase());
      const drugContent = JSON.stringify(drug).toLowerCase();

      userAllergies.forEach((allergy: string) => {
        if (drugContent.includes(allergy)) {
          safetyStatus = "High Risk";
          alerts.push(`ALLERGY WARNING: This product contains or is related to ${allergy.toUpperCase()}.`);
        }
      });
    }

    // 2. Check for Specific Contraindications (e.g., Pregnancy)
    if (userProfile?.isPregnant && (drug.pregnancy || drug.teratogenic_effects)) {
      alerts.push("PREGNANCY WARNING: Consult a doctor before use.");
    }

    res.json({
      success: true,
      meta: {
        scanned_code: scanData,
        interpreted_ndc: ndc
      },
      analysis: {
        status: safetyStatus,
        alerts: alerts,
        brand_name: info?.brand_name?.[0] || "Unknown",
        generic_name: info?.generic_name?.[0] || "Unknown",
        usage: drug.indications_and_usage?.[0] || "No usage data found."
      },
      raw_safety_info: {
        warnings: drug.warnings?.[0],
        stop_use: drug.stop_use?.[0],
        do_not_use: drug.do_not_use?.[0]
      }
    });

  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Drug not found', 
        tip: 'If this is a retail box, try entering the NDC number found near the barcode manually (e.g. 12345-678-90).' 
      });
    }
    res.status(500).json({ error: 'FDA API Connection Error', details: error.message });
  }
};