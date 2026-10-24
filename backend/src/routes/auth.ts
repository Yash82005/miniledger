
import { Router } from "express";
import { randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

const otpStore = new Map<
  string,
  { code: string; expiresAt: number; attempts: number }
>();

const phoneSchema = z.object({
  phone: z.string().trim().regex(
    /^\+?[1-9]\d{9,14}$/,
    "Enter a valid phone number"
  ),
});

const verifySchema = phoneSchema.extend({
  otp: z.string().regex(/^\d{6}$/, "OTP must contain 6 digits"),
});

// Request an OTP
router.post("/send-otp", (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid phone number",
      errors: parsed.error.issues,
    });
  }

  const phone = parsed.data.phone;
  const code = randomInt(100000, 1000000).toString();

  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  console.log(`Mock OTP for ${phone}: ${code}`);

  return res.json({
    message: "OTP generated. Check the server terminal.",
  });
});

// Verify OTP and create/find the user
router.post("/verify-otp", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid phone number or OTP format",
      errors: parsed.error.issues,
    });
  }

  const { phone, otp } = parsed.data;
  const savedOtp = otpStore.get(phone);

  if (!savedOtp || Date.now() > savedOtp.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({
      message: "OTP is missing or expired. Request a new one.",
    });
  }

  if (savedOtp.attempts >= 5) {
    otpStore.delete(phone);
    return res.status(429).json({
      message: "Too many attempts. Request a new OTP.",
    });
  }

  savedOtp.attempts += 1;

  if (savedOtp.code !== otp) {
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  otpStore.delete(phone);

  try {
    const result = await pool.query(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone)
       DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone`,
      [phone]
    );

    const user = result.rows[0];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing from .env");
      return res.status(500).json({
        message: "Authentication is not configured",
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login database error:", error);
    return res.status(500).json({
      message: "Could not complete login",
    });
  }
});

export default router;
