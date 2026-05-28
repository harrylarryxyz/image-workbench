export type Provider = {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  defaultModel: string;
  apiMode: string;
  enabled: boolean;
  apiKeyMasked: string;
  capabilities?: {
    generate: boolean | null;
    edit: boolean | null;
    mask: boolean | null;
    transparent: boolean | null;
    multipleRefs: boolean | null;
    maxRefs: number | null;
    recommendedTimeoutSec: number | null;
    maxOutputCount?: number | null;
    sizes?: string[] | null;
    qualities?: string[] | null;
    formats?: string[] | null;
    apiModes?: string[] | null;
    source: string;
  };
  editHealth?: {
    status: 'healthy' | 'failing' | 'unknown' | 'untested' | 'ok';
    lastTaskStatus: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    checkedAt: string | null;
  };
  updatedAt?: string;
};

export type Message = { kind: 'idle' | 'success' | 'error' | 'info'; text: string; detail?: unknown };
