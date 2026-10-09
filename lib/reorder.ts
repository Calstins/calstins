import { NextResponse } from "next/server";

type OrderDelegate = { update(args: { where: { id: string }; data: { order: number } }): Promise<unknown> };

/**
 * Writes `order = index` for each id. No transaction is assumed: every update is
 * independent, so a partial failure leaves a consistent (if partly old) ordering
 * and is reported to the caller instead of being swallowed.
 */
export async function applyReorder(delegate: OrderDelegate, ids: string[]) {
  const results = await Promise.allSettled(ids.map((id, i) => delegate.update({ where: { id }, data: { order: i } })));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) {
    return NextResponse.json({ error: `${failed} of ${ids.length} items could not be reordered. Refresh and try again.` }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
