import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Image Workbench Studio', description: 'Private AI image creation studio' };

const nav = [
  ['Studio', '/'],
  ['Assets', '/gallery'],
  ['Canvas', '/canvas'],
  ['Agent', '/agent'],
  ['Prompts', '/prompts'],
  ['Tasks', '/tasks'],
  ['Providers', '/providers'],
  ['Ops', '/ops'],
  ['Settings', '/settings'],
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand-lockup">
              <div className="brand-mark">IW</div>
              <div>
                <div className="logo">Image Workbench</div>
                <p className="muted">Studio for private AI image creation</p>
              </div>
            </div>
            <nav className="nav" aria-label="Primary">
              {nav.map(([label, href]) => <Button asChild key={href} variant="ghost" className="w-full justify-start"><Link href={href}>{label}</Link></Button>)}
            </nav>
            <div className="sidebar-footer">
              <Badge variant="outline">Production studio shell</Badge><br />
              创作、素材、画布、任务和运维保持一个产品语言；诊断信息只在需要时展开。
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
