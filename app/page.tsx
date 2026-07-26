import { getSuiteUser } from "@/lib/auth";
import { isVideoConfigured } from "@/lib/config";
import { listVideos } from "@/lib/store";
import { publicVideo } from "@/lib/videos";
import { VideoApp } from "./video-app";
import type { PublicVideo } from "@/lib/videos";

export const dynamic = "force-dynamic";

const previewVideos: PublicVideo[] = [
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff001", ownerId: "canale-atlante", ownerName: "Atlante Comune", title: "La città dopo l’automobile", description: "Mobilità pubblica, quartieri di prossimità e nuovi spazi collettivi.", category: "territorio", visibility: "public", durationSeconds: 1084, viewCount: 18420, likeCount: 1260, commentCount: 184, publishedAt: "2026-07-24T18:10:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff002", ownerId: "canale-lab", ownerName: "Laboratorio Aperto", title: "Intelligenza artificiale: chi decide davvero?", description: "Un’inchiesta sugli algoritmi, il lavoro e il controllo democratico della tecnologia.", category: "scienza", visibility: "public", durationSeconds: 1568, viewCount: 32600, likeCount: 2840, commentCount: 391, publishedAt: "2026-07-23T16:00:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff003", ownerId: "canale-officina", ownerName: "Officina Cultura", title: "Suoni dalla fabbrica che cambia", description: "Performance, memoria operaia e musica elettronica dal vivo.", category: "musica", visibility: "public", durationSeconds: 2634, viewCount: 9710, likeCount: 804, commentCount: 92, publishedAt: "2026-07-21T20:30:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff004", ownerId: "canale-scuola", ownerName: "Scuola Diffusa", title: "Imparare senza competere", description: "Esperienze di educazione cooperativa raccontate da studenti e insegnanti.", category: "formazione", visibility: "public", durationSeconds: 822, viewCount: 12560, likeCount: 930, commentCount: 111, publishedAt: "2026-07-20T12:00:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff005", ownerId: "canale-terra", ownerName: "Terra in Comune", title: "Acqua, suolo, comunità", description: "Come un territorio ha ricostruito la gestione condivisa delle risorse.", category: "societa", visibility: "public", durationSeconds: 1942, viewCount: 22100, likeCount: 1802, commentCount: 207, publishedAt: "2026-07-18T09:00:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff006", ownerId: "canale-dati", ownerName: "Dati Pubblici", title: "Un cloud pubblico può essere bello?", description: "Design, infrastruttura e sovranità digitale oltre le piattaforme estrattive.", category: "scienza", visibility: "public", durationSeconds: 1170, viewCount: 15320, likeCount: 1405, commentCount: 164, publishedAt: "2026-07-17T15:20:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff007", ownerId: "canale-cinema", ownerName: "Cinema Minimo", title: "Archivio delle lotte, episodio 01", description: "Materiali restaurati e testimonianze dal movimento per la casa.", category: "cultura", visibility: "public", durationSeconds: 3065, viewCount: 7860, likeCount: 694, commentCount: 76, publishedAt: "2026-07-14T17:45:00.000Z", hasPoster: false },
  { id: "7d2b778b-ff17-42b4-bf61-2f4dc22ff008", ownerId: "canale-lavoro", ownerName: "Inchiesta Lavoro", title: "La settimana di quattro giorni", description: "Dati, conflitti e risultati delle prime sperimentazioni italiane.", category: "lavoro", visibility: "public", durationSeconds: 1436, viewCount: 41200, likeCount: 3610, commentCount: 512, publishedAt: "2026-07-12T10:15:00.000Z", hasPoster: false },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  if (process.env.VIDEO_INTERFACE_PREVIEW === "true") {
    return <VideoApp configured user={{ id: "video-preview", name: "Andrea Rossi", email: "preview@tecnosocialismo.com" }} initialVideos={previewVideos} initialQuery={q.slice(0, 100)} previewMode />;
  }
  const configured = isVideoConfigured();
  const [user, records] = await Promise.all([
    getSuiteUser(),
    configured ? listVideos() : Promise.resolve([]),
  ]);

  return <VideoApp configured={configured} user={user} initialVideos={records.filter((video) => video.visibility === "public" && video.status === "ready").slice(0, 100).map(publicVideo)} initialQuery={q.slice(0, 100)} />;
}
