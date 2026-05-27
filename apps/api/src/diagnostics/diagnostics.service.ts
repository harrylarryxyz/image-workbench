import { Injectable } from '@nestjs/common';

@Injectable()
export class DiagnosticsService {
  classify(error: string | null | undefined): { code: string; suggestion: string } | null {
    const msg = (error ?? '').toLowerCase();
    if (!msg) return null;
    if (msg.includes('401') || msg.includes('403')) return { code: 'auth', suggestion: 'Check provider API key, account entitlement, or proxy auth.' };
    if (msg.includes('429') || msg.includes('quota')) return { code: 'quota', suggestion: 'Provider quota/rate limit hit. Wait or switch provider.' };
    if (msg.includes('504') || msg.includes('timeout')) return { code: 'timeout', suggestion: 'Complex image requests may time out. Reduce size/prompt complexity or use a more stable provider.' };
    if (msg.includes('html instead of json')) return { code: 'gateway_html', suggestion: 'Upstream gateway returned an HTML error page. Check proxy/provider availability.' };
    if (msg.includes('transparent')) return { code: 'unsupported_parameter', suggestion: 'GPT Image 2 does not support transparent background; use gpt-image-1.5.' };
    return { code: 'provider_error', suggestion: 'Inspect route metadata and raw provider error.' };
  }
}
