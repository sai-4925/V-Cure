import { z } from 'zod';

/**
 * AI FOUNDATION — Configuration
 * Source: AI___DESIGN master prompt "AI TECH STACK" (OpenAI-compatible APIs,
 * Gemini, RAG, Embeddings, Vector Database, OCR Engine, BullMQ, Redis).
 *
 * All configuration is environment-driven. No API keys or model names are
 * ever hardcoded in service code (CODE QUALITY: "No hardcoded secrets").
 */

const aiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().default('local-dev-mock-openai-key'),
  GEMINI_API_KEY: z.string().default('local-dev-mock-gemini-key'),
  VECTOR_DB_URL: z.string().optional(),
  AI_DEFAULT_PROVIDER: z.enum(['OPENAI_COMPATIBLE', 'GEMINI']).default('OPENAI_COMPATIBLE'),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_RETRY_BACKOFF_MS: z.coerce.number().int().positive().default(500),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-large'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(3072),
  EMBEDDING_CHUNK_SIZE_TOKENS: z.coerce.number().int().positive().default(512),
  EMBEDDING_CHUNK_OVERLAP_TOKENS: z.coerce.number().int().min(0).default(64),
  VECTOR_SEARCH_TOP_K: z.coerce.number().int().positive().default(5),
  VECTOR_SEARCH_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.72),
});

export type AIEnv = z.infer<typeof aiEnvSchema>;

/**
 * Parses and validates process.env. Fails fast at startup rather than at
 * first AI call — this is a foundation-layer guarantee, not optional.
 */
export function loadAIConfig(env: NodeJS.ProcessEnv = process.env): AIEnv {
  const result = aiEnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid AI configuration: ${issues}`);
  }
  return result.data;
}

export const AI_CONFIG_TOKEN = 'AI_CONFIG';
