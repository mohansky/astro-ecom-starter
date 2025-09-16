// src/pages/api/auth/[...all].ts
import { auth } from "@/lib/auth";
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (context) => {
  try {
    console.log('Auth request:', context.request.method, context.url.pathname);
    const response = await auth.handler(context.request);
    console.log('Auth response status:', response.status);
    return response;
  } catch (error) {
    console.error('Auth handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = ALL;
export const POST: APIRoute = ALL;
export const PATCH: APIRoute = ALL;
export const DELETE: APIRoute = ALL;
export const PUT: APIRoute = ALL;