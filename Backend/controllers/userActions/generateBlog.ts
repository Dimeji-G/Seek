import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces/index";
import { ai } from "../../services/gemini.services";
import { Type } from "@google/genai";
import User from "../../Models/User";

export const generateExtensiveBlogPost = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const user = req.user as unknown as User;
    const { topic, category, reading_time, target_audience } = req.body;

    if (!topic || !category || !reading_time || !target_audience) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }

    const prompt = `
      As an expert health and culture blogger, write a very-much extensive, high-quality blog post not less than 1500 words based on this topic: "${topic}" \n under the category: ${category} \n with an estimated reading time of ${reading_time}, and a target audience of ${target_audience}.
      
      ### TARGET READER PROFILE
      - **Nationality**: ${user?.nationality || "Nigerian"}
      - **Goals**: ${user?.userGoals?.join(", ")}
      - **Diet Type**: ${user?.dietType}
      - **Allergies to Avoid**: ${user?.allergies?.join(", ") || "None"}

      ### CONTENT STRUCTURE REQUIREMENTS
      1. **Catchy H1 Title**: Refine the provided topic into a professional headline.
      2. **Introduction**: Hook the reader by relating the topic to their specific ${user?.nationality} background and ${user?.userGoals?.join("/")} goals.
      3. **The "Why" Section**: Explain the science or cultural significance.
      4. **Practical Application**: Provide a detailed, step-by-step guide or recipe.
      5. **Constraint Check**: Explicitly mention how this avoids ${user?.allergies?.join(", ") || "common allergens"}.
      6. **Conclusion**: An encouraging closing statement and a "Call to Action".

      ### FORMAT
      Return the result as a JSON object with a 'content' field containing the full blog post in Markdown format.
    `;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING, description: "The full blog post in Markdown format." },
            word_count: { type: Type.NUMBER },
            seo_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "content"]
        },
      },
    });

    const result = JSON.parse(response.text as string);
    return res.status(200).json(result);

  } catch (error) {
    console.error("Long-form Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate the full blog post." });
  }
};