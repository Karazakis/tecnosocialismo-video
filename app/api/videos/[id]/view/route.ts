import { updateVideo } from "@/lib/store";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await updateVideo(id, (video) => ({ ...video, viewCount: video.viewCount + 1 }));
  return new Response(null, { status: 204 });
}
