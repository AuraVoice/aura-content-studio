export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-aura_studio_session"
    : "aura_studio_session";
