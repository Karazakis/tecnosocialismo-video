import { getSuiteUser } from "@/lib/auth";
import { hasLike, readVideo, setLike, updateVideo } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSuiteUser(request.headers);
  if (!user) return Response.json({ error: "Accesso richiesto" }, { status: 401 });
  const { id } = await params;
  const video = await readVideo(id);
  if (!video || video.status !== "ready" || (video.visibility === "private" && video.ownerId !== user.id)) return Response.json({ error: "Video non trovato" }, { status: 404 });

  const existing = await hasLike(id, user.id);
  await setLike(id, user.id, !existing);
  const updated = await updateVideo(id, (current) => ({ ...current, likeCount: Math.max(0, current.likeCount + (existing ? -1 : 1)) }));
  return Response.json({ liked: !existing, count: updated?.likeCount ?? video.likeCount });
}
