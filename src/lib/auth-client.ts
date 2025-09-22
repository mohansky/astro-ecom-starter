// src/lib/auth-client.ts - Simple approach
import { createAuthClient } from "better-auth/client";

const baseURL = import.meta.env.PUBLIC_BETTER_AUTH_URL ||
                import.meta.env.BETTER_AUTH_URL ||
                'http://localhost:4321';

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;

export interface UpdateUserData {
  name?: string;
  image?: string;
}

export interface AuthError {
  code?: string;
  message?: string;
}

export interface AuthResponse<T = any> {
  data?: T;
  error?: AuthError | string;
}