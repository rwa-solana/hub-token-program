import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Shield,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Lock,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHubCredential } from '@/hooks';
import { CredentialStatus, CredentialType, HUB_CREDENTIAL_PROGRAM_ID, deriveHubCredentialPDA } from '@/utils/kycVerification';

// KYC Form Component
const KycForm: FC<{
  credentialType: CredentialType;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isSubmitting: boolean;
}> = ({ credentialType, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const renderFields = () => {
    switch (credentialType) {
      case CredentialType.KycBasic:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="Enter your full name"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Date of Birth</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Country</label>
              <select
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              >
                <option value="">Select country</option>
                <option value="BR">Brazil</option>
                <option value="US">United States</option>
                <option value="PT">Portugal</option>
                <option value="ES">Spain</option>
              </select>
            </div>
          </>
        );

      case CredentialType.BrazilianCpf:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="Enter your full name"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">CPF</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="000.000.000-00"
                maxLength={14}
                value={formData.cpf || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, cpf: value });
                }}
                required
              />
            </div>
          </>
        );

      case CredentialType.BrazilianCnpj:
        return (
          <div>
            <label className="block text-sm font-medium text-solana-dark-300 mb-2">CNPJ</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
              placeholder="00.000.000/0000-00"
              maxLength={18}
              value={formData.cnpj || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, cnpj: value });
              }}
              required
            />
          </div>
        );

      case CredentialType.AccreditedInvestor:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="Enter your full name"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Country</label>
              <select
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="BR">Brazil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Annual Income (USD)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="200000"
                value={formData.annualIncome || ''}
                onChange={(e) => setFormData({ ...formData, annualIncome: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">Net Worth (USD)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="1000000"
                value={formData.netWorth || ''}
                onChange={(e) => setFormData({ ...formData, netWorth: parseInt(e.target.value) })}
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-solana-dark-400">
            Please select a credential type to continue.
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderFields()}
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Submit Verification
      </Button>
    </form>
  );
};

