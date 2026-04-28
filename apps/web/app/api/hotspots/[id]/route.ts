import { NextRequest } from "next/server";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError } from "../../_lib/api";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const hotspot = await prisma.hotspot.findUnique({
    where: { id: params.id },
    include: {
      operator: {
        select: { id: true, tier: true, accountId: true, rewardMultiplier: true },
      },
      _count: { select: { subscriptions: true } },
    },
  });

  if (!hotspot) return apiError("Hotspot not found", 404);
  return apiResponse(hotspot);
}
