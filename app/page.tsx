import { getSuiteUser } from "@/lib/auth";
import { isVideoConfigured } from "@/lib/config";
import { listVideos } from "@/lib/store";
import { publicVideo } from "@/lib/videos";
import { VideoApp } from "./video-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = isVideoConfigured();
  const [user, records] = await Promise.all([
    getSuiteUser(),
    configured ? listVideos() : Promise.resolve([]),
  ]);

  return <VideoApp configured={configured} user={user} initialVideos={records.filter((video) => video.visibility === "public" && video.status === "ready").slice(0, 60).map(publicVideo)} />;
}
