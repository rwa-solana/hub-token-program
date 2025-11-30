import { FC, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bell, Search, Shield } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

// Admin wallet address
const ADMIN_WALLET = 'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw';

export const Header: FC = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if connected wallet is admin
  useEffect(() => {
    if (connected && publicKey) {
      setIsAdmin(publicKey.toString() === ADMIN_WALLET);
    } else {
      setIsAdmin(false);
    }
  }, [connected, publicKey]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-solana flex items-center justify-center">
              <span className="text-xl font-bold text-white">H</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold gradient-text">Hub Token</h1>
              <p className="text-xs text-solana-dark-400">Real Estate Tokenization</p>
            </div>
          </Link>

          {/* Search - Desktop only */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-solana-dark-400" />
              <input
                type="text"
                placeholder="Search properties..."
                className="input pl-12"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Admin Button - Only show for admin wallet */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-solana-purple-500/20 hover:bg-solana-purple-500/30 transition-colors border border-solana-purple-500/30"
              >
                <Shield className="w-4 h-4 text-solana-purple-400" />
                <span className="text-sm font-medium text-solana-purple-400 hidden sm:inline">Admin</span>
              </button>
            )}

            {connected && (
              <button className="p-2.5 rounded-xl bg-solana-dark-800/50 hover:bg-solana-dark-700/50 transition-colors relative">
                <Bell className="w-5 h-5 text-solana-dark-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-solana-green-500 rounded-full" />
              </button>
            )}

            <div className="wallet-adapter-button-wrapper">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
