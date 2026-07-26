import { getSuiteUser } from "@/lib/auth";
import { readVideo, saveComment, updateVideo } from "@/lib/store";
import { publicComment, safeText, type StoredComment } from "@/lib/videos";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSuiteUser(request.headers);
  if (!user) return Response.json({ error: "Accesso richiesto" }, { status: 401 });
  const { id } = await params;
  const video = await readVideo(id);
  if (!video || video.status !== "ready" || (video.visibility === "private" && video.ownerId !== user.id)) return Response.json({ error: "Video non trovato" }, { status: 404 });
  const payload = (await request.json()) as { body?: string };
  const body = safeText(payload.body, 2000);
  if (!body) return Response.json({ error: "Il commento è vuoto" }, { status: 400 });
  const comment: StoredComment = { id: crypto.randomUUID(), videoId: id, authorId: user.id, authorName: user.name, body, createdAt: new Date().toISOString() };
  await saveComment(comment);
  await updateVideo(id, (current) => ({ ...current, commentCount: current.commentCount + 1 }));
  return Response.json({ comment: publicComment(comment) }, { status: 201 });
}
