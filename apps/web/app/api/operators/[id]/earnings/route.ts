import { NextRequest } from "next/server";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate, paginationParams } from "../../../_lib/api";

type Params = { params: { id: string } };

// GET /api/operators/[id]/earnings — earnings history for an operator
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  // Verify requester is the operator
  const operator = await prisma.operator.findUnique({ where: { id: params.id } });
  if (!operator) return apiError("Operator not found", 404);
  if (operator.userId !== auth.payload.sub) return apiError("Forbidden", 403);

  const { page, pageSize, skip } = paginationParams(req);

  const [rewards, total] = await Promise.all([
    prisma.reward.findMany({
      where: { operatorId: params.id },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        txId: true,
        distributed: true,
        createdAt: true,
      },
    }),
    prisma.reward.count({ where: { operatorId: params.id } }),
  ]);

  // Aggregate totals
  const totals = await prisma.reward.aggregate({
    where: { operatorId: params.id },
    _sum: { amount: true },
  });

  return apiResponse(
    { rewards, totalEarned: totals._sum.amount ?? 0 },
    200,
    { page, total }
  );
}
