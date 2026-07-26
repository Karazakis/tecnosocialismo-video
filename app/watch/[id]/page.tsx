import { notFound } from "next/navigation";
import { getSuiteUser } from "@/lib/auth";
import { isVideoConfigured } from "@/lib/config";
import { hasLike, listComments, listVideos, readVideo } from "@/lib/store";
import { publicComment, publicVideo } from "@/lib/videos";
import { VideoViewer } from "./video-viewer";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isVideoConfigured()) notFound();
  const { id } = await params;
  const user = await getSuiteUser();
  const record = await readVideo(id);
  if (!record || record.status !== "ready") notFound();
  if (record.visibility === "private" && user?.id !== record.ownerId) notFound();

  const [comments, allVideos, liked] = await Promise.all([
    listComments(id),
    listVideos(),
    user ? hasLike(id, user.id) : Promise.resolve(false),
  ]);
  const related = allVideos.filter((video) => video.id !== id && video.visibility === "public" && video.status === "ready").slice(0, 6);

  return <VideoViewer video={publicVideo(record)} related={related.map(publicVideo)} initialComments={comments.map(publicComment)} user={user} initiallyLiked={liked} />;
}