export const KycPage: FC = () => {
  const { publicKey, connected } = useWallet();
  const {
    credential,
    isLoading,
    hasCredential,
    isActive,
    credentialType,
    expiresAt,
    error,
    refresh,
    startKycSession,
    submitKycData,
  } = useHubCredential();

  const [selectedType, setSelectedType] = useState<CredentialType>(CredentialType.KycBasic);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get network from env for explorer URL
  const network = (import.meta.env.VITE_SOLANA_NETWORK || 'localnet') as string;
  const rpcUrl = (import.meta.env.VITE_SOLANA_RPC_URL || 'http://localhost:8899') as string;

  // Build explorer URL based on network
  const getExplorerUrl = (type: 'tx' | 'address', value: string) => {
    const baseUrl = 'https://explorer.solana.com';
    if (network === 'mainnet-beta') {
      return `${baseUrl}/${type}/${value}`;
    } else if (network === 'devnet') {
      return `${baseUrl}/${type}/${value}?cluster=devnet`;
    } else if (network === 'testnet') {
      return `${baseUrl}/${type}/${value}?cluster=testnet`;
    } else {
      // localnet - use custom RPC
      return `${baseUrl}/${type}/${value}?cluster=custom&customUrl=${encodeURIComponent(rpcUrl)}`;
    }
  };

  const handleStartKyc = async () => {
    const id = await startKycSession(selectedType);
    if (id) {
      setSessionId(id);
      setShowForm(true);
    }
  };

  const handleSubmitKyc = async (data: Record<string, any>) => {
    if (!sessionId) {
      console.error('No session ID');
      alert('No session ID found. Please start verification again.');
      return;
    }

    console.log('Submitting KYC with session:', sessionId);
    setIsSubmitting(true);
    try {
      const result = await submitKycData(sessionId, data);
      if (result.success) {
        setLastTxSignature(result.signature || null);
        setShowSuccess(true);
        setShowForm(false);
        setSessionId(null);
      } else {
        alert('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="Connect Your Wallet"
        description="Connect your Solana wallet to verify your identity with Hub Credential."
      />
    );
  }

  if (isLoading) return <PageLoading />;

  const getStatusIcon = () => {
    if (!hasCredential) {
      return <Clock className="w-16 h-16 text-solana-dark-400" />;
    }
    if (!isActive) {
      return <XCircle className="w-16 h-16 text-red-400" />;
    }
    return <CheckCircle2 className="w-16 h-16 text-solana-green-400" />;
  };

  const getStatusBadge = () => {
    if (!hasCredential) {
      return <Badge variant="default">No Credential</Badge>;
    }
    switch (credential?.status) {
      case CredentialStatus.Active:
        return <Badge variant="success">Verified</Badge>;
      case CredentialStatus.Expired:
        return <Badge variant="warning">Expired</Badge>;
      case CredentialStatus.Revoked:
        return <Badge variant="danger">Revoked</Badge>;
      case CredentialStatus.Suspended:
        return <Badge variant="warning">Suspended</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getCredentialTypeLabel = (type: CredentialType) => {
    switch (type) {
      case CredentialType.KycBasic:
        return 'Basic KYC';
      case CredentialType.KycFull:
        return 'Full KYC';
      case CredentialType.AccreditedInvestor:
        return 'Accredited Investor';
      case CredentialType.QualifiedPurchaser:
        return 'Qualified Purchaser';
      case CredentialType.BrazilianCpf:
        return 'Brazilian CPF';
      case CredentialType.BrazilianCnpj:
        return 'Brazilian CNPJ';
      default:
        return type;
    }
  };

  const [credentialPDA] = publicKey ? deriveHubCredentialPDA(publicKey) : [null];
  const explorerUrl = credentialPDA ? getExplorerUrl('address', credentialPDA.toString()) : null;
  const txExplorerUrl = lastTxSignature ? getExplorerUrl('tx', lastTxSignature) : null;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Identity Verification</h1>
          <p className="text-solana-dark-400">Verify your identity with Hub Credential to enable token transfers</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <Card className="p-6 bg-solana-green-500/10 border-solana-green-500/30">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-solana-green-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Verification Successful!</h3>
            <p className="text-solana-dark-300 mb-4">
              Your credential has been issued on-chain.
            </p>
            {lastTxSignature && (
              <div className="w-full max-w-md bg-solana-dark-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-solana-dark-400 mb-2">Transaction Signature</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs font-mono text-solana-green-400 break-all">
                    {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-20)}
                  </code>
                </div>
                {txExplorerUrl && (
                  <a
                    href={txExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-solana-purple-400 hover:text-solana-purple-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Solana Explorer
                  </a>
                )}
              </div>
            )}
            {credentialPDA && explorerUrl && (
              <div className="w-full max-w-md bg-solana-dark-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-solana-dark-400 mb-2">Credential Account</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs font-mono text-white">
                    {credentialPDA.toString().slice(0, 12)}...{credentialPDA.toString().slice(-12)}
                  </code>
                </div>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-solana-purple-400 hover:text-solana-purple-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Credential on Explorer
                </a>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowSuccess(false)}
              className="mt-2"
            >
              Close
            </Button>
          </div>
        </Card>
      )}

      {/* Status Card */}
      <Card className="text-center py-12">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          <div className="mb-4">
            {getStatusBadge()}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isActive ? 'Identity Verified!' : hasCredential ? 'Credential Inactive' : 'Verification Required'}
          </h2>
          <p className="text-solana-dark-400 max-w-md mb-8">
            {isActive
              ? `Your ${getCredentialTypeLabel(credentialType!)} credential is active and valid.`
              : hasCredential
              ? `Your credential is ${credential?.status}. Please renew or contact support.`
              : 'Complete identity verification to transfer tokens on the marketplace.'}
          </p>

          {!isActive && !showForm && (
            <div className="space-y-4 w-full max-w-md">
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">Select Verification Type</label>
                <select
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as CredentialType)}
                >
                  <option value={CredentialType.KycBasic}>Basic KYC</option>
                  <option value={CredentialType.BrazilianCpf}>Brazilian CPF</option>
                  <option value={CredentialType.BrazilianCnpj}>Brazilian CNPJ</option>
                  <option value={CredentialType.AccreditedInvestor}>Accredited Investor</option>
                </select>
              </div>
              <Button
                size="lg"
                onClick={handleStartKyc}
                leftIcon={<Shield className="w-5 h-5" />}
                className="w-full"
              >
                Start Verification
              </Button>
            </div>
          )}

          {showForm && (
            <div className="w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">
                {getCredentialTypeLabel(selectedType)} Verification
              </h3>
              <KycForm
                credentialType={selectedType}
                onSubmit={handleSubmitKyc}
                isSubmitting={isSubmitting}
              />
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => {
                  setShowForm(false);
                  setSessionId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {hasCredential && credentialPDA && (
            <div className="mt-8 p-4 bg-solana-dark-800/50 rounded-xl">
              <p className="text-sm text-solana-dark-400 mb-2">Hub Credential</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xs font-mono text-white">
                  {credentialPDA.toString().slice(0, 8)}...{credentialPDA.toString().slice(-8)}
                </code>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-solana-purple-400 hover:text-solana-purple-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {expiresAt && (
                <p className="text-sm text-solana-dark-400 mt-2">
                  Expires: {expiresAt.toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Program Info */}
      <Card className="p-4 bg-solana-dark-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-solana-purple-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-solana-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Hub Credential Program</p>
            <p className="text-xs text-solana-dark-400">
              {HUB_CREDENTIAL_PROGRAM_ID.toString().slice(0, 8)}...{HUB_CREDENTIAL_PROGRAM_ID.toString().slice(-8)}
            </p>
          </div>
          <Badge variant="default" className="ml-auto">On-Chain KYC</Badge>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-solana-purple-500/20 flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-solana-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Hub Credential</h3>
          <p className="text-sm text-solana-dark-400">
            Hub Credential provides secure, on-chain identity verification for the Hub Token ecosystem.
          </p>
        </Card>

        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-solana-green-500/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-solana-green-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Transfer Hook Protected</h3>
          <p className="text-sm text-solana-dark-400">
            All token transfers are automatically validated against your Hub Credential via on-chain Transfer Hooks.
          </p>
        </Card>

        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Brazilian Compliance</h3>
          <p className="text-sm text-solana-dark-400">
            Support for CPF and CNPJ verification for Brazilian investors and companies.
          </p>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Hub Credential Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-solana-purple-500/20 flex items-center justify-center mb-3 text-solana-purple-400 font-bold">
              1
            </div>
            <p className="text-sm text-solana-dark-300">Connect your wallet</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-solana-purple-500/20 flex items-center justify-center mb-3 text-solana-purple-400 font-bold">
              2
            </div>
            <p className="text-sm text-solana-dark-300">Submit your verification data</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-solana-purple-500/20 flex items-center justify-center mb-3 text-solana-purple-400 font-bold">
              3
            </div>
            <p className="text-sm text-solana-dark-300">Receive your on-chain credential</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-solana-green-500/20 flex items-center justify-center mb-3 text-solana-green-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-solana-dark-300">Transfer tokens freely</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
