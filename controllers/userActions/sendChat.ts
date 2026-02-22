import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces/index";
import { ai } from "../../services/gemini.services";
import { Type } from "@google/genai";
import User from "../../Models/User";


export const sendChat = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const user = req.user as unknown as User;
    const { chatHistory, currentMessage } = req.body;

    if (!currentMessage) {
      return res.status(400).json({ error: "Message content is required." });
    }

    const systemInstruction = `
      You are a clinical nutritionist AI assistant. Use the following context for all responses.

      USER IDENTITY & HEALTH PROFILE:
      - Name: ${user?.firstName || "User"}
      - Nationality: ${user?.nationality || "Nigerian"}
      - Primary Health Goals: ${user?.userGoals?.join(", ") || "Optimizing digestion and energy"}
      - Medical/Dietary Constraints: ${user?.dietType || "Standard"}
      - Strict Allergies: ${user?.allergies?.join(", ") || "None"}

      STRICT OPERATIONAL RULES:
      1. Answer the current query while respecting the context of previous messages.
      2. Priority: Always suggest local ${user?.nationality || "Nigerian"} dishes first.
      3. Safety: Strictly avoid any ingredients listed in the User's Allergies (${user?.allergies?.join(", ")}).
      4. Scoring: Provide a 'health_score' (0-100) based on alignment with: ${user?.userGoals?.join(", ")}.
      5. Tone: Be supportive, professional, and culturally informed.


      **recommend meals to the user only when it is relevant to the conversation.**
    `;

    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n\nUser Question: ${currentMessage}
            
            
            PREVIOUS MESSAGES: ${chatHistory}
            ` }]
      }
    ];

    

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chat_response: { 
              type: Type.STRING, 
              description: "The direct, conversational answer to the user's message." 
            },
            recommended_meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  meal_name: { type: Type.STRING },
                  origin: { type: Type.STRING, description: "Local or International" },
                  description: { type: Type.STRING },
                  health_score: { type: Type.NUMBER },
                  key_benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                  why_it_fits: { type: Type.STRING, description: "Personalized rationale based on goals and nationality." }
                },
                required: ["meal_name", "origin", "description", "health_score", "key_benefits", "why_it_fits"]
              }
            },
            follow_up_suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 2,
              maxItems: 3
            }
          },
          required: ["chat_response", "follow_up_suggestions"]
        },
      },
    });

    // Parse and return the structured JSON response
    const json = JSON.parse(response.text as string);
    return res.status(200).json({ response: json });

  } catch (error) {
    console.error("Chat Session Error:", error);
    return res.status(500).json({ error: "Failed to process chat context." });
  }
};