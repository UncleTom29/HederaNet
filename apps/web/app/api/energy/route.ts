import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate, validateBody, paginationParams } from "../_lib/api";

// GET /api/energy — list energy listings
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const { page, pageSize, skip } = paginationParams(req);
  const activeOnly = url.searchParams.get("active") !== "false";

  const where = activeOnly ? { isActive: true } : {};

  const [listings, total] = await Promise.all([
    prisma.energyListing.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        pricePerKwh: true,
        availableKwh: true,
        location: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
        seller: { select: { id: true, accountId: true, tier: true } },
      },
    }),
    prisma.energyListing.count({ where }),
  ]);

  return apiResponse(listings, 200, { page, total });
}

// POST /api/energy — create energy listing (operator only)
const createListingSchema = z.object({
  pricePerKwh: z.number().positive(),
  availableKwh: z.number().positive(),
  location: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const operator = await prisma.operator.findUnique({ where: { userId: auth.payload.sub } });
  if (!operator) return apiError("Must be an operator to list energy", 403);

  const body = await req.json().catch(() => null);
  const { data, error } = validateBody(createListingSchema, body);
  if (error) return error;

  const listing = await prisma.energyListing.create({
    data: {
      sellerId: operator.id,
      pricePerKwh: data.pricePerKwh,
      availableKwh: data.availableKwh,
      location: data.location ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  return apiResponse(listing, 201);
}
