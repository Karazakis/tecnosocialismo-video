import { get } from "@vercel/blob";
import { getSuiteUser } from "@/lib/auth";
import { readVideo } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await readVideo(id);
  if (!video || video.status !== "ready") return new Response("Non trovato", { status: 404 });
  if (video.visibility === "private") {
    const user = await getSuiteUser(request.headers);
    if (!user || user.id !== video.ownerId) return new Response("Non trovato", { status: 404 });
  }

  const forwardedHeaders: HeadersInit = {};
  const range = request.headers.get("range");
  if (range) forwardedHeaders.Range = range;
  const result = await get(video.blobUrl, { access: "private", headers: forwardedHeaders, useCache: true });
  if (!result) return new Response("Non trovato", { status: 404 });
  if (result.statusCode === 304) return new Response(null, { status: 304 });

  const contentRange = result.headers.get("content-range");
  const headers = new Headers({
    "Content-Type": result.blob.contentType || video.mimeType,
    "Content-Length": result.headers.get("content-length") || String(result.blob.size),
    "Accept-Ranges": result.headers.get("accept-ranges") || "bytes",
    "Cache-Control": video.visibility === "private" ? "private, max-age=300" : "public, max-age=3600, s-maxage=86400",
    ETag: result.blob.etag,
    "X-Content-Type-Options": "nosniff",
  });
  if (contentRange) headers.set("Content-Range", contentRange);
  return new Response(result.stream, { status: contentRange ? 206 : 200, headers });
}
