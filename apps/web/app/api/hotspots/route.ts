import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate, validateBody, paginationParams } from "../_lib/api";

// GET /api/hotspots — list hotspots with optional bounding-box filter
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const { page, pageSize, skip } = paginationParams(req);

  const latMin = parseFloat(url.searchParams.get("latMin") ?? "");
  const latMax = parseFloat(url.searchParams.get("latMax") ?? "");
  const lngMin = parseFloat(url.searchParams.get("lngMin") ?? "");
  const lngMax = parseFloat(url.searchParams.get("lngMax") ?? "");
  const onlineOnly = url.searchParams.get("online") === "true";

  const where: Record<string, unknown> = {};
  if (!isNaN(latMin) && !isNaN(latMax)) {
    where.latitude = { gte: latMin, lte: latMax };
  }
  if (!isNaN(lngMin) && !isNaN(lngMax)) {
    where.longitude = { gte: lngMin, lte: lngMax };
  }
  if (onlineOnly) where.isOnline = true;

  const [hotspots, total] = await Promise.all([
    prisma.hotspot.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        isOnline: true,
        uptimePercent: true,
        bandwidthMbps: true,
        pricePerGb: true,
        country: true,
        city: true,
        createdAt: true,
        operator: { select: { id: true, tier: true, accountId: true } },
      },
    }),
    prisma.hotspot.count({ where }),
  ]);

  return apiResponse(hotspots, 200, { page, total });
}

// POST /api/hotspots — register a new hotspot
const createHotspotSchema = z.object({
  name: z.string().min(3).max(80),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  bandwidthMbps: z.number().positive(),
  pricePerGb: z.number().nonnegative(),
  country: z.string().min(2).max(80).optional(),
  city: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const operator = await prisma.operator.findUnique({ where: { userId: auth.payload.sub } });
  if (!operator) return apiError("Register as operator first", 403);

  const body = await req.json().catch(() => null);
  const { data, error } = validateBody(createHotspotSchema, body);
  if (error) return error;

  const hotspot = await prisma.hotspot.create({
    data: {
      ...data,
      operatorId: operator.id,
      country: data.country ?? null,
      city: data.city ?? null,
    },
  });

  return apiResponse(hotspot, 201);
}
