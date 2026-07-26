import { isVideoConfigured } from "@/lib/config";
import { listVideos } from "@/lib/store";
import { publicVideo } from "@/lib/videos";

export async function GET(request: Request) {
  if (!isVideoConfigured()) return Response.json({ videos: [], configured: false });
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().slice(0, 80);
  const category = url.searchParams.get("category")?.trim().slice(0, 30);
  const clean = query?.toLocaleLowerCase("it");
  const records = (await listVideos()).filter((video) => {
    if (video.visibility !== "public" || video.status !== "ready") return false;
    if (category && video.category !== category) return false;
    if (clean && ![video.title, video.description, video.ownerName].some((part) => part.toLocaleLowerCase("it").includes(clean))) return false;
    return true;
  }).slice(0, 60);
  return Response.json({ videos: records.map(publicVideo), configured: true }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
