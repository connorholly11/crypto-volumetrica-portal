import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Requires authentication for a route.
 * Redirects to sign-in page if user is not authenticated.
 * @returns The authenticated user's ID
 */
export function requireAuth() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

/**
 * Gets the current user's authentication status
 * @returns Object containing userId (string | null) and isAuthenticated (boolean)
 */
export function getAuthStatus() {
  const { userId } = auth();
  return {
    userId,
    isAuthenticated: !!userId,
  };
}

/**
 * Requires admin role for a route.
 * Redirects to home page if user is not an admin.
 * @returns The authenticated admin's ID
 */
export async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check for admin role in session claims
  // You may need to configure this in your Clerk dashboard
  const isAdmin = sessionClaims?.metadata?.role === "admin";
  
  if (!isAdmin) {
    redirect("/");
  }

  return userId;
}

/**
 * Gets the current session with full details
 * @returns The full session object from Clerk
 */
export function getSession() {
  return auth();
}