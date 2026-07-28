import { z } from "zod";

const serverSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  STUDIO_USERNAME: z.string().min(3),
  STUDIO_PASSWORD: z.string().min(16),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  TELEGRAM_ALLOWED_CHAT_ID: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_TEXT_MODEL: z.string().default("gemini-3.5-flash"),
  GEMINI_VIDEO_MODEL: z.string().default("gemini-3.5-flash"),
  SEARCH_PROVIDER: z.enum(["brave", "mock"]).default("mock"),
  BRAVE_SEARCH_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default("aura-content-media"),
  CRON_SECRET: z.string().min(16),
  STUDIO_TIMEZONE: z.string().default("America/Los_Angeles")
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedEnv: ServerEnv | undefined;

export function env(): ServerEnv {
  if (!cachedEnv) {
    const result = serverSchema.safeParse(process.env);
    if (!result.success) {
      const missing = result.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ");
      throw new Error(`Invalid server environment: ${missing}`);
    }
    if (result.data.SEARCH_PROVIDER === "brave" && !result.data.BRAVE_SEARCH_API_KEY) {
      throw new Error("BRAVE_SEARCH_API_KEY is required when SEARCH_PROVIDER=brave");
    }
    cachedEnv = result.data;
  }
  return cachedEnv;
}

export function hasCoreEnvironment(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.DATABASE_URL
  );
}

export function resetEnvForTests(): void {
  cachedEnv = undefined;
}
