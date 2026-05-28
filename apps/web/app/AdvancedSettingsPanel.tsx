import { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

type AdvancedSettingsPanelProps = {
  advancedOpen: boolean;
  setAdvancedOpen: Dispatch<SetStateAction<boolean>>;
  model: string;
  setModel: (value: string) => void;
  size: string;
  setSize: (value: string) => void;
  quality: string;
  setQuality: (value: string) => void;
  format: string;
  setFormat: (value: string) => void;
  background: string;
  setBackground: (value: string) => void;
  apiMode: string;
  setApiMode: (value: string) => void;
  maskKey: string;
  setMaskKey: (value: string) => void;
};

export function AdvancedSettingsPanel({ advancedOpen, setAdvancedOpen, model, setModel, size, setSize, quality, setQuality, format, setFormat, background, setBackground, apiMode, setApiMode, maskKey, setMaskKey }: AdvancedSettingsPanelProps) {
  return <div className="rounded-2xl border border-border/70 bg-muted/20">
    <Button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" type="button" variant="ghost" onClick={() => setAdvancedOpen((value) => !value)} aria-expanded={advancedOpen}>
      <span><b>高级设置</b><small className="mt-1 block text-muted-foreground">Model / Size / Quality / Format</small></span>
      <span className="text-xl leading-none">{advancedOpen ? '−' : '+'}</span>
    </Button>
    {advancedOpen ? <div className="grid gap-4 border-t border-border/70 p-4 md:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" value={model} onChange={(e) => setModel(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="size">Size</Label><NativeSelect id="size" value={size} onChange={(e) => setSize(e.target.value)}><option>1024x1024</option><option>1536x1024</option><option>1024x1536</option><option>auto</option></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="quality">Quality</Label><NativeSelect id="quality" value={quality} onChange={(e) => setQuality(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>auto</option></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="format">Format</Label><NativeSelect id="format" value={format} onChange={(e) => setFormat(e.target.value)}><option>png</option><option>jpeg</option><option>webp</option></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="background">Background</Label><NativeSelect id="background" value={background} onChange={(e) => setBackground(e.target.value)}><option>auto</option><option>opaque</option><option>transparent</option></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="api-mode">API Mode</Label><NativeSelect id="api-mode" value={apiMode} onChange={(e) => setApiMode(e.target.value)}><option>auto</option><option>images</option><option>responses</option></NativeSelect></div>
      <div className="space-y-2 md:col-span-2"><Label htmlFor="mask-key">Mask</Label><Input id="mask-key" value={maskKey} onChange={(e) => setMaskKey(e.target.value)} placeholder="从 Edit 工作区生成后自动带入，通常无需填写" /></div>
    </div> : null}
  </div>;
}
