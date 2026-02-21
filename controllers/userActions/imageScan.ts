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
      As a specialist in clinical nutrition and metabolic health, analyze the provided image of a meal. 
      The goal is to provide a "Personalized Risk Assessment" similar to a medical diagnostic report, 
      tailored specifically to the following user profile.

      ### USER PROFILE
      - **Nationality**: ${user?.nationality || "Nigerian"}
      - **Primary Health Goals**: ${user?.userGoals?.join(", ") || "Optimizing digestion and energy"}
      - **Medical/Dietary Constraints**: ${user?.dietType || "Standard"}
      - **Strict Allergies**: ${user?.allergies?.join(", ") || "None"}

      ### STEP 1: VISUAL IDENTIFICATION
      - Identify the exact dish and its likely core ingredients (e.g., identifying palm oil, parboiled rice, specific proteins, or high-density carbohydrates).

      ### STEP 2: RISK & AILMENT ASSESSMENT
      - Based on the visual evidence, identify 3-5 specific "Ailments" or health risks this meal could trigger for this specific user. 
      - Focus on risks like: Gastric Acidity, Heartburn (GERD), Spiked Glycemic Index, or Inflammation.
      - Map each risk to a specific ingredient found in the photo (e.g., "The high concentration of scotch bonnet (ata rodo) may trigger stomach burning").

      ### STEP 3: CULTURAL ALTERNATIVES
      - Propose "Smart Alternatives" that remain culturally relevant to a ${user?.nationality || "Nigerian"} palate.
      - If the user is Nigerian, suggest substitutions like:
        * Swapping "Ata Rodo" for "Tatashe" to manage acidity.
        * Swapping "Parboiled White Rice" for "Ofada or Brown Rice" to manage blood sugar goals: ${user?.userGoals?.join(", ")}.
        * Reducing "Groundnut Oil" in favor of smaller quantities of "Heart-healthy oils" or steaming methods.

      ### STEP 4: EDUCATIONAL ENGAGEMENT
      - Formulate 3 critical thinking questions that challenge the user to understand the nutritional science behind why this meal affects their body based on their ${user?.nationality} heritage and health goals.

      ### OUTPUT FORMAT
      Return the analysis in a clean JSON object containing:
      - "identified_dish" (string)
      - "identified_ingredients" (array)
      - "risk_assessment" (array of objects: { ailment, trigger_ingredient, severity_level })
      - "personalized_alternatives" (array of objects: { original_component, suggestion, goal_benefit, cultural_relevance })
      - "educational_questions" (array of 3 strings)

      STRICT RULE: Do not suggest any ingredients listed in the user's allergies: ${user?.allergies?.join(", ")}.
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
      identified_dish: { type: Type.STRING },
      detailed_information_about_the_dish: { type: Type.STRING }, 
      identified_ingredients: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING } 
      },
      risk_assessment: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ailment: { type: Type.STRING },
            trigger_ingredient: { type: Type.STRING },
            severity_level: { 
              type: Type.STRING,
              description: "Low, Medium, or High" 
            }
          },
          required: ["ailment", "trigger_ingredient", "severity_level"]
        }
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
            original_component: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            goal_benefit: { type: Type.STRING },
            cultural_relevance: { type: Type.STRING } 
          },
          required: ["original_component", "suggestion", "goal_benefit", "cultural_relevance"]
        }
      }
    },
    required: [
      "identified_dish", 
      "identified_ingredients", 
      "risk_assessment", 
      "educational_questions", 
      "personalized_alternatives",
      "detailed_information_about_the_dish"
    ]
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