import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = { title: 'Image Workbench', description: 'Private AI image creation workbench' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="logo">Image Workbench</div>
            <p className="muted">GPT Image 2 / OpenAI-compatible 私有图像工作台</p>
            <nav className="nav">
              <Link href="/">Generate</Link>
              <Link href="/tasks">Tasks</Link>
              <Link href="/gallery">Gallery</Link>
              <Link href="/providers">Providers</Link>
              <Link href="/canvas">Canvas Roadmap</Link>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
