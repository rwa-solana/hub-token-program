import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  TrendingUp,
  Shield,
  Settings,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', requiresAuth: false },
  { to: '/properties', icon: Building2, label: 'Properties', requiresAuth: false },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio', requiresAuth: true },
  { to: '/revenue', icon: TrendingUp, label: 'Revenue', requiresAuth: true },
  { to: '/kyc', icon: Shield, label: 'KYC Verification', requiresAuth: true },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

export const Sidebar: FC = () => {
  const { connected } = useWallet();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col glass border-r border-white/5 pt-20">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isDisabled = item.requiresAuth && !connected;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-solana text-white shadow-lg shadow-solana-purple-500/25'
                    : 'text-solana-dark-300 hover:text-white hover:bg-solana-dark-800/50',
                  isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isDisabled && (
                <span className="ml-auto text-xs text-solana-dark-500">Connect</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Stats Card */}
      <div className="px-4 py-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-solana-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-solana-green-500" />
            </div>
            <div>
              <p className="text-sm text-solana-dark-400">Total Value Locked</p>
              <p className="text-lg font-bold text-white">$1.2M</p>
            </div>
          </div>
          <a
            href="https://explorer.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-solana-purple-400 hover:text-solana-purple-300"
          >
            View on Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="px-4 py-4 border-t border-white/5">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-2.5 text-solana-dark-400 hover:text-white rounded-lg transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};
