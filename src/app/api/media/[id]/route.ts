import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { downloadUpload } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseBody(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return new Response(null, { status: 401 });
  }

  const { id } = await context.params;
  const { row, bytes } = await downloadUpload(id);
  const total = bytes.byteLength;
  const range = request.headers.get("range");
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": `inline; filename="${String(row.file_name).replaceAll('"', "")}"`,
    "Content-Type": String(row.mime_type),
    "X-Content-Type-Options": "nosniff"
  };

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416 });
    const start = match[1] ? Number(match[1]) : 0;
    const requestedEnd = match[2] ? Number(match[2]) : total - 1;
    const end = Math.min(requestedEnd, total - 1);
    if (start > end || start >= total) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` }
      });
    }
    const chunk = bytes.slice(start, end + 1);
    return new Response(responseBody(chunk), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end}/${total}`
      }
    });
  }

  return new Response(responseBody(bytes), {
    headers: {
      ...baseHeaders,
      "Content-Length": String(total)
    }
  });
}
