import { FC, useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Wallet,
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Minus,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHubCredential } from '@/hooks';
import toast from 'react-hot-toast';

// API URL
const API_URL = import.meta.env.VITE_HUB_API_URL || 'http://localhost:3003';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyMint: string;
  propertyName: string;
  propertySymbol: string;
  valuePerToken: number;
  availableSupply: number;
  annualYieldPercent: number;
  onInvestmentSuccess?: () => void;
}

type InvestmentStep = 'input' | 'confirm' | 'processing' | 'success' | 'error';

export const InvestmentModal: FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  propertyMint,
  propertyName,
  propertySymbol,
  valuePerToken,
  availableSupply,
  annualYieldPercent,
  onInvestmentSuccess,
}) => {
  const { publicKey, connected } = useWallet();
  const { isActive, error: credentialError } = useHubCredential();

  const [step, setStep] = useState<InvestmentStep>('input');
  const [tokenAmount, setTokenAmount] = useState<number>(10);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculations
  const calculations = useMemo(() => {
    const totalCost = tokenAmount * valuePerToken;
    const annualRevenue = totalCost * (annualYieldPercent / 100);
    const monthlyRevenue = annualRevenue / 12;
    const ownershipPercent = availableSupply > 0 ? (tokenAmount / availableSupply) * 100 : 0;

    return {
      totalCost,
      annualRevenue,
      monthlyRevenue,
      ownershipPercent,
    };
  }, [tokenAmount, valuePerToken, annualYieldPercent, availableSupply]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setTokenAmount(10);
      setTxSignature(null);
      setError(null);
    }
  }, [isOpen]);

  // Quick amount buttons
  const quickAmounts = [10, 50, 100, 500, 1000];

  // Handle investment
  const handleInvest = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isActive) {
      toast.error('KYC verification required');
      return;
    }

    if (tokenAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (tokenAmount > availableSupply) {
      toast.error('Not enough tokens available');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyMint,
          investorWallet: publicKey.toString(),
          amount: tokenAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Investment failed');
      }

      setTxSignature(data.data?.signature || data.signature);
      setStep('success');
      toast.success('Investment successful!');
      onInvestmentSuccess?.();
    } catch (err) {
      console.error('Investment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Investment failed';
      setError(errorMessage);
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-solana-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-solana-green-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-solana-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Invest in Property</h2>
              <p className="text-sm text-solana-dark-400">{propertyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-solana-dark-800 transition-colors"
          >
            <X className="w-5 h-5 text-solana-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Input */}
          {step === 'input' && (
            <div className="space-y-5">
              {/* Token Price */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-solana-dark-400">Token Price</span>
                  <span className="text-xl font-bold text-white">
                    ${valuePerToken.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-solana-dark-400">Available</span>
                  <span className="text-solana-dark-300">
                    {availableSupply.toLocaleString()} {propertySymbol}
                  </span>
                </div>
              </div>

              {/* Token Amount Selector */}
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-3">
                  How many tokens do you want to buy?
                </label>

                {/* Stepper */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setTokenAmount(Math.max(1, tokenAmount - 10))}
                    className="w-12 h-12 rounded-xl bg-solana-dark-800 hover:bg-solana-dark-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-32 text-center text-3xl font-bold bg-transparent text-white focus:outline-none"
                    min={1}
                    max={availableSupply}
                  />
                  <button
                    onClick={() => setTokenAmount(Math.min(availableSupply, tokenAmount + 10))}
                    className="w-12 h-12 rounded-xl bg-solana-dark-800 hover:bg-solana-dark-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Quick Amounts */}
                <div className="flex flex-wrap justify-center gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTokenAmount(Math.min(amount, availableSupply))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tokenAmount === amount
                          ? 'bg-solana-purple-500 text-white'
                          : 'bg-solana-dark-800 text-solana-dark-300 hover:bg-solana-dark-700'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Investment Summary */}
              <div className="p-4 bg-gradient-to-br from-solana-purple-500/10 to-solana-green-500/10 border border-solana-dark-600 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-solana-dark-300">Total Investment</span>
                  <span className="text-xl font-bold text-white">
                    ${calculations.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Est. Annual Revenue</span>
                  <span className="text-solana-green-400">
                    +${calculations.annualRevenue.toFixed(2)}/year
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Est. Monthly Revenue</span>
                  <span className="text-solana-green-400">
                    +${calculations.monthlyRevenue.toFixed(2)}/month
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Ownership</span>
                  <span className="text-solana-dark-300">
                    {calculations.ownershipPercent.toFixed(4)}%
                  </span>
                </div>
              </div>

              {/* KYC Status */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-solana-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">KYC Verified</p>
                        <p className="text-xs text-solana-green-400">Ready to invest</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">KYC Required</p>
                        <p className="text-xs text-yellow-400">
                          {credentialError || 'Complete identity verification to invest'}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => window.location.href = '/kyc'}>
                        Verify
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Invest Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep('confirm')}
                disabled={!connected || !isActive || tokenAmount <= 0 || tokenAmount > availableSupply}
              >
                {!connected
                  ? 'Connect Wallet'
                  : !isActive
                  ? 'KYC Required'
                  : `Invest $${calculations.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </Button>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-solana-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-solana-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Confirm Investment</h3>
                <p className="text-sm text-solana-dark-400 mt-1">
                  Review your investment details
                </p>
              </div>

              <div className="p-4 bg-solana-dark-800/50 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-solana-dark-400">Property</span>
                  <span className="text-white font-medium">{propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-solana-dark-400">Tokens</span>
                  <span className="text-white font-medium">
                    {tokenAmount.toLocaleString()} {propertySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-solana-dark-400">Price per Token</span>
                  <span className="text-white">${valuePerToken.toFixed(2)}</span>
                </div>
                <div className="border-t border-solana-dark-600 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-solana-dark-300 font-medium">Total</span>
                    <span className="text-xl font-bold text-white">
                      ${calculations.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-solana-green-500/10 border border-solana-green-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-solana-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-solana-green-400">KYC Verified</p>
                    <p className="text-xs text-solana-green-300 mt-1">
                      Your identity has been verified. Tokens will be sent to your wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep('input')}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleInvest}>
                  Confirm Investment
                </Button>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-solana-purple-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Processing Investment</h3>
              <p className="text-sm text-solana-dark-400">
                Please wait while your investment is being processed...
              </p>
              <p className="text-xs text-solana-dark-500 mt-4">
                Verifying KYC and minting tokens to your wallet
              </p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-solana-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-solana-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Investment Successful!</h3>
              <p className="text-sm text-solana-dark-400 mb-4">
                {tokenAmount.toLocaleString()} {propertySymbol} tokens have been sent to your wallet.
              </p>
              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-solana-purple-400 hover:text-solana-purple-300"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="mt-6 space-y-3">
                <Button className="w-full" onClick={() => window.location.href = '/portfolio'}>
                  View Portfolio
                </Button>
                <Button variant="secondary" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Investment Failed</h3>
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => setStep('input')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
