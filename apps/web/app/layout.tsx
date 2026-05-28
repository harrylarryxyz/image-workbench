import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

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
              {nav.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            </nav>
            <div className="sidebar-footer">
              <b style={{ color: 'var(--text-secondary)' }}>Production studio shell</b><br />
              创作、素材、画布、任务和运维保持一个产品语言；诊断信息只在需要时展开。
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
