import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn("min-h-screen transition-all duration-300", collapsed ? "pl-20" : "pl-64")}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
