import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prismadb from "@/lib/prismadb";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "default_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    const baseUrl = process.env.TWO_FACTOR_BASE_URL;
    const authKey = process.env.TWO_FACTOR_AUTH_KEY;

    if (!authKey || !baseUrl) {
      throw new Error('Authentication env vars missing');
    }
    if (!code) {
      return NextResponse.json({ error: "OTP code is required" }, { status: 400, headers: corsHeaders });
    }

    const otpSession = await prismadb.otp_sessions.findFirst({
      where: {
        phone,
        expiresAt: { gt: new Date() },
        used: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpSession) {
      return NextResponse.json({ error: "OTP expired or invalid" }, { status: 400, headers: corsHeaders });
    }

    const verifyUrl = `${baseUrl}${authKey}/SMS/VERIFY/${otpSession.sessionId}/${code}`;
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "OTP verification failed (API Error)" }, { status: 400, headers: corsHeaders });
    }

    await prismadb.otp_sessions.update({
      where: { id: otpSession.id },
      data: { used: true }
    });

    const verificationResult = await response.json();
    if (verificationResult.Status !== "Success" || verificationResult.Details !== "OTP Matched") {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400, headers: corsHeaders });
    }

    let user = await prismadb.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await prismadb.user.create({
        data: {
          phone,
          name: "Guest", 
          email: `${phone}@placeholder.com`, // Email is @not null in DB
        },
      });
    }

    // Use UUID primary key in the payload, addressing Fix #1
    const payload = { userId: user.id, phone: user.phone, role: user.role };
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    
    const expiry = Math.floor(Date.now() / 1000) + 15 * 60;

    return NextResponse.json({
        token,
        refreshToken,
        expiry,
        user: {
          id: user.id, // Return UUID instead of phone
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error verifying OTP", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500, headers: corsHeaders });
  }
}
