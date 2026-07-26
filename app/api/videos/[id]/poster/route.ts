import { get } from "@vercel/blob";
import { getSuiteUser } from "@/lib/auth";
import { readVideo } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await readVideo(id);
  if (!video?.posterBlobUrl || video.status !== "ready") return new Response("Non trovato", { status: 404 });
  if (video.visibility === "private") {
    const user = await getSuiteUser(request.headers);
    if (!user || user.id !== video.ownerId) return new Response("Non trovato", { status: 404 });
  }
  const result = await get(video.posterBlobUrl, { access: "private", useCache: true, ifNoneMatch: request.headers.get("if-none-match") ?? undefined });
  if (!result) return new Response("Non trovato", { status: 404 });
  if (result.statusCode === 304) return new Response(null, { status: 304 });
  return new Response(result.stream, { headers: { "Content-Type": result.blob.contentType, "Content-Length": String(result.blob.size), ETag: result.blob.etag, "Cache-Control": video.visibility === "private" ? "private, max-age=300" : "public, max-age=86400, s-maxage=604800" } });
}
