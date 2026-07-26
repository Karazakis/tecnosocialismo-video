import { notFound } from "next/navigation";
import { getSuiteUser } from "@/lib/auth";
import { isVideoConfigured } from "@/lib/config";
import { hasLike, listComments, listVideos, readVideo } from "@/lib/store";
import { publicComment, publicVideo, type PublicVideo } from "@/lib/videos";
import { rankVideos } from "@/lib/recommendations";
import { VideoViewer } from "./video-viewer";

export const dynamic = "force-dynamic";

const previewWatchVideos: PublicVideo[] = [
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff002", ownerId: "canale-lab", ownerName: "Laboratorio Aperto", title: "Intelligenza artificiale: chi decide davvero?", description: "Un’inchiesta sugli algoritmi, il lavoro e il controllo democratico della tecnologia. Esperienze, dati e proposte per costruire infrastrutture intelligenti che rispondano alle persone e non agli inserzionisti.", category: "scienza", visibility: "public", durationSeconds: 1568, viewCount: 32600, likeCount: 2840, commentCount: 391, publishedAt: "2026-07-23T16:00:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff006", ownerId: "canale-dati", ownerName: "Dati Pubblici", title: "Un cloud pubblico può essere bello?", description: "Design e sovranità digitale.", category: "scienza", visibility: "public", durationSeconds: 1170, viewCount: 15320, likeCount: 1405, commentCount: 164, publishedAt: "2026-07-17T15:20:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff008", ownerId: "canale-lavoro", ownerName: "Inchiesta Lavoro", title: "La settimana di quattro giorni", description: "Dati e risultati delle sperimentazioni.", category: "lavoro", visibility: "public", durationSeconds: 1436, viewCount: 41200, likeCount: 3610, commentCount: 512, publishedAt: "2026-07-12T10:15:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff001", ownerId: "canale-atlante", ownerName: "Atlante Comune", title: "La città dopo l’automobile", description: "Mobilità pubblica e quartieri di prossimità.", category: "territorio", visibility: "public", durationSeconds: 1084, viewCount: 18420, likeCount: 1260, commentCount: 184, publishedAt: "2026-07-24T18:10:00.000Z", hasPoster: false },
];

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSuiteUser();
  if (process.env.VIDEO_INTERFACE_PREVIEW === "true") {
    const selected = previewWatchVideos.find((video) => video.id === id) ?? previewWatchVideos[0];
    const recommendations = rankVideos(previewWatchVideos.filter((video) => video.id !== selected.id), { seed: selected }, 10);
    return <VideoViewer video={selected} recommendations={recommendations} initialComments={[{ id: "preview-comment", authorName: "Giulia Ferri", body: "La parte sul controllo pubblico dei modelli apre una discussione che mancava.", createdAt: "2026-07-25T18:30:00.000Z" }]} user={user} initiallyLiked={false} previewMode />;
  }
  if (!isVideoConfigured()) notFound();
  const record = await readVideo(id);
  if (!record || record.status !== "ready") notFound();
  if (record.visibility === "private" && user?.id !== record.ownerId) notFound();

  const [comments, allVideos, liked] = await Promise.all([
    listComments(id),
    listVideos(),
    user ? hasLike(id, user.id) : Promise.resolve(false),
  ]);
  const publicRecord = publicVideo(record);
  const candidates = allVideos
    .filter((video) => video.id !== id && video.visibility === "public" && video.status === "ready")
    .map(publicVideo);
  const recommendations = rankVideos(candidates, { seed: publicRecord }, 10);

  return <VideoViewer video={publicRecord} recommendations={recommendations} initialComments={comments.map(publicComment)} user={user} initiallyLiked={liked} />;
}
