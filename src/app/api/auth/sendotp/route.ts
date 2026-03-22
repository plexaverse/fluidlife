import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

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
    const { phone } = await req.json();

    const baseUrl = process.env.TWO_FACTOR_BASE_URL;
    const authKey = process.env.TWO_FACTOR_AUTH_KEY;

    if (!authKey || !baseUrl) {
      throw new Error('Authentication key or Base URL is missing');
    }

    const templateName = 'OTP1';
    const apiUrl = `${baseUrl}${authKey}/SMS/${phone}/AUTOGEN/${templateName}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`2Factor.in API error: ${response.status}`);
    }

    const data = await response.json();

    const existingSession = await prismadb.otp_sessions.findFirst({
      where: { phone }
    });

    if (existingSession) {
      await prismadb.otp_sessions.update({
        where: { id: existingSession.id },
        data: {
          sessionId: data.Details,
          expiresAt: new Date(Date.now() + 1 * 60 * 1000), // 1 min expiry
          used: false,
        }
      });
    } else {
      await prismadb.otp_sessions.create({
        data: {
          phone,
          sessionId: data.Details,
          expiresAt: new Date(Date.now() + 1 * 60 * 1000),
          used: false
        }
      });
    }

    return NextResponse.json({
      status: data.Status === "Success" ? "pending" : "failed"
    }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send verification' }, { status: 500, headers: corsHeaders });
  }
}
