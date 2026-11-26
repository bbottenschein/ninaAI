import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Umgebungsvariable ${name} fehlt. Siehe .env.example und README.md.`);
  }
  return value;
}

/** Secret Key von Supabase: umgeht RLS, nur für Jobs und Skripte. */
export const supabaseSecretKey = () => required("SUPABASE_SECRET_KEY");

/** Schützt die Routen unter /api/jobs/*. */
export const jobsSecret = () => required("JOBS_SECRET");

/** Wird vom Anthropic-SDK selbst gelesen; hier nur für eine klare Fehlermeldung. */
export const anthropicApiKey = () => required("ANTHROPIC_API_KEY");

/** Für die Spracherkennung im Tutor-Gespräch. Optional: fehlt er, wird getippt. */
export const openaiApiKey = (): string | null => process.env.OPENAI_API_KEY || null;
