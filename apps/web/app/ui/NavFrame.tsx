import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const navGroups = [
  { label: 'Create', items: [['Studio', '/'], ['Assets', '/gallery'], ['Canvas', '/canvas'], ['Prompts', '/prompts']] },
  { label: 'History', items: [['Tasks', '/tasks'], ['Agent', '/agent']] },
  { label: 'Admin', items: [['Providers', '/providers'], ['Ops', '/ops'], ['Settings', '/settings']] },
] as const;
const mobileNav = [['Create', '/'], ['Assets', '/gallery'], ['Canvas', '/canvas'], ['More', '/settings']] as const;

export function NavFrame() {
  return <>
    <aside className="sidebar app-sidebar">
      <div className="brand-lockup">
        <div className="brand-mark">IW</div>
        <div>
          <div className="logo">Image Workbench</div>
          <p className="muted">AI design partner workspace</p>
        </div>
      </div>
      <nav className="nav grouped-nav" aria-label="Primary">
        {navGroups.map((group) => <div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.items.map(([label, href]) => <Button asChild key={href} variant="ghost" className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"><Link href={href}>{label}</Link></Button>)}
        </div>)}
      </nav>
      <div className="sidebar-footer">
        <Badge variant="outline">Lovart-like studio shell</Badge><br />
        创作入口优先，素材、画布和历史围绕作品流转；Admin 能力降噪收纳。
      </div>
    </aside>
    <header className="mobile-topbar">
      <div className="brand-lockup"><div className="brand-mark">IW</div><div><div className="logo">Image Workbench</div><div className="fine-print">AI design partner</div></div></div>
      <Button asChild size="sm"><Link href="/">Create</Link></Button>
    </header>
    <nav className="mobile-bottom-nav" aria-label="Mobile primary">
      {mobileNav.map(([label, href]) => <Button asChild key={href} variant="ghost" size="sm" className="rounded-2xl"><Link href={href}>{label}</Link></Button>)}
    </nav>
  </>;
}
