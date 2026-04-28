import { NextRequest } from "next/server";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate, paginationParams } from "../_lib/api";

// GET /api/operators — list all operators with pagination
export async function GET(req: NextRequest) {
  const { page, pageSize, skip } = paginationParams(req);
  const url = new URL(req.url);
  const tier = url.searchParams.get("tier") as string | null;

  const where = tier ? { tier: tier as never } : {};

  const [operators, total] = await Promise.all([
    prisma.operator.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        accountId: true,
        tier: true,
        stakedAmount: true,
        rewardMultiplier: true,
        isActive: true,
        createdAt: true,
        user: { select: { displayName: true, avatarUrl: true } },
        _count: { select: { hotspots: true } },
      },
    }),
    prisma.operator.count({ where }),
  ]);

  return apiResponse(operators, 200, { page, total });
}

// POST /api/operators — register as operator (requires auth)
export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const existing = await prisma.operator.findUnique({
    where: { userId: auth.payload.sub },
  });
  if (existing) return apiError("Already registered as operator", 409);

  const operator = await prisma.operator.create({
    data: {
      userId: auth.payload.sub,
      accountId: auth.payload.accountId,
    },
    select: {
      id: true,
      accountId: true,
      tier: true,
      stakedAmount: true,
      rewardMultiplier: true,
      isActive: true,
      createdAt: true,
    },
  });

  return apiResponse(operator, 201);
}
