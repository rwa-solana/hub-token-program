import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { LayoutDashboard, Building2, Wallet, TrendingUp, Shield } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/properties', icon: Building2, label: 'Properties' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio', requiresAuth: true },
  { to: '/revenue', icon: TrendingUp, label: 'Revenue', requiresAuth: true },
  { to: '/kyc', icon: Shield, label: 'KYC', requiresAuth: true },
];

export const MobileNav: FC = () => {
  const { connected } = useWallet();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isDisabled = item.requiresAuth && !connected;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  isActive
                    ? 'text-solana-green-500'
                    : 'text-solana-dark-400',
                  isDisabled && 'opacity-40 pointer-events-none'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={clsx(
                      'p-2 rounded-xl transition-all',
                      isActive && 'bg-solana-green-500/20'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
