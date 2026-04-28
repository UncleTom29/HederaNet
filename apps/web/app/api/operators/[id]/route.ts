import { NextRequest } from "next/server";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError } from "../../_lib/api";

type Params = { params: { id: string } };

// GET /api/operators/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const operator = await prisma.operator.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      accountId: true,
      tier: true,
      stakedAmount: true,
      rewardMultiplier: true,
      isActive: true,
      slashedAmount: true,
      createdAt: true,
      user: { select: { displayName: true, avatarUrl: true, accountId: true } },
      hotspots: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          isOnline: true,
          uptimePercent: true,
        },
      },
      _count: { select: { hotspots: true, rewards: true } },
    },
  });

  if (!operator) return apiError("Operator not found", 404);
  return apiResponse(operator);
}
