import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function Eyebrow({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="studio-eyebrow" className={cn('mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/85', className)} {...props} />;
}

function StudioHero({ eyebrow, title, description, className, children, ...props }: React.ComponentProps<'section'> & { eyebrow: React.ReactNode; title: React.ReactNode; description?: React.ReactNode }) {
  return <section
    data-slot="studio-hero"
    className={cn(
      'relative grid min-h-64 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,138,255,0.34),transparent_35%),radial-gradient(circle_at_82%_20%,rgba(115,213,255,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-6 py-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.32)] md:px-10',
      'after:pointer-events-none after:absolute after:inset-x-[30%] after:-bottom-28 after:h-56 after:bg-[radial-gradient(circle,rgba(115,213,255,0.18),transparent_62%)]',
      className,
    )}
    {...props}
  >
    <div className="relative z-10 mx-auto grid max-w-4xl content-center justify-items-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mb-3 text-4xl font-medium leading-none tracking-[-0.055em] text-foreground md:text-6xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{description}</p> : null}
      {children}
    </div>
  </section>;
}

function StudioWorkbenchGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-workbench-grid" className={cn('grid min-w-0 gap-5 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]', className)} {...props} />;
}

function StudioPanel({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card
    data-slot="studio-panel"
    className={cn(
      'overflow-hidden rounded-[1.75rem] border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(139,138,255,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] shadow-[0_18px_60px_rgba(0,0,0,0.32)]',
      className,
    )}
    {...props}
  />;
}

function StudioPanelHeader({ eyebrow, title, description, className, ...props }: React.ComponentProps<typeof CardHeader> & { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode }) {
  return <CardHeader data-slot="studio-panel-header" className={cn('gap-2', className)} {...props}>
    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
    <CardTitle className="text-2xl tracking-[-0.035em]">{title}</CardTitle>
    {description ? <CardDescription className="leading-6">{description}</CardDescription> : null}
  </CardHeader>;
}

function StudioPanelContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return <CardContent data-slot="studio-panel-content" className={cn('space-y-5', className)} {...props} />;
}

function StudioPreviewStage({ className, ...props }: React.ComponentProps<'section'>) {
  return <section
    data-slot="studio-preview-stage"
    className={cn(
      'relative top-6 grid min-h-[560px] gap-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018)),radial-gradient(circle_at_70%_10%,rgba(113,112,255,0.16),transparent_34%)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.32)] xl:sticky xl:grid-rows-[auto_1fr_auto] xl:p-5',
      'before:pointer-events-none before:absolute before:right-5 before:top-5 before:h-36 before:w-36 before:rounded-full before:bg-[radial-gradient(circle,rgba(115,213,255,0.1),transparent_68%)]',
      className,
    )}
    {...props}
  />;
}

function StudioPreviewFrame({ className, ...props }: React.ComponentProps<'div'>) {
  return <div
    data-slot="studio-preview-frame"
    className={cn(
      'grid min-h-[22.5rem] place-items-center overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(45deg,rgba(255,255,255,0.025)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.025)_75%),linear-gradient(45deg,rgba(255,255,255,0.025)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.025)_75%),#090a0f] bg-[length:32px_32px] bg-[position:0_0,16px_16px]',
      className,
    )}
    {...props}
  />;
}

function StudioCompareFrame({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-compare-frame" className={cn('grid min-h-[22.5rem] gap-3 md:grid-cols-2', className)} {...props} />;
}

function StudioComparePane({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-compare-pane" className={cn('relative grid place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[#090a0f]', className)} {...props} />;
}

function StudioEmptyPreview({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-empty-preview" className={cn('mx-auto grid max-w-sm place-items-center gap-2 p-7 text-center text-muted-foreground', className)} {...props} />;
}

function StudioMetricGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-metric-grid" className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-4', className)} {...props} />;
}

function StudioMetricItem({ label, value, className, ...props }: React.ComponentProps<'div'> & { label: React.ReactNode; value: React.ReactNode }) {
  return <div data-slot="studio-metric-item" className={cn('rounded-2xl border border-white/10 bg-white/[0.035] p-3', className)} {...props}>
    <b className="block truncate text-sm text-foreground">{value}</b>
    <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
  </div>;
}

function StudioActionToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-action-toolbar" className={cn('flex flex-wrap gap-2', className)} {...props} />;
}

function StudioSupportGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="studio-support-grid" className={cn('grid gap-4 md:grid-cols-3', className)} {...props} />;
}

export {
  Eyebrow,
  StudioActionToolbar,
  StudioCompareFrame,
  StudioComparePane,
  StudioEmptyPreview,
  StudioHero,
  StudioMetricGrid,
  StudioMetricItem,
  StudioPanel,
  StudioPanelContent,
  StudioPanelHeader,
  StudioPreviewFrame,
  StudioPreviewStage,
  StudioSupportGrid,
  StudioWorkbenchGrid,
};
