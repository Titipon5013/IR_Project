export const SUPABASE_ENV_KEYS = {
  url: 'NEXT_PUBLIC_SUPABASE_URL',
  anonKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
} as const;

export const SUPABASE_CONFIG_HINTS = [
  `${SUPABASE_ENV_KEYS.url}=https://<your-project-ref>.supabase.co`,
  `${SUPABASE_ENV_KEYS.anonKey}=<your-supabase-anon-key>`,
] as const;

