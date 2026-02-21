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
      Extract and analyze information from the 'Personalized Risk Assessment' image.
      
      User Profile for Personalization:
      - Nationality: ${user?.nationality || "Not specified"}
      - User Goals: ${user?.userGoals?.join(", ") || "General health"}
      - Allergies: ${user?.allergies?.join(", ") || "None"}
      - Diet Type: ${user?.dietType || "Standard"}

      Instructions:
      1. **Identify**: Extract the exact Dish Name and all Risks/Ailments listed in the image.
      2. **Educational Questions**: Generate 3 questions explaining the link between the ingredients and the risks.
      3. **Personalized Alternatives**: Suggest alternatives for the identified ailments (acidity, stomach pain, etc.). 
         - Ensure the alternatives align with the user's Nationality and help them reach their User Goals.
         - Strictly avoid any ingredients listed in the User's Allergies.
    `;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageData,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dish_name: { type: Type.STRING },
            identified_risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            educational_questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 3,
              maxItems: 3,
            },
            personalized_alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ailment: { type: Type.STRING },
                  alternative: { type: Type.STRING },
                  goal_alignment: { type: Type.STRING },
                  cultural_note: { type: Type.STRING } 
                }
              }
            }
          },
          required: ["dish_name", "identified_risks", "educational_questions", "personalized_alternatives"]
        },
      },
    });

    const json = JSON.parse(response.text as string);
    return res.status(200).json({response: json});

  } catch (error) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: "Analysis failed." });
  }
};