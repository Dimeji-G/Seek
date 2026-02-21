import { Request, Response } from "express";
import { afterVerificationMiddlerwareInterface } from "../../interfaces/index";
import User from "../../Models/User";
import userBotVerification from "../../Models/BotOTP";

export const generateBotCode = async (
  req: Request & afterVerificationMiddlerwareInterface,
  res: Response
) => {
  try {
    const user = req.user as unknown as User;

    const botCode = Math.floor(1000 + Math.random() * 9000);

    await userBotVerification.create({
        userEmail: user.email,
        code: botCode
    })
    
    return res.status(200).json({ success: true, message: "Code generated successfully.", botCode });

  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({ error: "Failed to generate meal recommendations." });
  }
};