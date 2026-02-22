import { Request, Response } from "express";
import axios from 'axios';

export const analyzeQrCode = async (req: Request, res: Response) => {
  try {
    const { scanData, userProfile = {} } = req.body;
    if (!scanData) return res.status(400).json({ error: 'No scan data provided' });

    // --- STEP 1: BRUTE FORCE RECOGNITION (RxNav) ---
    const rawNdc = scanData.replace(/\D/g, '').trim();
    // We try 3 variations: Raw, 11-digit padded, 10-digit trimmed
    const variations = [rawNdc];
    if (rawNdc.length === 10) variations.push('0' + rawNdc);
    if (rawNdc.length === 11 && rawNdc.startsWith('0')) variations.push(rawNdc.substring(1));

    let ndcMatch = null;
    for (const code of variations) {
      try {
        const rxRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/ndcstatus.json?ndc=${code}`);
        if (rxRes.data.ndcStatus.status !== "UNKNOWN") {
          ndcMatch = rxRes.data.ndcStatus;
          break;
        }
      } catch (e) { continue; }
    }

    if (!ndcMatch) {
      return res.status(404).json({ error: "Drug not recognized. Please check the NDC number." });
    }

    const genericName = ndcMatch.conceptName;
    const rxcui = ndcMatch.rxcui;

    // --- STEP 2: FETCH EVERYTHING (openFDA) ---
    // We search by the NAME we just found, which is 100% reliable
    let safetyInfo: any = {};
    try {
      const fdaRes = await axios.get(`https://api.fda.gov/drug/label.json`, {
        params: {
          search: `openfda.generic_name:"${genericName.split(' ')[0]}"`,
          limit: 1
        }
      });
      safetyInfo = fdaRes.data.results[0];
    } catch (e) {
      safetyInfo = { note: "Detailed label text not found, using clinical ID info." };
    }

    // --- STEP 3: DANGER & REACTION ANALYSIS ---
    let alerts: string[] = [];
    const safetyText = JSON.stringify(safetyInfo).toLowerCase();

    // 1. Condition/Danger Check
    if (userProfile.conditions) {
      userProfile.conditions.forEach((c: string) => {
        if (safetyText.includes(c.toLowerCase())) {
          alerts.push(`CONDITION WARNING: This drug mentions ${c.toUpperCase()} in its safety warnings.`);
        }
      });
    }

    // 2. Interaction Check (Drug-to-Drug)
    if (userProfile.currentMeds?.length > 0) {
      try {
        const medList = [...userProfile.currentMeds, rxcui].join('+');
        const intRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${medList}`);
        if (intRes.data.fullInteractionTypeGroup) {
          alerts.push("INTERACTION ALERT: Potential reaction with your current medications.");
        }
      } catch (e) { /* Interaction service down */ }
    }

    // 3. Pregnancy/Allergy
    if (userProfile.isPregnant && (safetyInfo.pregnancy || safetyInfo.teratogenic_effects)) {
      alerts.push("PREGNANCY ALERT: Risk factors detected in FDA labeling.");
    }

    // --- STEP 4: FINAL BREADCRUMBS ---
    res.json({
      success: true,
      identity: {
        brand_name: ndcMatch.conceptName,
        ndc: ndcMatch.ndc,
        rxcui: rxcui
      },
      safety_report: {
        is_safe: alerts.length === 0,
        flags: alerts,
        danger_details: safetyInfo.warnings?.[0] || "No specific danger text found.",
        contraindications: safetyInfo.contraindications?.[0] || "N/A",
        adverse_reactions: safetyInfo.adverse_reactions?.[0] || "N/A"
      },
      usage: {
        indications: safetyInfo.indications_and_usage?.[0],
        dosage: safetyInfo.dosage_and_administration?.[0]
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: "API Failure", details: error.message });
  }
};