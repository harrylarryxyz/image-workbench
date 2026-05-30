import { z } from 'zod';

export const ApiModeSchema = z.enum(['auto', 'images', 'responses']);
export type ApiMode = z.infer<typeof ApiModeSchema>;

export const TaskStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled', 'retrying']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const ProviderTypeSchema = z.enum(['openai-compatible', 'fal', 'custom-http']);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ImageFormatSchema = z.enum(['png', 'jpeg', 'webp']);
export type ImageFormat = z.infer<typeof ImageFormatSchema>;

export const ImageQualitySchema = z.enum(['low', 'medium', 'high', 'auto']);
export type ImageQuality = z.infer<typeof ImageQualitySchema>;

export const ProviderProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ProviderTypeSchema,
  baseUrl: z.string().url(),
  defaultModel: z.string(),
  apiMode: ApiModeSchema,
  enabled: z.boolean(),
});
export type ProviderProfile = z.infer<typeof ProviderProfileSchema>;

export const ModelCapabilitySchema = z.object({
  model: z.string(),
  supportsGenerate: z.boolean(),
  supportsEdit: z.boolean(),
  supportsMask: z.boolean(),
  supportsTransparent: z.boolean(),
  supportsMultipleRefs: z.boolean(),
  maxRefs: z.number().int().positive().optional(),
  maxOutputCount: z.number().int().positive().optional(),
  maxGenerateOutputCount: z.number().int().positive().optional(),
  maxEditOutputCount: z.number().int().positive().optional(),
  maxProviderEditOutputCount: z.number().int().positive().optional(),
  recommendedTimeoutSec: z.number().int().positive().optional(),
  sizes: z.array(z.string()).optional(),
  qualities: z.array(z.string()).optional(),
  formats: z.array(z.string()).optional(),
  apiModes: z.array(ApiModeSchema).optional(),
});
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const GenerateImageRequestSchema = z.object({
  providerId: z.string().optional(),
  prompt: z.string().min(1),
  model: z.string().optional(),
  size: z.string().default('1024x1024'),
  quality: ImageQualitySchema.default('low'),
  format: ImageFormatSchema.default('png'),
  background: z.enum(['auto', 'opaque', 'transparent']).default('auto'),
  apiMode: ApiModeSchema.default('auto'),
  count: z.number().int().min(1).max(4).default(1),
  timeoutSec: z.number().int().min(30).max(900).default(300),
});
export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;

export const RouteMetadataSchema = z.object({
  requestedModel: z.string(),
  resolvedModel: z.string(),
  apiMode: ApiModeSchema,
  endpoint: z.string(),
  fallbackAttempted: z.boolean(),
  fallbackReason: z.string().nullable(),
});
export type RouteMetadata = z.infer<typeof RouteMetadataSchema>;

export const TaskSummarySchema = z.object({
  id: z.string(),
  status: TaskStatusSchema,
  prompt: z.string(),
  model: z.string(),
  route: RouteMetadataSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});
export type TaskSummary = z.infer<typeof TaskSummarySchema>;
