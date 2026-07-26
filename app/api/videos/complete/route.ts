import { del, head } from "@vercel/blob";
import { getSuiteUser } from "@/lib/auth";
import { saveVideo } from "@/lib/store";
import { publicVideo, safeText, type StoredVideo } from "@/lib/videos";

type BlobInput = { url?: string; pathname?: string } | null;
type CompletionBody = {
  title?: string;
  description?: string;
  category?: string;
  visibility?: "public" | "unlisted" | "private";
  durationSeconds?: number;
  video?: BlobInput;
  poster?: BlobInput;
};

const allowedCategories = new Set(["societa", "cultura", "scienza", "lavoro", "formazione", "musica", "territorio", "altro"]);

export async function POST(request: Request) {
  const user = await getSuiteUser(request.headers);
  if (!user) return Response.json({ error: "Accesso richiesto" }, { status: 401 });
  const body = (await request.json()) as CompletionBody;
  const title = safeText(body.title, 140);
  const description = safeText(body.description, 5000);
  const category = allowedCategories.has(body.category ?? "") ? body.category! : "altro";
  const visibility = ["public", "unlisted", "private"].includes(body.visibility ?? "") ? body.visibility! : "public";
  if (!title || !body.video?.url || !body.video.pathname) return Response.json({ error: "Dati del video incompleti" }, { status: 400 });

  const ownedVideoPrefix = `video/${user.id}/`;
  if (!body.video.pathname.startsWith(ownedVideoPrefix)) return Response.json({ error: "Video non riconosciuto" }, { status: 400 });

  const cleanupUrls: string[] = [];
  try {
    const videoBlob = await head(body.video.url);
    if (videoBlob.pathname !== body.video.pathname || !videoBlob.contentType.startsWith("video/")) throw new Error("Formato video non valido");
    cleanupUrls.push(videoBlob.url);

    let posterBlob: Awaited<ReturnType<typeof head>> | null = null;
    if (body.poster?.url && body.poster.pathname) {
      if (!body.poster.pathname.startsWith(`poster/${user.id}/`)) throw new Error("Anteprima non riconosciuta");
      posterBlob = await head(body.poster.url);
      if (posterBlob.pathname !== body.poster.pathname || !posterBlob.contentType.startsWith("image/")) throw new Error("Anteprima non valida");
      cleanupUrls.push(posterBlob.url);
    }

    const now = new Date().toISOString();
    const record: StoredVideo = {
      id: crypto.randomUUID(), ownerId: user.id, ownerName: user.name, title, description, category, visibility,
      status: "ready", blobUrl: videoBlob.url, pathname: videoBlob.pathname,
      posterBlobUrl: posterBlob?.url ?? null, posterPathname: posterBlob?.pathname ?? null,
      mimeType: videoBlob.contentType, sizeBytes: videoBlob.size,
      durationSeconds: Math.max(0, Math.min(24 * 60 * 60, Math.round(Number(body.durationSeconds) || 0))),
      viewCount: 0, likeCount: 0, commentCount: 0, publishedAt: now, createdAt: now, updatedAt: now,
      hasPoster: Boolean(posterBlob),
    };
    await saveVideo(record);
    return Response.json({ video: publicVideo(record) }, { status: 201 });
  } catch (error) {
    if (cleanupUrls.length) await del(cleanupUrls).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : "Pubblicazione non riuscita" }, { status: 500 });
  }
}
