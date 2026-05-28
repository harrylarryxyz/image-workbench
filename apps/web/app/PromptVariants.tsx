import { Button } from '@/components/ui/button';
import type { Variant } from './create-types';

type PromptVariantsProps = {
  variants: Variant[];
  setPrompt: (value: string) => void;
};

export function PromptVariants({ variants, setPrompt }: PromptVariantsProps) {
  if (!variants.length) return null;
  return <div className="grid gap-3 md:grid-cols-3">
    {variants.map((variant, index) => <Button
      className="h-auto justify-start whitespace-normal rounded-xl border-border/70 p-4 text-left"
      type="button"
      variant="outline"
      key={variant.id ?? index}
      onClick={() => setPrompt(variant.payloadJson?.prompt ?? variant.content)}
    >
      <span className="grid gap-1">
        <b>{variant.title ?? `Variant ${index + 1}`}</b>
        <span className="text-muted-foreground line-clamp-3 text-xs leading-5">{variant.content}</span>
      </span>
    </Button>)}
  </div>;
}
