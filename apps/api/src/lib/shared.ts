import { z } from 'zod';

export const ApiModeSchema = z.enum(['auto', 'images', 'responses']);
export type ApiMode = z.infer<typeof ApiModeSchema>;

export const ImageFormatSchema = z.enum(['png', 'jpeg', 'webp']);
export const ImageQualitySchema = z.enum(['low', 'medium', 'high', 'auto']);

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

export type ProviderProfile = {
  id: string;
  name: string;
  type: 'openai-compatible' | 'fal' | 'custom-http';
  baseUrl: string;
  defaultModel: string;
  apiMode: ApiMode;
  enabled: boolean;
};
