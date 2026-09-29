import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_APP_NAME: z.string().default('ITS QLSX - Quản lý Sản xuất'),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Validates process / Vite environment variables at application startup.
 * Throws a descriptive error early if required configuration is missing or malformed.
 */
function validateEnv() {
  const result = envSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_ENV:
      import.meta.env.VITE_APP_ENV ?? (import.meta.env.DEV ? 'development' : 'production'),
  });

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n❌ [Environment Configuration Error] Missing or invalid environment variables:\n${formattedErrors}\n\nPlease check your .env.local file.\n`,
    );
  }

  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
