import { FC, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface Props {
  children: ReactNode;
}

export const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-solana-dark-950">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-solana-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-solana-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-solana-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
