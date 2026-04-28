import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate, validateBody, paginationParams } from "../_lib/api";

// GET /api/subscriptions — list user's subscriptions
export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const { page, pageSize, skip } = paginationParams(req);

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: auth.payload.sub },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        hotspot: { select: { id: true, name: true, latitude: true, longitude: true, city: true } },
      },
    }),
    prisma.subscription.count({ where: { userId: auth.payload.sub } }),
  ]);

  return apiResponse(subscriptions, 200, { page, total });
}

// POST /api/subscriptions — subscribe to a hotspot
const subscribeSchema = z.object({
  hotspotId: z.string().cuid(),
  durationDays: z.number().int().min(1).max(365),
});

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  const { data, error } = validateBody(subscribeSchema, body);
  if (error) return error;

  const hotspot = await prisma.hotspot.findUnique({ where: { id: data.hotspotId } });
  if (!hotspot) return apiError("Hotspot not found", 404);
  if (!hotspot.isOnline) return apiError("Hotspot is currently offline", 400);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + data.durationDays * 86_400_000);

  const subscription = await prisma.subscription.create({
    data: {
      userId: auth.payload.sub,
      hotspotId: data.hotspotId,
      expiresAt,
      status: "ACTIVE",
    },
  });

  return apiResponse(subscription, 201);
}
