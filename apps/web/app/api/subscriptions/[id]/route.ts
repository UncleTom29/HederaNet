import { NextRequest } from "next/server";
import { prisma } from "@hederanet/db";
import { apiResponse, apiError, authenticate } from "../../_lib/api";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: { hotspot: true },
  });

  if (!subscription) return apiError("Subscription not found", 404);
  if (subscription.userId !== auth.payload.sub) return apiError("Forbidden", 403);

  return apiResponse(subscription);
}

// DELETE /api/subscriptions/[id] — cancel subscription
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await authenticate(req);
  if (auth.error) return auth.error;

  const subscription = await prisma.subscription.findUnique({ where: { id: params.id } });
  if (!subscription) return apiError("Subscription not found", 404);
  if (subscription.userId !== auth.payload.sub) return apiError("Forbidden", 403);
  if (subscription.status === "CANCELLED") return apiError("Already cancelled", 400);

  const updated = await prisma.subscription.update({
    where: { id: params.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  return apiResponse(updated);
}
