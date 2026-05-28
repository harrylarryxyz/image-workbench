import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return <section className="hero page-header">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children ? <p className="sub">{children}</p> : null}
    </div>
    {actions ? <div className="page-header-actions">{actions}</div> : null}
  </section>;
}
