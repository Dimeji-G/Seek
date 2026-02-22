import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces/index";
import { ai } from "../../services/gemini.services";
import { Type } from "@google/genai";
import User from "../../Models/User";

export const generateBlogTopics = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const user = req.user as unknown as User;

    const prompt = `
      As a content strategist, generate 5 engaging blog post topics tailored for the user profile below.
      The topics should be relevant to their nationality, health goals, and dietary lifestyle.

      ### USER PROFILE
      - **Nationality/Culture**: ${user?.nationality || "Nigerian"}
      - **Interests/Goals**: ${user?.userGoals?.join(", ") || "General health and wellness"}
      - **Dietary Lifestyle**: ${user?.dietType || "Standard"}
      
      ### INSTRUCTIONS
      1. **Diversity**: Mix educational "How-to" guides, listicles (e.g., "Top 5..."), and cultural deep-dives.
      2. **Relevance**: Ensure topics bridge the gap between ${user?.nationality} culture and ${user?.dietType} dieting.
      3. **Engagement**: Write catchy, SEO-friendly headlines.
    `;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blog_topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The headline of the blog post" },
                  category: { type: Type.STRING, description: "e.g., Nutrition, Culture, Lifestyle" },
                  target_audience: { type: Type.STRING },
                  brief_outline: { type: Type.STRING, description: "A 2-sentence summary of what the post covers." },
                  estimated_reading_time: { type: Type.STRING, description: "e.g., 5 min read" }
                },
                required: ["title", "category", "brief_outline"]
              }
            }
          },
          required: ["blog_topics"]
        },
      },
    });

    // Directly parsing response.text
    const json = JSON.parse(response.text as string);
    return res.status(200).json(json);

  } catch (error) {
    console.error("Blog Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate blog topics." });
  }
};