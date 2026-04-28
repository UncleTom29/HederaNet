import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, signJWT, authenticate, validateBody } from "../_lib/api";

// POST /api/auth/wallet — sign-in with Hedera account proof
const loginSchema = z.object({
  accountId: z.string().regex(/^0\.0\.\d+$/, "Invalid Hedera account ID"),
  signature: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { data, error } = validateBody(loginSchema, body);
  if (error) return error;

  // In production: verify the signature against the message using Hedera SDK.
  // For now, we trust the presented accountId and create/find the user.
  const { accountId } = data;

  const user = await prisma.user.upsert({
    where: { accountId },
    update: { lastLoginAt: new Date() },
    create: {
      accountId,
      displayName: accountId,
    },
    select: { id: true, accountId: true, displayName: true, avatarUrl: true, createdAt: true },
  });

  const token = await signJWT({ sub: user.id, accountId: user.accountId });
  return apiResponse({ token, user });
}

// GET /api/auth/me — return current user
export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.payload.sub },
    select: { id: true, accountId: true, displayName: true, avatarUrl: true, createdAt: true },
  });
  if (!user) return apiError("User not found", 404);
  return apiResponse(user);
}
