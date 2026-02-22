import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces/index";
import { ai } from "../../services/gemini.services";
import { Type } from "@google/genai";
import User from "../../Models/User";

export const reccommendMeals = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const user = req.user as unknown as User;

    const prompt = `
      As a clinical nutritionist, recommend 5 distinct meals specifically for the user profile below.
      PRIORITY: Suggest local ${user?.nationality || "Nigerian"} dishes first before including international options.

      ### USER PROFILE
      - **Nationality**: ${user?.nationality || "Nigerian"}
      - **Primary Health Goals**: ${user?.userGoals?.join(", ") || "Optimizing digestion and energy"}
      - **Medical/Dietary Constraints**: ${user?.dietType || "Standard"}
      - **Strict Allergies**: ${user?.allergies?.join(", ") || "None"}

      ### INSTRUCTIONS
      1. **Cultural Relevance**: Prioritize dishes common in ${user?.nationality || "Nigeria"}.
      2. **Health Rating**: Assign a score from 0-100 based on how perfectly the meal aligns with the user's goals (${user?.userGoals?.join(", ")}) and dietary constraints.
      3. **Personalization**: If the user has allergies (${user?.allergies?.join(", ")}), ensure NO recommended meal contains those ingredients.
      4. **Detailed Description**: For each meal, describe the ingredients and why it was chosen for this specific user.
    `;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  meal_name: { type: Type.STRING },
                  origin: { type: Type.STRING, description: "e.g., Local/Nigerian or International" },
                  description: { type: Type.STRING },
                  health_score: { 
                    type: Type.NUMBER, 
                    description: "A score from 0 to 100 based on user goals and constraints." 
                  },
                  key_benefits: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  why_it_fits: { type: Type.STRING, description: "Reasoning based on user goals and nationality." }
                },
                required: ["meal_name", "origin", "description", "health_score", "key_benefits", "why_it_fits"]
              }
            }
          },
          required: ["recommendations"]
        },
      },
    });

    const json = JSON.parse(response.text as string);
    return res.status(200).json({ response: json });

  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({ error: "Failed to generate meal recommendations." });
  }
};