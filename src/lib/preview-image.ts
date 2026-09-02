import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function handlePreviewImageRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");

  if (!path || !path.startsWith("previews/")) {
    return new Response("Invalid or missing path", { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from("career-tools")
      .download(path);

    if (error || !data) {
      console.error("Preview image fetch error:", error);
      return new Response("Image not found", { status: 404 });
    }

    const ext = path.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "gif") contentType = "image/gif";
    else if (ext === "svg") contentType = "image/svg+xml";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Preview image server error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
