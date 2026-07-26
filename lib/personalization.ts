import type { ViewingSignal } from "./recommendations";

const historyKey = "ts-video-history-v1";
const savedKey = "ts-video-saved-v1";
const followsKey = "ts-video-follows-v1";
const autoplayKey = "ts-video-autoplay-v1";

export function readHistory(): ViewingSignal[] {
  const value = readJson<unknown>(historyKey, []);
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ViewingSignal => Boolean(
      item && typeof item === "object" &&
      "videoId" in item && typeof item.videoId === "string" &&
      "category" in item && typeof item.category === "string" &&
      "ownerId" in item && typeof item.ownerId === "string" &&
      "watchedAt" in item && typeof item.watchedAt === "string",
    ))
    .slice(0, 80);
}

export function rememberVideo(signal: Omit<ViewingSignal, "watchedAt">) {
  const history = readHistory().filter((item) => item.videoId !== signal.videoId);
  const next: ViewingSignal = {
    ...signal,
    progress: Math.max(0, Math.min(1, signal.progress)),
    watchedAt: new Date().toISOString(),
  };
  writeJson(historyKey, [next, ...history].slice(0, 80));
  return next;
}

export function readSaved() {
  return new Set(readStringArray(savedKey));
}

export function toggleSaved(videoId: string) {
  const values = readSaved();
  if (values.has(videoId)) values.delete(videoId);
  else values.add(videoId);
  writeJson(savedKey, [...values]);
  return values.has(videoId);
}

export function readFollows() {
  return new Set(readStringArray(followsKey));
}

export function toggleFollow(ownerId: string) {
  const values = readFollows();
  if (values.has(ownerId)) values.delete(ownerId);
  else values.add(ownerId);
  writeJson(followsKey, [...values]);
  return values.has(ownerId);
}

export function readAutoplay() {
  return readJson<boolean>(autoplayKey, true);
}

export function setAutoplay(value: boolean) {
  writeJson(autoplayKey, value);
}

function readStringArray(key: string) {
  const value = readJson<unknown>(key, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 500) : [];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Spazio locale non disponibile. */ }
}
