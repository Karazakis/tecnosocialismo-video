export type PublicVideo = {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  category: string;
  visibility: "public" | "unlisted" | "private";
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  hasPoster: boolean;
};

export type StoredVideo = PublicVideo & {
  status: "processing" | "ready" | "failed";
  blobUrl: string;
  pathname: string;
  posterBlobUrl: string | null;
  posterPathname: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type StoredComment = PublicComment & {
  videoId: string;
  authorId: string;
};

export function publicVideo(video: StoredVideo): PublicVideo {
  return {
    id: video.id,
    ownerId: video.ownerId,
    ownerName: video.ownerName,
    title: video.title,
    description: video.description,
    category: video.category,
    visibility: video.visibility,
    durationSeconds: video.durationSeconds,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    publishedAt: video.publishedAt,
    hasPoster: Boolean(video.posterBlobUrl),
  };
}

export function publicComment(comment: StoredComment): PublicComment {
  return { id: comment.id, authorName: comment.authorName, body: comment.body, createdAt: comment.createdAt };
}

export function safeText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\0/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export const categoryLabels: Record<string, string> = {
  tutti: "Tutto",
  societa: "Società",
  cultura: "Cultura",
  scienza: "Scienza",
  lavoro: "Lavoro",
  formazione: "Formazione",
  musica: "Musica",
  territorio: "Territori",
  altro: "Altro",
};

export function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("it-IT", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}
