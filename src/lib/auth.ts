// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { sendPasswordResetEmail } from "./email";

function getBaseURL() {
  if (import.meta.env.BETTER_AUTH_URL) {
    return import.meta.env.BETTER_AUTH_URL;
  }

  if (import.meta.env.PUBLIC_BETTER_AUTH_URL) {
    return import.meta.env.PUBLIC_BETTER_AUTH_URL;
  }

  return "https://manubal.netlify.app";
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }) => {
      console.log("Sending password reset email to:", user.email);
      console.log("Reset URL:", url);

      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
        userName: user.name,
        token: token,
      });
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  // Enable profile updates
  updateProfile: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: getBaseURL(),
  trustedOrigins: [getBaseURL()],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;
