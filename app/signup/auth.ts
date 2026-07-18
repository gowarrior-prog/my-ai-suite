"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { type ThemePrefs, type Visibility, DEFAULT_THEME } from "@/app/contexts/theme.types";

// Re-export types
export type { ThemePrefs, Visibility };

// ====================== IN-MEMORY STORE (Dev only) ======================
// Fix: Next.js Fast Refresh har server-file-save pe is module ko re-evaluate
// karta hai, jisse ek normal `let users = []` module-level variable HAR BAAR
// reset ho jaata hai — cookie browser mein reh jaati hai lekin user record
// gayab ho jaata hai, isliye getCurrentUser() null return karta hai aur
// /api/me jaise routes 401 dete hain, chahe tum abhi login ho.
//
// Solution: array ko Node ke globalThis object pe attach karo. globalThis
// Fast Refresh ke beech persist rehta hai (jab tak poora dev server process
// restart na ho), isliye login session aur theme/visibility data
// hot-reloads ke beech survive karega.
type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  theme: ThemePrefs;
  visibility: Visibility;
};

declare global {
  // eslint-disable-next-line no-var
  var __authUsersStore: UserRecord[] | undefined;
}

const users: UserRecord[] = globalThis.__authUsersStore ?? (globalThis.__authUsersStore = []);

// ====================== SCHEMAS ======================
const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[0-9]/, "At least one number"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const hexColor = z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Invalid hex color");

const themeSchema = z.object({
  mode: z.enum(["dark", "light"]),
  accent: hexColor,
  background: hexColor,
  bubbleUser: hexColor,
  bubbleAssistant: hexColor,
});

const visibilitySchema = z.enum(["public", "private"]);

// ====================== TYPES ======================
export type AuthResponse =
  | { success: true; user: { id: string; name: string; email: string }; message: string }
  | { error: string };

export type ThemeResponse =
  | { success: true; theme: ThemePrefs }
  | { error: string };

export type VisibilityResponse =
  | { success: true; visibility: Visibility }
  | { error: string };

// ====================== COOKIE HELPER ======================
async function setAuthCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// ====================== SIGNUP ======================
export async function signupAction(data: z.infer<typeof signupSchema>): Promise<AuthResponse> {
  try {
    const validated = signupSchema.safeParse(data);
    if (!validated.success) {
      // Zod Error ke andar structural data check karne ke liye .issues property use hoti hai
      return { error: validated.error.issues[0]?.message || "Validation failed" };
    }
    const { fullName, email, password } = validated.data;

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser: UserRecord = {
      id: `user_${Date.now()}`,
      name: fullName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      theme: { ...DEFAULT_THEME },
      visibility: "private",
    };

    users.push(newUser);
    await setAuthCookie(newUser.id);

    return {
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      message: "Account created successfully!",
    };
  } catch (error) {
    console.error("Signup Error:", error);
    return { error: "Something went wrong during signup" };
  }
}

// ====================== LOGIN ======================
export async function loginAction(data: z.infer<typeof loginSchema>): Promise<AuthResponse> {
  try {
    const validated = loginSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid email or password" };
    }

    const { email, password } = validated.data;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return { error: "Invalid email or password" };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { error: "Invalid email or password" };
    }

    await setAuthCookie(user.id);

    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      message: "Login successful",
    };
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Login failed" };
  }
}

// ====================== GET CURRENT USER ======================
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) return null;

    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      theme: user.theme ?? DEFAULT_THEME,
      visibility: user.visibility ?? "private",
    };
  } catch (error) {
    console.error("Get Current User Error:", error);
    return null;
  }
}

// ====================== UPDATE THEME ======================
export async function updateThemeAction(theme: ThemePrefs): Promise<ThemeResponse> {
  try {
    const validated = themeSchema.safeParse(theme);
    if (!validated.success) {
      // .errors[0] ko badal kar .issues[0] kar diya taake TypeScript type checker pass ho jaye
      return { error: validated.error.issues[0]?.message || "Invalid theme data" };
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Not authenticated" };

    const user = users.find((u) => u.id === userId);
    if (!user) return { error: "User not found" };

    user.theme = validated.data;
    revalidatePath("/");

    return { success: true, theme: user.theme };
  } catch (error) {
    console.error("Update Theme Error:", error);
    return { error: "Failed to update theme" };
  }
}

// ====================== UPDATE VISIBILITY ======================
export async function updateVisibilityAction(visibility: Visibility): Promise<VisibilityResponse> {
  try {
    const validated = visibilitySchema.safeParse(visibility);
    if (!validated.success) {
      return { error: "Invalid visibility value" };
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Not authenticated" };

    const user = users.find((u) => u.id === userId);
    if (!user) return { error: "User not found" };

    user.visibility = validated.data;
    revalidatePath("/");

    return { success: true, visibility: user.visibility };
  } catch (error) {
    console.error("Update Visibility Error:", error);
    return { error: "Failed to update visibility" };
  }
}

// ====================== LOGOUT ======================
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    // Fix: Next.js 16 mein options ko ek hi object ke andar pass kiya jata hai
    cookieStore.delete({ name: "userId", path: "/" });
    
    revalidatePath("/");
  } catch (error) {
    console.error("Logout Error:", error);
  }
}