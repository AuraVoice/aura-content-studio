import { GoogleGenAI } from "@google/genai";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { ZodType } from "zod";
import { z } from "zod";
import { env } from "@/lib/env";

let gemini: GoogleGenAI | undefined;

function client(): GoogleGenAI {
  gemini ??= new GoogleGenAI({ apiKey: env().GEMINI_API_KEY });
  return gemini;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export async function generateStructured<T>(
  schema: ZodType<T>,
  prompt: string,
  options: { model?: string; temperature?: number } = {}
): Promise<T> {
  const response = await client().models.generateContent({
    model: options.model ?? env().GEMINI_TEXT_MODEL,
    contents: prompt,
    config: {
      temperature: options.temperature ?? 0.35,
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(schema)
    }
  });
  if (!response.text) throw new Error("Gemini returned an empty response");
  return schema.parse(extractJson(response.text));
}

export async function evaluateVideoWithGemini<T>(input: {
  schema: ZodType<T>;
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  prompt: string;
}): Promise<T> {
  const extension = path.extname(input.fileName) || ".mp4";
  const tempPath = path.join(os.tmpdir(), `aura-${crypto.randomUUID()}${extension}`);
  await writeFile(tempPath, input.bytes);
  try {
    let uploaded = await client().files.upload({
      file: tempPath,
      config: { mimeType: input.mimeType, displayName: input.fileName }
    });
    const deadline = Date.now() + 120_000;
    while (uploaded.state === "PROCESSING") {
      if (Date.now() > deadline) throw new Error("Gemini video processing timed out");
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      if (!uploaded.name) throw new Error("Gemini upload has no file name");
      uploaded = await client().files.get({ name: uploaded.name });
    }
    if (uploaded.state === "FAILED") throw new Error("Gemini could not process the video");
    const response = await client().models.generateContent({
      model: env().GEMINI_VIDEO_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: uploaded.uri,
                mimeType: uploaded.mimeType ?? input.mimeType
              }
            },
            { text: input.prompt }
          ]
        }
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(input.schema)
      }
    });
    if (!response.text) throw new Error("Gemini returned an empty video evaluation");
    return input.schema.parse(extractJson(response.text));
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}

