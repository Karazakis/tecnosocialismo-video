import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSuiteUser } from "@/lib/auth";

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;
const MAX_POSTER_SIZE = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getSuiteUser(request.headers);
        if (!user) throw new Error("Accesso richiesto");
        const payload = parsePayload(clientPayload);
        const poster = payload.kind === "poster";
        const expected = poster ? `poster/${user.id}/` : `video/${user.id}/`;
        if (!pathname.startsWith(expected)) throw new Error("Percorso di caricamento non valido");
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: poster ? MAX_POSTER_SIZE : MAX_VIDEO_SIZE,
          allowedContentTypes: poster ? ["image/jpeg", "image/png", "image/webp"] : ["video/mp4", "video/webm", "video/quicktime"],
          validUntil: Date.now() + 30 * 60 * 1000,
          tokenPayload: JSON.stringify({ ownerId: user.id, kind: poster ? "poster" : "video" }),
        };
      },
      onUploadCompleted: async () => undefined,
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Caricamento non riuscito" }, { status: 400 });
  }
}

function parsePayload(value: string | null): { kind?: string } {
  try { return value ? JSON.parse(value) as { kind?: string } : {}; } catch { return {}; }
}
