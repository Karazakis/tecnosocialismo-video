import type { PublicVideo } from "./videos";

export type ViewingSignal = {
  videoId: string;
  category: string;
  ownerId: string;
  watchedAt: string;
  progress: number;
};

export type RankedVideo = {
  video: PublicVideo;
  score: number;
  reason: string;
  reasonCode: "topic" | "affinity" | "community" | "fresh" | "explore";
};

type RecommendationContext = {
  history?: ViewingSignal[];
  seed?: PublicVideo | null;
  now?: number;
};

const stopWords = new Set([
  "alla", "alle", "anche", "come", "dalla", "delle", "dello", "dopo", "dove",
  "della", "degli", "dentro", "essere", "questa", "questo", "sono", "sulla",
  "sulle", "tutto", "video", "with", "from", "into", "that", "this", "your",
]);

export function rankVideos(
  videos: PublicVideo[],
  context: RecommendationContext = {},
  limit = videos.length,
): RankedVideo[] {
  const history = context.history ?? [];
  const now = context.now ?? Date.now();
  const watched = new Set(history.map((item) => item.videoId));
  const categoryAffinity = frequency(history.map((item) => item.category));
  const ownerAffinity = frequency(history.map((item) => item.ownerId));
  const seedTerms = context.seed ? termsFor(context.seed) : new Set<string>();

  return videos
    .filter((video) => video.id !== context.seed?.id)
    .map((video) => {
      const ageDays = Math.max(0, (now - new Date(video.publishedAt).getTime()) / 86_400_000);
      const freshness = Math.max(0, 1 - ageDays / 180);
      const popularity = Math.log10(video.viewCount + 10) / 2;
      const engagement = Math.min(1, (video.likeCount * 2 + video.commentCount * 1.5) / Math.max(8, video.viewCount));
      const categorySignal = normalizedFrequency(categoryAffinity, video.category);
      const ownerSignal = normalizedFrequency(ownerAffinity, video.ownerId);
      const topicSignal = context.seed ? similarity(seedTerms, termsFor(video)) : 0;
      const sameCategory = context.seed?.category === video.category ? 1 : 0;
      const exploration = categoryAffinity.has(video.category) ? 0 : .7;
      const repeatPenalty = watched.has(video.id) ? 3.2 : 0;
      const deterministicJitter = stableFraction(video.id) * .18;

      const score =
        freshness * 2.2 +
        popularity * 1.25 +
        engagement * 2.5 +
        categorySignal * 3.1 +
        ownerSignal * .55 +
        topicSignal * 6.2 +
        sameCategory * 2.7 +
        exploration +
        deterministicJitter -
        repeatPenalty;

      const explanation = explain({
        topicSignal,
        sameCategory,
        categorySignal,
        popularity,
        engagement,
        freshness,
        exploration,
        seed: context.seed,
        video,
      });

      return { video, score, ...explanation };
    })
    .sort((a, b) => b.score - a.score || a.video.title.localeCompare(b.video.title, "it"))
    .slice(0, Math.max(0, limit));
}

export function trendingScore(video: PublicVideo, now = Date.now()) {
  const ageDays = Math.max(1, (now - new Date(video.publishedAt).getTime()) / 86_400_000);
  const activity = video.viewCount + video.likeCount * 6 + video.commentCount * 9 + 5;
  return Math.log10(activity) / Math.pow(ageDays + 1.5, .34);
}

function explain({
  topicSignal,
  sameCategory,
  categorySignal,
  popularity,
  engagement,
  freshness,
  exploration,
  seed,
  video,
}: {
  topicSignal: number;
  sameCategory: number;
  categorySignal: number;
  popularity: number;
  engagement: number;
  freshness: number;
  exploration: number;
  seed?: PublicVideo | null;
  video: PublicVideo;
}): Pick<RankedVideo, "reason" | "reasonCode"> {
  if (seed && topicSignal + sameCategory * .35 > .48) {
    return { reason: `Collegato a “${shortTitle(seed.title)}”`, reasonCode: "topic" };
  }
  if (categorySignal > .28) {
    return { reason: `Vicino ai temi che guardi`, reasonCode: "affinity" };
  }
  if (engagement > .2 || popularity > .72) {
    return { reason: "Sta generando una buona discussione", reasonCode: "community" };
  }
  if (freshness > .78) {
    return { reason: "Pubblicato di recente", reasonCode: "fresh" };
  }
  if (exploration > 0) {
    return { reason: `Un punto di vista da esplorare`, reasonCode: "explore" };
  }
  return { reason: `Scelto dal catalogo ${video.category}`, reasonCode: "explore" };
}

function termsFor(video: PublicVideo) {
  return new Set(
    `${video.title} ${video.description}`
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("it")
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 3 && !stopWords.has(term))
      .slice(0, 80),
  );
}

function similarity(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const term of left) if (right.has(term)) intersection += 1;
  return intersection / Math.sqrt(left.size * right.size);
}

function frequency(values: string[]) {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return result;
}

function normalizedFrequency(values: Map<string, number>, key: string) {
  const max = Math.max(0, ...values.values());
  return max ? (values.get(key) ?? 0) / max : 0;
}

function stableFraction(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function shortTitle(value: string) {
  return value.length > 34 ? `${value.slice(0, 31)}…` : value;
}
