import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces";
import axios from 'axios';
import {extractNdcFromScan} from './../../utils/fda.utils';

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

    // Query openFDA Label endpoint using the NDC
    const fdaUrl = `https://api.fda.gov/drug/label.json`;
    const response = await axios.get(fdaUrl, {
      params: {
        search: `openfda.package_ndc:"${ndc}"`,
        limit: 1
      }
    });

    const drugInfo = response.data.results[0];

    res.json({
      success: true,
      ndc_detected: ndc,
      raw_data: drugInfo 
    });

  } catch (error: any) {
    console.error('FDA API Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch drug data', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
};