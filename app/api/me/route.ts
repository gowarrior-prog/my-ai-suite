import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/signup/auth';   // apna correct path

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("❌ No user found - cookie missing or invalid");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    console.log("✅ User fetched successfully:", user.email);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("API /me Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}