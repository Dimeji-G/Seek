import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces";
import axios from 'axios';
import { extractNdcFromScan } from './../../utils/fda.utils';

export const analyzeQrCode = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const { scanData } = req.body;

    if (!scanData) {
      return res.status(400).json({ error: 'No scan data provided' });
    }

    const ndc = extractNdcFromScan(scanData);

    if (!ndc) {
      return res.status(422).json({ error: 'Invalid barcode format: Could not extract NDC' });
    }

    const fdaUrl = `https://api.fda.gov/drug/label.json`;
    
    // We search both package and product NDC to increase the hit rate
    const response = await axios.get(fdaUrl, {
      params: {
        search: `openfda.package_ndc:"${ndc}" OR openfda.product_ndc:"${ndc}"`,
        limit: 1
      }
    });

    res.json({
      success: true,
      ndc_detected: ndc,
      raw_data: response.data.results[0] 
    });

  } catch (error: any) {
    // Check if the error is specifically a 404 from FDA
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Drug not found', 
        details: 'The scanned NDC does not exist in the openFDA database.' 
      });
    }

    console.error('FDA API Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch drug data', 
      details: error.message 
    });
  }
};