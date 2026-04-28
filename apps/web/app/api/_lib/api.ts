import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

function getJWTSecret(): Uint8Array {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return new TextEncoder().encode(secret);
}

export interface JWTPayload {
  sub: string;       // userId
  accountId: string; // Hedera account ID
  iat?: number;
  exp?: number;
}

export function apiResponse<T>(
  data: T,
  status = 200,
  meta?: { page?: number; total?: number }
): NextResponse {
  return NextResponse.json({ data, error: null, meta }, { status });
}

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function signJWT(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJWTSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function authenticate(
  req: NextRequest
): Promise<{ payload: JWTPayload; error: null } | { payload: null; error: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { payload: null, error: apiError("Missing or invalid Authorization header", 401) };
  }
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token);
  if (!payload) {
    return { payload: null, error: apiError("Token invalid or expired", 401) };
  }
  return { payload, error: null };
}

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return { data: null, error: apiError(msg, 422) };
  }
  return { data: result.data, error: null };
}

export function paginationParams(req: NextRequest): { page: number; pageSize: number; skip: number } {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
