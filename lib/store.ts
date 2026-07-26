import { del, get, list, put } from "@vercel/blob";
import type { StoredComment, StoredVideo } from "./videos";

const META_PREFIX = "video-meta/";
const COMMENT_PREFIX = "video-comments/";
const LIKE_PREFIX = "video-likes/";

export async function saveVideo(video: StoredVideo) {
  await writeJson(`${META_PREFIX}${video.id}.json`, video, false);
  return video;
}

export async function readVideo(id: string): Promise<StoredVideo | null> {
  if (!isUuid(id)) return null;
  return readJson<StoredVideo>(`${META_PREFIX}${id}.json`);
}

export async function listVideos(): Promise<StoredVideo[]> {
  const result = await list({ prefix: META_PREFIX, limit: 1000 });
  const records = await Promise.all(result.blobs.map((blob) => readJson<StoredVideo>(blob.url)));
  return records.filter((item): item is StoredVideo => Boolean(item)).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function updateVideo(id: string, mutate: (video: StoredVideo) => StoredVideo) {
  const current = await readVideo(id);
  if (!current) return null;
  const updated = mutate({ ...current, updatedAt: new Date().toISOString() });
  await writeJson(`${META_PREFIX}${id}.json`, updated, true);
  return updated;
}

export async function listComments(videoId: string): Promise<StoredComment[]> {
  if (!isUuid(videoId)) return [];
  const result = await list({ prefix: `${COMMENT_PREFIX}${videoId}/`, limit: 1000 });
  const comments = await Promise.all(result.blobs.map((blob) => readJson<StoredComment>(blob.url)));
  return comments.filter((item): item is StoredComment => Boolean(item)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function saveComment(comment: StoredComment) {
  await writeJson(`${COMMENT_PREFIX}${comment.videoId}/${comment.createdAt.replace(/[:.]/g, "-")}-${comment.id}.json`, comment, false);
  return comment;
}

export async function hasLike(videoId: string, userId: string) {
  const result = await list({ prefix: `${LIKE_PREFIX}${videoId}/${safeKey(userId)}.json`, limit: 1 });
  return result.blobs.length > 0;
}

export async function setLike(videoId: string, userId: string, liked: boolean) {
  const pathname = `${LIKE_PREFIX}${videoId}/${safeKey(userId)}.json`;
  if (liked) await writeJson(pathname, { videoId, userId, createdAt: new Date().toISOString() }, true);
  else await del(pathname).catch(() => undefined);
}

async function writeJson(pathname: string, value: unknown, allowOverwrite: boolean) {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 0,
  });
}

async function readJson<T>(urlOrPathname: string): Promise<T | null> {
  try {
    const result = await get(urlOrPathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch { return null; }
}

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
