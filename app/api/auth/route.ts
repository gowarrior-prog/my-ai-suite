import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // In a real app, validate against a database. 
    // Here we just simulate a successful auth and issue a token.
    const token = `mock-jwt-token-${Date.now()}`;
    
    const response = NextResponse.json({ 
      success: true, 
      message: action === 'signup' ? "Account created successfully" : "Logged in successfully" 
    });

    // Set HttpOnly cookie for security
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
