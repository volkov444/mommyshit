import { getSupabaseServerClient } from "./server";

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
}

// Resolves the real logged-in user id from a request's bearer token.
// There's no cookie-session helper in this app (see session.ts) — the
// browser Supabase client's access token is sent explicitly instead and
// verified here against the service-role client.
export async function authenticateRequest(request: Request): Promise<string | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
