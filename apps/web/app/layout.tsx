import './globals.css';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { NavFrame } from './ui/NavFrame';

export const metadata = { title: 'Image Workbench Studio', description: 'Private AI image creation studio' };

export default function RootLayout({ children }: { children: ReactNode }) {
  void Badge;
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell responsive-studio-shell">
          <NavFrame />
          <main className="main app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
