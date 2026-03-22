import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set!');
}

export async function POST(req: Request) {
    try {
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !process.env.JWT_SECRET) {
            return new NextResponse(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
        }

        const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
        const body = await req.json();
        const { username, password } = body;

        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return new NextResponse(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
        }

        const token = await new SignJWT({ role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('4h')
            .sign(JWT_SECRET);

        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 4,
        });

        return response;
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: "Internal error" }), { status: 500 });
    }
}
