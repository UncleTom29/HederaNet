import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate, validateBody } from "../../_lib/api";

type Params = { params: { id: string } };

// GET /api/energy/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const listing = await prisma.energyListing.findUnique({
    where: { id: params.id },
    include: {
      seller: { select: { id: true, accountId: true, tier: true } },
      trades: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, buyerId: true, kwh: true, totalPrice: true, status: true, createdAt: true },
      },
    },
  });

  if (!listing) return apiError("Listing not found", 404);
  return apiResponse(listing);
}

// POST /api/energy/[id] — execute a trade (buy energy from listing)
const tradeSchema = z.object({
  kwh: z.number().positive(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  const { data, error } = validateBody(tradeSchema, body);
  if (error) return error;

  const listing = await prisma.energyListing.findUnique({ where: { id: params.id } });
  if (!listing) return apiError("Listing not found", 404);
  if (!listing.isActive) return apiError("Listing is no longer active", 400);
  if (data.kwh > listing.availableKwh) {
    return apiError(`Only ${listing.availableKwh} kWh available`, 400);
  }

  const buyer = await prisma.operator.findUnique({ where: { userId: auth.payload.sub } });
  if (!buyer) return apiError("Buyer must be a registered operator", 403);
  if (buyer.id === listing.sellerId) return apiError("Cannot buy from your own listing", 400);

  const totalPrice = data.kwh * listing.pricePerKwh;

  const [trade] = await prisma.$transaction([
    prisma.trade.create({
      data: {
        listingId: listing.id,
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        kwh: data.kwh,
        totalPrice,
        status: "PENDING",
      },
    }),
    prisma.energyListing.update({
      where: { id: listing.id },
      data: {
        availableKwh: { decrement: data.kwh },
        isActive: listing.availableKwh - data.kwh > 0,
      },
    }),
  ]);

  return apiResponse(trade, 201);
}
