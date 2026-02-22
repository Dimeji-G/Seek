import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces/index";
import { ai } from "../../services/gemini.services";
import { Type } from "@google/genai";
import User from "../../Models/User";

export const analyzeImageQuestion = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const image = (req as any).file;
    const user = req.user as unknown as User;

    if (!image) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const imageData = image.buffer.toString("base64");
    const mimeType = image.mimetype;

    const prompt = `
      You are a dual-specialist in Clinical Nutrition and Pharmacology. 
      Analyze the provided image, which contains either a meal or a medication/supplement.

      ### USER CONTEXT
      - Nationality: ${user?.nationality || "Nigerian"}
      - Health Goals: ${user?.userGoals?.join(", ") || "Optimizing energy and digestion"}
      - Allergies/Sensitivities: ${user?.allergies?.join(", ") || "None"}
      - Dietary Framework: ${user?.dietType || "Standard"}

      ### ANALYSIS STEPS
      1. **Identification**: Determine if the item is "FOOD" or "DRUG". Identify the specific dish or medication name and its active components.
      2. **Risk Assessment**:
         - For FOOD: Identify risks like Gastric Acidity or Spiked Glycemic Index based on ingredients seen.
         - For DRUGS: Identify potential side effects (e.g., drowsiness) or instructions (e.g., "Take with food").
      3. **Personalization**:
         - Map risks to specific ingredients/chemicals found in the image.
         - For FOOD: Suggest ${user?.nationality}-relevant alternatives (e.g., swapping Ata Rodo for Tatashe).
         - For DRUGS: Suggest lifestyle support to manage side effects (e.g., "Drink more water" or "Avoid caffeine").

      STRICT RULE: Do not suggest components listed in the user's allergies: ${user?.allergies?.join(", ")}.
    `;

    

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, { inlineData: { data: imageData, mimeType } }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            item_type: { type: Type.STRING, description: "FOOD or DRUG" },
            identified_name: { type: Type.STRING },
            detailed_info: { type: Type.STRING },
            identified_components: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Ingredients for food, active chemicals for drugs."
            },
            risk_assessment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ailment_or_side_effect: { type: Type.STRING },
                  trigger: { type: Type.STRING, description: "Ingredient or chemical trigger" },
                  severity: { type: Type.STRING, description: "Low, Medium, or High" }
                },
                required: ["ailment_or_side_effect", "trigger", "severity"]
              }
            },
            personalized_recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original_issue: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  goal_alignment: { type: Type.STRING },
                  cultural_note: { type: Type.STRING } 
                },
                required: ["original_issue", "suggestion", "goal_alignment"]
              }
            },
            educational_questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["item_type", "identified_name", "risk_assessment", "personalized_recommendations"]
        },
      },
    });

    const json = JSON.parse(response.text as string);
    return res.status(200).json({ response: json });

  } catch (error) {
    console.error("Health Analysis Error:", error);
    return res.status(500).json({ error: "Analysis failed." });
  }
};