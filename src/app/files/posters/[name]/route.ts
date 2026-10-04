import { eq } from "drizzle-orm";

import { db } from "@/db";
import { jobListings } from "@/db/schema";
import { contentTypeForKey, readUpload } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(params.name)) {
    return new Response("Not found", { status: 404 });
  }
  const key = `posters/${params.name}`;

  // Only serve keys that belong to a listing, never arbitrary bucket objects.
  const job = await db.query.jobListings.findFirst({
    columns: { id: true },
    where: eq(jobListings.posterKey, key),
  });
  if (!job) return new Response("Not found", { status: 404 });

  const body = await readUpload(key);
  if (!body) return new Response("Not found", { status: 404 });

  return new Response(body, {
    headers: {
      "Content-Type": contentTypeForKey(key),
      // Keys are random and never reused, so the bytes never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
