import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces";
import User from "../../Models/User";
import { ai } from "../../services/gemini.services";
import { Type } from "@google/genai";

export const getDetailedMealAnalysis = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const user = req.user as unknown as User;
    const { mealName } = req.body;

    if (!mealName) {
      return res.status(400).json({ error: "Please provide a meal name." });
    }

    const prompt = `
      You are a high-level Clinical Nutritionist and Food Scientist. 
      Provide a comprehensive, scientific deconstruction of the meal: "${mealName}".

      ### USER CONTEXT FOR PERSONALIZATION:
      - Nationality: ${user?.nationality || "Nigerian"}
      - Health Goals: ${user?.userGoals?.join(", ") || "Optimizing energy and digestion"}
      - Allergies: ${user?.allergies?.join(", ") || "None"}
      - Constraints: ${user?.dietType || "Standard"}

      ### ANALYSIS REQUIREMENTS:
      1. **Molecular Breakdown**: Identify core macronutrients and critical micronutrients.
      2. **Ingredient Profiling**: List every standard ingredient used in a traditional ${user?.nationality} version of this dish.
      3. **Health Score**: Rate this meal (0-100) specifically against the user's goals: ${user?.userGoals?.join(", ")}.
      4. **Risk Assessment**: Identify specific ailments (e.g., Acidity, Heartburn, Glycemic spikes) this meal might trigger.
      5. **Biochemical Impact**: Explain how this meal affects energy levels (e.g., slow-release vs. sugar crash) which is vital for the user's work on their startup, Clark.
      6. **Smart Tweaks**: Suggest 3 "Pro-level" substitutions to make it healthier while keeping the ${user?.nationality} soul of the dish.

      STRICT RULE: Do not include ingredients that conflict with these allergies: ${user?.allergies?.join(", ")}.
    `;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meal_identity: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                origin: { type: Type.STRING },
                estimated_calories: { type: Type.STRING }
              }
            },
            nutritional_deconstruction: {
              type: Type.OBJECT,
              properties: {
                macros: { type: Type.STRING },
                key_vitamins_minerals: { type: Type.ARRAY, items: { type: Type.STRING } },
                glycemic_index_estimate: { type: Type.STRING }
              }
            },
            ingredient_list: { type: Type.ARRAY, items: { type: Type.STRING } },
            health_impact_metrics: {
              type: Type.OBJECT,
              properties: {
                overall_score: { type: Type.NUMBER },
                energy_sustainability: { type: Type.STRING, description: "How long energy lasts (relevant for late-night coding)." },
                digestive_load: { type: Type.STRING, description: "Light, Moderate, or Heavy." }
              }
            },
            risk_and_ailment_report: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  potential_issue: { type: Type.STRING },
                  trigger_ingredient: { type: Type.STRING },
                  mitigation_strategy: { type: Type.STRING }
                }
              }
            },
            personalized_optimizations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original_ingredient: { type: Type.STRING },
                  recommended_swap: { type: Type.STRING },
                  benefit_to_user_goals: { type: Type.STRING }
                }
              }
            }
          },
          required: ["meal_identity", "nutritional_deconstruction", "health_impact_metrics", "risk_and_ailment_report"]
        },
      },
    });
    

    const json = JSON.parse(response.text as string);
    return res.status(200).json({ response: json });

  } catch (error) {
    console.error("Detailed Analysis Error:", error);
    return res.status(500).json({ error: "Failed to deconstruct meal." });
  }
};