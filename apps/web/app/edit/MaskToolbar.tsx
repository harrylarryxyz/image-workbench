import { Button } from '@/components/ui/button';

type MaskToolbarProps = {
  canSave: boolean;
  clear: () => void;
  save: () => void;
};

export function MaskToolbar({ canSave, clear, save }: MaskToolbarProps) {
  return <div className="mt-3 flex flex-wrap gap-2">
    <Button variant="secondary" type="button" onClick={clear}>清空 Mask</Button>
    <Button variant="outline" type="button" disabled={!canSave} onClick={save}>保存 Mask</Button>
  </div>;
}
