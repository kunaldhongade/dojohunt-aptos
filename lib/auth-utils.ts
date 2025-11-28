import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Get user ID from NextAuth session in API routes
 * This is the preferred method for API route authentication
 * Uses NextAuth JWT token from cookies
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Get token from request cookies using NextAuth's getToken
    // This works with NextRequest in App Router API routes
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token && token.id) {
      return token.id as string;
    }

    return null;
  } catch (error) {
    console.error("Error getting user ID from request:", error);
    return null;
  }
}

/**
 * Verify authentication and get user ID from request
 * Returns user ID or throws error
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

/**
 * Alternative: Get user ID from JWT token in Authorization header
 * (For backward compatibility with existing JWT-based endpoints)
 */
export function getUserIdFromJWT(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const { verify } = require("jsonwebtoken");
    const token = authHeader.substring(7);
    const decoded = verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId || decoded.id || null;
  } catch (error) {
    console.error("Error verifying JWT token:", error);
    return null;
  }
}

