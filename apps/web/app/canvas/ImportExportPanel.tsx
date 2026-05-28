import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ImportExportPanelProps = {
  importText: string;
  exported: string;
  setImportText: (value: string) => void;
  importCanvas: (event: FormEvent) => void;
};

export function ImportExportPanel({ importText, exported, setImportText, importCanvas }: ImportExportPanelProps) {
  return <Card>
    <CardHeader>
      <p className="eyebrow">Import / Export</p>
      <CardTitle>Canvas JSON</CardTitle>
      <CardDescription>导入/导出保留为高级能力，默认折叠。CanvasRun 会额外保留每次执行快照，可 replay。</CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={importCanvas}>
        <div className="rounded-2xl border bg-muted/20 p-4" data-testid="canvas-json-panel">
          <Label htmlFor="canvas-json">打开 Import / Export JSON</Label>
          <Textarea id="canvas-json" data-testid="canvas-json" value={importText || exported} onChange={(e) => setImportText(e.target.value)} className="min-h-72 font-mono" />
          <div className="mt-3 flex flex-wrap gap-2"><Button type="submit">导入 JSON</Button><Button variant="outline" type="button" onClick={() => navigator.clipboard?.writeText(exported)}>复制 JSON</Button></div>
        </div>
      </form>
    </CardContent>
  </Card>;
}
